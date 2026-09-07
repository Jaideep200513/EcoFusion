import os
import pytest
from app.prediction.dataset_builder import generate_synthetic_training_data
from app.prediction.feature_engineering import prepare_feature_matrix
from app.prediction.model import WorkloadPredictor
from app.prediction.train import train_prediction_model, TrainingRequest, get_global_predictor
from app.prediction.predict import predict_workload_requirements, apply_predictions_to_workloads
from app.prediction.schemas import PredictionInput
from app.models.workload import Workload


def test_synthetic_training_data_generator():
    df = generate_synthetic_training_data(sample_count=100, seed=42)
    assert len(df) == 100
    assert "cpu_required" in df.columns
    assert "memory_required" in df.columns
    assert "duration" in df.columns


def test_predictor_fit_evaluate_save_load():
    req = TrainingRequest(sample_count=200, random_state=42)
    resp = train_prediction_model(req)

    assert resp.training_status == "SUCCESS"
    assert resp.sample_count == 200
    assert "mae" in resp.validation_metrics
    assert "rmse" in resp.validation_metrics
    assert "r2" in resp.validation_metrics

    # Verify global predictor artifact loaded
    predictor = get_global_predictor()
    assert predictor.is_trained is True


def test_prediction_inference_schema():
    inputs = [
        PredictionInput(
            workload_id="WL-PRED-1",
            arrival_time=4.0,
            priority=2,
            historical_cpu_mean=32.0,
            historical_memory_mean=128.0,
            historical_duration_mean=2.0
        ),
        PredictionInput(
            workload_id="WL-PRED-2",
            arrival_time=8.0,
            priority=1,
            # Missing optional historical features
        )
    ]

    preds = predict_workload_requirements(inputs)
    assert len(preds) == 2
    assert preds[0].workload_id == "WL-PRED-1"
    assert preds[0].predicted_cpu_required > 0
    assert preds[0].predicted_memory_required > 0
    assert preds[0].predicted_duration > 0
    assert preds[0].is_predicted is True

    assert preds[1].workload_id == "WL-PRED-2"
    assert preds[1].predicted_cpu_required > 0


def test_apply_predictions_to_workloads():
    workloads = [
        Workload(
            id="WL-001",
            arrival_time=0.0,
            cpu_required=16.0,
            memory_required=64.0,
            duration=2.0,
            deadline=10.0,
            priority=1,
        )
    ]

    updated = apply_predictions_to_workloads(workloads)
    assert len(updated) == 1
    assert updated[0].id == "WL-001"
    assert updated[0].cpu_required > 0
    assert updated[0].memory_required > 0
    assert updated[0].duration > 0
    assert updated[0].deadline > updated[0].arrival_time
