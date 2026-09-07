import os
from app.models.simulation import SimulationConfig
from app.services.simulation_service import run_simulation_pipeline, load_experiment_from_disk
from app.services.resource_pool_service import get_default_resource_pools
from app.services.time_slot_service import generate_time_slots
from app.services.capacity_tracker import CapacityTracker
from app.models.scheduling import SchedulingStatus


def test_integration_100_workloads_pipeline():
    config = SimulationConfig(
        simulation_start=0,
        simulation_end=24,
        slot_duration_minutes=60,
        random_seed=42,
        scheduler_name="random",
        num_workloads=100,
    )

    result = run_simulation_pipeline(config_override=config, custom_experiment_id="EXP-INTEGRATION-TEST")

    # Verification 1: Correct totals
    assert result.total_workloads == 100
    assert (result.scheduled_workloads + result.unscheduled_workloads) == 100
    assert len(result.assignments) == 100

    # Verification 2: Every workload is explicitly marked SCHEDULED or UNSCHEDULED
    for decision in result.assignments:
        assert decision.status in [SchedulingStatus.SCHEDULED, SchedulingStatus.UNSCHEDULED]
        if decision.status == SchedulingStatus.SCHEDULED:
            assert decision.resource_pool_id is not None
            assert decision.start_time is not None
            assert decision.end_time is not None
            # Verification 3: No scheduled workload violates its deadline
            assert decision.end_time <= decision.completion_time
            assert decision.sla_met is True

    # Verification 4: Output metrics populated
    assert result.total_energy_kwh >= 0.0
    assert result.total_carbon_kg >= 0.0
    assert result.total_cost >= 0.0
    assert 0.0 <= result.sla_violation_rate <= 100.0
    assert result.execution_metadata.execution_time_ms > 0

    # Verification 5: Check resource capacities are never exceeded
    pools = get_default_resource_pools()
    slots = generate_time_slots(config)
    tracker = CapacityTracker(pools, slots)

    for decision in result.assignments:
        if decision.status == SchedulingStatus.SCHEDULED:
            start_slot_idx = int(decision.start_time)
            duration_slots = int(decision.duration)
            # Re-reserve to check capacity constraints
            assert tracker.reserve(
                decision.resource_pool_id,
                start_slot_idx,
                duration_slots,
                decision.cpu_required,
                decision.memory_required,
            ) is True

    # Verification 6: Persistence to disk
    persisted = load_experiment_from_disk("EXP-INTEGRATION-TEST")
    assert persisted is not None
    assert persisted["metrics"]["total_workloads"] == 100


def test_reproducibility_same_seed_produces_identical_results():
    config1 = SimulationConfig(random_seed=12345, scheduler_name="random", num_workloads=50)
    config2 = SimulationConfig(random_seed=12345, scheduler_name="random", num_workloads=50)

    res1 = run_simulation_pipeline(config_override=config1, custom_experiment_id="EXP-REPRO-1")
    res2 = run_simulation_pipeline(config_override=config2, custom_experiment_id="EXP-REPRO-2")

    assert res1.scheduled_workloads == res2.scheduled_workloads
    assert res1.total_energy_kwh == res2.total_energy_kwh
    assert res1.total_carbon_kg == res2.total_carbon_kg
    assert res1.total_cost == res2.total_cost
    assert res1.sla_violation_rate == res2.sla_violation_rate
