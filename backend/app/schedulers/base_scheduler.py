from abc import ABC, abstractmethod
from typing import List
from ..models.workload import Workload
from ..models.resource_pool import ResourcePool
from ..models.simulation import TimeSlot, SimulationConfig
from ..models.scheduling import SchedulingDecision


class BaseScheduler(ABC):
    """
    Abstract base class for all workload schedulers.
    """

    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def schedule(
        self,
        workloads: List[Workload],
        resource_pools: List[ResourcePool],
        time_slots: List[TimeSlot],
        config: SimulationConfig,
    ) -> List[SchedulingDecision]:
        """
        Execute scheduling algorithm over submitted workloads, available resource pools,
        and discrete time slots within the simulation horizon.
        """
        pass
