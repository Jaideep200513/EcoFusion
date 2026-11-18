import math
import numpy as np
from typing import List
from pymoo.core.repair import Repair
from ..models.workload import Workload
from ..models.resource_pool import ResourcePool
from ..models.simulation import TimeSlot, SimulationConfig
from ..services.capacity_tracker import CapacityTracker
from .chromosome import decode_gene, encode_gene


class EcoFusionRepair(Repair):
    """
    Feasibility-preserving repair operator for NSGA-II chromosomes.
    Fixes invalid start times, deadline violations, and capacity over-allocations.
    """

    def __init__(
        self,
        workloads: List[Workload],
        pools: List[ResourcePool],
        slots: List[TimeSlot],
        config: SimulationConfig
    ):
        super().__init__()
        self.workloads = sorted(workloads, key=lambda w: (w.arrival_time, w.id))
        self.pools = pools
        self.slots = slots
        self.config = config
        self.num_pools = len(pools)
        self.num_slots = len(slots)
        self.slot_duration_hours = config.slot_duration_minutes / 60.0

    def _do(self, problem, X, **kwargs):
        X_repaired = np.copy(X).astype(int)

        for row_idx in range(len(X_repaired)):
            chromosome = X_repaired[row_idx]
            capacity_tracker = CapacityTracker(self.pools, self.slots)

            for wl_idx, wl in enumerate(self.workloads):
                gene = int(chromosome[wl_idx])
                p_idx, s_idx = decode_gene(gene, self.num_slots)
                p_idx = max(0, min(p_idx, self.num_pools - 1))
                s_idx = max(0, min(s_idx, self.num_slots - 1))

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
                    chromosome[wl_idx] = encode_gene(p_idx, s_idx, self.num_slots)
                else:
                    found_alt = False
                    slot_order = sorted(range(self.num_slots), key=lambda s: abs(s - s_idx))

                    # 1. Search feasible slot within the SAME pool first (preserving spatial GA intent)
                    if pool.available:
                        for cand_s in slot_order:
                            c_slot = self.slots[cand_s]
                            c_comp = c_slot.start_time + wl.duration
                            if (
                                c_slot.start_time >= (wl.arrival_time - 1e-5) and
                                c_comp <= (wl.deadline + 1e-5) and
                                c_comp <= (self.config.simulation_end + 1e-5) and
                                capacity_tracker.can_fit(pool.id, cand_s, duration_slots, wl.cpu_required, wl.memory_required)
                            ):
                                capacity_tracker.reserve(pool.id, cand_s, duration_slots, wl.cpu_required, wl.memory_required)
                                chromosome[wl_idx] = encode_gene(p_idx, cand_s, self.num_slots)
                                found_alt = True
                                break

                    # 2. Search alternative pools if same pool cannot accommodate
                    if not found_alt:
                        other_pools = [p for p in range(self.num_pools) if p != p_idx]
                        for alt_p in other_pools:
                            alt_pool = self.pools[alt_p]
                            if not alt_pool.available:
                                continue
                            for cand_s in slot_order:
                                c_slot = self.slots[cand_s]
                                c_comp = c_slot.start_time + wl.duration
                                if (
                                    c_slot.start_time >= (wl.arrival_time - 1e-5) and
                                    c_comp <= (wl.deadline + 1e-5) and
                                    c_comp <= (self.config.simulation_end + 1e-5) and
                                    capacity_tracker.can_fit(alt_pool.id, cand_s, duration_slots, wl.cpu_required, wl.memory_required)
                                ):
                                    capacity_tracker.reserve(alt_pool.id, cand_s, duration_slots, wl.cpu_required, wl.memory_required)
                                    chromosome[wl_idx] = encode_gene(alt_p, cand_s, self.num_slots)
                                    found_alt = True
                                    break
                            if found_alt:
                                break

        return X_repaired
