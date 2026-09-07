from datetime import datetime, timezone
from typing import List
import numpy as np
from .schemas import PredictionInput, WorkloadPrediction
from .feature_engineering import extract_features_from_dict, extract_features_from_workload
from .train import get_global_predictor
from ..models.workload import Workload


def predict_workload_requirements(inputs: List[PredictionInput]) -> List[WorkloadPrediction]:
    """
    Generate workload CPU, Memory, and duration predictions for input instances.
    """
    predictor = get_global_predictor()
    
    # If predictor is not yet trained, automatically train with default configuration
    if not predictor.is_trained:
        from .train import train_prediction_model, TrainingRequest
        train_prediction_model(TrainingRequest(sample_count=500, random_state=42))
        predictor = get_global_predictor()

    feature_matrix = np.array([extract_features_from_dict(inp.model_dump()) for inp in inputs])
    preds = predictor.predict(feature_matrix)

    now_iso = datetime.now(timezone.utc).isoformat()
    results: List[WorkloadPrediction] = []

    for idx, inp in enumerate(inputs):
        cpu_pred = round(float(preds[idx, 0]), 1)
        mem_pred = round(float(preds[idx, 1]), 1)
        dur_pred = round(float(preds[idx, 2]), 1)

        results.append(
            WorkloadPrediction(
                workload_id=inp.workload_id,
                predicted_cpu_required=cpu_pred,
                predicted_memory_required=mem_pred,
                predicted_duration=dur_pred,
                model_version=predictor.version,
                timestamp=now_iso,
                is_predicted=True
            )
        )

    return results


def apply_predictions_to_workloads(workloads: List[Workload]) -> List[Workload]:
    """
    Update a list of Workload objects with predicted CPU, RAM, and duration values.
    """
    if not workloads:
        return []

    predictor = get_global_predictor()
    if not predictor.is_trained:
        from .train import train_prediction_model, TrainingRequest
        train_prediction_model(TrainingRequest(sample_count=500, random_state=42))
        predictor = get_global_predictor()

    feature_matrix = np.array([extract_features_from_workload(w) for w in workloads])
    preds = predictor.predict(feature_matrix)

    predicted_workloads: List[Workload] = []
    for idx, w in enumerate(workloads):
        p_cpu = round(float(preds[idx, 0]), 1)
        p_mem = round(float(preds[idx, 1]), 1)
        p_dur = round(float(preds[idx, 2]), 1)
        
        # Ensure deadline stays > arrival_time + duration
        p_deadline = max(w.deadline, w.arrival_time + p_dur + 1.0)

        pw = Workload(
            id=w.id,
            arrival_time=w.arrival_time,
            cpu_required=p_cpu,
            memory_required=p_mem,
            duration=p_dur,
            deadline=p_deadline,
            priority=w.priority
        )
        predicted_workloads.append(pw)

    return predicted_workloads
