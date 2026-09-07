import numpy as np
from typing import Dict, Any
from sklearn.model_selection import train_test_split
from .schemas import TrainingRequest, TrainingResponse
from .dataset_builder import generate_synthetic_training_data
from .feature_engineering import prepare_feature_matrix, FEATURE_COLUMNS
from .model import WorkloadPredictor, MODEL_ARTIFACTS_DIR

_global_predictor: WorkloadPredictor = WorkloadPredictor()


def get_global_predictor() -> WorkloadPredictor:
    global _global_predictor
    if not _global_predictor.is_trained:
        _global_predictor.load()
    return _global_predictor


def train_prediction_model(request: TrainingRequest) -> TrainingResponse:
    """
    Generate synthetic dataset, split train/test sets, train Random Forest, calculate metrics, and save artifact.
    """
    global _global_predictor
    df = generate_synthetic_training_data(sample_count=request.sample_count, seed=request.random_state)
    
    X = prepare_feature_matrix(df)
    y = df[["cpu_required", "memory_required", "duration"]].to_numpy()

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=request.test_size, random_state=request.random_state
    )

    predictor = WorkloadPredictor(
        n_estimators=request.n_estimators,
        max_depth=request.max_depth,
        random_state=request.random_state
    )
    
    metrics = predictor.fit(X_train, y_train)
    val_metrics = predictor.evaluate(X_val, y_val)
    
    predictor.save("workload_predictor.joblib")
    _global_predictor = predictor

    return TrainingResponse(
        model_id="rf_workload_predictor_v1",
        sample_count=len(df),
        validation_metrics=val_metrics,
        feature_names=FEATURE_COLUMNS,
        training_status="SUCCESS"
    )
