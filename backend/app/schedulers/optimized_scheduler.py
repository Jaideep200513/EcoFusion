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


class OptimizedScheduler(BaseScheduler):
    """
    NSGA-II Multi-Objective Optimized Scheduler.
    Runs NSGA-II evolutionary optimization and returns decisions for the best-compromise solution.
    """

    def __init__(self):
        super().__init__(name="ECOFUSION_NSGA2")

    def schedule(
        self,
        workloads: List[Workload],
        resource_pools: List[ResourcePool],
        time_slots: List[TimeSlot],
        config: SimulationConfig,
    ) -> List[SchedulingDecision]:
        from ..optimization import run_nsga2_optimization, OptimizationConfig
        
        opt_config = OptimizationConfig(
            random_seed=config.random_seed,
            population_size=50,
            generations=50
        )
        opt_res = run_nsga2_optimization(workloads, resource_pools, time_slots, config, opt_config)
        return opt_res.selected_solution.assignments


class CarbonAwareScheduler(BaseScheduler):
    """
    Carbon-Aware Greedy Scheduler:
    Prioritizes resource pools with the lowest carbon intensity (gCO2/kWh).
    """

    def __init__(self):
        super().__init__(name="CARBON_AWARE")

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

        # Sort resource pools by carbon intensity ascending
        sorted_pools = sorted(resource_pools, key=lambda p: p.carbon_intensity)
        sorted_workloads = sorted(workloads, key=lambda w: (w.arrival_time, w.id))

        for wl in sorted_workloads:
            duration_slots = math.ceil(wl.duration / slot_duration_hours)
            assigned = False

            for pool in sorted_pools:
                if not pool.available:
                    continue

                for s_idx, slot in enumerate(time_slots):
                    if slot.start_time < wl.arrival_time - 1e-5:
                        continue

                    completion_time = slot.start_time + wl.duration
                    if completion_time > config.simulation_end + 1e-5 or completion_time > wl.deadline + 1e-5:
                        continue

                    if capacity_tracker.can_fit(pool.id, s_idx, duration_slots, wl.cpu_required, wl.memory_required):
                        capacity_tracker.reserve(pool.id, s_idx, duration_slots, wl.cpu_required, wl.memory_required)
                        energy_kwh = calculate_workload_energy(wl, pool, s_idx, duration_slots, capacity_tracker, slot_duration_hours)
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
                        break

                if assigned:
                    break

            if not assigned:
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


class EnergyAwareScheduler(BaseScheduler):
    """
    Energy-Aware Greedy Scheduler:
    Prioritizes resource pools with the lowest PUE rating.
    """

    def __init__(self):
        super().__init__(name="ENERGY_AWARE")

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

        # Sort resource pools by PUE ascending
        sorted_pools = sorted(resource_pools, key=lambda p: p.pue)
        sorted_workloads = sorted(workloads, key=lambda w: (w.arrival_time, w.id))

        for wl in sorted_workloads:
            duration_slots = math.ceil(wl.duration / slot_duration_hours)
            assigned = False

            for pool in sorted_pools:
                if not pool.available:
                    continue

                for s_idx, slot in enumerate(time_slots):
                    if slot.start_time < wl.arrival_time - 1e-5:
                        continue

                    completion_time = slot.start_time + wl.duration
                    if completion_time > config.simulation_end + 1e-5 or completion_time > wl.deadline + 1e-5:
                        continue

                    if capacity_tracker.can_fit(pool.id, s_idx, duration_slots, wl.cpu_required, wl.memory_required):
                        capacity_tracker.reserve(pool.id, s_idx, duration_slots, wl.cpu_required, wl.memory_required)
                        energy_kwh = calculate_workload_energy(wl, pool, s_idx, duration_slots, capacity_tracker, slot_duration_hours)
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
                        break

                if assigned:
                    break

            if not assigned:
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
