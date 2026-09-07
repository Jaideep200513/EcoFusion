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
        X_repaired = np.copy(X)

        for row_idx in range(len(X_repaired)):
            chromosome = X_repaired[row_idx]
            capacity_tracker = CapacityTracker(self.pools, self.slots)

            for wl_idx, wl in enumerate(self.workloads):
                gene = int(chromosome[wl_idx])
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
                else:
                    # Search alternative feasible candidate
                    found_alt = False
                    for alt_p_idx, alt_pool in enumerate(self.pools):
                        if not alt_pool.available:
                            continue
                        for alt_s_idx, alt_slot in enumerate(self.slots):
                            alt_comp = alt_slot.start_time + wl.duration
                            if (
                                alt_slot.start_time >= (wl.arrival_time - 1e-5) and
                                alt_comp <= (wl.deadline + 1e-5) and
                                alt_comp <= (self.config.simulation_end + 1e-5) and
                                capacity_tracker.can_fit(alt_pool.id, alt_s_idx, duration_slots, wl.cpu_required, wl.memory_required)
                            ):
                                capacity_tracker.reserve(alt_pool.id, alt_s_idx, duration_slots, wl.cpu_required, wl.memory_required)
                                chromosome[wl_idx] = encode_gene(alt_p_idx, alt_s_idx, self.num_slots)
                                found_alt = True
                                break
                        if found_alt:
                            break

        return X_repaired
