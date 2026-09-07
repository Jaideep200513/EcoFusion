from app.models.simulation import SimulationConfig
from app.optimization.schemas import OptimizationConfig
from app.services.workload_service import generate_workloads
from app.services.resource_pool_service import get_default_resource_pools
from app.services.time_slot_service import generate_time_slots
from app.services.simulation_service import run_simulation_pipeline
from app.optimization.nsga2_optimizer import run_nsga2_optimization
from app.models.scheduling import SchedulingStatus


def test_week4_pipeline_30_workloads_comparison():
    sim_cfg = SimulationConfig(
        simulation_start=0,
        simulation_end=24,
        slot_duration_minutes=60,
        random_seed=42,
        num_workloads=30
    )

    workloads = generate_workloads(30, sim_cfg, seed=42)
    pools = get_default_resource_pools()
    slots = generate_time_slots(sim_cfg)

    # 1. Random Scheduler
    rand_res = run_simulation_pipeline(
        config_override=sim_cfg.model_copy(update={"scheduler_name": "random"}),
        workload_list=workloads,
        resource_pool_list=pools,
    )

    # 2. First-Fit Scheduler
    ff_res = run_simulation_pipeline(
        config_override=sim_cfg.model_copy(update={"scheduler_name": "first_fit"}),
        workload_list=workloads,
        resource_pool_list=pools,
    )

    # 3. Carbon-Aware Scheduler
    ca_res = run_simulation_pipeline(
        config_override=sim_cfg.model_copy(update={"scheduler_name": "carbon_aware"}),
        workload_list=workloads,
        resource_pool_list=pools,
    )

    # 4. NSGA-II Optimization
    opt_cfg = OptimizationConfig(population_size=20, generations=15, random_seed=42)
    opt_res = run_nsga2_optimization(workloads, pools, slots, sim_cfg, opt_cfg, experiment_id="EXP-W4-NSGA2")

    # Assertions
    assert rand_res.total_workloads == 30
    assert ff_res.total_workloads == 30
    assert ca_res.total_workloads == 30
    assert opt_res.total_workloads == 30

    best_sol = opt_res.selected_solution
    assert len(best_sol.assignments) == 30

    # Verification: No capacity or deadline violations in selected feasible decisions
    for decision in best_sol.assignments:
        assert decision.status in [SchedulingStatus.SCHEDULED, SchedulingStatus.UNSCHEDULED]
        if decision.status == SchedulingStatus.SCHEDULED:
            assert decision.start_time is not None
            assert decision.end_time is not None
            assert decision.end_time <= decision.completion_time
            assert decision.sla_met is True


def test_nsga2_reproducibility_same_seed():
    sim_cfg = SimulationConfig(num_workloads=20, random_seed=123)
    opt_cfg1 = OptimizationConfig(population_size=15, generations=10, random_seed=123)
    opt_cfg2 = OptimizationConfig(population_size=15, generations=10, random_seed=123)

    workloads = generate_workloads(20, sim_cfg, seed=123)
    pools = get_default_resource_pools()
    slots = generate_time_slots(sim_cfg)

    res1 = run_nsga2_optimization(workloads, pools, slots, sim_cfg, opt_cfg1, experiment_id="REPRO-1")
    res2 = run_nsga2_optimization(workloads, pools, slots, sim_cfg, opt_cfg2, experiment_id="REPRO-2")

    sol1 = res1.selected_solution
    sol2 = res2.selected_solution

    assert sol1.carbon_kg == sol2.carbon_kg
    assert sol1.energy_kwh == sol2.energy_kwh
    assert sol1.cost_usd == sol2.cost_usd
