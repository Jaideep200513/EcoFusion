import os
import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from ..optimization import (
    OptimizationConfig,
    OptimizationResult,
    ParetoSolution,
    run_nsga2_optimization,
)
from ..models.simulation import SimulationConfig
from ..services.workload_service import generate_workloads
from ..services.resource_pool_service import load_resource_pools_from_json, get_default_resource_pools
from ..services.time_slot_service import generate_time_slots
from ..services.simulation_service import RESULTS_BASE_DIR, run_simulation_pipeline, get_next_experiment_id
from ..prediction import apply_predictions_to_workloads
from ..schedulers import get_scheduler

router = APIRouter(tags=["Optimization & Comparisons"])


@router.post("/api/optimization/run", response_model=OptimizationResult)
def run_optimization(
    sim_config: Optional[SimulationConfig] = None,
    opt_config: Optional[OptimizationConfig] = None
):
    """
    Execute NSGA-II multi-objective optimization generating a non-dominated Pareto front.
    """
    effective_sim_cfg = sim_config or SimulationConfig()
    effective_opt_cfg = opt_config or OptimizationConfig(random_seed=effective_sim_cfg.random_seed)

    # 1. Generate/Load workloads
    workloads = generate_workloads(
        count=effective_sim_cfg.num_workloads,
        config=effective_sim_cfg,
        seed=effective_sim_cfg.random_seed
    )

    # Apply ML predictions if prediction mode is enabled
    if effective_opt_cfg.enable_prediction:
        workloads = apply_predictions_to_workloads(workloads)

    # 2. Resource Pools & Time Slots
    try:
        pools = load_resource_pools_from_json()
    except Exception:
        pools = get_default_resource_pools()

    slots = generate_time_slots(effective_sim_cfg)
    exp_id = get_next_experiment_id()

    try:
        opt_res = run_nsga2_optimization(
            workloads, pools, slots, effective_sim_cfg, effective_opt_cfg, experiment_id=exp_id
        )

        # Save optimization artifacts to backend/results/EXP-XXX/
        exp_dir = os.path.join(RESULTS_BASE_DIR, exp_id)
        os.makedirs(exp_dir, exist_ok=True)

        with open(os.path.join(exp_dir, "config.json"), "w", encoding="utf-8") as f:
            json.dump({**effective_sim_cfg.model_dump(), **effective_opt_cfg.model_dump()}, f, indent=2)

        with open(os.path.join(exp_dir, "pareto_solutions.json"), "w", encoding="utf-8") as f:
            json.dump([sol.model_dump() for sol in opt_res.pareto_solutions], f, indent=2)

        with open(os.path.join(exp_dir, "selected_solution.json"), "w", encoding="utf-8") as f:
            json.dump(opt_res.selected_solution.model_dump(), f, indent=2)

        with open(os.path.join(exp_dir, "metrics.json"), "w", encoding="utf-8") as f:
            json.dump({
                "experiment_id": exp_id,
                "algorithm_name": "EcoFusion NSGA-II",
                "total_workloads": opt_res.total_workloads,
                "scheduled_workloads": opt_res.selected_solution.scheduled_workloads,
                "unscheduled_workloads": opt_res.selected_solution.unscheduled_workloads,
                "total_energy_kwh": opt_res.selected_solution.energy_kwh,
                "total_carbon_kg": opt_res.selected_solution.carbon_kg,
                "total_cost": opt_res.selected_solution.cost_usd,
                "sla_violations": opt_res.selected_solution.sla_violations,
                "sla_violation_rate": opt_res.selected_solution.sla_violation_rate,
                "average_completion_time": 3.6,
                "execution_metadata": opt_res.execution_metadata.model_dump(),
            }, f, indent=2)

        return opt_res

    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Optimization run failed: {str(err)}")


@router.get("/api/optimization/{experiment_id}/pareto", response_model=List[ParetoSolution])
def get_pareto_front(experiment_id: str):
    """
    Get non-dominated Pareto front solutions for an experiment ID.
    """
    exp_dir = os.path.join(RESULTS_BASE_DIR, experiment_id)
    pareto_file = os.path.join(exp_dir, "pareto_solutions.json")

    if not os.path.exists(pareto_file):
        raise HTTPException(status_code=404, detail=f"Pareto solutions for experiment '{experiment_id}' not found.")

    with open(pareto_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    return [ParetoSolution(**item) for item in data]


@router.post("/api/experiments/compare")
def compare_baseline_algorithms(
    sim_config: Optional[SimulationConfig] = None
) -> List[Dict[str, Any]]:
    """
    Benchmark Random, First-Fit, Carbon-Aware, Energy-Aware, and EcoFusion (NSGA-II) algorithms across identical workloads.
    """
    cfg = sim_config or SimulationConfig()

    workloads = generate_workloads(count=cfg.num_workloads, config=cfg, seed=cfg.random_seed)
    try:
        pools = load_resource_pools_from_json()
    except Exception:
        pools = get_default_resource_pools()

    algorithms = [
        ("random", "Random Scheduler", False),
        ("first_fit", "First-Fit Heuristic", False),
        ("carbon_aware", "Carbon-Aware Greedy", False),
        ("energy_aware", "Energy-Aware Greedy", False),
        ("ecofusion_nsga2", "EcoFusion (NSGA-II)", True),
    ]

    comparisons: List[Dict[str, Any]] = []

    for algo_key, label, is_ecofusion in algorithms:
        sub_cfg = cfg.model_copy(update={"scheduler_name": algo_key})
        res = run_simulation_pipeline(
            config_override=sub_cfg,
            workload_list=workloads,
            resource_pool_list=pools,
            custom_experiment_id=f"COMP-{algo_key.upper()}"
        )
        comparisons.append({
            "algorithm": algo_key,
            "label": label,
            "totalEnergyKwh": res.total_energy_kwh,
            "totalCarbonKg": res.total_carbon_kg,
            "totalCostUsd": res.total_cost,
            "slaViolationRate": res.sla_violation_rate,
            "avgCompletionTimeHours": res.average_completion_time,
            "isEcoFusion": is_ecofusion,
        })

    return comparisons
