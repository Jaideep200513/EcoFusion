from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from ..models.simulation import SimulationConfig, SimulationResult
from ..services.simulation_service import run_simulation_pipeline, load_experiment_from_disk

router = APIRouter(tags=["Simulations"])


@router.get("/api/simulation/config", response_model=SimulationConfig)
def get_simulation_config():
    """
    Get default simulator parameters and setup options.
    """
    return SimulationConfig()


@router.post("/api/simulations/run", response_model=SimulationResult)
def run_simulation(config: Optional[SimulationConfig] = None):
    """
    Execute spatial-temporal workload simulation with configured scheduler and parameters.
    """
    effective_config = config or SimulationConfig()
    try:
        result = run_simulation_pipeline(config_override=effective_config)
        return result
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(err)}")


@router.get("/api/simulations/{experiment_id}")
def get_simulation_result(experiment_id: str):
    """
    Fetch persisted simulation outputs for a specific experiment ID.
    """
    data = load_experiment_from_disk(experiment_id)
    if not data:
        raise HTTPException(status_code=404, detail=f"Experiment '{experiment_id}' not found.")
    return data
