from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class SchedulingStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    UNSCHEDULED = "UNSCHEDULED"
    REJECTED = "REJECTED"


class SchedulingDecision(BaseModel):
    workload_id: str = Field(..., description="Target workload ID")
    resource_pool_id: Optional[str] = Field(default=None, description="Assigned resource pool ID (None if unscheduled)")
    start_time: Optional[float] = Field(default=None, description="Scheduled start time offset in hours")
    end_time: Optional[float] = Field(default=None, description="Scheduled end time offset in hours")
    duration: float = Field(..., description="Workload execution duration in hours")
    cpu_required: float = Field(..., description="Requested CPU cores")
    memory_required: float = Field(..., description="Requested RAM in GB")
    completion_time: Optional[float] = Field(default=None, description="Actual completion time offset in hours")
    sla_met: bool = Field(default=False, description="Whether completion_time <= deadline")
    status: SchedulingStatus = Field(..., description="Scheduling status outcome")
    energy_kwh: float = Field(default=0.0, description="Allocated energy consumption in kWh")
    carbon_kg: float = Field(default=0.0, description="Allocated carbon emissions in kgCO2")
    cost: float = Field(default=0.0, description="Allocated operational electricity cost in USD")
