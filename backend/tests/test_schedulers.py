from app.models.simulation import SimulationConfig
from app.models.resource_pool import ResourcePool
from app.models.workload import Workload
from app.services.workload_service import generate_workloads
from app.services.time_slot_service import generate_time_slots
from app.schedulers.random_scheduler import RandomScheduler
from app.schedulers.first_fit_scheduler import FirstFitScheduler
from app.models.scheduling import SchedulingStatus


def get_test_pools():
    return [
        ResourcePool(
            id="pool-1",
            location="Mumbai",
            cpu_capacity=256.0,
            memory_capacity=1024.0,
            pue=1.2,
            idle_power=50.0,
            max_power=200.0,
            carbon_intensity=600.0,
            electricity_price=0.12,
        ),
        ResourcePool(
            id="pool-2",
            location="Hyderabad",
            cpu_capacity=256.0,
            memory_capacity=1024.0,
            pue=1.15,
            idle_power=40.0,
            max_power=180.0,
            carbon_intensity=500.0,
            electricity_price=0.10,
        ),
    ]


def test_random_scheduler_execution():
    cfg = SimulationConfig(num_workloads=10, random_seed=42)
    workloads = generate_workloads(10, cfg, seed=42)
    pools = get_test_pools()
    slots = generate_time_slots(cfg)

    scheduler = RandomScheduler()
    decisions = scheduler.schedule(workloads, pools, slots, cfg)

    assert len(decisions) == 10
    scheduled = [d for d in decisions if d.status == SchedulingStatus.SCHEDULED]
    assert len(scheduled) > 0

    for d in scheduled:
        assert d.start_time is not None
        assert d.end_time is not None
        assert d.energy_kwh >= 0
        assert d.carbon_kg >= 0
        assert d.cost >= 0


def test_first_fit_scheduler_execution():
    cfg = SimulationConfig(num_workloads=10, random_seed=42)
    workloads = generate_workloads(10, cfg, seed=42)
    pools = get_test_pools()
    slots = generate_time_slots(cfg)

    scheduler = FirstFitScheduler()
    decisions = scheduler.schedule(workloads, pools, slots, cfg)

    assert len(decisions) == 10
    scheduled = [d for d in decisions if d.status == SchedulingStatus.SCHEDULED]
    assert len(scheduled) > 0


def test_scheduler_reproducibility():
    cfg = SimulationConfig(num_workloads=15, random_seed=99)
    workloads1 = generate_workloads(15, cfg, seed=99)
    workloads2 = generate_workloads(15, cfg, seed=99)
    pools = get_test_pools()
    slots = generate_time_slots(cfg)

    scheduler = RandomScheduler()
    decisions1 = scheduler.schedule(workloads1, pools, slots, cfg)
    decisions2 = scheduler.schedule(workloads2, pools, slots, cfg)

    # Identical seed -> identical scheduling decisions
    for d1, d2 in zip(decisions1, decisions2):
        assert d1.workload_id == d2.workload_id
        assert d1.status == d2.status
        assert d1.resource_pool_id == d2.resource_pool_id
        assert d1.start_time == d2.start_time
