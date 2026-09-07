from ..models.resource_pool import ResourcePool


def calculate_operational_cost(
    energy_kwh: float,
    electricity_price_per_kwh: float
) -> float:
    """
    Calculate operational electricity cost in USD.

    Formula:
      cost = energy_kwh * electricity_price_per_kwh
    """
    if energy_kwh <= 0 or electricity_price_per_kwh <= 0:
        return 0.0

    cost = energy_kwh * electricity_price_per_kwh
    return round(cost, 4)


def calculate_workload_cost(
    energy_kwh: float,
    pool: ResourcePool
) -> float:
    """
    Calculate operational cost for a given energy amount and resource pool.
    """
    return calculate_operational_cost(energy_kwh, pool.electricity_price)
