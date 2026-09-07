from app.models.simulation import SimulationConfig
from app.models.resource_pool import ResourcePool
from app.models.workload import Workload
from app.services.workload_service import generate_workloads
from app.services.time_slot_service import generate_time_slots
from app.services.capacity_tracker import CapacityTracker
from app.services.energy_service import calculate_pool_slot_energy, calculate_workload_energy
from app.services.carbon_service import calculate_carbon_emissions
from app.services.cost_service import calculate_operational_cost
from app.services.sla_service import is_sla_met


def test_synthetic_workload_generation():
    cfg = SimulationConfig(num_workloads=20, random_seed=42)
    w1 = generate_workloads(count=20, config=cfg, seed=42)
    w2 = generate_workloads(count=20, config=cfg, seed=42)

    assert len(w1) == 20
    # Reproducibility check
    assert w1[0].cpu_required == w2[0].cpu_required
    assert w1[0].arrival_time == w2[0].arrival_time
    assert w1[0].deadline > w1[0].arrival_time


def test_time_slot_generation():
    cfg = SimulationConfig(simulation_start=0, simulation_end=24, slot_duration_minutes=60)
    slots = generate_time_slots(cfg)
    assert len(slots) == 24
    assert slots[0].start_time == 0.0
    assert slots[0].end_time == 1.0
    assert slots[23].end_time == 24.0


def test_capacity_tracker():
    pool = ResourcePool(
        id="pool-1",
        location="Mumbai",
        cpu_capacity=100.0,
        memory_capacity=400.0,
        pue=1.2,
        idle_power=50.0,
        max_power=200.0,
        carbon_intensity=500.0,
        electricity_price=0.1,
    )
    cfg = SimulationConfig(simulation_start=0, simulation_end=5)
    slots = generate_time_slots(cfg)

    tracker = CapacityTracker([pool], slots)

    # Can fit 60 CPU and 200 RAM across slots 0..1
    assert tracker.can_fit("pool-1", 0, 2, 60.0, 200.0) is True

    # Reserve
    assert tracker.reserve("pool-1", 0, 2, 60.0, 200.0) is True

    # Cannot fit another 60 CPU (60 + 60 = 120 > 100 capacity)
    assert tracker.can_fit("pool-1", 0, 2, 60.0, 200.0) is False


def test_energy_formulas():
    pool = ResourcePool(
        id="pool-1",
        location="Mumbai",
        cpu_capacity=100.0,
        memory_capacity=400.0,
        pue=1.5,
        idle_power=100.0,  # kW
        max_power=300.0,   # kW
        carbon_intensity=500.0,
        electricity_price=0.10,
    )

    # At 50% utilization (50 CPU used):
    # power = 100 + (300 - 100) * 0.5 = 200 kW
    # energy_it = 200 * 1 = 200 kWh
    # energy_total = 200 * 1.5 PUE = 300 kWh
    res = calculate_pool_slot_energy(pool, used_cpu=50.0, slot_duration_hours=1.0)
    assert res["utilization"] == 0.5
    assert res["power_kw"] == 200.0
    assert res["energy_it_kwh"] == 200.0
    assert res["energy_total_kwh"] == 300.0


def test_carbon_and_cost_formulas():
    # 300 kWh @ 500 gCO2/kWh -> (300 * 500) / 1000 = 150 kgCO2
    carbon = calculate_carbon_emissions(300.0, 500.0)
    assert carbon == 150.0

    # 300 kWh @ $0.10/kWh -> $30.0
    cost = calculate_operational_cost(300.0, 0.10)
    assert cost == 30.0


def test_sla_met():
    assert is_sla_met(10.0, 12.0) is True
    assert is_sla_met(12.0, 12.0) is True
    assert is_sla_met(12.5, 12.0) is False
