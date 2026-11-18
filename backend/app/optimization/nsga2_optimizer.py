import time
import numpy as np
from datetime import datetime, timezone
from typing import List, Optional
from pymoo.algorithms.moo.nsga2 import NSGA2
from pymoo.core.sampling import Sampling
from pymoo.operators.crossover.pntx import TwoPointCrossover
from pymoo.operators.mutation.pm import PM
from pymoo.optimize import minimize

from .schemas import OptimizationConfig, OptimizationResult, ParetoSolution
from .problem import EcoFusionSchedulingProblem
from .repair import EcoFusionRepair
from .compromise_selector import select_best_compromise_solution
from .chromosome import encode_gene
from ..models.workload import Workload
from ..models.resource_pool import ResourcePool
from ..models.simulation import TimeSlot, SimulationConfig, ExecutionMetadata
from ..models.scheduling import SchedulingStatus
from ..services.sla_service import evaluate_sla_metrics
from ..schedulers.first_fit_scheduler import FirstFitScheduler
from ..schedulers.optimized_scheduler import (
    CarbonAwareScheduler,
    EnergyAwareScheduler,
    CostAwareScheduler,
    EDFScheduler,
)


def _build_heuristic_seeds(
    workloads: List[Workload],
    pools: List[ResourcePool],
    slots: List[TimeSlot],
    config: SimulationConfig
) -> List[np.ndarray]:
    """
    Generate seed chromosomes from baseline heuristics to initialize the population
    at the boundary extremes of the multi-objective search space.
    """
    pool_to_idx = {p.id: i for i, p in enumerate(pools)}
    slot_to_idx = {s.start_time: i for i, s in enumerate(slots)}
    sorted_w = sorted(workloads, key=lambda w: (w.arrival_time, w.id))
    w_map = {w.id: i for i, w in enumerate(sorted_w)}
    num_slots = len(slots)

    def to_chromosome(scheduler) -> np.ndarray:
        chrom = np.zeros(len(workloads), dtype=int)
        try:
            decs = scheduler.schedule(workloads, pools, slots, config)
            for d in decs:
                if d.workload_id in w_map and d.resource_pool_id and d.start_time is not None:
                    idx = w_map[d.workload_id]
                    p_idx = pool_to_idx.get(d.resource_pool_id, 0)
                    s_idx = slot_to_idx.get(d.start_time, 0)
                    chrom[idx] = encode_gene(p_idx, s_idx, num_slots)
        except Exception:
            pass
        return chrom

    return [
        to_chromosome(CarbonAwareScheduler()),
        to_chromosome(EnergyAwareScheduler()),
        to_chromosome(CostAwareScheduler()),
        to_chromosome(FirstFitScheduler()),
        to_chromosome(EDFScheduler()),
    ]


class DiverseHeuristicSampling(Sampling):
    """
    Sampling operator that seeds diverse heuristic solutions at generation 0
    and fills the remainder of the population with reproducible random samples.
    """

    def __init__(self, seeded_chromosomes: List[np.ndarray], seed: int = 42):
        super().__init__()
        self.seeded = seeded_chromosomes
        self.seed = seed

    def _do(self, problem, n_samples, **kwargs):
        rng = np.random.RandomState(self.seed)
        val = rng.randint(0, problem.xu[0] + 1, size=(n_samples, problem.n_var))
        for i, sc in enumerate(self.seeded):
            if i < n_samples:
                val[i] = sc
        return val


def run_nsga2_optimization(
    workloads: List[Workload],
    pools: List[ResourcePool],
    slots: List[TimeSlot],
    sim_config: SimulationConfig,
    opt_config: Optional[OptimizationConfig] = None,
    experiment_id: str = "EXP-OPT-001"
) -> OptimizationResult:
    """
    Execute NSGA-II multi-objective optimization over submitted workloads and resource pools.
    """
    start_time_ms = time.time() * 1000.0
    config = opt_config or OptimizationConfig(random_seed=sim_config.random_seed)

    # 1. Instantiate Problem & Repair Operator
    problem = EcoFusionSchedulingProblem(workloads, pools, slots, sim_config)
    repair_operator = EcoFusionRepair(workloads, pools, slots, sim_config)

    # 2. Heuristic Seeding & Operators
    seeded_chroms = _build_heuristic_seeds(workloads, pools, slots, sim_config)
    sampling_operator = DiverseHeuristicSampling(seeded_chroms, seed=config.random_seed)

    algorithm = NSGA2(
        pop_size=config.population_size,
        sampling=sampling_operator,
        crossover=TwoPointCrossover(prob=config.crossover_prob),
        mutation=PM(prob=config.mutation_prob, eta=20, vtype=int),
        repair=repair_operator,
    )

    # 3. Minimize Problem
    res = minimize(
        problem,
        algorithm,
        termination=("n_gen", config.generations),
        seed=config.random_seed,
        verbose=False
    )

    # 4. Process Non-Dominated Solutions with Deduplication
    pareto_solutions: List[ParetoSolution] = []
    seen_signatures = set()

    if res.X is not None and len(res.X) > 0:
        solution_vectors = res.X if res.X.ndim == 2 else np.array([res.X])
        
        for x_vec in solution_vectors:
            decisions, carbon_kg, energy_kwh, cost_usd, unscheduled = problem.evaluate_chromosome(x_vec)
            sla_metrics = evaluate_sla_metrics(decisions, len(workloads))
            scheduled_count = len([d for d in decisions if d.status == SchedulingStatus.SCHEDULED])

            sig = (round(carbon_kg, 2), round(energy_kwh, 2), round(cost_usd, 2), unscheduled)
            if sig in seen_signatures:
                continue
            seen_signatures.add(sig)

            sol = ParetoSolution(
                solution_id=f"SOL-{len(pareto_solutions) + 1:03d}",
                rank=1,
                carbon_kg=round(carbon_kg, 2),
                energy_kwh=round(energy_kwh, 2),
                cost_usd=round(cost_usd, 2),
                sla_violations=sla_metrics["sla_violations"],
                sla_violation_rate=sla_metrics["sla_violation_rate"],
                scheduled_workloads=scheduled_count,
                unscheduled_workloads=unscheduled,
                constraint_violation=float(unscheduled),
                score=0.0,
                assignments=decisions
            )
            pareto_solutions.append(sol)

    if not pareto_solutions:
        # Fallback to evaluating the best available seeded heuristic solution
        fallback_vec = seeded_chroms[0] if len(seeded_chroms) > 0 else np.zeros(len(workloads), dtype=int)
        decisions, carbon_kg, energy_kwh, cost_usd, unscheduled = problem.evaluate_chromosome(fallback_vec)
        sla_metrics = evaluate_sla_metrics(decisions, len(workloads))
        scheduled_count = len([d for d in decisions if d.status == SchedulingStatus.SCHEDULED])

        pareto_solutions.append(
            ParetoSolution(
                solution_id="SOL-001",
                rank=1,
                carbon_kg=round(carbon_kg, 2),
                energy_kwh=round(energy_kwh, 2),
                cost_usd=round(cost_usd, 2),
                sla_violations=sla_metrics["sla_violations"],
                sla_violation_rate=sla_metrics["sla_violation_rate"],
                scheduled_workloads=scheduled_count,
                unscheduled_workloads=unscheduled,
                constraint_violation=float(unscheduled),
                score=0.0,
                assignments=decisions
            )
        )

    # 5. Select Best-Compromise Solution
    selected_solution, scored_solutions = select_best_compromise_solution(
        pareto_solutions, config.compromise_weights
    )

    execution_time_ms = round((time.time() * 1000.0) - start_time_ms, 2)
    metadata = ExecutionMetadata(
        execution_time_ms=execution_time_ms,
        timestamp=datetime.now(timezone.utc).isoformat(),
        seed_used=config.random_seed,
        version="0.4.0",
        extra={
            "population_size": config.population_size,
            "generations": config.generations,
            "pareto_solutions_count": len(scored_solutions),
        }
    )

    return OptimizationResult(
        experiment_id=experiment_id,
        algorithm_name="EcoFusion NSGA-II",
        total_workloads=len(workloads),
        pareto_solutions=scored_solutions,
        selected_solution=selected_solution,
        execution_metadata=metadata
    )
