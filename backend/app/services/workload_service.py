import os
import pandas as pd
from typing import List, Optional
from ..models.workload import Workload
from ..models.simulation import SimulationConfig
from ..utils.random_utils import get_seeded_random
from ..utils.validation import validate_unique_workload_ids


def generate_workloads(
    count: int = 100,
    config: Optional[SimulationConfig] = None,
    seed: int = 42
) -> List[Workload]:
    """
    Generate synthetic workload instances reproducibly given a random seed and config ranges.
    """
    rng = get_seeded_random(seed)
    if config is None:
        config = SimulationConfig()

    workloads: List[Workload] = []
    
    cpu_options = [16, 32, 64, 96, 128, 192, 256]
    mem_options = [64, 128, 256, 512, 768, 1024]
    
    # Restrict options to configured range
    valid_cpus = [c for c in cpu_options if config.cpu_min <= c <= config.cpu_max] or [int(config.cpu_min)]
    valid_mems = [m for m in mem_options if config.memory_min <= m <= config.memory_max] or [int(config.memory_min)]

    horizon = config.simulation_end - config.simulation_start

    for i in range(1, count + 1):
        workload_id = f"WL-{i:03d}"
        
        # Arrival time distributed across the first 75% of the horizon
        arrival_time = round(rng.uniform(0.0, max(1.0, horizon * 0.75)), 1)
        duration = float(rng.randint(int(config.duration_min), int(config.duration_max)))
        
        # CPU & Memory
        cpu = float(rng.choice(valid_cpus))
        mem = float(rng.choice(valid_mems))
        
        # Deadline: arrival_time + duration + slack
        slack = rng.uniform(1.0, max(2.0, config.deadline_slack_hours))
        deadline = round(arrival_time + duration + slack, 1)

        wl = Workload(
            id=workload_id,
            arrival_time=arrival_time,
            cpu_required=cpu,
            memory_required=mem,
            duration=duration,
            deadline=deadline,
            priority=rng.choice([1, 1, 1, 2, 3])  # Mostly priority 1
        )
        workloads.append(wl)

    validate_unique_workload_ids(workloads)
    return workloads


def load_workloads_from_csv(file_path: str) -> List[Workload]:
    """
    Load workload definitions from a CSV file.
    Expected columns: id, arrival_time, cpu_required, memory_required, duration, deadline, priority
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Workload CSV file not found: {file_path}")

    df = pd.read_csv(file_path)
    workloads: List[Workload] = []

    for idx, row in df.iterrows():
        wl = Workload(
            id=str(row["id"]),
            arrival_time=float(row["arrival_time"]),
            cpu_required=float(row["cpu_required"]),
            memory_required=float(row["memory_required"]),
            duration=float(row["duration"]),
            deadline=float(row["deadline"]),
            priority=int(row["priority"]) if "priority" in row and not pd.isna(row["priority"]) else 1
        )
        workloads.append(wl)

    validate_unique_workload_ids(workloads)
    return workloads


def save_workloads_to_csv(workloads: List[Workload], file_path: str) -> None:
    """
    Export workload list to a CSV file.
    """
    os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
    data = [
        {
            "id": w.id,
            "arrival_time": w.arrival_time,
            "cpu_required": w.cpu_required,
            "memory_required": w.memory_required,
            "duration": w.duration,
            "deadline": w.deadline,
            "priority": w.priority,
        }
        for w in workloads
    ]
    df = pd.DataFrame(data)
    df.to_csv(file_path, index=False)
