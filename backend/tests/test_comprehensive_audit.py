import pytest
from app.models.simulation import SimulationConfig
from app.models.resource_pool import ResourcePool
from app.models.workload import Workload
from app.models.scheduling import SchedulingStatus
from app.services.workload_service import generate_workloads
from app.services.time_slot_service import generate_time_slots
from app.schedulers.random_scheduler import RandomScheduler
from app.schedulers.first_fit_scheduler import FirstFitScheduler
from app.schedulers.optimized_scheduler import (
    CarbonAwareScheduler,
    EnergyAwareScheduler,
    CostAwareScheduler,
    EDFScheduler,
    OptimizedScheduler,
)
from app.prediction.feature_engineering import extract_features_from_workload, FEATURE_COLUMNS


ALL_SCHEDULER_CLASSES = [
    RandomScheduler,
    FirstFitScheduler,
    CarbonAwareScheduler,
    EnergyAwareScheduler,
    CostAwareScheduler,
    EDFScheduler,
    OptimizedScheduler,
]


def get_standard_pools():
    return [
        ResourcePool(
            id="POOL-BOM",
            location="Mumbai",
            cpu_capacity=4864.0,
            memory_capacity=19456.0,
            pue=1.30,
            idle_power=105.0,
            max_power=420.0,
            carbon_intensity=620.0,
            electricity_price=0.085,
        ),
        ResourcePool(
            id="POOL-HYD",
            location="Hyderabad",
            cpu_capacity=4352.0,
            memory_capacity=17408.0,
            pue=1.14,
            idle_power=82.0,
            max_power=330.0,
            carbon_intensity=450.0,
            electricity_price=0.125,
        ),
        ResourcePool(
            id="POOL-SIN",
            location="Singapore",
            cpu_capacity=4608.0,
            memory_capacity=18432.0,
            pue=1.24,
            idle_power=112.0,
            max_power=445.0,
            carbon_intensity=270.0,
            electricity_price=0.165,
        ),
    ]


def assert_invariants(decisions, workloads, pools, slots):
    assert len(decisions) == len(workloads), "Missing or extra workload decisions"
    unique_ids = {d.workload_id for d in decisions}
    assert len(unique_ids) == len(workloads), "Duplicate workload IDs in decisions"

    wl_map = {w.id: w for w in workloads}
    pool_map = {p.id: p for p in pools}
    cpu_usage = {p.id: [0.0] * len(slots) for p in pools}
    mem_usage = {p.id: [0.0] * len(slots) for p in pools}

    for d in decisions:
        wl = wl_map[d.workload_id]
        if d.status == SchedulingStatus.UNSCHEDULED:
            assert d.resource_pool_id is None
            assert d.sla_met is False
            assert d.energy_kwh == 0.0
            continue

        assert d.resource_pool_id in pool_map
        assert d.start_time >= wl.arrival_time - 1e-5
        assert d.end_time <= slots[-1].end_time + 1e-5
        assert d.energy_kwh >= 0.0
        assert d.carbon_kg >= 0.0
        assert d.cost >= 0.0

        start_slot = int(round(d.start_time))
        end_slot = int(round(d.end_time))
        for s in range(start_slot, min(len(slots), end_slot)):
            cpu_usage[d.resource_pool_id][s] += wl.cpu_required
            mem_usage[d.resource_pool_id][s] += wl.memory_required

    for p in pools:
        for s in range(len(slots)):
            assert cpu_usage[p.id][s] <= p.cpu_capacity + 1e-5, f"CPU overcommit on {p.id} slot {s}"
            assert mem_usage[p.id][s] <= p.memory_capacity + 1e-5, f"RAM overcommit on {p.id} slot {s}"


def test_ml_no_target_leakage():
    """Verify that extract_features_from_workload does NOT leak actual cpu_required/memory_required/duration."""
    w1 = Workload(
        id="WL-A",
        arrival_time=4.0,
        duration=2.0,
        cpu_required=16.0,
        memory_required=64.0,
        deadline=10.0,
        priority=2,
        workload_type="compute",
    )
    w2 = Workload(
        id="WL-B",
        arrival_time=4.0,
        duration=2.0,
        cpu_required=512.0,  # Different actual ground truth target!
        memory_required=2048.0,
        deadline=10.0,
        priority=2,
        workload_type="compute",
    )
    f1 = extract_features_from_workload(w1)
    f2 = extract_features_from_workload(w2)
    assert len(f1) == len(FEATURE_COLUMNS)
    assert f1 == f2, "Target leakage detected: feature vector changed when ground-truth CPU/RAM target changed!"


def test_all_10_scenarios_backend():
    cfg = SimulationConfig(num_workloads=15, random_seed=42)
    slots = generate_time_slots(cfg)
    pools = get_standard_pools()

    # Scenario 1 & 2: Small and heavy workloads
    workloads = generate_workloads(15, cfg, seed=42)
    for SchedulerCls in ALL_SCHEDULER_CLASSES:
        sched = SchedulerCls()
        decisions = sched.schedule(workloads, pools, slots, cfg)
        assert_invariants(decisions, workloads, pools, slots)

    # Scenario 4: Memory-intensive workloads
    mem_pools = [
        ResourcePool(
            id="POOL-M1",
            location="Mumbai",
            cpu_capacity=4096.0,
            memory_capacity=1024.0,
            pue=1.2,
            idle_power=80.0,
            max_power=300.0,
            carbon_intensity=500.0,
            electricity_price=0.10,
        )
    ]
    mem_wls = [
        Workload(
            id=f"MEM-{i}",
            arrival_time=0.0,
            duration=2.0,
            cpu_required=16.0,
            memory_required=512.0,  # Max 2 concurrent per slot
            deadline=12.0,
            priority=1,
            workload_type="batch",
        )
        for i in range(6)
    ]
    for SchedulerCls in [FirstFitScheduler, CarbonAwareScheduler, EnergyAwareScheduler, CostAwareScheduler, EDFScheduler]:
        decisions = SchedulerCls().schedule(mem_wls, mem_pools, slots, cfg)
        assert_invariants(decisions, mem_wls, mem_pools, slots)

    # Scenario 10: Unschedulable workload (exceeds cluster capacity)
    impossible_wls = [
        Workload(
            id="IMP-1",
            arrival_time=2.0,
            duration=2.0,
            cpu_required=99999.0,
            memory_required=256.0,
            deadline=10.0,
            priority=3,
            workload_type="ml",
        )
    ]
    for SchedulerCls in ALL_SCHEDULER_CLASSES:
        decisions = SchedulerCls().schedule(impossible_wls, pools, slots, cfg)
        assert_invariants(decisions, impossible_wls, pools, slots)
        assert decisions[0].status == SchedulingStatus.UNSCHEDULED
