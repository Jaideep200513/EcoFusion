import type {
  Workload,
  ResourcePool,
  DataCenter,
  TimeSlot,
  CandidateOption,
  SchedulingDecision,
  SimulationResult,
  SimulationConfig,
  SimulationSetupConfig,
  Experiment,
} from '../types';
import {
  demoResourcePools,
  demoWorkloads,
  demoTimeSlots,
  baselineComparisons,
  demoExperiments,
  defaultConfig,
  defaultSimulationSetupConfig,
} from '../data/mockData';
import { apiClient } from './apiClient';

export class SimulatorService {
  private resourcePools: ResourcePool[] = [...demoResourcePools];
  private workloads: Workload[] = [...demoWorkloads];
  private timeSlots: TimeSlot[] = [...demoTimeSlots];
  private experiments: Experiment[] = [...demoExperiments];
  private config: SimulationConfig = { ...defaultConfig };
  private setupConfig: SimulationSetupConfig = { ...defaultSimulationSetupConfig };
  private latestParetoSolutions: any[] = [];

  public getResourcePools(): ResourcePool[] {
    return this.resourcePools;
  }

  public async fetchResourcePools(): Promise<ResourcePool[]> {
    try {
      const pools = await apiClient.getResourcePools();
      if (pools && pools.length > 0) {
        this.resourcePools = pools;
      }
    } catch {
      // Fallback
    }
    return this.resourcePools;
  }

  public getDataCenters(): DataCenter[] {
    return this.resourcePools;
  }

  public getWorkloads(): Workload[] {
    return this.workloads;
  }

  public async fetchWorkloads(count: number = 100, seed: number = 42): Promise<Workload[]> {
    try {
      const wls = await apiClient.getWorkloads(count, seed);
      if (wls && wls.length > 0) {
        this.workloads = wls;
      }
    } catch {
      // Fallback
    }
    return this.workloads;
  }

  public getTimeSlots(): TimeSlot[] {
    return this.timeSlots;
  }

  public getExperiments(): Experiment[] {
    return this.experiments;
  }

  public async fetchExperiments(): Promise<Experiment[]> {
    try {
      const exps = await apiClient.getExperiments();
      if (exps && exps.length > 0) {
        this.experiments = exps;
      }
    } catch {
      // Fallback
    }
    return this.experiments;
  }

  public getSimulationConfig(): SimulationConfig {
    return this.config;
  }

  public getSimulationSetupConfig(): SimulationSetupConfig {
    return this.setupConfig;
  }

  public getLatestParetoSolutions(): any[] {
    return this.latestParetoSolutions;
  }

  public updateSimulationSetupConfig(newConfig: Partial<SimulationSetupConfig>): SimulationSetupConfig {
    this.setupConfig = { ...this.setupConfig, ...newConfig };
    return this.setupConfig;
  }

  public updateConfig(newConfig: Partial<SimulationConfig>): SimulationConfig {
    this.config = { ...this.config, ...newConfig };
    return this.config;
  }

  public calculateMetrics(
    workload: Workload,
    datacenter: DataCenter,
    slot: TimeSlot
  ): {
    estimatedEnergyKwh: number;
    estimatedCarbonGco2: number;
    estimatedCostUsd: number;
    slaFeasible: boolean;
    slaMarginHours: number;
  } {
    const loadFraction = Math.min(1.0, workload.cpuRequired / (datacenter.cpuCapacity * 0.1));
    const powerKw = datacenter.idlePowerKw + (datacenter.maxPowerKw - datacenter.idlePowerKw) * loadFraction;
    const eIt = powerKw * workload.duration;
    const estimatedEnergyKwh = eIt * datacenter.pue;
    const carbonIntensity = slot.carbonIntensity || datacenter.carbonIntensity;
    const estimatedCarbonGco2 = estimatedEnergyKwh * carbonIntensity;
    const price = slot.electricityPrice || datacenter.electricityPrice;
    const estimatedCostUsd = estimatedEnergyKwh * price;

    const arrivalHour = parseInt(workload.arrivalTime.split(':')[0], 10) || 8;
    const slotHour = parseInt(slot.startTime.split(':')[0], 10) || 10;
    const deadlineHour = parseInt(workload.deadline.split(':')[0], 10) || 18;

    const completionHour = slotHour + workload.duration;
    const slaFeasible = slotHour >= arrivalHour && completionHour <= deadlineHour;
    const slaMarginHours = deadlineHour - completionHour;

    return {
      estimatedEnergyKwh: Number(estimatedEnergyKwh.toFixed(2)),
      estimatedCarbonGco2: Number(estimatedCarbonGco2.toFixed(1)),
      estimatedCostUsd: Number(estimatedCostUsd.toFixed(2)),
      slaFeasible,
      slaMarginHours,
    };
  }

  public evaluateCandidateOptions(workloadId: string): CandidateOption[] {
    const workload = this.workloads.find((w) => w.id === workloadId) || this.workloads[0];
    const candidates: CandidateOption[] = [];

    this.resourcePools.forEach((pool) => {
      this.timeSlots.slice(3, 9).forEach((slot) => {
        const metrics = this.calculateMetrics(workload, pool, slot);
        candidates.push({
          poolId: pool.id,
          poolName: pool.name,
          datacenterId: pool.id,
          datacenterName: pool.name,
          region: pool.region,
          timeSlotId: slot.id,
          timeSlotLabel: `${slot.startTime} - ${slot.endTime}`,
          estimatedEnergy: metrics.estimatedEnergyKwh,
          estimatedCarbon: metrics.estimatedCarbonGco2,
          estimatedCost: metrics.estimatedCostUsd,
          slaFeasible: metrics.slaFeasible,
          pue: pool.pue,
          carbonIntensity: slot.carbonIntensity,
          electricityPrice: slot.electricityPrice,
        });
      });
    });

    return candidates;
  }

  public async runAsyncSimulation(configOverride?: Partial<SimulationConfig>): Promise<SimulationResult> {
    try {
      const algo = (configOverride?.algorithm || this.setupConfig.algorithm || 'ECOFUSION_NSGA2').toUpperCase();
      
      if (algo.includes('NSGA2') || algo.includes('ECOFUSION')) {
        const optRes = await apiClient.runOptimization(
          {
            num_workloads: this.setupConfig.numWorkloads,
            random_seed: this.setupConfig.randomSeed,
            ...(configOverride || {}),
          },
          {
            population_size: 50,
            generations: 50,
            random_seed: this.setupConfig.randomSeed,
          }
        );
        this.latestParetoSolutions = optRes.paretoSolutions;
        return optRes.result;
      }

      const res = await apiClient.runSimulation({
        algorithm: algo,
        numWorkloads: this.setupConfig.numWorkloads,
        randomSeed: this.setupConfig.randomSeed,
        ...(configOverride || {}),
      });
      return res;
    } catch {
      return this.runDemoSimulation(configOverride);
    }
  }

  public runDemoSimulation(configOverride?: Partial<SimulationConfig>): SimulationResult {
    const effectiveConfig = { ...this.config, ...configOverride };
    
    let totalEnergy = 0;
    let totalCarbonG = 0;
    let totalCost = 0;
    let slaViolations = 0;
    const decisions: SchedulingDecision[] = [];

    this.workloads.forEach((wl, idx) => {
      const pool = this.resourcePools[idx % this.resourcePools.length];
      const slot = this.timeSlots[(idx * 2) % this.timeSlots.length];
      const metrics = this.calculateMetrics(wl, pool, slot);

      totalEnergy += metrics.estimatedEnergyKwh;
      totalCarbonG += metrics.estimatedCarbonGco2;
      totalCost += metrics.estimatedCostUsd;

      if (!metrics.slaFeasible) {
        slaViolations += 1;
      }

      decisions.push({
        workloadId: wl.id,
        poolId: pool.id,
        datacenterId: pool.id,
        timeSlotId: slot.id,
        estimatedEnergyKwh: metrics.estimatedEnergyKwh,
        estimatedCarbonGco2: metrics.estimatedCarbonGco2,
        estimatedCostUsd: metrics.estimatedCostUsd,
        slaFeasible: metrics.slaFeasible,
        slaMarginHours: metrics.slaMarginHours,
      });
    });

    const slaViolationRate = Number(((slaViolations / this.workloads.length) * 100).toFixed(1));

    return {
      experimentId: `SIM-${effectiveConfig.algorithm}-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      totalWorkloads: this.workloads.length,
      scheduledWorkloads: this.workloads.length - slaViolations,
      totalEnergyKwh: Number(totalEnergy.toFixed(1)),
      totalCarbonKg: Number((totalCarbonG / 1000).toFixed(2)),
      totalCostUsd: Number(totalCost.toFixed(2)),
      slaViolationRate,
      avgCompletionTimeHours: 3.6,
      decisions,
      comparisons: baselineComparisons,
    };
  }

  public addWorkload(newWorkload: Omit<Workload, 'id' | 'status' | 'slaStatus'>): Workload {
    const created: Workload = {
      ...newWorkload,
      id: `WL-${100 + this.workloads.length + 1}`,
      status: 'PENDING',
      slaStatus: 'COMPLIANT',
    };
    this.workloads.unshift(created);
    return created;
  }

  public createExperiment(expData: Partial<Experiment>): Experiment {
    const newExp: Experiment = {
      id: `EXP-2026-${String(this.experiments.length + 1).padStart(3, '0')}`,
      name: expData.name || 'Custom Scheduling Experiment',
      datasetName: expData.datasetName || 'Synthetic-Dataset-v1',
      numWorkloads: expData.numWorkloads || 24,
      numDataCenters: expData.numDataCenters || 3,
      timeSlotDuration: expData.timeSlotDuration || 60,
      algorithm: expData.algorithm || 'ECOFUSION_NSGA2',
      randomSeed: expData.randomSeed || 42,
      status: 'READY',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      config: { ...this.config, ...(expData.config || {}) },
    };
    this.experiments.unshift(newExp);
    return newExp;
  }
}

export const simulatorService = new SimulatorService();
