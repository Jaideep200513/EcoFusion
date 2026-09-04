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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Simulator Settings & Parameters</h3>
            <p className="text-xs text-slate-400">
              Configure global simulation horizon, SLA constraints, objective weights, and JSON exports
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md glow-cyan transition-all"
          >
            {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Saved!' : 'Save Configuration'}</span>
          </button>

          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleExportConfig}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
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
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              1. Simulation Horizon & Granularity
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Horizon (Hours)</label>
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={config.horizonHours}
                  onChange={(e) => setConfig({ ...config, horizonHours: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Time Slot Duration (Minutes)</label>
                <select
                  value={config.timeSlotDurationMinutes}
                  onChange={(e) => setConfig({ ...config, timeSlotDurationMinutes: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>60 Minutes (1 Hour)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Multi-Objective Optimization Weights */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              2. Objective Function Weights
            </h4>
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300">Carbon Emission Weight (w_carbon):</span>
                  <span className="font-mono text-emerald-400 font-bold">{config.carbonWeight}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={config.carbonWeight}
                  onChange={(e) => setConfig({ ...config, carbonWeight: Number(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300">Energy Consumption Weight (w_energy):</span>
                  <span className="font-mono text-amber-400 font-bold">{config.energyWeight}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={config.energyWeight}
                  onChange={(e) => setConfig({ ...config, energyWeight: Number(e.target.value) })}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300">Operational Cost Weight (w_cost):</span>
                  <span className="font-mono text-cyan-400 font-bold">{config.costWeight}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={config.costWeight}
                  onChange={(e) => setConfig({ ...config, costWeight: Number(e.target.value) })}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* SLA Constraints */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
              3. SLA Threshold Constraints
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Max SLA Violation Rate (%)</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  step={0.5}
                  value={config.maxSlaViolationRate}
                  onChange={(e) => setConfig({ ...config, maxSlaViolationRate: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Default Algorithm</label>
                <select
                  value={config.algorithm}
                  onChange={(e) => setConfig({ ...config, algorithm: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                >
                  <option value="ECOFUSION_NSGA2">EcoFusion NSGA-II Multi-Objective</option>
                  <option value="CARBON_AWARE">Carbon-Aware Heuristic</option>
                  <option value="ENERGY_AWARE">Energy-Aware Heuristic</option>
                  <option value="CONVENTIONAL_COST">Conventional Cost-Min</option>
                  <option value="RANDOM">Random Baseline</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* JSON Preview Panel */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Live JSON Configuration Preview
              </h4>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              This config payload is injected directly into simulatorService during execution.
            </p>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto max-h-[380px] custom-scrollbar">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
