from typing import Dict, Type
from .base_scheduler import BaseScheduler
from .random_scheduler import RandomScheduler
from .first_fit_scheduler import FirstFitScheduler
from .optimized_scheduler import OptimizedScheduler, CarbonAwareScheduler, EnergyAwareScheduler

SCHEDULERS: Dict[str, Type[BaseScheduler]] = {
    "random": RandomScheduler,
    "first_fit": FirstFitScheduler,
    "carbon_aware": CarbonAwareScheduler,
    "energy_aware": EnergyAwareScheduler,
    "ecofusion_nsga2": OptimizedScheduler,
    "optimized": OptimizedScheduler,
}


def get_scheduler(name: str) -> BaseScheduler:
    """
    Instantiate scheduler by algorithm name.
    """
    key = name.lower().strip()
    if key not in SCHEDULERS:
        raise ValueError(f"Unknown scheduler algorithm: '{name}'. Supported: {list(SCHEDULERS.keys())}")
    return SCHEDULERS[key]()


__all__ = [
    "BaseScheduler",
    "RandomScheduler",
    "FirstFitScheduler",
    "OptimizedScheduler",
    "CarbonAwareScheduler",
    "EnergyAwareScheduler",
    "SCHEDULERS",
    "get_scheduler",
]
