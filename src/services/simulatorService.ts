import type {
  Workload,
  DataCenter,
  TimeSlot,
  CandidateOption,
  SchedulingDecision,
  SimulationResult,
  SimulationConfig,
  Experiment,
} from '../types';
import {
  demoDataCenters,
  demoWorkloads,
  demoTimeSlots,
  baselineComparisons,
  demoExperiments,
  defaultConfig,
} from '../data/mockData';

export class SimulatorService {
  private dataCenters: DataCenter[] = [...demoDataCenters];
  private workloads: Workload[] = [...demoWorkloads];
  private timeSlots: TimeSlot[] = [...demoTimeSlots];
  private experiments: Experiment[] = [...demoExperiments];
  private config: SimulationConfig = { ...defaultConfig };

  public getDataCenters(): DataCenter[] {
    return this.dataCenters;
  }

  public getWorkloads(): Workload[] {
    return this.workloads;
  }

  public getTimeSlots(): TimeSlot[] {
    return this.timeSlots;
  }

  public getExperiments(): Experiment[] {
    return this.experiments;
  }

  public getSimulationConfig(): SimulationConfig {
    return this.config;
  }

  public updateConfig(newConfig: Partial<SimulationConfig>): SimulationConfig {
    this.config = { ...this.config, ...newConfig };
    return this.config;
  }

  /**
   * Section 11 Mathematical Formulas Implementation:
   * E_IT = (IdlePower + (MaxPower - IdlePower) * LoadFraction) * Duration
   * E_DC = E_IT * PUE
   * Carbon = E_DC * CarbonIntensity (in gCO2)
   * Cost = E_DC * ElectricityPrice (in USD)
   */
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
    // IT power approximation based on CPU requested relative to DC total CPU
    const loadFraction = Math.min(1.0, workload.cpuRequired / (datacenter.cpuCapacity * 0.1));
    const powerKw = datacenter.idlePowerKw + (datacenter.maxPowerKw - datacenter.idlePowerKw) * loadFraction;
    
    // IT Energy in kWh
    const eIt = powerKw * workload.duration;
    
    // Data Center Energy considering PUE
    const estimatedEnergyKwh = eIt * datacenter.pue;
    
    // Carbon emissions (gCO2) using time slot dynamic carbon intensity
    const carbonIntensity = slot.carbonIntensity || datacenter.carbonIntensity;
    const estimatedCarbonGco2 = estimatedEnergyKwh * carbonIntensity;
    
    // Electricity cost ($) using time slot dynamic price
    const price = slot.electricityPrice || datacenter.electricityPrice;
    const estimatedCostUsd = estimatedEnergyKwh * price;

    // Parse times to compare SLA
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

  /**
   * Generates candidate DataCenter x TimeSlot options for a specific workload
   */
  public evaluateCandidateOptions(workloadId: string): CandidateOption[] {
    const workload = this.workloads.find((w) => w.id === workloadId) || this.workloads[0];
    const candidates: CandidateOption[] = [];

    this.dataCenters.forEach((dc) => {
      // Evaluate against a subset of time slots
      this.timeSlots.slice(3, 9).forEach((slot) => {
        const metrics = this.calculateMetrics(workload, dc, slot);
        candidates.push({
          datacenterId: dc.id,
          datacenterName: dc.name,
          region: dc.region,
          timeSlotId: slot.id,
          timeSlotLabel: `${slot.startTime} - ${slot.endTime}`,
          estimatedEnergy: metrics.estimatedEnergyKwh,
          estimatedCarbon: metrics.estimatedCarbonGco2,
          estimatedCost: metrics.estimatedCostUsd,
          slaFeasible: metrics.slaFeasible,
          pue: dc.pue,
          carbonIntensity: slot.carbonIntensity,
          electricityPrice: slot.electricityPrice,
        });
      });
    });

    return candidates;
  }

  /**
   * Executes a demo simulation run on the current workload set
   */
  public runDemoSimulation(configOverride?: Partial<SimulationConfig>): SimulationResult {
    const effectiveConfig = { ...this.config, ...configOverride };
    
    let totalEnergy = 0;
    let totalCarbonG = 0;
    let totalCost = 0;
    let slaViolations = 0;
    const decisions: SchedulingDecision[] = [];

    this.workloads.forEach((wl, idx) => {
      // Assign best DC/Slot according to demo multi-objective weights
      const dc = this.dataCenters[idx % this.dataCenters.length];
      const slot = this.timeSlots[(idx * 2) % this.timeSlots.length];

      const metrics = this.calculateMetrics(wl, dc, slot);

      totalEnergy += metrics.estimatedEnergyKwh;
      totalCarbonG += metrics.estimatedCarbonGco2;
      totalCost += metrics.estimatedCostUsd;

      if (!metrics.slaFeasible) {
        slaViolations += 1;
      }

      decisions.push({
        workloadId: wl.id,
        datacenterId: dc.id,
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
