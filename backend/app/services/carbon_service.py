from typing import List, Optional
from ..models.resource_pool import ResourcePool
from ..models.simulation import TimeSlot
from .time_slot_service import DIURNAL_CARBON_MULTIPLIERS


def calculate_carbon_emissions(
    energy_kwh: float,
    carbon_intensity_g_per_kwh: float
) -> float:
    """
    Calculate carbon emissions in kgCO2.

    Formula:
      carbon_kg = (energy_kwh * carbon_intensity_gCO2_per_kWh) / 1000.0
    """
    if energy_kwh <= 0 or carbon_intensity_g_per_kwh <= 0:
        return 0.0

    carbon_kg = (energy_kwh * carbon_intensity_g_per_kwh) / 1000.0
    return round(carbon_kg, 4)


def get_effective_slot_carbon_intensity(
    pool: ResourcePool,
    slot_idx: int,
    time_slots: Optional[List[TimeSlot]] = None
) -> float:
    """
    Compute spatial-temporal carbon intensity CI(pool, t) in gCO2/kWh.
    """
    hour_idx = slot_idx % 24
    if time_slots and 0 <= slot_idx < len(time_slots):
        mult = getattr(time_slots[slot_idx], "carbon_multiplier", DIURNAL_CARBON_MULTIPLIERS[hour_idx])
    else:
        mult = DIURNAL_CARBON_MULTIPLIERS[hour_idx]

    loc_lower = (pool.location or "").lower()
    is_mumbai = "mumbai" in loc_lower or "bom" in pool.id.lower()
    is_hyderabad = "hyderabad" in loc_lower or "hyd" in pool.id.lower()
    is_singapore = "singapore" in loc_lower or "sin" in pool.id.lower()

    is_midday_solar = 9 <= hour_idx <= 15
    is_night = hour_idx <= 5 or hour_idx >= 22

    if is_singapore and is_midday_solar:
        reg_mult = mult * 0.65
    elif is_hyderabad and is_midday_solar:
        reg_mult = mult * 0.70
    elif is_mumbai and is_night:
        reg_mult = mult * 1.18
    elif is_singapore:
        reg_mult = 0.78 + mult * 0.22
    else:
        reg_mult = mult

    return max(95.0, pool.carbon_intensity * reg_mult)


def calculate_workload_carbon(
    energy_kwh: float,
    pool: ResourcePool,
    start_slot_id: int = 0,
    duration_slots: int = 1,
    time_slots: Optional[List[TimeSlot]] = None
) -> float:
    """
    Calculate carbon emissions (kgCO2) across all occupied time slots.
    """
    if energy_kwh <= 0:
        return 0.0
    dur = max(1, duration_slots)
    avg_ci = sum(
        get_effective_slot_carbon_intensity(pool, start_slot_id + offset, time_slots)
        for offset in range(dur)
    ) / dur
    return calculate_carbon_emissions(energy_kwh, avg_ci)
