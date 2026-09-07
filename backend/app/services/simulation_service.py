import os
import time
import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from ..models.simulation import SimulationConfig, SimulationResult, ExecutionMetadata
from ..models.workload import Workload
from ..models.resource_pool import ResourcePool
from ..models.experiment import Experiment, ExperimentSummary
from ..models.scheduling import SchedulingStatus
from ..services.workload_service import generate_workloads, load_workloads_from_csv
from ..services.resource_pool_service import load_resource_pools_from_json, get_default_resource_pools
from ..services.time_slot_service import generate_time_slots
from ..services.sla_service import evaluate_sla_metrics
from ..schedulers import get_scheduler


RESULTS_BASE_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "results"
)


def get_next_experiment_id() -> str:
    """
    Generate next available EXP-XXX experiment identifier.
    """
    os.makedirs(RESULTS_BASE_DIR, exist_ok=True)
    existing = [
        d for d in os.listdir(RESULTS_BASE_DIR)
        if os.path.isdir(os.path.join(RESULTS_BASE_DIR, d)) and d.startswith("EXP-")
    ]
    if not existing:
        return "EXP-001"
    
    max_num = 0
    for exp_dir in existing:
        try:
            num = int(exp_dir.replace("EXP-", ""))
            if num > max_num:
                max_num = num
        except ValueError:
            pass

    return f"EXP-{max_num + 1:03d}"


def save_experiment_to_disk(
    experiment_id: str,
    config: SimulationConfig,
    result: SimulationResult
) -> str:
    """
    Persist experiment configuration, assignments, metrics, and summary to backend/results/EXP-XXX/.
    """
    exp_dir = os.path.join(RESULTS_BASE_DIR, experiment_id)
    os.makedirs(exp_dir, exist_ok=True)

    # 1. config.json
    with open(os.path.join(exp_dir, "config.json"), "w", encoding="utf-8") as f:
        json.dump(config.model_dump(), f, indent=2)

    # 2. assignments.json
    assignments_data = [a.model_dump() for a in result.assignments]
    with open(os.path.join(exp_dir, "assignments.json"), "w", encoding="utf-8") as f:
        json.dump(assignments_data, f, indent=2)

    # 3. metrics.json
    metrics_data = {
        "experiment_id": result.experiment_id,
        "scheduler_name": result.scheduler_name,
        "total_workloads": result.total_workloads,
        "scheduled_workloads": result.scheduled_workloads,
        "unscheduled_workloads": result.unscheduled_workloads,
        "total_energy_kwh": result.total_energy_kwh,
        "total_carbon_kg": result.total_carbon_kg,
        "total_cost": result.total_cost,
        "sla_violations": result.sla_violations,
        "sla_violation_rate": result.sla_violation_rate,
        "average_completion_time": result.average_completion_time,
        "execution_metadata": result.execution_metadata.model_dump(),
    }
    with open(os.path.join(exp_dir, "metrics.json"), "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=2)

    # 4. summary.json
    summary_data = {
        "experiment_id": experiment_id,
        "timestamp": result.execution_metadata.timestamp,
        "scheduler_name": result.scheduler_name,
        "random_seed": config.random_seed,
        "total_energy_kwh": result.total_energy_kwh,
        "total_carbon_kg": result.total_carbon_kg,
        "total_cost_usd": result.total_cost,
        "sla_violation_rate_percent": result.sla_violation_rate,
        "scheduled_ratio": f"{result.scheduled_workloads}/{result.total_workloads}",
    }
    with open(os.path.join(exp_dir, "summary.json"), "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2)

    return exp_dir


def load_experiment_from_disk(experiment_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve persisted experiment outputs by experiment ID.
    """
    exp_dir = os.path.join(RESULTS_BASE_DIR, experiment_id)
    if not os.path.exists(exp_dir):
        return None

    try:
        with open(os.path.join(exp_dir, "config.json"), "r", encoding="utf-8") as f:
            config_data = json.load(f)
        with open(os.path.join(exp_dir, "metrics.json"), "r", encoding="utf-8") as f:
            metrics_data = json.load(f)
        with open(os.path.join(exp_dir, "assignments.json"), "r", encoding="utf-8") as f:
            assignments_data = json.load(f)

        return {
            "experiment_id": experiment_id,
            "config": config_data,
            "metrics": metrics_data,
            "assignments": assignments_data,
        }
    except Exception:
        return None


def list_all_experiments() -> List[Experiment]:
    """
    List all recorded experiments stored in backend/results/.
    """
    os.makedirs(RESULTS_BASE_DIR, exist_ok=True)
    experiments: List[Experiment] = []

    dirs = sorted([
        d for d in os.listdir(RESULTS_BASE_DIR)
        if os.path.isdir(os.path.join(RESULTS_BASE_DIR, d)) and d.startswith("EXP-")
    ], reverse=True)

    for exp_id in dirs:
        data = load_experiment_from_disk(exp_id)
        if data and "config" in data and "metrics" in data:
            cfg = SimulationConfig(**data["config"])
            m = data["metrics"]
            summary = ExperimentSummary(
                total_workloads=m.get("total_workloads", 0),
                scheduled_workloads=m.get("scheduled_workloads", 0),
                unscheduled_workloads=m.get("unscheduled_workloads", 0),
                total_energy_kwh=m.get("total_energy_kwh", 0.0),
                total_carbon_kg=m.get("total_carbon_kg", 0.0),
                total_cost=m.get("total_cost", 0.0),
                sla_violation_rate=m.get("sla_violation_rate", 0.0),
                avg_completion_time_hours=m.get("average_completion_time", 0.0),
            )
            exp = Experiment(
                id=exp_id,
                name=f"Simulation Run {exp_id}",
                dataset_name=cfg.workload_dataset_name,
                scheduler_name=cfg.scheduler_name,
                random_seed=cfg.random_seed,
                timestamp=m.get("execution_metadata", {}).get("timestamp", datetime.now(timezone.utc).isoformat()),
                status="COMPLETED",
                config=cfg,
                summary=summary,
            )
            experiments.append(exp)

    return experiments


def run_simulation_pipeline(
    config_override: Optional[SimulationConfig] = None,
    workload_list: Optional[List[Workload]] = None,
    resource_pool_list: Optional[List[ResourcePool]] = None,
    custom_experiment_id: Optional[str] = None
) -> SimulationResult:
    """
    Execute the complete simulation pipeline:
    1. Load/merge configuration
    2. Load or generate workloads
    3. Load resource pools
    4. Generate time slots
    5. Execute selected scheduler
    6. Compute metrics (energy, carbon, cost, SLA)
    7. Build SimulationResult
    8. Persist results to backend/results/EXP-XXX/
    """
    start_time_ms = time.time() * 1000.0
    config = config_override or SimulationConfig()

    # 1. Workloads
    if workload_list:
        workloads = workload_list
    else:
        workloads = generate_workloads(
            count=config.num_workloads,
            config=config,
            seed=config.random_seed
        )

    # 2. Resource Pools
    if resource_pool_list:
        pools = resource_pool_list
    else:
        try:
            pools = load_resource_pools_from_json()
        except Exception:
            pools = get_default_resource_pools()

    # 3. Time Slots
    time_slots = generate_time_slots(config)

    # 4. Instantiate Scheduler
    scheduler = get_scheduler(config.scheduler_name)

    # 5. Run Scheduling Decisions
    decisions = scheduler.schedule(workloads, pools, time_slots, config)

    # 6. Aggregate Metrics
    scheduled_decisions = [d for d in decisions if d.status == SchedulingStatus.SCHEDULED]
    
    total_energy = round(sum(d.energy_kwh for d in scheduled_decisions), 2)
    total_carbon = round(sum(d.carbon_kg for d in scheduled_decisions), 2)
    total_cost = round(sum(d.cost for d in scheduled_decisions), 2)

    sla_metrics = evaluate_sla_metrics(decisions, len(workloads))

    # Execution Metadata
    execution_time_ms = round((time.time() * 1000.0) - start_time_ms, 2)
    metadata = ExecutionMetadata(
        execution_time_ms=execution_time_ms,
        timestamp=datetime.now(timezone.utc).isoformat(),
        seed_used=config.random_seed,
        version="0.3.0",
        extra={
            "resource_pools_count": len(pools),
            "time_slots_count": len(time_slots),
        }
    )

    exp_id = custom_experiment_id or get_next_experiment_id()

    # Build Result
    result = SimulationResult(
        experiment_id=exp_id,
        scheduler_name=config.scheduler_name,
        total_workloads=len(workloads),
        scheduled_workloads=len(scheduled_decisions),
        unscheduled_workloads=len(workloads) - len(scheduled_decisions),
        total_energy_kwh=total_energy,
        total_carbon_kg=total_carbon,
        total_cost=total_cost,
        sla_violations=sla_metrics["sla_violations"],
        sla_violation_rate=sla_metrics["sla_violation_rate"],
        average_completion_time=sla_metrics["average_completion_time"],
        assignments=decisions if config.include_unassigned_workloads else scheduled_decisions,
        execution_metadata=metadata
    )

    # Save to disk
    save_experiment_to_disk(exp_id, config, result)

    return result
