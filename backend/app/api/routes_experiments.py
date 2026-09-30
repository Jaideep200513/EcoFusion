from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..models.experiment import Experiment
from ..models.simulation import SimulationConfig
from ..services.simulation_service import (
    list_all_experiments,
    load_experiment_from_disk,
    run_simulation_pipeline,
)
from ..api.routes_workloads import get_current_workloads

router = APIRouter(prefix="/api/experiments", tags=["Experiments"])


class AlgorithmBenchmarkComparison(BaseModel):
    algorithm: str
    label: str
    parameter_focus: str
    primary_strength: str
    tradeoff_blindspot: str
    total_energy_kwh: float
    total_carbon_kg: float
    total_cost_usd: float
    sla_violation_rate: float
    avg_completion_time_hours: float
    scheduled_workloads: int
    total_workloads: int
    is_ecofusion: bool = False
    carbon_gain_vs_baseline_pct: float = 0.0
    energy_gain_vs_baseline_pct: float = 0.0
    cost_gain_vs_baseline_pct: float = 0.0
    composite_efficiency_score: float = 0.0


ALGO_METADATA = {
    "random": {
        "label": "Random Placement",
        "focus": "Baseline Heuristic",
        "strength": "Zero computational overhead",
        "blindspot": "Blind to all parameters (high carbon, energy, and cost)",
    },
    "first_fit": {
        "label": "First-Fit FIFO",
        "focus": "Earliest Available First",
        "strength": "Simple deterministic queue servicing",
        "blindspot": "Does not optimize power, carbon, or electricity prices",
    },
    "carbon_aware": {
        "label": "Carbon-Aware Heuristic",
        "focus": "Single-Parameter: Carbon Emissions",
        "strength": "Greedily searches lowest grid carbon intensity",
        "blindspot": "Ignores electricity prices and cooling PUE efficiency",
    },
    "energy_aware": {
        "label": "Energy-Aware Heuristic",
        "focus": "Single-Parameter: Energy (kWh)",
        "strength": "Minimizes IT power consumption and selects low PUE",
        "blindspot": "Ignores dirty vs clean grid energy and peak price tariffs",
    },
    "cost_aware": {
        "label": "Cost-Aware Heuristic",
        "focus": "Single-Parameter: Electricity Price ($)",
        "strength": "Selects lowest $/kWh electricity rates",
        "blindspot": "Shifts workload to dirty fossil energy or high PUE sites",
    },
    "edf": {
        "label": "Earliest Deadline First (EDF)",
        "focus": "Single-Parameter: SLA & Latency",
        "strength": "Minimizes queue delay and strict deadline risks",
        "blindspot": "Disregards green energy, energy efficiency, and tariffs",
    },
    "ecofusion_nsga2": {
        "label": "EcoFusion (NSGA-II Multi-Obj)",
        "focus": "Multi-Parameter: Carbon + Energy + Cost + SLA",
        "strength": "Pareto-optimal spatial-temporal co-optimization",
        "blindspot": "Requires evolutionary search generations",
    },
}


@router.get("", response_model=List[Experiment])
def get_experiments():
    """
    Get list of all saved simulation experiments.
    """
    return list_all_experiments()


@router.get("/{experiment_id}")
def get_experiment_by_id(experiment_id: str):
    """
    Get metadata and results for a specific experiment ID.
    """
    data = load_experiment_from_disk(experiment_id)
    if not data:
        raise HTTPException(status_code=404, detail=f"Experiment '{experiment_id}' not found.")
    return data


@router.post("/compare", response_model=List[AlgorithmBenchmarkComparison])
def compare_algorithms(sim_config: Optional[SimulationConfig] = None):
    """
    Execute empirical comparison across single-parameter algorithms and EcoFusion multi-parameter optimization.
    Produces numerical evidence proving multi-parameter outperformance across Carbon, Energy, Cost, and SLA.
    """
    cfg = sim_config or SimulationConfig()
    workloads = get_current_workloads(count=cfg.num_workloads, seed=cfg.random_seed)

    algos = [
        "random",
        "first_fit",
        "carbon_aware",
        "energy_aware",
        "cost_aware",
        "edf",
        "ecofusion_nsga2",
    ]

    results: List[AlgorithmBenchmarkComparison] = []
    baseline_first_fit = None

    for algo in algos:
        c = cfg.model_copy()
        c.scheduler_name = algo
        c.include_unassigned_workloads = True

        sim_res = run_simulation_pipeline(
            config_override=c,
            workload_list=workloads,
            custom_experiment_id=f"COMPARE-{algo.upper()}"
        )

        meta = ALGO_METADATA.get(algo, {
            "label": algo.title(),
            "focus": "Heuristic",
            "strength": "-",
            "blindspot": "-",
        })

        item = AlgorithmBenchmarkComparison(
            algorithm=algo.upper(),
            label=meta["label"],
            parameter_focus=meta["focus"],
            primary_strength=meta["strength"],
            tradeoff_blindspot=meta["blindspot"],
            total_energy_kwh=sim_res.total_energy_kwh,
            total_carbon_kg=sim_res.total_carbon_kg,
            total_cost_usd=sim_res.total_cost,
            sla_violation_rate=sim_res.sla_violation_rate,
            avg_completion_time_hours=sim_res.average_completion_time,
            scheduled_workloads=sim_res.scheduled_workloads,
            total_workloads=sim_res.total_workloads,
            is_ecofusion=(algo == "ecofusion_nsga2"),
        )

        if algo == "first_fit":
            baseline_first_fit = item

        results.append(item)

    # Compute numerical gains relative to baseline first_fit
    base_carbon = baseline_first_fit.total_carbon_kg if baseline_first_fit and baseline_first_fit.total_carbon_kg > 0 else 1.0
    base_energy = baseline_first_fit.total_energy_kwh if baseline_first_fit and baseline_first_fit.total_energy_kwh > 0 else 1.0
    base_cost = baseline_first_fit.total_cost_usd if baseline_first_fit and baseline_first_fit.total_cost_usd > 0 else 1.0

    # Find min/max for normalization in composite efficiency score
    min_c = min(r.total_carbon_kg for r in results)
    max_c = max(r.total_carbon_kg for r in results) or 1.0
    min_e = min(r.total_energy_kwh for r in results)
    max_e = max(r.total_energy_kwh for r in results) or 1.0
    min_usd = min(r.total_cost_usd for r in results)
    max_usd = max(r.total_cost_usd for r in results) or 1.0

    for r in results:
        r.carbon_gain_vs_baseline_pct = round(((base_carbon - r.total_carbon_kg) / base_carbon) * 100.0, 1)
        r.energy_gain_vs_baseline_pct = round(((base_energy - r.total_energy_kwh) / base_energy) * 100.0, 1)
        r.cost_gain_vs_baseline_pct = round(((base_cost - r.total_cost_usd) / base_cost) * 100.0, 1)

        # Multi-criteria score (100 = ideal utopia point, lower = farther from utopia)
        norm_c = (r.total_carbon_kg - min_c) / (max_c - min_c) if max_c > min_c else 0.0
        norm_e = (r.total_energy_kwh - min_e) / (max_e - min_e) if max_e > min_e else 0.0
        norm_usd = (r.total_cost_usd - min_usd) / (max_usd - min_usd) if max_usd > min_usd else 0.0
        sla_pen = r.sla_violation_rate / 100.0

        dist = (norm_c ** 2 + norm_e ** 2 + norm_usd ** 2 + (sla_pen * 2) ** 2) ** 0.5
        r.composite_efficiency_score = round(max(0.0, 100.0 * (1.0 - (dist / 2.0))), 1)

    return results
