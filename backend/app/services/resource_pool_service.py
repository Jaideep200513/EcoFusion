import os
import json
from typing import List
from ..models.resource_pool import ResourcePool
from ..utils.validation import validate_unique_pool_ids


DEFAULT_CONFIG_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "config",
    "datacenters.json"
)


def load_resource_pools_from_json(file_path: str = DEFAULT_CONFIG_PATH) -> List[ResourcePool]:
    """
    Load resource pool configurations from a JSON file.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Resource pools configuration file not found: {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    pools: List[ResourcePool] = [ResourcePool(**item) for item in raw_data]
    validate_unique_pool_ids(pools)
    return pools


def get_default_resource_pools() -> List[ResourcePool]:
    """
    Return default fallback resource pool definitions.
    """
    return [
        ResourcePool(
            id="pool-mumbai-01",
            name="Mumbai Data Center Pool",
            location="Mumbai",
            region="ap-south-1",
            cpu_capacity=2048.0,
            memory_capacity=8192.0,
            pue=1.28,
            idle_power=120.0,
            max_power=450.0,
            carbon_intensity=650.0,
            electricity_price=0.12,
            available=True,
        ),
        ResourcePool(
            id="pool-hyderabad-01",
            name="Hyderabad Data Center Pool",
            location="Hyderabad",
            region="ap-south-2",
            cpu_capacity=1536.0,
            memory_capacity=6144.0,
            pue=1.22,
            idle_power=95.0,
            max_power=360.0,
            carbon_intensity=580.0,
            electricity_price=0.10,
            available=True,
        ),
        ResourcePool(
            id="pool-singapore-01",
            name="Singapore Data Center Pool",
            location="Singapore",
            region="ap-southeast-1",
            cpu_capacity=2560.0,
            memory_capacity=10240.0,
            pue=1.18,
            idle_power=150.0,
            max_power=580.0,
            carbon_intensity=420.0,
            electricity_price=0.18,
            available=True,
        ),
    ]
