import pandas as pd
import numpy as np
from typing import List, Dict, Any, Union
from .schemas import PredictionInput
from ..models.workload import Workload

FEATURE_COLUMNS = [
    "arrival_time",
    "hour_of_day",
    "priority",
    "historical_cpu_mean",
    "historical_memory_mean",
    "historical_duration_mean",
]


def extract_features_from_dict(raw: Dict[str, Any]) -> List[float]:
    """
    Extract and fill default values for missing feature attributes.
    """
    arrival_time = float(raw.get("arrival_time", 0.0))
    hour_of_day = float(raw.get("hour_of_day", int(arrival_time) % 24))
    priority = float(raw.get("priority", 1))

    # Fallbacks for optional historical features
    hist_cpu = float(raw.get("historical_cpu_mean", 64.0) if raw.get("historical_cpu_mean") is not None else 64.0)
    hist_mem = float(raw.get("historical_memory_mean", 256.0) if raw.get("historical_memory_mean") is not None else 256.0)
    hist_dur = float(raw.get("historical_duration_mean", 3.0) if raw.get("historical_duration_mean") is not None else 3.0)

    return [arrival_time, hour_of_day, priority, hist_cpu, hist_mem, hist_dur]


def extract_features_from_workload(wl: Workload) -> List[float]:
    """
    Extract feature vector from a domain Workload object without target leakage.
    Computes historical prior expectations conditioned strictly on pre-execution arrival context
    (arrival_time, hour_of_day, priority) rather than copying the target labels directly.
    """
    hour_of_day = float(int(wl.arrival_time) % 24)
    priority = float(wl.priority or 1)

    # Context-conditioned historical prior means (derived from arrival hour and priority tier)
    prior_cpu_mean = 32.0 * priority + (hour_of_day % 8) * 12.0
    prior_mem_mean = prior_cpu_mean * 4.0
    prior_dur_mean = 1.0 + (prior_cpu_mean / 64.0) + (priority * 0.5)

    return [
        float(wl.arrival_time),
        hour_of_day,
        priority,
        prior_cpu_mean,
        prior_mem_mean,
        prior_dur_mean,
    ]


def prepare_feature_matrix(data: Union[pd.DataFrame, List[Dict[str, Any]]]) -> np.ndarray:
    """
    Convert a DataFrame or list of dicts into a NumPy feature matrix.
    """
    if isinstance(data, pd.DataFrame):
        df = data.copy()
        for col in FEATURE_COLUMNS:
            if col not in df.columns:
                df[col] = 0.0
        return df[FEATURE_COLUMNS].to_numpy()

    matrix = []
    for item in data:
        matrix.append(extract_features_from_dict(item))
    return np.array(matrix)
