import numpy as np
from typing import List, Tuple
from ..models.workload import Workload
from ..models.resource_pool import ResourcePool
from ..models.simulation import TimeSlot


def decode_gene(gene: int, num_slots: int) -> Tuple[int, int]:
    """
    Decode an integer gene into (resource_pool_index, time_slot_index).
    """
    pool_idx = int(gene // num_slots)
    slot_idx = int(gene % num_slots)
    return pool_idx, slot_idx


def encode_gene(pool_idx: int, slot_idx: int, num_slots: int) -> int:
    """
    Encode (resource_pool_index, time_slot_index) into a single integer gene.
    """
    return pool_idx * num_slots + slot_idx


def decode_chromosome(
    chromosome: np.ndarray,
    pools: List[ResourcePool],
    slots: List[TimeSlot]
) -> List[Tuple[ResourcePool, TimeSlot]]:
    """
    Decode a full chromosome vector into a list of (ResourcePool, TimeSlot) pairs for each workload.
    """
    num_pools = len(pools)
    num_slots = len(slots)
    assignments = []

    for gene in chromosome:
        p_idx, s_idx = decode_gene(int(gene), num_slots)
        p_idx = min(p_idx, num_pools - 1)
        s_idx = min(s_idx, num_slots - 1)
        assignments.append((pools[p_idx], slots[s_idx]))

    return assignments
