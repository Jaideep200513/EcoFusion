import React, { useState } from 'react';
import { simulatorService } from '../services/simulatorService';
import type { SimulationSetupConfig, DashboardTab } from '../types';
import {
  Sliders,
  Server,
  Building2,
  Leaf,
  Clock,
  RotateCcw,
  Play,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SimulationSetupProps {
  onRunSimulation: () => void;
  onNavigateTab: (tab: DashboardTab) => void;
  isSimulating?: boolean;
}

export const SimulationSetup: React.FC<SimulationSetupProps> = ({
  onRunSimulation,
  onNavigateTab,
  isSimulating,
}) => {
  const initialConfig = simulatorService.getSimulationSetupConfig();
  const [config, setConfig] = useState<SimulationSetupConfig>({ ...initialConfig });
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    workload: true,
    infrastructure: false,
    environment: false,
    scheduling: false,
    reproducibility: false,
  });
  const [savedFeedback, setSavedFeedback] = useState(false);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleUpdate = <K extends keyof SimulationSetupConfig>(key: K, value: SimulationSetupConfig[K]) => {
    setConfig((prev) => {
      const next = { ...prev, [key]: value };
      simulatorService.updateSimulationSetupConfig(next);
      return next;
    });
  };

  const handleReset = () => {
    const fresh = simulatorService.getSimulationSetupConfig();
    setConfig({ ...fresh });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1500);
  };

  const handleExecute = () => {
    onRunSimulation();
    setTimeout(() => {
      onNavigateTab('scheduling');
    }, 700);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-950 tracking-tight">Simulation Setup & Parameter Tuning</h3>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200 font-semibold">
              CONFIGURABLE
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Configure workload distributions, regional infrastructure constraints, environmental signals, and algorithm policies.
          </p>
        </div>

        {savedFeedback && (
          <span className="text-xs font-mono text-emerald-700 flex items-center gap-1.5 animate-fade-in font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Defaults restored
          </span>
        )}
      </div>

      {/* Accordion 1: Workload Configuration */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <button
          onClick={() => toggleSection('workload')}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-950 text-white flex items-center justify-center shadow-sm">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono text-slate-500 font-semibold uppercase">Step 01</div>
              <h4 className="text-base font-bold text-slate-950">Workload Trace Dataset Configuration</h4>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-600 hidden sm:inline">
              {config.numWorkloads} Workloads · {config.deadlinePolicy}
            </span>
            {openSections.workload ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>
        </button>

        {openSections.workload && (
          <div className="p-6 border-t border-slate-200 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 mb-1.5 font-semibold">Dataset Source Trace</label>
                <select
                  value={config.datasetName}
                  onChange={(e) => handleUpdate('datasetName', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-950 text-xs focus:border-slate-950 focus:bg-white outline-none"
                >
                  <option value="Synthetic-Trace-v1.csv (Google Cluster Trace subset)">
                    Synthetic-Trace-v1 (Google Cluster Trace subset)
                  </option>
                  <option value="Alibaba-Cluster-Trace-Sample24.csv">
                    Alibaba-Cluster-Trace-Sample24 (Alibaba 2020)
                  </option>
                  <option value="Azure-Functions-Batch-Subset.csv">
                    Azure-Functions-Batch-Subset (Synthetic 2024)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1.5 font-semibold">
                  Number of Workloads: <span className="text-slate-950 font-mono font-bold">{config.numWorkloads}</span>
                </label>
                <input
                  type="range"
                  min={8}
                  max={64}
                  step={4}
                  value={config.numWorkloads}
                  onChange={(e) => handleUpdate('numWorkloads', parseInt(e.target.value, 10))}
                  className="w-full accent-slate-950"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">CPU Range (Cores)</label>
                <div className="flex items-center gap-1 font-mono text-slate-950 font-semibold">
                  <span>{config.cpuMin}</span> - <span>{config.cpuMax}</span> Cores
                </div>
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-medium">RAM Range (GB)</label>
                <div className="flex items-center gap-1 font-mono text-slate-950 font-semibold">
                  <span>{config.memoryMin}</span> - <span>{config.memoryMax}</span> GB
                </div>
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Duration Range</label>
                <div className="flex items-center gap-1 font-mono text-slate-950 font-semibold">
                  <span>{config.durationMin}</span> - <span>{config.durationMax}</span> Hours
                </div>
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Deadline Slack</label>
                <select
                  value={config.deadlinePolicy}
                  onChange={(e) => handleUpdate('deadlinePolicy', e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-slate-950 text-xs focus:border-slate-950 focus:bg-white outline-none"
                >
                  <option value="STRICT">Strict (0h slack)</option>
                  <option value="SLACK_2H">Slack +2h</option>
                  <option value="SLACK_4H">Slack +4h</option>
                  <option value="FLEXIBLE">Flexible (+8h)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Accordion 2: Infrastructure Configuration */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <button
          onClick={() => toggleSection('infrastructure')}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-950 text-white flex items-center justify-center shadow-sm">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono text-slate-500 font-semibold uppercase">Step 02</div>
              <h4 className="text-sm font-bold text-slate-950">Regional Infrastructure Pools & PUE</h4>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-600 hidden sm:inline">
              3 Regional Pools (Mumbai, Hyderabad, Singapore)
            </span>
            {openSections.infrastructure ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>
        </button>

        {openSections.infrastructure && (
          <div className="p-6 border-t border-slate-200 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-950 mb-1">Mumbai (AP-South-1)</div>
                <div className="text-slate-600">2048 Cores · 8192 GB RAM</div>
                <div className="text-slate-900 font-mono font-bold mt-2">PUE: 1.28</div>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-950 mb-1">Hyderabad (AP-South-2)</div>
                <div className="text-slate-600">1536 Cores · 6144 GB RAM</div>
                <div className="text-slate-900 font-mono font-bold mt-2">PUE: 1.22</div>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-950 mb-1">Singapore (AP-Southeast-1)</div>
                <div className="text-slate-600">2560 Cores · 10240 GB RAM</div>
                <div className="text-slate-900 font-mono font-bold mt-2">PUE: 1.18</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-slate-700 mb-1.5 font-semibold">Server Idle Power Baseline (kW)</label>
                <input
                  type="number"
                  value={config.idlePowerKw}
                  onChange={(e) => handleUpdate('idlePowerKw', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-950 font-mono text-xs focus:border-slate-950 focus:bg-white outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1.5 font-semibold">Server Peak Power Ceiling (kW)</label>
                <input
                  type="number"
                  value={config.maxPowerKw}
                  onChange={(e) => handleUpdate('maxPowerKw', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-950 font-mono text-xs focus:border-slate-950 focus:bg-white outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Accordion 3: Environmental & Energy Configuration */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <button
          onClick={() => toggleSection('environment')}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-950 text-white flex items-center justify-center shadow-sm">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono text-slate-500 font-semibold uppercase">Step 03</div>
              <h4 className="text-sm font-bold text-slate-950">Environmental Carbon Signals & Tariffs</h4>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-600 hidden sm:inline">
              {config.baselineCarbonIntensity} gCO₂/kWh · ${config.electricityPrice}/kWh
            </span>
            {openSections.environment ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>
        </button>

        {openSections.environment && (
          <div className="p-6 border-t border-slate-200 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 mb-1.5 font-semibold">Baseline Carbon Intensity (gCO₂/kWh)</label>
                <input
                  type="number"
                  value={config.baselineCarbonIntensity}
                  onChange={(e) => handleUpdate('baselineCarbonIntensity', parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-950 font-mono text-xs focus:border-slate-950 focus:bg-white outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1.5 font-semibold">Base Electricity Price ($/kWh)</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.electricityPrice}
                  onChange={(e) => handleUpdate('electricityPrice', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-950 font-mono text-xs focus:border-slate-950 focus:bg-white outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1.5 font-semibold">Renewable Share (% grid)</label>
                <input
                  type="number"
                  value={config.renewableAvailability}
                  onChange={(e) => handleUpdate('renewableAvailability', parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-950 font-mono text-xs focus:border-slate-950 focus:bg-white outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Accordion 4: Scheduling & Algorithmic Parameters */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <button
          onClick={() => toggleSection('scheduling')}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-950 text-white flex items-center justify-center shadow-sm">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono text-slate-500 font-semibold uppercase">Step 04</div>
              <h4 className="text-sm font-bold text-slate-950">Scheduling Engine & SLA Constraint Policy</h4>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-600 hidden sm:inline">
              Algorithm: {config.algorithm} · Horizon: {config.simulationHorizonHours}h
            </span>
            {openSections.scheduling ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>
        </button>

        {openSections.scheduling && (
          <div className="p-6 border-t border-slate-200 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 mb-1.5 font-semibold">Optimization Algorithm</label>
                <select
                  value={config.algorithm}
                  onChange={(e) => handleUpdate('algorithm', e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-950 text-xs font-semibold focus:border-slate-950 focus:bg-white outline-none"
                >
                  <option value="ECOFUSION_NSGA2">EcoFusion (NSGA-II Multi-Objective)</option>
                  <option value="CARBON_AWARE">Carbon-Aware Greedy (Greedy spatial)</option>
                  <option value="ENERGY_AWARE">Energy-Aware Greedy (PUE biased)</option>
                  <option value="FIRST_FIT">First-Fit Heuristic</option>
                  <option value="RANDOM">Random Baseline</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1.5 font-semibold">Simulation Horizon</label>
                <select
                  value={config.simulationHorizonHours}
                  onChange={(e) => handleUpdate('simulationHorizonHours', parseInt(e.target.value, 10))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-950 text-xs font-mono focus:border-slate-950 focus:bg-white outline-none"
                >
                  <option value={12}>12 Hours (Half Day)</option>
                  <option value={24}>24 Hours (Full Diurnal Cycle)</option>
                  <option value={48}>48 Hours (Multi-Day Trace)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1.5 font-semibold">SLA Enforcement Policy</label>
                <select
                  value={config.slaPolicy}
                  onChange={(e) => handleUpdate('slaPolicy', e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-950 text-xs focus:border-slate-950 focus:bg-white outline-none"
                >
                  <option value="STRICT_ZERO_TOLERANCE">Strict Zero Tolerance (Hard cutoff)</option>
                  <option value="PENALTY_BOUNDED">Penalty Bounded (Quadratic cost)</option>
                  <option value="BEST_EFFORT">Best Effort</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Accordion 5: Reproducibility Settings */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <button
          onClick={() => toggleSection('reproducibility')}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-950 text-white flex items-center justify-center shadow-sm">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono text-slate-500 font-semibold uppercase">Step 05</div>
              <h4 className="text-sm font-bold text-slate-950">Reproducibility & Scientific Lineage</h4>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-600 hidden sm:inline">
              Seed: {config.randomSeed} · Version: {config.configurationVersion}
            </span>
            {openSections.reproducibility ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>
        </button>

        {openSections.reproducibility && (
          <div className="p-6 border-t border-slate-200 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 mb-1.5 font-semibold">Experiment Label</label>
                <input
                  type="text"
                  value={config.experimentName}
                  onChange={(e) => handleUpdate('experimentName', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-950 font-mono text-xs focus:border-slate-950 focus:bg-white outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1.5 font-semibold">Pseudo-Random Seed (Repro)</label>
                <input
                  type="number"
                  value={config.randomSeed}
                  onChange={(e) => handleUpdate('randomSeed', parseInt(e.target.value, 10) || 42)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-950 font-mono text-xs focus:border-slate-950 focus:bg-white outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1.5 font-semibold">Configuration Schema Version</label>
                <input
                  type="text"
                  readOnly
                  value={config.configurationVersion}
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2.5 text-slate-500 font-mono text-xs cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-all cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>Reset to Defaults</span>
            </button>
            <span className="hidden sm:inline text-[11px] font-mono text-slate-500 font-medium">
              Random Seed: {config.randomSeed}
            </span>
          </div>

          <button
            onClick={handleExecute}
            disabled={isSimulating}
            className="px-6 py-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-current text-white" />
            <span>{isSimulating ? 'Executing Simulation...' : 'Run Simulation →'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
