from typing import List
from fastapi import APIRouter
from ..models.resource_pool import ResourcePool
from ..services.resource_pool_service import load_resource_pools_from_json, get_default_resource_pools

router = APIRouter(prefix="/api/resource-pools", tags=["Resource Pools"])


@router.get("", response_model=List[ResourcePool])
def get_resource_pools():
    """
    Get configured virtualized data center resource pools.
    """
    try:
        return load_resource_pools_from_json()
    except Exception:
        return get_default_resource_pools()
