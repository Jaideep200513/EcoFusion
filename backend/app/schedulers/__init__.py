from typing import Dict, Type
from .base_scheduler import BaseScheduler
from .random_scheduler import RandomScheduler
from .first_fit_scheduler import FirstFitScheduler

SCHEDULERS: Dict[str, Type[BaseScheduler]] = {
    "random": RandomScheduler,
    "first_fit": FirstFitScheduler,
}


def get_scheduler(name: str) -> BaseScheduler:
    """
    Instantiate scheduler by name ("random" or "first_fit").
    """
    key = name.lower().strip()
    if key not in SCHEDULERS:
        raise ValueError(f"Unknown scheduler algorithm: '{name}'. Supported: {list(SCHEDULERS.keys())}")
    return SCHEDULERS[key]()


__all__ = [
    "BaseScheduler",
    "RandomScheduler",
    "FirstFitScheduler",
    "SCHEDULERS",
    "get_scheduler",
]
