import math
from typing import List, Tuple
from .base_scheduler import BaseScheduler
from ..models.workload import Workload
from ..models.resource_pool import ResourcePool
from ..models.simulation import TimeSlot, SimulationConfig
from ..models.scheduling import SchedulingDecision, SchedulingStatus
from ..services.capacity_tracker import CapacityTracker
from ..services.energy_service import calculate_workload_energy
from ..services.carbon_service import calculate_workload_carbon
from ..services.cost_service import calculate_workload_cost
from ..services.sla_service import is_sla_met
from ..utils.random_utils import get_seeded_random


class RandomScheduler(BaseScheduler):
    """
    Random Scheduler baseline algorithm:
    1. Collects all feasible (resource pool, time slot) candidate assignments for each workload.
    2. Shuffles candidates randomly using the configured random seed.
    3. Selects a feasible candidate that satisfies arrival time, deadline, CPU, and Memory capacities.
    4. Explicitly records unscheduled workloads when no candidate can fit.
    """

    def __init__(self):
        super().__init__(name="random")

    def schedule(
        self,
        workloads: List[Workload],
        resource_pools: List[ResourcePool],
        time_slots: List[TimeSlot],
        config: SimulationConfig,
    ) -> List[SchedulingDecision]:
        rng = get_seeded_random(config.random_seed)
        capacity_tracker = CapacityTracker(resource_pools, time_slots)
        decisions: List[SchedulingDecision] = []

        pool_map = {p.id: p for p in resource_pools}
        slot_duration_hours = config.slot_duration_minutes / 60.0

        # Sort workloads by arrival time for orderly processing
        sorted_workloads = sorted(workloads, key=lambda w: (w.arrival_time, w.id))

        for wl in sorted_workloads:
            duration_slots = math.ceil(wl.duration / slot_duration_hours)
            feasible_candidates: List[Tuple[ResourcePool, int]] = []

            # Search feasible candidates across all pools and time slots
            for pool in resource_pools:
                if not pool.available:
                    continue

                for slot_idx, slot in enumerate(time_slots):
                    # Constraint 1: Start time must not be before arrival time
                    if slot.start_time < wl.arrival_time - 1e-5:
                        continue

                    # Constraint 2: Completion time must not exceed simulation horizon
                    completion_time = slot.start_time + wl.duration
                    if completion_time > config.simulation_end + 1e-5:
                        continue

                    # Constraint 3: Completion time must not exceed workload deadline
                    if completion_time > wl.deadline + 1e-5:
                        continue

                    # Constraint 4: Capacity check across all occupied slots
                    if capacity_tracker.can_fit(
                        pool.id, slot_idx, duration_slots, wl.cpu_required, wl.memory_required
                    ):
                        feasible_candidates.append((pool, slot_idx))

            if feasible_candidates:
                # Randomly pick a feasible candidate
                selected_pool, selected_slot_idx = rng.choice(feasible_candidates)
                selected_slot = time_slots[selected_slot_idx]
                completion_time = selected_slot.start_time + wl.duration

                # Reserve resources
                capacity_tracker.reserve(
                    selected_pool.id, selected_slot_idx, duration_slots, wl.cpu_required, wl.memory_required
                )

                # Compute metrics
                energy_kwh = calculate_workload_energy(
                    wl, selected_pool, selected_slot_idx, duration_slots, capacity_tracker, slot_duration_hours
                )
                carbon_kg = calculate_workload_carbon(energy_kwh, selected_pool)
                cost_usd = calculate_workload_cost(energy_kwh, selected_pool)
                sla_met = is_sla_met(completion_time, wl.deadline)

                decisions.append(
                    SchedulingDecision(
                        workload_id=wl.id,
                        resource_pool_id=selected_pool.id,
                        start_time=selected_slot.start_time,
                        end_time=completion_time,
                        duration=wl.duration,
                        cpu_required=wl.cpu_required,
                        memory_required=wl.memory_required,
                        completion_time=completion_time,
                        sla_met=sla_met,
                        status=SchedulingStatus.SCHEDULED,
                        energy_kwh=energy_kwh,
                        carbon_kg=carbon_kg,
                        cost=cost_usd,
                    )
                )
            else:
                # Unscheduled workload
                decisions.append(
                    SchedulingDecision(
                        workload_id=wl.id,
                        resource_pool_id=None,
                        start_time=None,
                        end_time=None,
                        duration=wl.duration,
                        cpu_required=wl.cpu_required,
                        memory_required=wl.memory_required,
                        completion_time=None,
                        sla_met=False,
                        status=SchedulingStatus.UNSCHEDULED,
                        energy_kwh=0.0,
                        carbon_kg=0.0,
                        cost=0.0,
                    )
                )

        return decisions
