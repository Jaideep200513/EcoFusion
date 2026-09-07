from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from .scheduling import SchedulingDecision


class TimeSlot(BaseModel):
    slot_id: int = Field(..., description="0-indexed discrete time slot identifier")
    start_time: float = Field(..., description="Start time offset in hours from simulation start")
    end_time: float = Field(..., description="End time offset in hours from simulation start")
    slot_duration_minutes: int = Field(default=60, description="Duration of slot in minutes")


class SimulationConfig(BaseModel):
    simulation_start: float = Field(default=0.0, description="Simulation start hour")
    simulation_end: float = Field(default=24.0, description="Simulation horizon end hour")
    slot_duration_minutes: int = Field(default=60, description="Time slot duration in minutes")
    random_seed: int = Field(default=42, description="Random seed for reproducibility")
    scheduler_name: str = Field(default="random", description="Scheduler algorithm: 'random' or 'first_fit'")
    include_unassigned_workloads: bool = Field(default=True, description="Whether to include unassigned workloads in results")
    workload_dataset_name: str = Field(default="synthetic_100", description="Label for workload trace dataset")
    num_workloads: int = Field(default=100, description="Number of synthetic workloads to generate")
    cpu_min: float = Field(default=16.0, description="Min CPU requirement per workload")
    cpu_max: float = Field(default=256.0, description="Max CPU requirement per workload")
    memory_min: float = Field(default=64.0, description="Min Memory requirement per workload")
    memory_max: float = Field(default=1024.0, description="Max Memory requirement per workload")
    duration_min: float = Field(default=1.0, description="Min execution duration in hours")
    duration_max: float = Field(default=6.0, description="Max execution duration in hours")
    deadline_slack_hours: float = Field(default=4.0, description="Average deadline slack in hours")


class ExecutionMetadata(BaseModel):
    execution_time_ms: float = Field(..., description="Simulation pipeline runtime in milliseconds")
    timestamp: str = Field(..., description="ISO 8601 execution timestamp")
    seed_used: int = Field(..., description="Random seed used")
    version: str = Field(default="0.3.0", description="Simulator engine version")
    extra: Optional[Dict[str, Any]] = Field(default_factory=dict)


class SimulationResult(BaseModel):
    experiment_id: str = Field(..., description="Unique experiment tracking ID")
    scheduler_name: str = Field(..., description="Name of scheduler evaluated")
    total_workloads: int = Field(..., description="Total workloads submitted")
    scheduled_workloads: int = Field(..., description="Number of workloads successfully scheduled")
    unscheduled_workloads: int = Field(..., description="Number of workloads unscheduled/rejected")
    total_energy_kwh: float = Field(..., description="Total energy consumed across all pools in kWh")
    total_carbon_kg: float = Field(..., description="Total carbon emissions in kgCO2")
    total_cost: float = Field(..., description="Total operational cost in USD")
    sla_violations: int = Field(..., description="Number of scheduled workloads violating deadline")
    sla_violation_rate: float = Field(..., description="Percentage of workloads violating SLA")
    average_completion_time: float = Field(..., description="Average completion time in hours for scheduled workloads")
    assignments: List[SchedulingDecision] = Field(default_factory=list, description="List of scheduling decisions")
    execution_metadata: ExecutionMetadata = Field(..., description="Execution performance and environment metadata")
