from typing import List
from ..models.simulation import TimeSlot, SimulationConfig


def generate_time_slots(config: SimulationConfig) -> List[TimeSlot]:
    """
    Generate discrete 1-hour time slots from simulation_start to simulation_end.
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
        time_slots.append(
            TimeSlot(
                slot_id=slot_id,
                start_time=round(curr_start, 2),
                end_time=round(curr_end, 2),
                slot_duration_minutes=slot_minutes,
            )
        )
        slot_id += 1
        curr_start = curr_end

    return time_slots
