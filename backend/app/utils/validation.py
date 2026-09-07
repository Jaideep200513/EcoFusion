from typing import List
from ..models.workload import Workload
from ..models.resource_pool import ResourcePool


def validate_unique_workload_ids(workloads: List[Workload]) -> None:
    """
    Ensure all workload IDs in the set are unique.
    """
    seen = set()
    for wl in workloads:
        if wl.id in seen:
            raise ValueError(f"Duplicate workload ID detected: {wl.id}")
        seen.add(wl.id)


def validate_unique_pool_ids(pools: List[ResourcePool]) -> None:
    """
    Ensure all resource pool IDs are unique.
    """
    seen = set()
    for pool in pools:
        if pool.id in seen:
            raise ValueError(f"Duplicate resource pool ID detected: {pool.id}")
        seen.add(pool.id)
