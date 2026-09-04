export type SLAStatus = 'COMPLIANT' | 'RISK' | 'VIOLATED';

export interface Workload {
  id: string;
  name: string;
  arrivalTime: string; // e.g. "08:00" or ISO
  cpuRequired: number; // cores
  memoryRequired: number; // GB
  duration: number; // hours
  deadline: string; // e.g. "14:00"
  slaStatus: SLAStatus;
  assignedDcId?: string;
  assignedTimeSlot?: string;
  status: 'PENDING' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED';
}

export interface DataCenter {
  id: string;
  name: string;
  region: string;
  cpuCapacity: number; // cores
  memoryCapacity: number; // GB
  pue: number; // Power Usage Effectiveness e.g., 1.25
  idlePowerKw: number;
  maxPowerKw: number;
  currentUtilization: number; // %
  carbonIntensity: number; // gCO2/kWh
  electricityPrice: number; // $/kWh
  status: 'ONLINE' | 'MAINTENANCE' | 'OFFLINE';
  activeWorkloadsCount: number;
}

export interface TimeSlot {
  id: string;
  startTime: string; // "10:00"
  endTime: string; // "11:00"
  carbonIntensity: number; // gCO2/kWh
  electricityPrice: number; // $/kWh
  renewableRatio: number; // % renewable energy available
}

export interface SchedulingDecision {
  workloadId: string;
  datacenterId: string;
  timeSlotId: string;
  estimatedEnergyKwh: number;
  estimatedCarbonGco2: number;
  estimatedCostUsd: number;
  slaFeasible: boolean;
  slaMarginHours: number;
}

export interface CandidateOption {
  datacenterId: string;
  datacenterName: string;
  region: string;
  timeSlotId: string;
  timeSlotLabel: string;
  estimatedEnergy: number; // kWh
  estimatedCarbon: number; // gCO2
  estimatedCost: number; // USD
  slaFeasible: boolean;
  pue: number;
  carbonIntensity: number;
  electricityPrice: number;
}

export interface SimulationConfig {
  horizonHours: number;
  timeSlotDurationMinutes: number;
  numDataCenters: number;
  numWorkloads: number;
  randomSeed: number;
  carbonWeight: number; // 0..1
  energyWeight: number; // 0..1
  costWeight: number; // 0..1
  maxSlaViolationRate: number; // %
  algorithm: 'ECOFUSION_NSGA2' | 'RANDOM' | 'CONVENTIONAL_COST' | 'ENERGY_AWARE' | 'CARBON_AWARE';
}

export interface Experiment {
  id: string;
  name: string;
  datasetName: string;
  numWorkloads: number;
  numDataCenters: number;
  timeSlotDuration: number; // minutes
  algorithm: string;
  randomSeed: number;
  status: 'DRAFT' | 'READY' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  totalEnergyKwh?: number;
  totalCarbonKg?: number;
  totalCostUsd?: number;
  slaViolationRate?: number;
  config: SimulationConfig;
}

export interface AlgorithmResultComparison {
  algorithm: string;
  label: string;
  totalEnergyKwh: number;
  totalCarbonKg: number;
  totalCostUsd: number;
  slaViolationRate: number;
  avgCompletionTimeHours: number;
  isEcoFusion?: boolean;
}

export interface SimulationResult {
  experimentId: string;
  timestamp: string;
  totalWorkloads: number;
  scheduledWorkloads: number;
  totalEnergyKwh: number;
  totalCarbonKg: number;
  totalCostUsd: number;
  slaViolationRate: number;
  avgCompletionTimeHours: number;
  decisions: SchedulingDecision[];
  comparisons: AlgorithmResultComparison[];
}

export interface SystemStatus {
  datasetStatus: 'NOT_CONNECTED' | 'SAMPLE_DATA' | 'CONNECTED';
  mlModelStatus: 'NOT_TRAINED' | 'TRAINING' | 'READY';
  nsga2Status: 'NOT_IMPLEMENTED' | 'DEVELOPMENT' | 'READY';
  simulationMode: 'DEMO' | 'VALIDATION' | 'PRODUCTION';
}
