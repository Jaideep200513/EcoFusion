from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class PredictionInput(BaseModel):
    workload_id: str = Field(..., description="Target workload ID")
    arrival_time: float = Field(..., description="Arrival time offset in hours")
    priority: int = Field(default=1, description="Workload priority (1-3)")
    historical_cpu_mean: Optional[float] = Field(default=None, description="Historical CPU usage mean if available")
    historical_memory_mean: Optional[float] = Field(default=None, description="Historical RAM usage mean if available")
    historical_duration_mean: Optional[float] = Field(default=None, description="Historical duration mean if available")
    workload_type: Optional[str] = Field(default="batch", description="Workload type label (e.g. batch, interactive)")


class WorkloadPrediction(BaseModel):
    workload_id: str = Field(..., description="Target workload ID")
    predicted_cpu_required: float = Field(..., description="Predicted CPU cores requirement (> 0)")
    predicted_memory_required: float = Field(..., description="Predicted RAM requirement in GB (> 0)")
    predicted_duration: float = Field(..., description="Predicted duration in hours (> 0)")
    model_version: str = Field(default="rf_v1.0", description="Predictor model artifact version")
    timestamp: str = Field(..., description="ISO 8601 prediction timestamp")
    is_predicted: bool = Field(default=True, description="True if estimated via ML model, False if observed")


class ModelStatus(BaseModel):
    is_trained: bool = Field(..., description="Whether the predictor model artifact exists and is ready")
    model_version: str = Field(default="rf_v1.0", description="Current model version tag")
    trained_samples: int = Field(default=0, description="Number of training samples evaluated")
    mae_metrics: Dict[str, float] = Field(default_factory=dict, description="Mean Absolute Error per target")
    rmse_metrics: Dict[str, float] = Field(default_factory=dict, description="Root Mean Squared Error per target")
    r2_metrics: Dict[str, float] = Field(default_factory=dict, description="R² score per target")
    training_timestamp: Optional[str] = Field(default=None, description="ISO timestamp of last training run")


class TrainingRequest(BaseModel):
    sample_count: int = Field(default=1000, description="Number of synthetic historical trace samples to generate for training")
    n_estimators: int = Field(default=100, description="Random Forest tree count")
    max_depth: Optional[int] = Field(default=12, description="Max tree depth ceiling")
    random_state: int = Field(default=42, description="Random seed")
    test_size: float = Field(default=0.2, description="Validation split ratio")


class TrainingResponse(BaseModel):
    model_id: str = Field(..., description="Trained model artifact identifier")
    sample_count: int = Field(..., description="Total training samples generated")
    validation_metrics: Dict[str, Any] = Field(..., description="Validation MAE, RMSE, R² scores")
    feature_names: List[str] = Field(..., description="List of feature names used")
    training_status: str = Field(default="SUCCESS", description="Outcome status")
