from typing import List
from fastapi import APIRouter, HTTPException
from ..models.workload import Workload, WorkloadCreate
from ..models.simulation import SimulationConfig
from ..services.workload_service import generate_workloads

router = APIRouter(prefix="/api/workloads", tags=["Workloads"])

# In-memory session workload cache
_cached_workloads: List[Workload] = []


def get_current_workloads(count: int = 100, seed: int = 42) -> List[Workload]:
    global _cached_workloads
    if not _cached_workloads:
        _cached_workloads = generate_workloads(count=count, seed=seed)
    return _cached_workloads


@router.get("", response_model=List[Workload])
def get_workloads(count: int = 100, seed: int = 42):
    """
    Get current set of workloads (or generate synthetic workload trace).
    """
    return get_current_workloads(count=count, seed=seed)


@router.post("", response_model=Workload, status_code=201)
def create_workload(payload: WorkloadCreate):
    """
    Submit a custom workload definition.
    """
    global _cached_workloads
    workloads = get_current_workloads()
    
    new_id = payload.id or f"WL-{len(workloads) + 1:03d}"
    if any(w.id == new_id for w in workloads):
        raise HTTPException(status_code=400, detail=f"Workload ID '{new_id}' already exists.")

    wl = Workload(
        id=new_id,
        arrival_time=payload.arrival_time,
        cpu_required=payload.cpu_required,
        memory_required=payload.memory_required,
        duration=payload.duration,
        deadline=payload.deadline,
        priority=payload.priority,
    )

    _cached_workloads.insert(0, wl)
    return wl
