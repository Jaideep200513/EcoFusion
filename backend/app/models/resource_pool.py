from typing import Optional
from pydantic import BaseModel, Field, model_validator


class ResourcePool(BaseModel):
    id: str = Field(..., description="Unique resource pool ID")
    name: Optional[str] = Field(default=None, description="Human-readable resource pool name")
    location: str = Field(..., description="Geographic location / city (e.g., Mumbai, Hyderabad, Singapore)")
    region: Optional[str] = Field(default=None, description="Cloud region label (e.g. ap-south-1)")
    cpu_capacity: float = Field(..., description="Total aggregated CPU capacity in cores (> 0)")
    memory_capacity: float = Field(..., description="Total aggregated RAM capacity in GB (> 0)")
    pue: float = Field(..., description="Power Usage Effectiveness (>= 1.0)")
    idle_power: float = Field(..., description="Baseline idle power consumption in kW (>= 0)")
    max_power: float = Field(..., description="Peak power consumption ceiling in kW (>= idle_power)")
    carbon_intensity: float = Field(..., description="Carbon intensity in gCO2/kWh (>= 0)")
    electricity_price: float = Field(..., description="Electricity price in $/kWh (>= 0)")
    available: bool = Field(default=True, description="Operational availability flag")

    @model_validator(mode="after")
    def validate_resource_pool(self) -> "ResourcePool":
        if self.cpu_capacity <= 0:
            raise ValueError("CPU capacity must be strictly positive (> 0)")
        if self.memory_capacity <= 0:
            raise ValueError("Memory capacity must be strictly positive (> 0)")
        if self.pue < 1.0:
            raise ValueError(f"PUE ({self.pue}) cannot be less than 1.0")
        if self.idle_power < 0:
            raise ValueError("Idle power must be non-negative (>= 0)")
        if self.max_power < self.idle_power:
            raise ValueError(f"Maximum power ({self.max_power} kW) cannot be less than idle power ({self.idle_power} kW)")
        if self.carbon_intensity < 0:
            raise ValueError("Carbon intensity must be non-negative (>= 0)")
        if self.electricity_price < 0:
            raise ValueError("Electricity price must be non-negative (>= 0)")
        return self
