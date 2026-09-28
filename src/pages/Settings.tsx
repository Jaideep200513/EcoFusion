import React, { useState } from 'react';
import type { SimulationConfig } from '../types';
import { simulatorService } from '../services/simulatorService';
import { defaultConfig } from '../data/mockData';
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  Download,
  CheckCircle2,
  Code2,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [config, setConfig] = useState<SimulationConfig>(simulatorService.getSimulationConfig());
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    simulatorService.updateConfig(config);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleReset = () => {
    setConfig({ ...defaultConfig });
    simulatorService.updateConfig(defaultConfig);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 1500);
  };

  const handleExportConfig = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ecofusion_config_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-slate-950 text-white shadow-sm">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-950 tracking-tight">Simulator Settings & Parameters</h3>
            <p className="text-xs text-slate-600 mt-1">
              Configure global simulation horizon, SLA constraints, objective weights, and JSON exports.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            {isSaved ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Saved!' : 'Save Configuration'}</span>
          </button>

          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleExportConfig}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Simulation & Horizon */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider">
              1. Simulation Horizon & Granularity
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Horizon (Hours)</label>
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={config.horizonHours}
                  onChange={(e) => setConfig({ ...config, horizonHours: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-950 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Time Slot Duration (Minutes)</label>
                <select
                  value={config.timeSlotDurationMinutes}
                  onChange={(e) => setConfig({ ...config, timeSlotDurationMinutes: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-950 font-medium"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>60 Minutes (1 Hour)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Multi-Objective Optimization Weights */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider">
              2. Objective Function Weights (Normalized)
            </h4>
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-700 font-semibold">Carbon Emission Weight (w_carbon):</span>
                  <span className="font-mono text-emerald-700 font-bold">{config.carbonWeight}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={config.carbonWeight}
                  onChange={(e) => setConfig({ ...config, carbonWeight: Number(e.target.value) })}
                  className="w-full accent-slate-950"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-700 font-semibold">Energy Consumption Weight (w_energy):</span>
                  <span className="font-mono text-slate-950 font-bold">{config.energyWeight}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={config.energyWeight}
                  onChange={(e) => setConfig({ ...config, energyWeight: Number(e.target.value) })}
                  className="w-full accent-slate-950"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-700 font-semibold">Operational Cost Weight (w_cost):</span>
                  <span className="font-mono text-slate-950 font-bold">{config.costWeight}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={config.costWeight}
                  onChange={(e) => setConfig({ ...config, costWeight: Number(e.target.value) })}
                  className="w-full accent-slate-950"
                />
              </div>
            </div>
          </div>

          {/* SLA Constraints */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider">
              3. SLA Threshold Constraints & Default Algorithm
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Max SLA Violation Rate (%)</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  step={0.5}
                  value={config.maxSlaViolationRate}
                  onChange={(e) => setConfig({ ...config, maxSlaViolationRate: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-950 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Default Optimization Algorithm</label>
                <select
                  value={config.algorithm}
                  onChange={(e) => setConfig({ ...config, algorithm: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-950 font-semibold"
                >
                  <option value="ECOFUSION_NSGA2">EcoFusion NSGA-II Multi-Objective</option>
                  <option value="CARBON_AWARE">Carbon-Aware Heuristic</option>
                  <option value="ENERGY_AWARE">Energy-Aware Heuristic</option>
                  <option value="FIRST_FIT">First-Fit Heuristic</option>
                  <option value="RANDOM">Random Baseline</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* JSON Preview Panel */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Code2 className="w-4 h-4 text-slate-900" />
              <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider">
                Live Configuration Payload
              </h4>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              This configuration vector is persisted to localStorage and passed directly to the simulation engine.
            </p>
            <pre className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 overflow-x-auto max-h-[380px] custom-scrollbar">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
