from typing import List, Optional
from ..models.resource_pool import ResourcePool
from ..models.simulation import TimeSlot
from .time_slot_service import DIURNAL_TARIFF_MULTIPLIERS


def calculate_operational_cost(
    energy_kwh: float,
    electricity_price_per_kwh: float
) -> float:
    """
    Calculate operational electricity cost in USD.

    Formula:
      cost = energy_kwh * electricity_price_per_kwh
    """
    if energy_kwh <= 0 or electricity_price_per_kwh <= 0:
        return 0.0

    cost = energy_kwh * electricity_price_per_kwh
    return round(cost, 4)


def get_effective_slot_tariff(
    pool: ResourcePool,
    slot_idx: int,
    time_slots: Optional[List[TimeSlot]] = None
) -> float:
    """
    Compute spatial-temporal electricity tariff Tariff(pool, t) in USD/kWh.
    """
    hour_idx = slot_idx % 24
    if time_slots and 0 <= slot_idx < len(time_slots):
        mult = getattr(time_slots[slot_idx], "tariff_multiplier", DIURNAL_TARIFF_MULTIPLIERS[hour_idx])
    else:
        mult = DIURNAL_TARIFF_MULTIPLIERS[hour_idx]

    loc_lower = (pool.location or "").lower()
    is_mumbai = "mumbai" in loc_lower or "bom" in pool.id.lower()
    is_hyderabad = "hyderabad" in loc_lower or "hyd" in pool.id.lower()
    is_singapore = "singapore" in loc_lower or "sin" in pool.id.lower()

    is_midday_solar = 9 <= hour_idx <= 15
    is_night = hour_idx <= 5 or hour_idx >= 22
    is_evening_peak = 17 <= hour_idx <= 21

    if is_mumbai and is_night:
        reg_mult = mult * 0.72
    elif is_singapore and (is_midday_solar or is_evening_peak):
        reg_mult = mult * 1.38
    elif is_hyderabad and is_midday_solar:
        reg_mult = mult * 0.80
    else:
        reg_mult = mult

    return max(0.035, pool.electricity_price * reg_mult)


def calculate_workload_cost(
    energy_kwh: float,
    pool: ResourcePool,
    start_slot_id: int = 0,
    duration_slots: int = 1,
    time_slots: Optional[List[TimeSlot]] = None
) -> float:
    """
    Calculate operational cost (USD) across all occupied time slots.
    """
    if energy_kwh <= 0:
        return 0.0
    dur = max(1, duration_slots)
    avg_tariff = sum(
        get_effective_slot_tariff(pool, start_slot_id + offset, time_slots)
        for offset in range(dur)
    ) / dur
    return calculate_operational_cost(energy_kwh, avg_tariff)
