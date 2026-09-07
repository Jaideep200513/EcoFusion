import math
import numpy as np
from typing import List, Tuple
from pymoo.core.problem import ElementwiseProblem
from ..models.workload import Workload
from ..models.resource_pool import ResourcePool
from ..models.simulation import TimeSlot, SimulationConfig
from ..models.scheduling import SchedulingDecision, SchedulingStatus
from ..services.capacity_tracker import CapacityTracker
from ..services.energy_service import calculate_workload_energy
from ..services.carbon_service import calculate_workload_carbon
from ..services.cost_service import calculate_workload_cost
from ..services.sla_service import is_sla_met
from .chromosome import decode_gene


class EcoFusionSchedulingProblem(ElementwiseProblem):
    """
    Multi-objective spatial-temporal workload scheduling problem formulation for pymoo.

    Objectives:
      F1: Minimize total carbon emissions (kgCO2)
      F2: Minimize total energy consumption (kWh)
      F3: Minimize total operational cost (USD)

    Constraint:
      G1: Unscheduled workload count <= 0
    """

    def __init__(
        self,
        workloads: List[Workload],
        pools: List[ResourcePool],
        slots: List[TimeSlot],
        config: SimulationConfig
    ):
        self.workloads = sorted(workloads, key=lambda w: (w.arrival_time, w.id))
        self.pools = pools
        self.slots = slots
        self.config = config
        self.num_pools = len(pools)
        self.num_slots = len(slots)
        self.slot_duration_hours = config.slot_duration_minutes / 60.0

        n_var = len(self.workloads)
        max_gene_val = (self.num_pools * self.num_slots) - 1

        super().__init__(
            n_var=n_var,
            n_obj=3,
            n_ieq_constr=1,
            xl=np.zeros(n_var, dtype=int),
            xu=np.full(n_var, max_gene_val, dtype=int)
        )

    def evaluate_chromosome(
        self, x: np.ndarray
    ) -> Tuple[List[SchedulingDecision], float, float, float, int]:
        """
        Decode and evaluate a chromosome vector returning decisions, carbon, energy, cost, and unscheduled count.
        """
        capacity_tracker = CapacityTracker(self.pools, self.slots)
        decisions: List[SchedulingDecision] = []

        total_energy = 0.0
        total_carbon = 0.0
        total_cost = 0.0
        unscheduled_count = 0

        for wl_idx, wl in enumerate(self.workloads):
            gene = int(x[wl_idx])
            p_idx, s_idx = decode_gene(gene, self.num_slots)
            p_idx = min(p_idx, self.num_pools - 1)
            s_idx = min(s_idx, self.num_slots - 1)

            pool = self.pools[p_idx]
            slot = self.slots[s_idx]
            duration_slots = math.ceil(wl.duration / self.slot_duration_hours)

            completion_time = slot.start_time + wl.duration
            is_valid = (
                pool.available and
                slot.start_time >= (wl.arrival_time - 1e-5) and
                completion_time <= (wl.deadline + 1e-5) and
                completion_time <= (self.config.simulation_end + 1e-5) and
                capacity_tracker.can_fit(pool.id, s_idx, duration_slots, wl.cpu_required, wl.memory_required)
            )

            if is_valid:
                capacity_tracker.reserve(pool.id, s_idx, duration_slots, wl.cpu_required, wl.memory_required)
                energy_kwh = calculate_workload_energy(
                    wl, pool, s_idx, duration_slots, capacity_tracker, self.slot_duration_hours
                )
                carbon_kg = calculate_workload_carbon(energy_kwh, pool)
                cost_usd = calculate_workload_cost(energy_kwh, pool)
                sla_met = is_sla_met(completion_time, wl.deadline)

                total_energy += energy_kwh
                total_carbon += carbon_kg
                total_cost += cost_usd

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
            else:
                unscheduled_count += 1
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

        return decisions, total_carbon, total_energy, total_cost, unscheduled_count

    def _evaluate(self, x, out, *args, **kwargs):
        _, total_carbon, total_energy, total_cost, unscheduled_count = self.evaluate_chromosome(x)

        # Apply penalizing penalty for unscheduled workloads to favor feasible Pareto solutions
        penalty = unscheduled_count * 1000.0
        
        out["F"] = [
            round(total_carbon + penalty, 2),
            round(total_energy + penalty, 2),
            round(total_cost + penalty, 2),
        ]
        out["G"] = [unscheduled_count]
