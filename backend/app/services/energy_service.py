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
    Calculate total facility energy (kWh) allocated to a specific workload across all occupied time slots.
    
    Mathematical Model:
      u(p, h) = min(1.0, used_cpu(p, h) / cpu_capacity(p))
      P_IT(w, p, h) = (c_w / cpu_capacity(p)) * [ P_idle(p) + (P_max(p) - P_idle(p)) * (0.45 + 0.55 * u(p, h)) ]
      PUE(p, h) = max(1.05, pue_base(p) + pue_offset(p, h))
      E_facility(w, p, s) = sum_{h=s}^{s+d-1} P_IT(w, p, h) * slot_duration_hours * PUE(p, h)
    """
    if pool.cpu_capacity <= 0 or duration_slots <= 0:
        return 0.0

    total_wl_energy_kwh = 0.0
    cpu_fraction = min(1.0, max(0.0, workload.cpu_required / pool.cpu_capacity))
    loc_lower = (pool.location or "").lower()
    is_mumbai = "mumbai" in loc_lower or "bom" in pool.id.lower()
    is_singapore = "singapore" in loc_lower or "sin" in pool.id.lower()

    for slot_idx in range(start_slot_id, start_slot_id + duration_slots):
        used = capacity_tracker.get_used_capacity(pool.id, slot_idx)
        used_cpu = max(workload.cpu_required, used["cpu"])
        utilization = min(1.0, max(0.0, used_cpu / pool.cpu_capacity))

        # Diurnal thermal cooling PUE offset
        pue_offset = 0.0
        if 0 <= slot_idx < len(capacity_tracker.slots):
            base_offset = getattr(capacity_tracker.slots[slot_idx], "pue_offset", 0.0)
            if base_offset > 0:
                pue_offset = base_offset * (1.35 if is_mumbai else (0.5 if is_singapore else 1.0))
            else:
                pue_offset = base_offset * (1.25 if is_singapore else 1.0)

        effective_pue = max(1.05, pool.pue + pue_offset)
        it_power_kw = cpu_fraction * (
            pool.idle_power + (pool.max_power - pool.idle_power) * (0.45 + 0.55 * utilization)
        )
        e_it_kwh = it_power_kw * slot_duration_hours
        e_facility_kwh = e_it_kwh * effective_pue
        total_wl_energy_kwh += e_facility_kwh

    return round(total_wl_energy_kwh, 4)
