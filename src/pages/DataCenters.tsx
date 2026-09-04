import React, { useState } from 'react';
import type { DataCenter } from '../types';
import { simulatorService } from '../services/simulatorService';
import { Drawer } from '../components/common/Drawer';
import {
  Building2,
  Globe,
  Activity,
  MapPin,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const DataCenters: React.FC = () => {
  const [dataCenters] = useState<DataCenter[]>(simulatorService.getDataCenters());
  const [selectedDc, setSelectedDc] = useState<DataCenter | null>(null);

  // Hourly carbon & price forecast curves for drawer view
  const hourlyProfileData = [
    { hour: '00:00', carbon: selectedDc?.carbonIntensity || 350, price: selectedDc?.electricityPrice || 0.12 },
    { hour: '04:00', carbon: (selectedDc?.carbonIntensity || 350) * 0.9, price: (selectedDc?.electricityPrice || 0.12) * 0.85 },
    { hour: '08:00', carbon: (selectedDc?.carbonIntensity || 350) * 1.25, price: (selectedDc?.electricityPrice || 0.12) * 1.4 },
    { hour: '12:00', carbon: (selectedDc?.carbonIntensity || 350) * 0.8, price: (selectedDc?.electricityPrice || 0.12) * 1.1 },
    { hour: '16:00', carbon: (selectedDc?.carbonIntensity || 350) * 1.35, price: (selectedDc?.electricityPrice || 0.12) * 1.6 },
    { hour: '20:00', carbon: (selectedDc?.carbonIntensity || 350) * 1.15, price: (selectedDc?.electricityPrice || 0.12) * 1.2 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Data Center Network</h3>
            <p className="text-xs text-slate-400">
              Multi-region facility infrastructure, Power Usage Effectiveness (PUE), and grid emission factors
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Total Infrastructure:</span>
          <span className="font-bold text-cyan-300 font-mono">3,840 Cores</span>
          <span className="text-slate-600">•</span>
          <span className="font-bold text-emerald-300 font-mono">15.3 TB RAM</span>
        </div>
      </div>

      {/* Cards Grid for Data Centers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dataCenters.map((dc) => (
          <div
            key={dc.id}
            onClick={() => setSelectedDc(dc)}
            className="glass-panel p-5 rounded-2xl glass-panel-hover cursor-pointer border border-slate-800 flex flex-col justify-between space-y-4 group"
          >
            {/* DC Header */}
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                    {dc.id}
                  </span>
                  <h4 className="text-base font-bold text-slate-100 mt-2 group-hover:text-cyan-300 transition-colors">
                    {dc.name}
                  </h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {dc.region}
                  </p>
                </div>

                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {dc.status}
                </span>
              </div>

              {/* Progress Utilization bar */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    CPU Load:
                  </span>
                  <span className="font-mono font-bold text-slate-200">{dc.currentUtilization}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${dc.currentUtilization}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-800/80">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">PUE Factor</span>
                <span className="text-sm font-bold font-mono text-emerald-400">{dc.pue}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Active Tasks</span>
                <span className="text-sm font-bold font-mono text-cyan-300">{dc.activeWorkloadsCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Carbon Intensity</span>
                <span className="text-xs font-bold font-mono text-amber-300">
                  {dc.carbonIntensity} gCO₂/kWh
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Electricity Price</span>
                <span className="text-xs font-bold font-mono text-slate-200">
                  ${dc.electricityPrice}/kWh
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
              <span>Capacity: {dc.cpuCapacity} Cores</span>
              <span className="text-cyan-400 font-semibold group-hover:underline">Details →</span>
            </div>
          </div>
        ))}
      </div>

      {/* Regional Topology Visualizer */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              <span>Spatial Data Center Geographic Topology</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulated multi-region placement nodes & interconnection grid (Illustrative Prototype)
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            DEMO NODES
          </span>
        </div>

        <div className="relative h-64 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-around p-6">
          {/* Node 1 */}
          <div className="flex flex-col items-center space-y-2 z-10">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center shadow-lg glow-cyan">
              <Building2 className="w-7 h-7 text-cyan-400" />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-200">DC1: US East</p>
              <p className="text-[10px] text-slate-400">PUE 1.22 • 385 gCO₂</p>
            </div>
          </div>

          {/* Connection line 1-2 */}
          <div className="flex-1 h-0.5 bg-gradient-to-r from-cyan-500/50 via-emerald-500/50 to-slate-700 relative mx-4">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-slate-900 text-[10px] font-mono text-cyan-400 border border-slate-800">
              Inter-Region Latency ~45ms
            </div>
          </div>

          {/* Node 2 */}
          <div className="flex flex-col items-center space-y-2 z-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center shadow-lg glow-emerald">
              <Building2 className="w-7 h-7 text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-200">DC2: EU Central</p>
              <p className="text-[10px] text-emerald-400 font-semibold">PUE 1.15 • Clean Grid (190g)</p>
            </div>
          </div>

          {/* Connection line 2-3 */}
          <div className="flex-1 h-0.5 bg-gradient-to-r from-emerald-500/50 via-amber-500/50 to-slate-700 relative mx-4">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-slate-900 text-[10px] font-mono text-amber-400 border border-slate-800">
              Inter-Region Latency ~110ms
            </div>
          </div>

          {/* Node 3 */}
          <div className="flex flex-col items-center space-y-2 z-10">
            <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center shadow-lg">
              <Building2 className="w-7 h-7 text-amber-400" />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-200">DC3: AP South</p>
              <p className="text-[10px] text-slate-400">PUE 1.35 • Low Price ($0.09)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Center Detail Drawer */}
      <Drawer
        isOpen={!!selectedDc}
        onClose={() => setSelectedDc(null)}
        title={`Facility Profile: ${selectedDc?.id}`}
        subtitle={selectedDc?.name}
      >
        {selectedDc && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Region:</span>
                <span className="font-semibold text-slate-200">{selectedDc.region}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-bold">{selectedDc.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Power Usage Effectiveness (PUE):</span>
                <span className="font-mono text-cyan-300 font-bold">{selectedDc.pue}</span>
              </div>
            </div>

            {/* Capacity & Power Spec */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Power & Hardware Specs
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block mb-1">CPU Capacity</span>
                  <p className="text-base font-bold text-slate-100">{selectedDc.cpuCapacity} cores</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Memory Capacity</span>
                  <p className="text-base font-bold text-slate-100">{selectedDc.memoryCapacity} GB</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Idle Power</span>
                  <p className="text-base font-bold text-slate-100">{selectedDc.idlePowerKw} kW</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Max Power</span>
                  <p className="text-base font-bold text-slate-100">{selectedDc.maxPowerKw} kW</p>
                </div>
              </div>
            </div>

            {/* Dynamic Forecast chart */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                24h Dynamic Grid Forecast
              </h4>
              <div className="h-44 w-full bg-slate-950 p-2 rounded-xl border border-slate-800">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyProfileData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="hour" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip />
                    <Line type="monotone" dataKey="carbon" name="gCO₂/kWh" stroke="#06b6d4" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
