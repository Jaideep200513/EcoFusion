from typing import Optional
from pydantic import BaseModel, Field, model_validator


class WorkloadBase(BaseModel):
    arrival_time: float = Field(..., description="Arrival time offset in hours from simulation start (>= 0)")
    cpu_required: float = Field(..., description="CPU core requirement (> 0)")
    memory_required: float = Field(..., description="Memory requirement in GB (> 0)")
    duration: float = Field(..., description="Execution duration in hours (> 0)")
    deadline: float = Field(..., description="Deadline offset in hours from simulation start (> arrival_time)")
    priority: Optional[int] = Field(default=1, description="Optional priority level (1=Normal, 2=High, 3=Critical)")

    @model_validator(mode="after")
    def validate_workload_fields(self) -> "WorkloadBase":
        if self.arrival_time < 0:
            raise ValueError("Arrival time must be non-negative (>= 0)")
        if self.cpu_required <= 0:
            raise ValueError("CPU requirement must be strictly positive (> 0)")
        if self.memory_required <= 0:
            raise ValueError("Memory requirement must be strictly positive (> 0)")
        if self.duration <= 0:
            raise ValueError("Duration must be strictly positive (> 0)")
        if self.deadline <= self.arrival_time:
            raise ValueError(f"Deadline ({self.deadline}) must be strictly after arrival time ({self.arrival_time})")
        if self.deadline < (self.arrival_time + self.duration):
            # Useful warning or strict validation: execution duration must fit before deadline
            pass
        return self


class WorkloadCreate(WorkloadBase):
    id: Optional[str] = Field(default=None, description="Unique workload ID (auto-generated if omitted)")


class Workload(WorkloadBase):
    id: str = Field(..., description="Unique workload ID")
