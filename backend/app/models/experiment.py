from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from .simulation import SimulationConfig


class ExperimentSummary(BaseModel):
    total_workloads: int
    scheduled_workloads: int
    unscheduled_workloads: int
    total_energy_kwh: float
    total_carbon_kg: float
    total_cost: float
    sla_violation_rate: float
    avg_completion_time_hours: float


class Experiment(BaseModel):
    id: str = Field(..., description="Unique experiment identifier (e.g. EXP-001)")
    name: str = Field(..., description="Human-readable experiment title")
    dataset_name: str = Field(..., description="Workload dataset label")
    scheduler_name: str = Field(..., description="Scheduler algorithm applied")
    random_seed: int = Field(..., description="Random seed used")
    timestamp: str = Field(..., description="ISO timestamp of creation")
    status: str = Field(default="COMPLETED", description="Experiment run status")
    config: SimulationConfig = Field(..., description="Full simulation configuration")
    summary: Optional[ExperimentSummary] = Field(default=None, description="Summary metrics if completed")
