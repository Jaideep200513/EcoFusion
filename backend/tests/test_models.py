import pytest
from pydantic import ValidationError
from app.models.workload import Workload
from app.models.resource_pool import ResourcePool


def test_workload_valid():
    wl = Workload(
        id="WL-001",
        arrival_time=2.0,
        cpu_required=16.0,
        memory_required=64.0,
        duration=3.0,
        deadline=8.0,
        priority=1,
    )
    assert wl.id == "WL-001"
    assert wl.cpu_required == 16.0


def test_workload_negative_cpu():
    with pytest.raises(ValidationError):
        Workload(
            id="WL-ERR",
            arrival_time=0.0,
            cpu_required=-5.0,
            memory_required=64.0,
            duration=2.0,
            deadline=5.0,
        )


def test_workload_deadline_before_arrival():
    with pytest.raises(ValidationError):
        Workload(
            id="WL-ERR",
            arrival_time=5.0,
            cpu_required=8.0,
            memory_required=16.0,
            duration=2.0,
            deadline=4.0,  # Invalid: deadline < arrival_time
        )


def test_resource_pool_valid():
    pool = ResourcePool(
        id="pool-test",
        location="Mumbai",
        cpu_capacity=1000.0,
        memory_capacity=4000.0,
        pue=1.25,
        idle_power=100.0,
        max_power=400.0,
        carbon_intensity=500.0,
        electricity_price=0.15,
    )
    assert pool.id == "pool-test"
    assert pool.pue == 1.25


def test_resource_pool_invalid_pue():
    with pytest.raises(ValidationError):
        ResourcePool(
            id="pool-err",
            location="Test",
            cpu_capacity=100.0,
            memory_capacity=100.0,
            pue=0.9,  # Invalid: PUE < 1.0
            idle_power=10.0,
            max_power=20.0,
            carbon_intensity=100.0,
            electricity_price=0.1,
        )


def test_resource_pool_max_power_less_than_idle():
    with pytest.raises(ValidationError):
        ResourcePool(
            id="pool-err",
            location="Test",
            cpu_capacity=100.0,
            memory_capacity=100.0,
            pue=1.2,
            idle_power=200.0,
            max_power=100.0,  # Invalid: max < idle
            carbon_intensity=100.0,
            electricity_price=0.1,
        )
