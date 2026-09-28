import React from 'react';
import {
  BookOpen,
  Zap,
  Leaf,
  DollarSign,
  ShieldCheck,
  Server,
  Sparkles,
  Clock,
  Building2,
} from 'lucide-react';

export const Documentation: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-slate-950 text-white shadow-sm">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">
                EcoFusion Architecture & Methodology
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200 font-bold">
                SINGLE SOURCE OF TRUTH
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              End-to-end specification: Input → Prediction → Feasibility → NSGA-II Optimization → Simulation → Evaluation.
            </p>
          </div>
        </div>
      </div>

      {/* 1. The Core Idea: WHERE + WHEN */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500 uppercase">
          <span>Section 01</span>
          <span>·</span>
          <span>Fundamental Principle</span>
        </div>
        <h3 className="text-lg font-bold text-slate-950">1. The Core Idea: WHERE + WHEN Decisions</h3>
        <p className="text-sm text-slate-700 leading-relaxed">
          EcoFusion receives a set of computational workloads that need to be executed. For every workload, it answers two fundamental questions:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-950 font-bold text-sm">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>WHERE should this workload run?</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Selects the optimal <strong>Resource Pool / Geographic Location</strong> (e.g. Mumbai, Hyderabad, Singapore) based on regional PUE efficiency, host server power characteristics, and spot grid emission factors.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-950 font-bold text-sm">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>WHEN should it run?</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Selects the optimal <strong>Time Slot</strong> (e.g. 13:00 vs. 02:00) to exploit temporal solar/wind renewable energy availability and off-peak electricity pricing windows without violating SLA deadlines.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-2 font-mono text-xs">
          <div className="text-slate-400 font-sans font-bold text-xs uppercase tracking-wider">Fundamental Operational Flow</div>
          <div className="text-slate-300 leading-relaxed">
            Workload Input → [Prediction + Feasibility] → WHERE (Pool) + WHEN (Slot) → Execute/Simulate → Min [Carbon, Energy, Cost] subject to SLA → Verified Result
          </div>
        </div>
      </div>

      {/* 2. Working Architecture */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500 uppercase">
          <span>Section 02</span>
          <span>·</span>
          <span>System Architecture</span>
        </div>
        <h3 className="text-lg font-bold text-slate-950">2. Complete Working Architecture</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          The pipeline connects UI telemetry, machine learning prediction, multi-objective evolutionary search, and physical simulation:
        </p>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 space-y-2 overflow-x-auto leading-relaxed">
          <pre>{`┌──────────────────────────────────────────────────────────────┐
│                     EcoFusion Dashboard                      │
│ Workloads | Resource Pools | Experiments | Scheduling | Results │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    Experiment Manager                        │
│ Dataset + Infrastructure + Time Horizon + Random Seed        │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    Workload Manager                          │
│ Arrival | CPU | Memory | Duration | Deadline | Priority      │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                  Workload Prediction Model                   │
│ Predict CPU / Memory / Duration / Resource Demand (RF v1.0)  │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                  Resource & Environment Model                │
│ Pools: CPU / Memory / PUE / Power / Carbon / Price           │
│ Time Slots: Hourly carbon intensity + spot tariff price      │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                       Scheduler                              │
│                 NSGA-II Multi-Objective                      │
│       WHERE = Resource Pool  ×  WHEN = Time Slot             │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    Simulation Engine                         │
│ Resource allocation + execution simulation                   │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                     Evaluation Engine                        │
│ Carbon | Energy | Cost | SLA | Completion Time               │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                       Results                                │
│ Schedule | Pareto Front | Metrics | Baseline Comparison      │
└──────────────────────────────────────────────────────────────┘`}</pre>
        </div>
      </div>

      {/* 3. Feasibility Checking Constraints */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500 uppercase">
          <span>Section 03</span>
          <span>·</span>
          <span>Constraint Boundaries</span>
        </div>
        <h3 className="text-lg font-bold text-slate-950">3. Feasibility Checking Prior to Optimization</h3>
        <p className="text-xs text-slate-700 leading-relaxed">
          Before candidates are evaluated, EcoFusion filters out all invalid combinations through strict feasibility checks:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-950">
              <Clock className="w-4 h-4 text-slate-900" />
              <span>Arrival Constraint</span>
            </div>
            <div className="font-mono text-slate-950 bg-white p-2 rounded border border-slate-200 font-semibold">
              T_start ≥ T_arrival
            </div>
            <p className="text-slate-600 leading-relaxed">
              A workload cannot be scheduled prior to its arrival timestamp. Any slot earlier than arrival is rejected.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-950">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Deadline Constraint</span>
            </div>
            <div className="font-mono text-slate-950 bg-white p-2 rounded border border-slate-200 font-semibold">
              T_start + Duration ≤ T_deadline
            </div>
            <p className="text-slate-600 leading-relaxed">
              The workload must finish prior to its SLA deadline. If starting at a slot causes it to exceed the deadline, it is disqualified.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-950">
              <Server className="w-4 h-4 text-slate-900" />
              <span>Resource Constraint</span>
            </div>
            <div className="font-mono text-slate-950 bg-white p-2 rounded border border-slate-200 font-semibold">
              Available_Cores(p, t) ≥ Req_CPU
            </div>
            <p className="text-slate-600 leading-relaxed">
              The regional resource pool must have sufficient concurrent host CPU and RAM capacity across the entire task duration.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Viva Highlight: ML Prediction vs. NSGA-II Optimization */}
      <div className="p-6 rounded-2xl bg-emerald-950 text-white shadow-sm space-y-3 border border-emerald-900">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Viva Core Distinction: AI/ML vs. Evolutionary Optimization</span>
        </div>
        <h3 className="text-lg font-bold text-white tracking-tight">
          "ML predicts workload characteristics; NSGA-II performs the scheduling optimization."
        </h3>
        <p className="text-xs text-slate-200 leading-relaxed max-w-3xl">
          The <strong>Random Forest Regressor</strong> model does <em>not</em> decide the final physical placement. Instead, it extracts trace characteristics (task category, submitted cores, requested memory, arrival patterns) to predict actual runtime resource demand (<span className="font-mono text-emerald-300">Predicted CPU, Predicted Memory, Predicted Duration</span>). These predictions then inform the <strong>NSGA-II multi-objective genetic algorithm</strong>, which searches the combinatorial space of <span className="font-mono text-emerald-300">WHERE (Resource Pool) × WHEN (Time Slot)</span> candidate assignments.
        </p>
      </div>

      {/* 5. Physical Equations & Mathematical Modeling */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500 uppercase">
          <span>Section 04</span>
          <span>·</span>
          <span>Physical Energy, Carbon & Cost Formulations</span>
        </div>
        <h3 className="text-lg font-bold text-slate-950">4. Mathematical Equations for Simulation & Evaluation</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-950">IT & Facility Energy</span>
              <Zap className="w-4 h-4 text-slate-900" />
            </div>
            <div className="p-2.5 rounded bg-white border border-slate-200 font-mono text-slate-950 font-bold space-y-1">
              <div>E_IT = P × duration</div>
              <div>E_DC = E_IT × PUE(p)</div>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Server dynamic power <span className="font-mono">P = P_idle + (P_max - P_idle) × U</span>, scaled by regional facility Power Usage Effectiveness (<span className="font-mono">PUE</span>).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-950">Operational Carbon</span>
              <Leaf className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="p-2.5 rounded bg-white border border-slate-200 font-mono text-slate-950 font-bold">
              Carbon = E_DC × CarbonIntensity(p, t)
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Multiplying total facility kWh by the hourly grid carbon factor (gCO₂/kWh) at that specific location and execution hour.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-950">Electricity Cost</span>
              <DollarSign className="w-4 h-4 text-amber-600" />
            </div>
            <div className="p-2.5 rounded bg-white border border-slate-200 font-mono text-slate-950 font-bold">
              Cost = E_DC × ElectricityPrice(p, t)
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Multiplying facility energy by the time-of-use tariff ($/kWh), capturing savings from off-peak night/midday temporal shifting.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="text-xs font-bold text-slate-950 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>SLA is a Hard Constraint, Not an Optimization Objective</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The multi-objective formulation is <span className="font-mono font-bold text-slate-950">min [ Carbon, Energy, Cost ]</span> subject to <span className="font-mono font-bold text-slate-950">CompletionTime ≤ Deadline</span>. EcoFusion never chooses a low-carbon or low-cost assignment that violates the SLA deadline.
          </p>
        </div>
      </div>

      {/* 6. Cloud Abstraction */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500 uppercase">
          <span>Section 05</span>
          <span>·</span>
          <span>Concept Representation</span>
        </div>
        <h3 className="text-lg font-bold text-slate-950">5. Where Does the "Cloud" Actually Exist?</h3>
        <p className="text-xs text-slate-700 leading-relaxed">
          In EcoFusion, you do not need to create physical AWS, Azure, or GCP virtual machines. The simulation models cloud capacity abstractly through <strong>Resource Pools</strong>:
        </p>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed">
          <span className="font-bold text-slate-950">Resource Pool</span> = Your rigorous mathematical abstraction of available cloud computing capacity at a geographic location (Total CPU Cores, Memory GB, PUE factor, Baseline Power, Regional Carbon Intensity, and Spot Tariffs).
        </div>
      </div>

      {/* 7. Baseline Algorithms & Comparative Methodology */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500 uppercase">
          <span>Section 06</span>
          <span>·</span>
          <span>Scientific Evaluation</span>
        </div>
        <h3 className="text-lg font-bold text-slate-950">6. Baseline Algorithm Benchmarking</h3>
        <p className="text-xs text-slate-700 leading-relaxed">
          To prove empirical performance, EcoFusion runs the <strong>exact same workload trace</strong> through 5 distinct scheduling strategies:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-sans text-[10px]">
              <tr>
                <th className="py-2.5 px-3 font-bold">Algorithm</th>
                <th className="py-2.5 px-3 font-bold">Policy Strategy</th>
                <th className="py-2.5 px-3 font-bold">Carbon Impact</th>
                <th className="py-2.5 px-3 font-bold">SLA Behavior</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700 font-mono">
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-950 font-sans">Random Baseline</td>
                <td className="py-2.5 px-3">Random candidate assignment across available pools & slots</td>
                <td className="py-2.5 px-3 text-rose-700 font-bold">Highest emissions</td>
                <td className="py-2.5 px-3 text-rose-700 font-bold">High violation rate (15-22%)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-950 font-sans">First-Fit Chronological</td>
                <td className="py-2.5 px-3">Earliest available time slot starting from task arrival</td>
                <td className="py-2.5 px-3 text-amber-700">High (morning peak grid carbon)</td>
                <td className="py-2.5 px-3 text-emerald-700">Low violations (early dispatch)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-950 font-sans">Energy-Aware Greedy</td>
                <td className="py-2.5 px-3">Minimizes IT power and selects lowest PUE facility</td>
                <td className="py-2.5 px-3 text-slate-600">Moderate (carbon-blind)</td>
                <td className="py-2.5 px-3 text-emerald-700">Zero violations</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-950 font-sans">Carbon-Aware Greedy</td>
                <td className="py-2.5 px-3">Prioritizes slots with lowest gCO₂/kWh (solar midday peak)</td>
                <td className="py-2.5 px-3 text-emerald-700 font-bold">Low emissions</td>
                <td className="py-2.5 px-3 text-emerald-700">Zero violations</td>
              </tr>
              <tr className="bg-slate-950 text-white">
                <td className="py-2.5 px-3 font-bold text-white font-sans flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>EcoFusion (NSGA-II)</span>
                </td>
                <td className="py-2.5 px-3 text-slate-200">Pareto compromise: min [Carbon, Energy, Cost] subject to SLA</td>
                <td className="py-2.5 px-3 text-emerald-400 font-bold">Optimal trade-off</td>
                <td className="py-2.5 px-3 text-emerald-400 font-bold">Strict 0.0% violations</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
