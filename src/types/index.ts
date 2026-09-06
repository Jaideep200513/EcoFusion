export type SLAStatus = 'COMPLIANT' | 'RISK' | 'VIOLATED';

export interface Workload {
  id: string;
  name: string;
  arrivalTime: string; // e.g. "08:00"
  cpuRequired: number; // cores
  memoryRequired: number; // GB
  duration: number; // hours
  deadline: string; // e.g. "14:00"
  slaStatus: SLAStatus;
  assignedPoolId?: string;
  assignedDcId?: string; // backwards compatibility
  assignedTimeSlot?: string;
  status: 'PENDING' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED';
}

export interface ResourcePool {
  id: string;
  name: string;
  region: string;
  locationLabel: string; // e.g. "Mumbai", "Hyderabad", "Singapore"
  cpuCapacity: number; // cores
  memoryCapacity: number; // GB
  pue: number; // Power Usage Effectiveness e.g. 1.22
  idlePowerKw: number;
  maxPowerKw: number;
  currentUtilization: number; // %
  carbonIntensity: number; // gCO2/kWh
  electricityPrice: number; // $/kWh
  availability: number; // %
  status: 'ONLINE' | 'MAINTENANCE' | 'OFFLINE';
  activeWorkloadsCount: number;
}

// Backwards compatibility alias
export type DataCenter = ResourcePool;

export interface TimeSlot {
  id: string;
  label: string; // e.g. "00", "01", "02"
  startTime: string; // "00:00"
  endTime: string; // "01:00"
  carbonIntensity: number; // gCO2/kWh
  electricityPrice: number; // $/kWh
  renewableRatio: number; // % renewable energy
}

export interface SchedulingDecision {
  workloadId: string;
  poolId: string;
  datacenterId?: string; // backwards compatibility
  timeSlotId: string;
  estimatedEnergyKwh: number;
  estimatedCarbonGco2: number;
  estimatedCostUsd: number;
  slaFeasible: boolean;
  slaMarginHours: number;
}

export interface CandidateOption {
  poolId: string;
  poolName: string;
  datacenterId?: string; // backwards compatibility
  datacenterName?: string;
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

export interface SimulationSetupConfig {
  // Workload Configuration
  datasetName: string;
  numWorkloads: number;
  cpuMin: number;
  cpuMax: number;
  memoryMin: number;
  memoryMax: number;
  durationMin: number;
  durationMax: number;
  deadlinePolicy: 'STRICT' | 'SLACK_2H' | 'SLACK_4H' | 'FLEXIBLE';

  // Infrastructure Configuration
  numResourcePools: number;
  cpuCapacity: number;
  memoryCapacity: number;
  pue: number;
  idlePowerKw: number;
  maxPowerKw: number;

  // Environmental Configuration
  baselineCarbonIntensity: number;
  electricityPrice: number;
  renewableAvailability: number; // %

  // Scheduling Configuration
  timeSlotDurationMinutes: number;
  simulationHorizonHours: number;
  algorithm: 'ECOFUSION_NSGA2' | 'RANDOM' | 'FIRST_FIT' | 'ENERGY_AWARE' | 'CARBON_AWARE';
  slaPolicy: 'STRICT_ZERO_TOLERANCE' | 'PENALTY_BOUNDED' | 'BEST_EFFORT';

  // Reproducibility
  experimentName: string;
  randomSeed: number;
  configurationVersion: string;
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
  algorithm: 'ECOFUSION_NSGA2' | 'RANDOM' | 'FIRST_FIT' | 'CONVENTIONAL_COST' | 'ENERGY_AWARE' | 'CARBON_AWARE';
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

export type DashboardTab =
  | 'overview'
  | 'workloads'
  | 'resource-pools'
  | 'simulation-setup'
  | 'scheduling'
  | 'experiments'
  | 'results'
  | 'comparisons'
  | 'documentation'
  | 'configuration'
  | 'settings';

