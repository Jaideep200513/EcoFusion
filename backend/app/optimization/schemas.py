from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from ..models.scheduling import SchedulingDecision
from ..models.simulation import ExecutionMetadata


class CompromiseWeights(BaseModel):
    carbon: float = Field(default=0.4, description="Weight for carbon emissions objective (0..1)")
    energy: float = Field(default=0.3, description="Weight for energy consumption objective (0..1)")
    cost: float = Field(default=0.3, description="Weight for operational cost objective (0..1)")
    sla: float = Field(default=1.0, description="Penalty weight for SLA violation rate")


class OptimizationConfig(BaseModel):
    population_size: int = Field(default=50, description="NSGA-II population size")
    generations: int = Field(default=50, description="NSGA-II number of generations")
    crossover_prob: float = Field(default=0.9, description="Crossover probability")
    mutation_prob: float = Field(default=0.1, description="Mutation probability")
    random_seed: int = Field(default=42, description="Random seed for reproducibility")
    enable_prediction: bool = Field(default=False, description="Whether to use ML predicted workload demands during optimization")
    compromise_weights: CompromiseWeights = Field(default_factory=CompromiseWeights, description="Objective weights for best-compromise selection")
    scheduler_name: str = Field(default="ECOFUSION_NSGA2", description="Optimization algorithm label")


class ParetoSolution(BaseModel):
    solution_id: str = Field(..., description="Unique Pareto solution ID (e.g. SOL-001)")
    rank: int = Field(default=1, description="Pareto non-dominated rank")
    carbon_kg: float = Field(..., description="Total carbon emissions in kgCO2")
    energy_kwh: float = Field(..., description="Total energy consumption in kWh")
    cost_usd: float = Field(..., description="Total operational cost in USD")
    sla_violations: int = Field(..., description="Number of SLA violations")
    sla_violation_rate: float = Field(..., description="Percentage SLA violation rate")
    scheduled_workloads: int = Field(..., description="Number of scheduled workloads")
    unscheduled_workloads: int = Field(..., description="Number of unscheduled workloads")
    constraint_violation: float = Field(default=0.0, description="Pymoo constraint violation metric (0.0 = feasible)")
    score: float = Field(..., description="Best-compromise weighted score")
    assignments: List[SchedulingDecision] = Field(default_factory=list, description="Scheduling decisions")


class OptimizationResult(BaseModel):
    experiment_id: str = Field(..., description="Experiment ID")
    algorithm_name: str = Field(default="EcoFusion NSGA-II", description="Algorithm name")
    total_workloads: int = Field(..., description="Total workloads submitted")
    pareto_solutions: List[ParetoSolution] = Field(default_factory=list, description="All non-dominated Pareto front solutions")
    selected_solution: ParetoSolution = Field(..., description="Best-compromise selected Pareto solution")
    execution_metadata: ExecutionMetadata = Field(..., description="Execution performance metadata")
