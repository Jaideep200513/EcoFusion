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


def _normalize_header(col: str) -> str:
    """Normalize column header for robust matching."""
    return "".join(c for c in str(col).lower() if c.isalnum())


def _find_column_name(columns: List[str], candidate_keys: List[str]) -> Optional[str]:
    """Find matching column name regardless of casing, underscores, or spaces."""
    normalized_cols = {_normalize_header(c): c for c in columns}
    for candidate in candidate_keys:
        norm = _normalize_header(candidate)
        if norm in normalized_cols:
            return normalized_cols[norm]
    return None


def _parse_time_value(val: any, default: float = 0.0) -> float:
    """
    Parse a time representation (float, integer, or 'HH:MM' string) to precise decimal hours.
    e.g., '08:30' -> 8.5, 4 -> 4.0, '14.25' -> 14.25
    """
    if pd.isna(val) or val is None:
        return default
    if isinstance(val, (int, float)):
        return round(float(val), 4)
    val_str = str(val).strip()
    if ":" in val_str:
        parts = val_str.split(":")
        try:
            h = float(parts[0])
            m = float(parts[1]) if len(parts) > 1 else 0.0
            return round(h + (m / 60.0), 4)
        except ValueError:
            pass
    try:
        return round(float(val_str), 4)
    except ValueError:
        return default


def parse_workload_dataframe(df: pd.DataFrame) -> List[Workload]:
    """
    Convert a pandas DataFrame into a validated list of Workload objects with high precision.
    Supports auto-mapping varied column names, e.g. 'cpu_required', 'CPU Cores', 'cores', etc.
    """
    if df.empty:
        return []

    # Drop entirely empty rows
    df = df.dropna(how="all").copy()
    cols = [str(c) for c in df.columns]

    # Column mappings
    id_col = _find_column_name(cols, ["id", "workload_id", "task_id", "job_id", "name", "task"])
    arrival_col = _find_column_name(cols, ["arrival_time", "arrival", "start_time", "arrival_hour", "arrivalhour"])
    cpu_col = _find_column_name(cols, ["cpu_required", "cpu", "cpu_cores", "cores", "cores_required", "vcpu", "vcpus"])
    mem_col = _find_column_name(cols, ["memory_required", "memory", "ram", "ram_gb", "memory_gb", "memorygb"])
    dur_col = _find_column_name(cols, ["duration", "duration_hours", "runtime", "execution_time", "length_hours"])
    dl_col = _find_column_name(cols, ["deadline", "sla_deadline", "due_time", "due_hour", "max_completion_time"])
    prio_col = _find_column_name(cols, ["priority", "prio", "weight", "importance", "tier"])

    if not cpu_col or not mem_col or not dur_col:
        raise ValueError(
            f"Missing required workload columns. Found: {cols}. "
            "Expected columns for CPU, Memory, and Duration."
        )

    workloads: List[Workload] = []
    seen_ids = set()

    for idx, row in df.iterrows():
        # ID determination
        raw_id = str(row[id_col]).strip() if id_col and not pd.isna(row[id_col]) else None
        if not raw_id or raw_id == "nan":
            raw_id = f"WL-{idx + 1:03d}"
        
        # Ensure unique ID
        unique_id = raw_id
        counter = 1
        while unique_id in seen_ids:
            unique_id = f"{raw_id}-{counter}"
            counter += 1
        seen_ids.add(unique_id)

        # Precise numerical values
        arrival_time = _parse_time_value(row[arrival_col] if arrival_col else 0.0, default=0.0)
        cpu_val = float(row[cpu_col]) if not pd.isna(row[cpu_col]) else 32.0
        mem_val = float(row[mem_col]) if not pd.isna(row[mem_col]) else 128.0
        dur_val = float(row[dur_col]) if not pd.isna(row[dur_col]) else 2.0

        # Non-negative & positive clamps
        arrival_time = max(0.0, arrival_time)
        cpu_val = max(1.0, cpu_val)
        mem_val = max(1.0, mem_val)
        dur_val = max(0.1, dur_val)

        # Deadline
        if dl_col and not pd.isna(row[dl_col]):
            dl_val = _parse_time_value(row[dl_col], default=arrival_time + dur_val + 2.0)
        else:
            dl_val = arrival_time + dur_val + 4.0

        # Ensure deadline is after arrival + duration
        if dl_val <= arrival_time:
            dl_val = arrival_time + dur_val + 2.0
        elif dl_val < arrival_time + dur_val:
            dl_val = arrival_time + dur_val + 1.0

        # Priority (1=Normal, 2=High, 3=Critical)
        priority = 1
        if prio_col and not pd.isna(row[prio_col]):
            try:
                priority = max(1, min(3, int(float(row[prio_col]))))
            except (ValueError, TypeError):
                priority = 1

        wl = Workload(
            id=unique_id,
            arrival_time=round(arrival_time, 2),
            cpu_required=round(cpu_val, 2),
            memory_required=round(mem_val, 2),
            duration=round(dur_val, 2),
            deadline=round(dl_val, 2),
            priority=priority,
        )
        workloads.append(wl)

    validate_unique_workload_ids(workloads)
    return workloads


def load_workloads_from_csv(file_path: str) -> List[Workload]:
    """
    Load workload definitions from a CSV file.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Workload CSV file not found: {file_path}")

    df = pd.read_csv(file_path)
    return parse_workload_dataframe(df)


def load_workloads_from_excel(file_path_or_bytes: any, sheet_name: any = 0) -> List[Workload]:
    """
    Load workload definitions from an Excel file (.xlsx or .xls) using openpyxl.
    Can take a file path string or in-memory binary buffer.
    """
    import io
    if isinstance(file_path_or_bytes, bytes):
        file_obj = io.BytesIO(file_path_or_bytes)
    else:
        file_obj = file_path_or_bytes

    df = pd.read_excel(file_obj, engine="openpyxl", sheet_name=sheet_name)
    return parse_workload_dataframe(df)


def save_workloads_to_csv(workloads: List[Workload], file_path: str) -> None:
    """
    Export workload list to a CSV file.
    """
    os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
    df = _workloads_to_dataframe(workloads)
    df.to_csv(file_path, index=False)


def save_workloads_to_excel(workloads: List[Workload], file_path: str) -> None:
    """
    Export workload list to an Excel (.xlsx) file.
    """
    os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
    df = _workloads_to_dataframe(workloads)
    df.to_excel(file_path, engine="openpyxl", index=False, sheet_name="Workloads")


def _workloads_to_dataframe(workloads: List[Workload]) -> pd.DataFrame:
    """Convert workload list to pandas DataFrame."""
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
    return pd.DataFrame(data)


def generate_workload_excel_template() -> bytes:
    """
    Generate a formatted Excel workbook with sample workloads and data dictionary.
    Returns bytes suitable for direct HTTP download.
    """
    import io

    # High-precision sample workloads across realistic data center applications
    sample_workloads = [
        {"id": "WL-001", "name": "LLM Fine-Tuning Batch", "arrival_time": 0.0, "cpu_required": 128.0, "memory_required": 512.0, "duration": 4.5, "deadline": 8.0, "priority": 3, "category": "AI / ML"},
        {"id": "WL-002", "name": "Genomic Sequence Alignment", "arrival_time": 1.5, "cpu_required": 64.0, "memory_required": 256.0, "duration": 3.0, "deadline": 6.5, "priority": 2, "category": "Bioinformatics"},
        {"id": "WL-003", "name": "Financial Monte Carlo Risk", "arrival_time": 2.0, "cpu_required": 96.0, "memory_required": 384.0, "duration": 2.5, "deadline": 7.0, "priority": 2, "category": "FinTech"},
        {"id": "WL-004", "name": "Climate Forecasting Mesh", "arrival_time": 3.0, "cpu_required": 256.0, "memory_required": 1024.0, "duration": 5.0, "deadline": 12.0, "priority": 1, "category": "HPC"},
        {"id": "WL-005", "name": "IoT Sensor Stream ETL", "arrival_time": 4.5, "cpu_required": 16.0, "memory_required": 64.0, "duration": 1.5, "deadline": 8.0, "priority": 1, "category": "Stream Processing"},
        {"id": "WL-006", "name": "Autonomous Driving Perception", "arrival_time": 5.0, "cpu_required": 192.0, "memory_required": 768.0, "duration": 3.5, "deadline": 10.5, "priority": 3, "category": "Computer Vision"},
        {"id": "WL-007", "name": "Graph Embedding Re-indexing", "arrival_time": 6.0, "cpu_required": 48.0, "memory_required": 192.0, "duration": 2.0, "deadline": 11.0, "priority": 1, "category": "Knowledge Graph"},
        {"id": "WL-008", "name": "Satellite Radar Image Filter", "arrival_time": 7.5, "cpu_required": 64.0, "memory_required": 256.0, "duration": 3.0, "deadline": 13.0, "priority": 2, "category": "Geospatial"},
        {"id": "WL-009", "name": "E-Commerce Recommendation Train", "arrival_time": 8.0, "cpu_required": 128.0, "memory_required": 512.0, "duration": 4.0, "deadline": 16.0, "priority": 2, "category": "Recommender"},
        {"id": "WL-010", "name": "Distributed Database Compaction", "arrival_time": 9.5, "cpu_required": 32.0, "memory_required": 128.0, "duration": 1.75, "deadline": 14.0, "priority": 1, "category": "Infrastructure"},
        {"id": "WL-011", "name": "Quantum Circuit Simulation", "arrival_time": 10.0, "cpu_required": 192.0, "memory_required": 768.0, "duration": 4.0, "deadline": 18.0, "priority": 2, "category": "Quantum Computing"},
        {"id": "WL-012", "name": "Video Transcoding 4K Stream", "arrival_time": 11.0, "cpu_required": 64.0, "memory_required": 192.0, "duration": 2.5, "deadline": 16.0, "priority": 1, "category": "Media Processing"},
    ]

    dictionary_data = [
        {"Column Name": "id", "Type": "Text", "Required": "Yes", "Description": "Unique workload identifier (e.g. WL-001, Task-A). Auto-assigned if empty.", "Example": "WL-001"},
        {"Column Name": "name", "Type": "Text", "Required": "No", "Description": "Human-readable descriptive workload or job name.", "Example": "LLM Fine-Tuning Batch"},
        {"Column Name": "arrival_time", "Type": "Decimal / Time", "Required": "Yes", "Description": "Arrival hour offset from start of simulation (e.g. 0.0, 1.5, 08:30).", "Example": "0.0"},
        {"Column Name": "cpu_required", "Type": "Decimal", "Required": "Yes", "Description": "Aggregated virtual CPU cores demanded by the task (> 0).", "Example": "128.0"},
        {"Column Name": "memory_required", "Type": "Decimal", "Required": "Yes", "Description": "Total RAM required in Gigabytes (GB) (> 0).", "Example": "512.0"},
        {"Column Name": "duration", "Type": "Decimal", "Required": "Yes", "Description": "Expected job execution time in hours (floats allowed e.g. 2.5 hrs).", "Example": "4.5"},
        {"Column Name": "deadline", "Type": "Decimal / Time", "Required": "Yes", "Description": "Hard SLA completion deadline hour (> arrival_time + duration).", "Example": "8.0"},
        {"Column Name": "priority", "Type": "Integer", "Required": "No", "Description": "1 = Normal/Batch, 2 = High Priority, 3 = Mission Critical.", "Example": "3"},
        {"Column Name": "category", "Type": "Text", "Required": "No", "Description": "Application domain tag (e.g. AI/ML, FinTech, HPC).", "Example": "AI / ML"},
    ]

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df_sample = pd.DataFrame(sample_workloads)
        df_sample.to_excel(writer, sheet_name="Workload_Dataset", index=False)

        df_dict = pd.DataFrame(dictionary_data)
        df_dict.to_excel(writer, sheet_name="Data_Dictionary", index=False)

    return output.getvalue()
