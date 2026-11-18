from typing import List
from ..models.simulation import TimeSlot, SimulationConfig

# Realistic 24-hour diurnal solar/coal carbon multipliers, Time-of-Use tariff multipliers, and thermal PUE offsets
DIURNAL_CARBON_MULTIPLIERS = [
    1.18, 1.21, 1.22, 1.20, 1.16, 1.09, 1.00, 0.89,
    0.76, 0.63, 0.51, 0.45, 0.43, 0.44, 0.48, 0.58,
    0.74, 0.94, 1.08, 1.16, 1.15, 1.12, 1.14, 1.16,
]

DIURNAL_TARIFF_MULTIPLIERS = [
    0.58, 0.55, 0.54, 0.55, 0.59, 0.68, 0.81, 0.93,
    1.06, 1.14, 0.97, 0.89, 0.85, 0.89, 0.95, 1.10,
    1.40, 1.65, 1.86, 1.82, 1.57, 1.19, 0.81, 0.64,
]

DIURNAL_PUE_OFFSETS = [
    -0.03, -0.03, -0.04, -0.04, -0.03, -0.02, -0.01, 0.00,
    0.01, 0.02, 0.04, 0.05, 0.06, 0.06, 0.05, 0.04,
    0.03, 0.02, 0.01, 0.00, -0.01, -0.01, -0.02, -0.03,
]

DIURNAL_RENEWABLE_RATIOS = [
    18.0, 16.0, 15.0, 17.0, 20.0, 24.0, 32.0, 40.0,
    50.0, 60.0, 72.0, 78.0, 82.0, 80.0, 75.0, 65.0,
    48.0, 34.0, 22.0, 18.0, 19.0, 20.0, 19.0, 18.0,
]


def generate_time_slots(config: SimulationConfig) -> List[TimeSlot]:
    """
    Generate discrete time slots from simulation_start to simulation_end with diurnal grid and thermal profiles.
    """
    start_hour = int(config.simulation_start)
    end_hour = int(config.simulation_end)
    slot_minutes = config.slot_duration_minutes
    slot_duration_hours = slot_minutes / 60.0

    time_slots: List[TimeSlot] = []
    slot_id = 0

    curr_start = float(start_hour)
    while curr_start < end_hour:
        curr_end = curr_start + slot_duration_hours
        hour_idx = int(curr_start) % 24
        time_slots.append(
            TimeSlot(
                slot_id=slot_id,
                start_time=round(curr_start, 2),
                end_time=round(curr_end, 2),
                slot_duration_minutes=slot_minutes,
                carbon_multiplier=DIURNAL_CARBON_MULTIPLIERS[hour_idx],
                tariff_multiplier=DIURNAL_TARIFF_MULTIPLIERS[hour_idx],
                pue_offset=DIURNAL_PUE_OFFSETS[hour_idx],
                renewable_ratio=DIURNAL_RENEWABLE_RATIOS[hour_idx],
            )
        )
        slot_id += 1
        curr_start = curr_end

    return time_slots
