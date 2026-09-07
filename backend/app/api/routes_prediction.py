from typing import List
from fastapi import APIRouter, HTTPException
from ..prediction import (
    TrainingRequest,
    TrainingResponse,
    PredictionInput,
    WorkloadPrediction,
    ModelStatus,
    train_prediction_model,
    predict_workload_requirements,
    get_global_predictor,
)

router = APIRouter(prefix="/api/prediction", tags=["Prediction"])


@router.get("/status", response_model=ModelStatus)
def get_prediction_model_status():
    """
    Get current Random Forest model status, trained sample count, and validation metrics.
    """
    predictor = get_global_predictor()
    return ModelStatus(
        is_trained=predictor.is_trained,
        model_version=predictor.version,
        trained_samples=predictor.trained_samples,
        mae_metrics=predictor.last_metrics.get("mae", {}),
        rmse_metrics=predictor.last_metrics.get("rmse", {}),
        r2_metrics=predictor.last_metrics.get("r2", {}),
        training_timestamp=None,
    )


@router.post("/train", response_model=TrainingResponse)
def train_model(request: TrainingRequest):
    """
    Train Random Forest predictor model on synthetic workload traces.
    """
    try:
        return train_prediction_model(request)
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Model training failed: {str(err)}")


@router.post("/predict", response_model=List[WorkloadPrediction])
def predict_workloads(inputs: List[PredictionInput]):
    """
    Generate workload CPU, RAM, and duration predictions.
    """
    if not inputs:
        raise HTTPException(status_code=400, detail="Prediction inputs list cannot be empty.")
    try:
        return predict_workload_requirements(inputs)
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Workload prediction failed: {str(err)}")
