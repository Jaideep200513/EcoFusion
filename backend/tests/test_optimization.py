import numpy as np
from app.models.simulation import SimulationConfig
from app.models.resource_pool import ResourcePool
from app.models.workload import Workload
from app.services.workload_service import generate_workloads
from app.services.resource_pool_service import get_default_resource_pools
from app.services.time_slot_service import generate_time_slots
from app.optimization.chromosome import decode_gene, encode_gene
from app.optimization.problem import EcoFusionSchedulingProblem
from app.optimization.repair import EcoFusionRepair
from app.optimization.nsga2_optimizer import run_nsga2_optimization
from app.optimization.compromise_selector import select_best_compromise_solution
from app.optimization.schemas import OptimizationConfig, CompromiseWeights


def test_gene_encoding_decoding():
    gene = encode_gene(pool_idx=2, slot_idx=15, num_slots=24)
    p_idx, s_idx = decode_gene(gene, num_slots=24)
    assert p_idx == 2
    assert s_idx == 15


def test_optimization_problem_evaluation():
    cfg = SimulationConfig(num_workloads=10, random_seed=42)
    workloads = generate_workloads(10, cfg, seed=42)
    pools = get_default_resource_pools()
    slots = generate_time_slots(cfg)

    problem = EcoFusionSchedulingProblem(workloads, pools, slots, cfg)
    x_test = np.zeros(10, dtype=int)

    decisions, carbon_kg, energy_kwh, cost_usd, unscheduled = problem.evaluate_chromosome(x_test)
    assert len(decisions) == 10
    assert carbon_kg >= 0.0
    assert energy_kwh >= 0.0
    assert cost_usd >= 0.0
    assert unscheduled >= 0


def test_repair_operator():
    cfg = SimulationConfig(num_workloads=5, random_seed=42)
    workloads = generate_workloads(5, cfg, seed=42)
    pools = get_default_resource_pools()
    slots = generate_time_slots(cfg)

    repair = EcoFusionRepair(workloads, pools, slots, cfg)
    # Start with invalid genes (all 0)
    X_invalid = np.zeros((1, 5), dtype=int)
    X_repaired = repair._do(None, X_invalid)

    assert X_repaired.shape == (1, 5)


def test_nsga2_optimizer_run():
    sim_cfg = SimulationConfig(num_workloads=12, random_seed=42)
    opt_cfg = OptimizationConfig(population_size=20, generations=10, random_seed=42)

    workloads = generate_workloads(12, sim_cfg, seed=42)
    pools = get_default_resource_pools()
    slots = generate_time_slots(sim_cfg)

    opt_res = run_nsga2_optimization(workloads, pools, slots, sim_cfg, opt_cfg, experiment_id="TEST-OPT-01")

    assert opt_res.total_workloads == 12
    assert len(opt_res.pareto_solutions) >= 1
    assert opt_res.selected_solution is not None
    assert opt_res.selected_solution.carbon_kg >= 0
    assert opt_res.selected_solution.energy_kwh >= 0
    assert opt_res.selected_solution.cost_usd >= 0


def test_compromise_selection():
    sim_cfg = SimulationConfig(num_workloads=10, random_seed=42)
    opt_cfg = OptimizationConfig(population_size=10, generations=5, random_seed=42)

    workloads = generate_workloads(10, sim_cfg, seed=42)
    pools = get_default_resource_pools()
    slots = generate_time_slots(sim_cfg)

    opt_res = run_nsga2_optimization(workloads, pools, slots, sim_cfg, opt_cfg)
    best_sol, scored = select_best_compromise_solution(
        opt_res.pareto_solutions, CompromiseWeights(carbon=0.5, energy=0.25, cost=0.25)
    )

    assert best_sol is not None
    assert best_sol.score >= 0.0
