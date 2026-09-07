from typing import Dict
from ..models.resource_pool import ResourcePool
from ..models.workload import Workload
from .capacity_tracker import CapacityTracker


def calculate_pool_slot_energy(
    pool: ResourcePool,
    used_cpu: float,
    slot_duration_hours: float = 1.0
) -> Dict[str, float]:
    """
    Calculate IT power, IT energy, and PUE-adjusted total energy for a resource pool in a single time slot.

    Formulas:
      utilization = used_cpu / total_cpu_capacity
      power_kw = idle_power + (max_power - idle_power) * utilization
      energy_it_kwh = power_kw * slot_duration_hours
      energy_total_kwh = energy_it_kwh * pue
    """
    if pool.cpu_capacity <= 0:
        return {"utilization": 0.0, "power_kw": 0.0, "energy_it_kwh": 0.0, "energy_total_kwh": 0.0}

    utilization = min(1.0, max(0.0, used_cpu / pool.cpu_capacity))
    power_kw = pool.idle_power + (pool.max_power - pool.idle_power) * utilization
    energy_it_kwh = power_kw * slot_duration_hours
    energy_total_kwh = energy_it_kwh * pool.pue

    return {
        "utilization": round(utilization, 4),
        "power_kw": round(power_kw, 3),
        "energy_it_kwh": round(energy_it_kwh, 4),
        "energy_total_kwh": round(energy_total_kwh, 4),
    }


def calculate_workload_energy(
    workload: Workload,
    pool: ResourcePool,
    start_slot_id: int,
    duration_slots: int,
    capacity_tracker: CapacityTracker,
    slot_duration_hours: float = 1.0
) -> float:
    """
    Calculate total energy allocated to a specific workload across all occupied time slots.
    Allocates resource pool energy proportionally according to the workload's CPU share.
    """
    total_wl_energy_kwh = 0.0

    for slot_idx in range(start_slot_id, start_slot_id + duration_slots):
        used = capacity_tracker.get_used_capacity(pool.id, slot_idx)
        used_cpu = max(workload.cpu_required, used["cpu"])

        pool_energy = calculate_pool_slot_energy(pool, used_cpu, slot_duration_hours)
        pool_total_kwh = pool_energy["energy_total_kwh"]

        # Proportional share based on workload CPU / total used CPU in pool
        cpu_share = workload.cpu_required / used_cpu if used_cpu > 0 else 0.0
        wl_slot_energy = pool_total_kwh * cpu_share
        total_wl_energy_kwh += wl_slot_energy

    return round(total_wl_energy_kwh, 4)
