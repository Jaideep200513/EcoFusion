from typing import List, Dict
from ..models.resource_pool import ResourcePool
from ..models.simulation import TimeSlot


class CapacityTracker:
    """
    Spatial-temporal resource capacity tracker across pools and time slots.
    Ensures CPU and Memory limits are never violated.
    """

    def __init__(self, pools: List[ResourcePool], slots: List[TimeSlot]):
        self.pools: Dict[str, ResourcePool] = {p.id: p for p in pools}
        self.slots: List[TimeSlot] = slots
        self.num_slots = len(slots)

        # Usage matrices: pool_id -> list of float indexed by slot_id
        self.cpu_used: Dict[str, List[float]] = {
            p.id: [0.0] * self.num_slots for p in pools
        }
        self.memory_used: Dict[str, List[float]] = {
            p.id: [0.0] * self.num_slots for p in pools
        }

    def is_valid_slot_range(self, start_slot_id: int, duration_slots: int) -> bool:
        if start_slot_id < 0 or duration_slots <= 0:
            return False
        if (start_slot_id + duration_slots) > self.num_slots:
            return False
        return True

    def can_fit(
        self,
        pool_id: str,
        start_slot_id: int,
        duration_slots: int,
        cpu_required: float,
        memory_required: float,
    ) -> bool:
        if pool_id not in self.pools:
            return False

        if not self.is_valid_slot_range(start_slot_id, duration_slots):
            return False

        pool = self.pools[pool_id]
        if not pool.available:
            return False

        for slot_idx in range(start_slot_id, start_slot_id + duration_slots):
            if (self.cpu_used[pool_id][slot_idx] + cpu_required) > pool.cpu_capacity + 1e-6:
                return False
            if (self.memory_used[pool_id][slot_idx] + memory_required) > pool.memory_capacity + 1e-6:
                return False

        return True

    def reserve(
        self,
        pool_id: str,
        start_slot_id: int,
        duration_slots: int,
        cpu_required: float,
        memory_required: float,
    ) -> bool:
        if not self.can_fit(pool_id, start_slot_id, duration_slots, cpu_required, memory_required):
            return False

        for slot_idx in range(start_slot_id, start_slot_id + duration_slots):
            self.cpu_used[pool_id][slot_idx] += cpu_required
            self.memory_used[pool_id][slot_idx] += memory_required

        return True

    def release(
        self,
        pool_id: str,
        start_slot_id: int,
        duration_slots: int,
        cpu_required: float,
        memory_required: float,
    ) -> None:
        if pool_id not in self.pools:
            return

        for slot_idx in range(start_slot_id, start_slot_id + duration_slots):
            if 0 <= slot_idx < self.num_slots:
                self.cpu_used[pool_id][slot_idx] = max(0.0, self.cpu_used[pool_id][slot_idx] - cpu_required)
                self.memory_used[pool_id][slot_idx] = max(0.0, self.memory_used[pool_id][slot_idx] - memory_required)

    def get_used_capacity(self, pool_id: str, slot_id: int) -> Dict[str, float]:
        if pool_id not in self.pools or not (0 <= slot_id < self.num_slots):
            return {"cpu": 0.0, "memory": 0.0}
        return {
            "cpu": self.cpu_used[pool_id][slot_id],
            "memory": self.memory_used[pool_id][slot_id],
        }

    def get_remaining_capacity(self, pool_id: str, slot_id: int) -> Dict[str, float]:
        if pool_id not in self.pools or not (0 <= slot_id < self.num_slots):
            return {"cpu": 0.0, "memory": 0.0}
        pool = self.pools[pool_id]
        return {
            "cpu": max(0.0, pool.cpu_capacity - self.cpu_used[pool_id][slot_id]),
            "memory": max(0.0, pool.memory_capacity - self.memory_used[pool_id][slot_id]),
        }

    def get_utilization(self, pool_id: str, slot_id: int) -> float:
        if pool_id not in self.pools or not (0 <= slot_id < self.num_slots):
            return 0.0
        pool = self.pools[pool_id]
        if pool.cpu_capacity <= 0:
            return 0.0
        return min(1.0, self.cpu_used[pool_id][slot_id] / pool.cpu_capacity)
