from ..models.resource_pool import ResourcePool


def calculate_carbon_emissions(
    energy_kwh: float,
    carbon_intensity_g_per_kwh: float
) -> float:
    """
    Calculate carbon emissions in kgCO2.

    Formula:
      carbon_kg = (energy_kwh * carbon_intensity_gCO2_per_kWh) / 1000.0
    """
    if energy_kwh <= 0 or carbon_intensity_g_per_kwh <= 0:
        return 0.0

    carbon_kg = (energy_kwh * carbon_intensity_g_per_kwh) / 1000.0
    return round(carbon_kg, 4)


def calculate_workload_carbon(
    energy_kwh: float,
    pool: ResourcePool
) -> float:
    """
    Calculate carbon emissions for a given energy amount and resource pool.
    """
    return calculate_carbon_emissions(energy_kwh, pool.carbon_intensity)
