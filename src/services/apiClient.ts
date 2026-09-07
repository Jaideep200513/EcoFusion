import type {
  Workload,
  ResourcePool,
  SimulationConfig,
  SimulationResult,
  Experiment,
} from '../types';

const API_BASE_URL = 'http://localhost:8000';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  public async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async getWorkloads(count: number = 100, seed: number = 42): Promise<Workload[]> {
    const res = await fetch(`${this.baseUrl}/api/workloads?count=${count}&seed=${seed}`);
    if (!res.ok) throw new Error('Failed to fetch workloads from backend API');
    const data = await res.json();
    return data.map((item: any) => ({
      id: item.id,
      name: `Task-${item.id}`,
      arrivalTime: `${String(Math.floor(item.arrival_time)).padStart(2, '0')}:00`,
      cpuRequired: item.cpu_required,
      memoryRequired: item.memory_required,
      duration: item.duration,
      deadline: `${String(Math.floor(item.deadline)).padStart(2, '0')}:00`,
      slaStatus: item.deadline ? 'COMPLIANT' : 'RISK',
      status: 'PENDING',
    }));
  }

  public async createWorkload(payload: {
    arrival_time: number;
    cpu_required: number;
    memory_required: number;
    duration: number;
    deadline: number;
    priority?: number;
  }): Promise<Workload> {
    const res = await fetch(`${this.baseUrl}/api/workloads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create workload via backend API');
    const item = await res.json();
    return {
      id: item.id,
      name: `Task-${item.id}`,
      arrivalTime: `${String(Math.floor(item.arrival_time)).padStart(2, '0')}:00`,
      cpuRequired: item.cpu_required,
      memoryRequired: item.memory_required,
      duration: item.duration,
      deadline: `${String(Math.floor(item.deadline)).padStart(2, '0')}:00`,
      slaStatus: 'COMPLIANT',
      status: 'PENDING',
    };
  }

  public async getResourcePools(): Promise<ResourcePool[]> {
    const res = await fetch(`${this.baseUrl}/api/resource-pools`);
    if (!res.ok) throw new Error('Failed to fetch resource pools from backend API');
    const data = await res.json();
    return data.map((p: any) => ({
      id: p.id,
      name: p.name || `${p.location} Pool`,
      region: p.region || p.location,
      locationLabel: p.location,
      cpuCapacity: p.cpu_capacity,
      memoryCapacity: p.memory_capacity,
      pue: p.pue,
      idlePowerKw: p.idle_power,
      maxPowerKw: p.max_power,
      currentUtilization: 0,
      carbonIntensity: p.carbon_intensity,
      electricityPrice: p.electricity_price,
      availability: p.available ? 99.9 : 0.0,
      status: p.available ? 'ONLINE' : 'OFFLINE',
      activeWorkloadsCount: 0,
    }));
  }

  public async runSimulation(configOverride?: Record<string, any>): Promise<SimulationResult> {
    const res = await fetch(`${this.baseUrl}/api/simulations/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheduler_name: configOverride?.algorithm?.toLowerCase().includes('fit') ? 'first_fit' : 'random',
        num_workloads: configOverride?.numWorkloads || 100,
        random_seed: configOverride?.randomSeed || 42,
        ...configOverride,
      }),
    });
    if (!res.ok) throw new Error('Simulation execution failed on backend API');
    const data = await res.json();
    return {
      experimentId: data.experiment_id,
      timestamp: data.execution_metadata?.timestamp || new Date().toISOString(),
      totalWorkloads: data.total_workloads,
      scheduledWorkloads: data.scheduled_workloads,
      totalEnergyKwh: data.total_energy_kwh,
      totalCarbonKg: data.total_carbon_kg,
      totalCostUsd: data.total_cost,
      slaViolationRate: data.sla_violation_rate,
      avgCompletionTimeHours: data.average_completion_time,
      decisions: (data.assignments || []).map((a: any) => ({
        workloadId: a.workload_id,
        poolId: a.resource_pool_id || 'NONE',
        datacenterId: a.resource_pool_id || 'NONE',
        timeSlotId: a.start_time !== null ? `TS-${String(Math.floor(a.start_time)).padStart(2, '0')}` : 'UNSCHEDULED',
        estimatedEnergyKwh: a.energy_kwh,
        estimatedCarbonGco2: Math.round(a.carbon_kg * 1000),
        estimatedCostUsd: a.cost,
        slaFeasible: a.sla_met,
        slaMarginHours: a.end_time !== null ? 2.0 : 0,
      })),
      comparisons: [],
    };
  }

  public async getExperiments(): Promise<Experiment[]> {
    const res = await fetch(`${this.baseUrl}/api/experiments`);
    if (!res.ok) throw new Error('Failed to fetch experiments from backend API');
    const data = await res.json();
    return data.map((exp: any) => ({
      id: exp.id,
      name: exp.name,
      datasetName: exp.dataset_name,
      numWorkloads: exp.summary?.total_workloads || 100,
      numDataCenters: 3,
      timeSlotDuration: 60,
      algorithm: exp.scheduler_name,
      randomSeed: exp.random_seed,
      status: exp.status || 'COMPLETED',
      createdAt: exp.timestamp,
      totalEnergyKwh: exp.summary?.total_energy_kwh,
      totalCarbonKg: exp.summary?.total_carbon_kg,
      totalCostUsd: exp.summary?.total_cost,
      slaViolationRate: exp.summary?.sla_violation_rate,
      config: {
        horizonHours: 24,
        timeSlotDurationMinutes: 60,
        numDataCenters: 3,
        numWorkloads: exp.summary?.total_workloads || 100,
        randomSeed: exp.random_seed,
        carbonWeight: 0.5,
        energyWeight: 0.3,
        costWeight: 0.2,
        maxSlaViolationRate: 5.0,
        algorithm: 'RANDOM',
      },
    }));
  }
}

export const apiClient = new ApiClient();
