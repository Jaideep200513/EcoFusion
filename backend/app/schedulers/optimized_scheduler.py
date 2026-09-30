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
    Carbon-Only Single-Parameter Greedy Scheduler:
    Objective: min Carbon(workload) = (Energy * Carbon_Intensity) / 1000
    Evaluates all feasible (resource pool, time slot) candidate assignments and chooses
    the assignment that minimizes carbon emissions strictly, ignoring electricity cost and PUE.
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

        sorted_workloads = sorted(workloads, key=lambda w: (w.arrival_time, w.id))

        for wl in sorted_workloads:
            duration_slots = math.ceil(wl.duration / slot_duration_hours)
            candidates = []

            for pool in resource_pools:
                if not pool.available:
                    continue

                for s_idx, slot in enumerate(time_slots):
                    if slot.start_time < wl.arrival_time - 1e-5:
                        continue

                    completion_time = slot.start_time + wl.duration
                    if completion_time > config.simulation_end + 1e-5:
                        continue

                    sla_feasible = completion_time <= wl.deadline + 1e-5

                    if capacity_tracker.can_fit(pool.id, s_idx, duration_slots, wl.cpu_required, wl.memory_required):
                        # Calculate provisional metrics
                        energy_kwh = calculate_workload_energy(
                            wl, pool, s_idx, duration_slots, capacity_tracker, slot_duration_hours
                        )
                        carbon_kg = calculate_workload_carbon(energy_kwh, pool)
                        cost_usd = calculate_workload_cost(energy_kwh, pool)

                        # Primary sort: SLA feasible first, then minimum carbon emissions
                        candidates.append({
                            "pool": pool,
                            "slot": slot,
                            "s_idx": s_idx,
                            "completion_time": completion_time,
                            "sla_met": sla_feasible,
                            "energy_kwh": energy_kwh,
                            "carbon_kg": carbon_kg,
                            "cost_usd": cost_usd,
                            "score": carbon_kg if sla_feasible else carbon_kg + 10000.0,
                        })

            if candidates:
                candidates.sort(key=lambda c: c["score"])
                best = candidates[0]

                capacity_tracker.reserve(
                    best["pool"].id, best["s_idx"], duration_slots, wl.cpu_required, wl.memory_required
                )

                decisions.append(
                    SchedulingDecision(
                        workload_id=wl.id,
                        resource_pool_id=best["pool"].id,
                        start_time=best["slot"].start_time,
                        end_time=best["completion_time"],
                        duration=wl.duration,
                        cpu_required=wl.cpu_required,
                        memory_required=wl.memory_required,
                        completion_time=best["completion_time"],
                        sla_met=best["sla_met"],
                        status=SchedulingStatus.SCHEDULED,
                        energy_kwh=best["energy_kwh"],
                        carbon_kg=best["carbon_kg"],
                        cost=best["cost_usd"],
                    )
                )
            else:
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
    Energy-Only Single-Parameter Greedy Scheduler:
    Objective: min Energy(workload) = Power(u) * dt * PUE
    Evaluates all feasible candidate assignments and chooses the assignment that minimizes
    physical energy consumption (kWh), ignoring grid carbon intensity and electricity tariffs.
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

        sorted_workloads = sorted(workloads, key=lambda w: (w.arrival_time, w.id))

        for wl in sorted_workloads:
            duration_slots = math.ceil(wl.duration / slot_duration_hours)
            candidates = []

            for pool in resource_pools:
                if not pool.available:
                    continue

                for s_idx, slot in enumerate(time_slots):
                    if slot.start_time < wl.arrival_time - 1e-5:
                        continue

                    completion_time = slot.start_time + wl.duration
                    if completion_time > config.simulation_end + 1e-5:
                        continue

                    sla_feasible = completion_time <= wl.deadline + 1e-5

                    if capacity_tracker.can_fit(pool.id, s_idx, duration_slots, wl.cpu_required, wl.memory_required):
                        energy_kwh = calculate_workload_energy(
                            wl, pool, s_idx, duration_slots, capacity_tracker, slot_duration_hours
                        )
                        carbon_kg = calculate_workload_carbon(energy_kwh, pool)
                        cost_usd = calculate_workload_cost(energy_kwh, pool)

                        # Primary sort: SLA feasible first, then minimum energy
                        candidates.append({
                            "pool": pool,
                            "slot": slot,
                            "s_idx": s_idx,
                            "completion_time": completion_time,
                            "sla_met": sla_feasible,
                            "energy_kwh": energy_kwh,
                            "carbon_kg": carbon_kg,
                            "cost_usd": cost_usd,
                            "score": energy_kwh if sla_feasible else energy_kwh + 10000.0,
                        })

            if candidates:
                candidates.sort(key=lambda c: c["score"])
                best = candidates[0]

                capacity_tracker.reserve(
                    best["pool"].id, best["s_idx"], duration_slots, wl.cpu_required, wl.memory_required
                )

                decisions.append(
                    SchedulingDecision(
                        workload_id=wl.id,
                        resource_pool_id=best["pool"].id,
                        start_time=best["slot"].start_time,
                        end_time=best["completion_time"],
                        duration=wl.duration,
                        cpu_required=wl.cpu_required,
                        memory_required=wl.memory_required,
                        completion_time=best["completion_time"],
                        sla_met=best["sla_met"],
                        status=SchedulingStatus.SCHEDULED,
                        energy_kwh=best["energy_kwh"],
                        carbon_kg=best["carbon_kg"],
                        cost=best["cost_usd"],
                    )
                )
            else:
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


class CostAwareScheduler(BaseScheduler):
    """
    Cost-Only Single-Parameter Greedy Scheduler:
    Objective: min Cost(workload) = Energy * Electricity_Price
    Evaluates all feasible candidate assignments and chooses the assignment that minimizes
    electricity cost ($ USD), ignoring dirty grid emissions and hardware cooling overhead.
    """

    def __init__(self):
        super().__init__(name="COST_AWARE")

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
            candidates = []

            for pool in resource_pools:
                if not pool.available:
                    continue

                for s_idx, slot in enumerate(time_slots):
                    if slot.start_time < wl.arrival_time - 1e-5:
                        continue

                    completion_time = slot.start_time + wl.duration
                    if completion_time > config.simulation_end + 1e-5:
                        continue

                    sla_feasible = completion_time <= wl.deadline + 1e-5

                    if capacity_tracker.can_fit(pool.id, s_idx, duration_slots, wl.cpu_required, wl.memory_required):
                        energy_kwh = calculate_workload_energy(
                            wl, pool, s_idx, duration_slots, capacity_tracker, slot_duration_hours
                        )
                        carbon_kg = calculate_workload_carbon(energy_kwh, pool)
                        cost_usd = calculate_workload_cost(energy_kwh, pool)

                        # Primary sort: SLA feasible first, then minimum cost
                        candidates.append({
                            "pool": pool,
                            "slot": slot,
                            "s_idx": s_idx,
                            "completion_time": completion_time,
                            "sla_met": sla_feasible,
                            "energy_kwh": energy_kwh,
                            "carbon_kg": carbon_kg,
                            "cost_usd": cost_usd,
                            "score": cost_usd if sla_feasible else cost_usd + 10000.0,
                        })

            if candidates:
                candidates.sort(key=lambda c: c["score"])
                best = candidates[0]

                capacity_tracker.reserve(
                    best["pool"].id, best["s_idx"], duration_slots, wl.cpu_required, wl.memory_required
                )

                decisions.append(
                    SchedulingDecision(
                        workload_id=wl.id,
                        resource_pool_id=best["pool"].id,
                        start_time=best["slot"].start_time,
                        end_time=best["completion_time"],
                        duration=wl.duration,
                        cpu_required=wl.cpu_required,
                        memory_required=wl.memory_required,
                        completion_time=best["completion_time"],
                        sla_met=best["sla_met"],
                        status=SchedulingStatus.SCHEDULED,
                        energy_kwh=best["energy_kwh"],
                        carbon_kg=best["carbon_kg"],
                        cost=best["cost_usd"],
                    )
                )
            else:
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


class EDFScheduler(BaseScheduler):
    """
    Earliest Deadline First (EDF) / SLA-Priority Single-Parameter Scheduler:
    Objective: min Completion_Time & SLA risk
    Sorts workloads by deadline ascending and schedules at the earliest possible start slot,
    completely ignoring carbon emissions, energy efficiency, and electricity prices.
    """

    def __init__(self):
        super().__init__(name="EDF")

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

        # Sort by earliest deadline first
        sorted_workloads = sorted(workloads, key=lambda w: (w.deadline, w.arrival_time, w.id))

        for wl in sorted_workloads:
            duration_slots = math.ceil(wl.duration / slot_duration_hours)
            candidates = []

            for pool in resource_pools:
                if not pool.available:
                    continue

                for s_idx, slot in enumerate(time_slots):
                    if slot.start_time < wl.arrival_time - 1e-5:
                        continue

                    completion_time = slot.start_time + wl.duration
                    if completion_time > config.simulation_end + 1e-5:
                        continue

                    sla_feasible = completion_time <= wl.deadline + 1e-5

                    if capacity_tracker.can_fit(pool.id, s_idx, duration_slots, wl.cpu_required, wl.memory_required):
                        energy_kwh = calculate_workload_energy(
                            wl, pool, s_idx, duration_slots, capacity_tracker, slot_duration_hours
                        )
                        carbon_kg = calculate_workload_carbon(energy_kwh, pool)
                        cost_usd = calculate_workload_cost(energy_kwh, pool)

                        # Primary sort: earliest start time (minimal queueing latency)
                        candidates.append({
                            "pool": pool,
                            "slot": slot,
                            "s_idx": s_idx,
                            "completion_time": completion_time,
                            "sla_met": sla_feasible,
                            "energy_kwh": energy_kwh,
                            "carbon_kg": carbon_kg,
                            "cost_usd": cost_usd,
                            "score": slot.start_time if sla_feasible else slot.start_time + 1000.0,
                        })

            if candidates:
                candidates.sort(key=lambda c: c["score"])
                best = candidates[0]

                capacity_tracker.reserve(
                    best["pool"].id, best["s_idx"], duration_slots, wl.cpu_required, wl.memory_required
                )

                decisions.append(
                    SchedulingDecision(
                        workload_id=wl.id,
                        resource_pool_id=best["pool"].id,
                        start_time=best["slot"].start_time,
                        end_time=best["completion_time"],
                        duration=wl.duration,
                        cpu_required=wl.cpu_required,
                        memory_required=wl.memory_required,
                        completion_time=best["completion_time"],
                        sla_met=best["sla_met"],
                        status=SchedulingStatus.SCHEDULED,
                        energy_kwh=best["energy_kwh"],
                        carbon_kg=best["carbon_kg"],
                        cost=best["cost_usd"],
                    )
                )
            else:
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
