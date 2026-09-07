import time
import numpy as np
from datetime import datetime, timezone
from typing import List, Optional
from pymoo.algorithms.moo.nsga2 import NSGA2
from pymoo.operators.sampling.rnd import IntegerRandomSampling
from pymoo.operators.crossover.sbx import SBX
from pymoo.operators.mutation.pm import PM
from pymoo.optimize import minimize

from .schemas import OptimizationConfig, OptimizationResult, ParetoSolution
from .problem import EcoFusionSchedulingProblem
from .repair import EcoFusionRepair
from .compromise_selector import select_best_compromise_solution
from ..models.workload import Workload
from ..models.resource_pool import ResourcePool
from ..models.simulation import TimeSlot, SimulationConfig, ExecutionMetadata
from ..models.scheduling import SchedulingStatus
from ..services.sla_service import evaluate_sla_metrics


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

    # 2. Configure pymoo NSGA2 Algorithm
    algorithm = NSGA2(
        pop_size=config.population_size,
        sampling=IntegerRandomSampling(),
        crossover=SBX(prob=config.crossover_prob, eta=15, vtype=float),
        mutation=PM(prob=config.mutation_prob, eta=20, vtype=float),
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

    # 4. Process Non-Dominated Solutions
    pareto_solutions: List[ParetoSolution] = []

    if res.X is not None and len(res.X) > 0:
        # Handle 1D vs 2D solution array
        solution_vectors = res.X if res.X.ndim == 2 else np.array([res.X])
        
        for idx, x_vec in enumerate(solution_vectors):
            decisions, carbon_kg, energy_kwh, cost_usd, unscheduled = problem.evaluate_chromosome(x_vec)
            sla_metrics = evaluate_sla_metrics(decisions, len(workloads))

            scheduled_count = len([d for d in decisions if d.status == SchedulingStatus.SCHEDULED])

            sol = ParetoSolution(
                solution_id=f"SOL-{idx + 1:03d}",
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
    else:
        # Fallback if pymoo returned empty solution set
        decisions, carbon_kg, energy_kwh, cost_usd, unscheduled = problem.evaluate_chromosome(problem.xl)
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
