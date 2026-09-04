import React from 'react';
import { MetricCard } from '../components/common/MetricCard';
import { ChartCard } from '../components/common/ChartCard';
import { demoTimeSlots } from '../data/mockData';
import {
  Leaf,
  Zap,
  DollarSign,
  Gauge,
  Sun,
  Activity,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from 'recharts';

export const CarbonEnergy: React.FC = () => {
  // Demo charts data
  const energyByDcData = [
    { name: 'DC1 (US East)', energyKwh: 1450, pue: 1.22, color: '#06b6d4' },
    { name: 'DC2 (EU Central)', energyKwh: 980, pue: 1.15, color: '#10b981' },
    { name: 'DC3 (AP South)', energyKwh: 1220, pue: 1.35, color: '#f59e0b' },
  ];

  const carbonByDcData = [
    { name: 'DC1 (US East)', carbonKg: 558, intensity: 385, color: '#06b6d4' },
    { name: 'DC2 (EU Central)', carbonKg: 186, intensity: 190, color: '#10b981' },
    { name: 'DC3 (AP South)', carbonKg: 756, intensity: 620, color: '#f59e0b' },
  ];

  const costBySlotData = demoTimeSlots.map((ts) => ({
    time: ts.startTime,
    costUsd: Number((ts.electricityPrice * 180).toFixed(2)),
    renewableRatio: ts.renewableRatio,
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Sustainability Analytics & Grid Profiles</h3>
            <p className="text-xs text-slate-400">
              Spatial-temporal grid emission forecasts, energy consumption profiles, and operational electricity costs
            </p>
          </div>
        </div>

        <span className="px-3 py-1 text-xs font-mono rounded-full bg-slate-900 text-amber-400 border border-amber-800/60">
          DEMO DATA ONLY — Real grid feed planned Week 4
        </span>
      </div>

      {/* Sustainability Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Carbon Footprint"
          value="980.4"
          unit="kgCO₂"
          icon={<Leaf className="w-5 h-5 text-emerald-400" />}
          accentColor="emerald"
        />
        <MetricCard
          title="Energy Consumption"
          value="3,410"
          unit="kWh"
          icon={<Zap className="w-5 h-5 text-amber-400" />}
          accentColor="amber"
        />
        <MetricCard
          title="Electricity Cost"
          value="$462.10"
          unit="USD"
          icon={<DollarSign className="w-5 h-5 text-cyan-400" />}
          accentColor="cyan"
        />
        <MetricCard
          title="Avg Carbon Intensity"
          value="287.5"
          unit="gCO₂/kWh"
          icon={<Activity className="w-5 h-5 text-emerald-400" />}
          accentColor="emerald"
        />
        <MetricCard
          title="Average PUE"
          value="1.24"
          icon={<Gauge className="w-5 h-5 text-violet-400" />}
          accentColor="violet"
        />
        <MetricCard
          title="Renewable Share"
          value="64.2%"
          unit="estimated"
          icon={<Sun className="w-5 h-5 text-amber-400" />}
          subtitle="Solar/Wind availability"
          accentColor="amber"
        />
      </div>

      {/* Row 2 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carbon Intensity per Time Slot */}
        <ChartCard
          title="Grid Carbon Intensity Forecast by Time Slot"
          subtitle="Fluctuation in gCO₂ per kWh across 24h simulation horizon"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={demoTimeSlots} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="startTime" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="carbonIntensity"
                name="gCO₂/kWh"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Electricity Cost per Time Slot */}
        <ChartCard
          title="Estimated Electricity Cost & Renewable Availability"
          subtitle="Hourly pricing fluctuations and renewable energy share ratio"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={costBySlotData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="costUsd"
                name="Hourly Cost ($)"
                stroke="#06b6d4"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="renewableRatio"
                name="Renewable Share %"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Energy Consumption by DC */}
        <ChartCard
          title="Energy Consumption Breakdown by Data Center"
          subtitle="IT workload power scaled by facility PUE factor"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={energyByDcData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip />
              <Bar dataKey="energyKwh" name="Energy (kWh)" radius={[6, 6, 0, 0]}>
                {energyByDcData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Carbon Emissions by DC */}
        <ChartCard
          title="Carbon Emissions Impact by Data Center"
          subtitle="Total kgCO₂ output per facility region"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={carbonByDcData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip />
              <Bar dataKey="carbonKg" name="Carbon (kgCO₂)" radius={[6, 6, 0, 0]}>
                {carbonByDcData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};
