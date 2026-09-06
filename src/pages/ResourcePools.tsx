import React, { useState } from 'react';
import type { ResourcePool } from '../types';
import { simulatorService } from '../services/simulatorService';
import { Drawer } from '../components/common/Drawer';
import {
  Building2,
  MapPin,
  Server,
  Leaf,
  DollarSign,
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

export const ResourcePools: React.FC = () => {
  const resourcePools = simulatorService.getResourcePools();
  const [selectedPool, setSelectedPool] = useState<ResourcePool | null>(null);

  // Hourly carbon & price forecast curves for drawer view
  const hourlyProfileData = [
    { hour: '00:00', carbon: (selectedPool?.carbonIntensity || 450) * 1.05, price: (selectedPool?.electricityPrice || 0.12) * 0.8 },
    { hour: '04:00', carbon: (selectedPool?.carbonIntensity || 450) * 1.0, price: (selectedPool?.electricityPrice || 0.12) * 0.75 },
    { hour: '08:00', carbon: (selectedPool?.carbonIntensity || 450) * 1.15, price: (selectedPool?.electricityPrice || 0.12) * 1.1 },
    { hour: '12:00', carbon: (selectedPool?.carbonIntensity || 450) * 0.72, price: (selectedPool?.electricityPrice || 0.12) * 1.25 }, // solar peak drop
    { hour: '16:00', carbon: (selectedPool?.carbonIntensity || 450) * 1.2, price: (selectedPool?.electricityPrice || 0.12) * 1.4 },
    { hour: '20:00', carbon: (selectedPool?.carbonIntensity || 450) * 1.1, price: (selectedPool?.electricityPrice || 0.12) * 1.15 },
  ];

  const totalCores = resourcePools.reduce((acc, p) => acc + p.cpuCapacity, 0);
  const totalMemory = resourcePools.reduce((acc, p) => acc + p.memoryCapacity, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-slate-950 text-white shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-950 tracking-tight">Regional Resource Pools</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Abstract regional computing pools representing Mumbai, Hyderabad, and Singapore with dynamic PUE and grid carbon signals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-600 font-medium">Total Pooled Capacity:</span>
          <span className="font-bold text-slate-950">{totalCores.toLocaleString()} Cores</span>
          <span className="text-slate-400">•</span>
          <span className="font-bold text-slate-950">{(totalMemory / 1024).toFixed(1)} TB RAM</span>
        </div>
      </div>

      {/* Cards Grid for Resource Pools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {resourcePools.map((pool) => (
          <div
            key={pool.id}
            onClick={() => setSelectedPool(pool)}
            className="p-6 rounded-xl bg-white border border-slate-200 hover:border-slate-400 shadow-sm transition-all cursor-pointer flex flex-col justify-between space-y-5 group"
          >
            {/* Pool Header */}
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                    {pool.id}
                  </span>
                  <h4 className="text-lg font-bold text-slate-950 mt-2.5 group-hover:text-slate-700 transition-colors">
                    {pool.name}
                  </h4>
                  <p className="text-xs text-slate-600 flex items-center gap-1 mt-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-900" />
                    {pool.locationLabel} · <span className="font-mono text-xs text-slate-500 font-semibold">{pool.region}</span>
                  </p>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full bg-slate-100 text-slate-900 border border-slate-200 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {pool.status}
                </span>
              </div>

              {/* Hardware Capacity Specs */}
              <div className="grid grid-cols-2 gap-3 mt-4 text-xs font-mono bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 text-xs uppercase block font-semibold">Compute Cores</span>
                  <span className="font-bold text-slate-950">{pool.cpuCapacity} Cores</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs uppercase block font-semibold">Memory Buffer</span>
                  <span className="font-bold text-slate-950">{pool.memoryCapacity} GB</span>
                </div>
                <div className="mt-1">
                  <span className="text-slate-500 text-xs uppercase block font-semibold">PUE Factor</span>
                  <span className="font-bold text-slate-950">{pool.pue}</span>
                </div>
                <div className="mt-1">
                  <span className="text-slate-500 text-xs uppercase block font-semibold">Power Range</span>
                  <span className="font-bold text-slate-800">{pool.idlePowerKw} - {pool.maxPowerKw} kW</span>
                </div>
              </div>

              {/* Dynamic Utilization Bar */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-600 font-semibold">Current Load:</span>
                  <span className="font-bold text-slate-950">{pool.currentUtilization}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="bg-slate-950 h-full rounded-full transition-all duration-500"
                    style={{ width: `${pool.currentUtilization}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Environmental & Economic Telemetry */}
            <div className="pt-4 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  Grid Carbon Intensity:
                </span>
                <span className="font-mono font-bold text-slate-950">
                  {pool.carbonIntensity} <span className="text-xs text-slate-500 font-sans font-normal">gCO₂/kWh</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                  <DollarSign className="w-3.5 h-3.5 text-slate-900" />
                  Electricity Tariff:
                </span>
                <span className="font-mono font-bold text-slate-950">
                  ${pool.electricityPrice} <span className="text-xs text-slate-500 font-sans font-normal">/kWh</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                  <Server className="w-3.5 h-3.5 text-slate-900" />
                  Assigned Trace Tasks:
                </span>
                <span className="font-mono font-bold text-slate-950">
                  {pool.activeWorkloadsCount} Workloads
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Drawer for Selected Pool */}
      <Drawer
        isOpen={!!selectedPool}
        onClose={() => setSelectedPool(null)}
        title={selectedPool ? `${selectedPool.name} — ${selectedPool.locationLabel}` : ''}
      >
        {selectedPool && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-slate-950 font-bold">{selectedPool.region}</span>
                <h4 className="text-base font-bold text-slate-950 mt-0.5">{selectedPool.locationLabel} Resource Pool</h4>
              </div>
              <div className="text-right font-mono text-xs">
                <div className="text-slate-600 font-medium">PUE Factor</div>
                <div className="text-base font-bold text-slate-950">{selectedPool.pue}</div>
              </div>
            </div>

            {/* Capacity Overview */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">CPU Cores</div>
                <div className="text-base font-bold font-mono text-slate-950 mt-1">{selectedPool.cpuCapacity}</div>
              </div>
              <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">RAM (GB)</div>
                <div className="text-base font-bold font-mono text-slate-950 mt-1">{selectedPool.memoryCapacity}</div>
              </div>
              <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Power Range</div>
                <div className="text-xs font-bold font-mono text-slate-950 mt-1.5">{selectedPool.idlePowerKw}-{selectedPool.maxPowerKw} kW</div>
              </div>
            </div>

            {/* 24-Hour Carbon and Price Forecast Chart */}
            <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h5 className="text-xs font-bold text-slate-950">Dynamic Grid Signals (24-Hour Horizon)</h5>
                  <p className="text-[11px] text-slate-600">Simulated carbon intensity (gCO₂/kWh) & electricity tariff ($/kWh)</p>
                </div>
              </div>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyProfileData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="hour" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis yAxisId="left" stroke="#09090b" fontSize={10} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#09090b', borderRadius: '8px', fontSize: '11px' }} />
                    <Line yAxisId="left" type="monotone" dataKey="carbon" stroke="#09090b" strokeWidth={2} name="Carbon (gCO₂)" />
                    <Line yAxisId="right" type="monotone" dataKey="price" stroke="#64748b" strokeWidth={2} name="Price ($)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Mathematical Model Context */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="font-semibold text-slate-950">Energy & Facility Overhead Formulation:</div>
              <div className="p-2.5 rounded bg-white border border-slate-200 font-mono text-[11px] text-slate-950 font-medium">
                E_DC = (P_idle + (P_max - P_idle) × U) × duration × PUE
              </div>
              <p className="text-[11px]">
                For this pool, facility cooling and power distribution adds {Math.round((selectedPool.pue - 1) * 100)}% overhead onto IT equipment load.
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
