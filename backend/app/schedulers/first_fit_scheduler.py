import math
from typing import List
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


class FirstFitScheduler(BaseScheduler):
    """
    First-Fit Scheduler baseline algorithm:
    1. Iterates through resource pools in configuration order.
    2. Iterates through time slots in chronological order.
    3. Selects the first feasible candidate assignment respecting arrival time, deadline, CPU, and Memory capacity.
    4. Explicitly records unscheduled workloads when no candidate can fit.
    """

    def __init__(self):
        super().__init__(name="first_fit")

    def schedule(
        self,
        workloads: List[Workload],
        resource_pools: List[ResourcePool],
        time_slots: List[TimeSlot],
        config: SimulationConfig,
    ) -> List[SchedulingDecision]:
        capacity_tracker = CapacityTracker(resource_pools, time_slots)
        decisions: List[SchedulingDecision] = []
        slot_duration_hours = config.slot_duration_minutes / 60.0

        sorted_workloads = sorted(workloads, key=lambda w: (w.arrival_time, w.id))

        for wl in sorted_workloads:
            duration_slots = math.ceil(wl.duration / slot_duration_hours)
            assigned = False

            # Search in pool configuration order, then chronological slot order
            for pool in resource_pools:
                if not pool.available:
                    continue

                for slot_idx, slot in enumerate(time_slots):
                    # Constraint 1: Arrival time
                    if slot.start_time < wl.arrival_time - 1e-5:
                        continue

                    # Constraint 2: Simulation horizon limit
                    completion_time = slot.start_time + wl.duration
                    if completion_time > config.simulation_end + 1e-5:
                        continue

                    # Constraint 3: Workload deadline limit
                    if completion_time > wl.deadline + 1e-5:
                        continue

                    # Constraint 4: Capacity reservation check
                    if capacity_tracker.can_fit(
                        pool.id, slot_idx, duration_slots, wl.cpu_required, wl.memory_required
                    ):
                        # Reserve first feasible slot
                        capacity_tracker.reserve(
                            pool.id, slot_idx, duration_slots, wl.cpu_required, wl.memory_required
                        )

                        energy_kwh = calculate_workload_energy(
                            wl, pool, slot_idx, duration_slots, capacity_tracker, slot_duration_hours
                        )
                        carbon_kg = calculate_workload_carbon(energy_kwh, pool)
                        cost_usd = calculate_workload_cost(energy_kwh, pool)
                        sla_met = is_sla_met(completion_time, wl.deadline)

                        decisions.append(
                            SchedulingDecision(
                                workload_id=wl.id,
                                resource_pool_id=pool.id,
                                start_time=slot.start_time,
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
                        assigned = True
                        break  # Stop checking slots for this pool

                if assigned:
                    break  # Stop checking remaining pools for this workload

            if not assigned:
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
