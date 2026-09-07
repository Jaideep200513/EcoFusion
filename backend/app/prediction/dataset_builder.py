import numpy as np
import pandas as pd
from typing import Tuple
from ..utils.random_utils import get_seeded_random


def generate_synthetic_training_data(
    sample_count: int = 1000,
    seed: int = 42
) -> pd.DataFrame:
    """
    Generate synthetic historical workload execution traces for training Random Forest models.
    Features: arrival_time, hour_of_day, priority, historical_cpu_mean, historical_memory_mean, historical_duration_mean
    Targets: cpu_required, memory_required, duration
    """
    rng = get_seeded_random(seed)
    np_rng = np.random.RandomState(seed)

    arrival_times = np_rng.uniform(0.0, 24.0, size=sample_count)
    hours_of_day = (arrival_times.astype(int)) % 24
    priorities = np_rng.choice([1, 1, 1, 2, 3], size=sample_count)

    # Base relationship with noise
    # Priority higher -> higher CPU & RAM
    cpu_base = 32.0 * priorities + (hours_of_day % 8) * 12.0
    cpu_required = np.clip(cpu_base + np_rng.normal(0, 15.0, size=sample_count), 16.0, 256.0)

    memory_base = cpu_required * 4.0
    memory_required = np.clip(memory_base + np_rng.normal(0, 50.0, size=sample_count), 64.0, 1024.0)

    duration_base = 1.0 + (cpu_required / 64.0) + (priorities * 0.5)
    duration = np.clip(duration_base + np_rng.normal(0, 0.8, size=sample_count), 1.0, 6.0)

    # Historical noisy observations
    hist_cpu = cpu_required + np_rng.normal(0, 8.0, size=sample_count)
    hist_mem = memory_required + np_rng.normal(0, 20.0, size=sample_count)
    hist_dur = duration + np_rng.normal(0, 0.4, size=sample_count)

    df = pd.DataFrame({
        "arrival_time": arrival_times,
        "hour_of_day": hours_of_day,
        "priority": priorities,
        "historical_cpu_mean": hist_cpu,
        "historical_memory_mean": hist_mem,
        "historical_duration_mean": hist_dur,
        "cpu_required": np.round(cpu_required, 1),
        "memory_required": np.round(memory_required, 1),
        "duration": np.round(duration, 1),
    })

    return df
