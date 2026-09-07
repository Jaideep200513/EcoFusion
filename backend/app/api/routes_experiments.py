from typing import List
from fastapi import APIRouter, HTTPException
from ..models.experiment import Experiment
from ..services.simulation_service import list_all_experiments, load_experiment_from_disk

router = APIRouter(prefix="/api/experiments", tags=["Experiments"])


@router.get("", response_model=List[Experiment])
def get_experiments():
    """
    Get list of all saved simulation experiments.
    """
    return list_all_experiments()


@router.get("/{experiment_id}")
def get_experiment_by_id(experiment_id: str):
    """
    Get metadata and results for a specific experiment ID.
    """
    data = load_experiment_from_disk(experiment_id)
    if not data:
        raise HTTPException(status_code=404, detail=f"Experiment '{experiment_id}' not found.")
    return data
