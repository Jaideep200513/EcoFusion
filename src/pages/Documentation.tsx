import React from 'react';
import {
  BookOpen,
  Zap,
  Leaf,
  DollarSign,
  ShieldCheck,
  Server,
  Layers,
} from 'lucide-react';

export const Documentation: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-slate-950 text-white shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-950 tracking-tight">
              Research Methodology & Mathematical Formulation
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Formal problem specification, objective functions, power modeling, and constraint boundaries for EcoFusion.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Problem Formulation Overview */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-900" />
          <span>1. Problem Statement: Spatial-Temporal Optimization</span>
        </h3>
        <p className="text-xs text-slate-700 leading-relaxed">
          Given a set of batch computational workloads <span className="font-mono font-bold text-slate-950">W = &#123;w₁, w₂, ..., wₙ&#125;</span> arriving over a discrete simulation horizon <span className="font-mono font-bold text-slate-950">T</span>, and a set of geographically distributed resource pools <span className="font-mono font-bold text-slate-950">P = &#123;p₁, p₂, ..., pₘ&#125;</span>, the objective of EcoFusion is to find an optimal assignment vector <span className="font-mono font-bold text-slate-950">(pool_id, start_slot)</span> for each workload to simultaneously minimize carbon emissions, total facility energy, and electricity costs without violating SLA deadlines.
        </p>
      </div>

      {/* 2. Mathematical Equations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formula 1: IT Equipment Energy */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-slate-950 font-bold uppercase text-[10px] tracking-wider">Formula 01</span>
            <Zap className="w-4 h-4 text-slate-900" />
          </div>
          <h4 className="text-sm font-bold text-slate-950">IT Server Power & Energy (E_IT)</h4>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-950 font-semibold">
            E_IT = [P_idle + (P_max - P_idle) × U(w, p)] × d(w)
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Where <strong className="text-slate-950 font-mono">P_idle</strong> is server baseline idle draw (kW), <strong className="text-slate-950 font-mono">P_max</strong> is server peak power (kW), <strong className="text-slate-950 font-mono">U(w, p)</strong> is the CPU utilization fraction demanded by task <strong className="text-slate-950 font-mono">w</strong> relative to pool capacity, and <strong className="text-slate-950 font-mono">d(w)</strong> is duration in hours.
          </p>
        </div>

        {/* Formula 2: Total Facility Energy */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-slate-950 font-bold uppercase text-[10px] tracking-wider">Formula 02</span>
            <Server className="w-4 h-4 text-slate-900" />
          </div>
          <h4 className="text-sm font-bold text-slate-950">Data Center Facility Total Energy (E_DC)</h4>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-950 font-semibold">
            E_DC = E_IT × PUE(p)
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Where <strong className="text-slate-950 font-mono">PUE(p)</strong> is the Power Usage Effectiveness of resource pool <strong className="text-slate-950 font-mono">p</strong>. Facility energy accounts for chillers, CRAH cooling overhead, UPS conversion losses, and auxiliary power distribution.
          </p>
        </div>

        {/* Formula 3: Operational Carbon Emissions */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-slate-950 font-bold uppercase text-[10px] tracking-wider">Formula 03</span>
            <Leaf className="w-4 h-4 text-emerald-600" />
          </div>
          <h4 className="text-sm font-bold text-slate-950">Operational Carbon Footprint (gCO₂)</h4>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-950 font-semibold">
            Carbon = ∑ [ E_DC(w, p) × I_carbon(t, p) ]
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Where <strong className="text-slate-950 font-mono">I_carbon(t, p)</strong> represents the marginal/average grid emission intensity (gCO₂/kWh) at hourly time slot <strong className="text-slate-950 font-mono">t</strong> in pool location <strong className="text-slate-950 font-mono">p</strong> (e.g. Mumbai solar dip vs. Singapore CCGT).
          </p>
        </div>

        {/* Formula 4: Operational Electricity Cost */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-slate-950 font-bold uppercase text-[10px] tracking-wider">Formula 04</span>
            <DollarSign className="w-4 h-4 text-slate-900" />
          </div>
          <h4 className="text-sm font-bold text-slate-950">Electricity Cost & Tariffs ($)</h4>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-950 font-semibold">
            Cost = ∑ [ E_DC(w, p) × Price(t, p) ]
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Where <strong className="text-slate-950 font-mono">Price(t, p)</strong> is the dynamic spot or time-of-use electricity tariff ($/kWh) for time slot <strong className="text-slate-950 font-mono">t</strong> in region <strong className="text-slate-950 font-mono">p</strong>.
          </p>
        </div>
      </div>

      {/* 3. Feasibility & SLA Constraints */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-900" />
          <span>2. Feasibility & SLA Constraints</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-slate-950">Constraint A: SLA Deadline Enforcement</div>
            <div className="font-mono text-slate-950 font-semibold bg-white p-2.5 rounded border border-slate-200">
              t_start ≥ t_arrival(w)  AND  t_start + duration(w) ≤ t_deadline(w)
            </div>
            <p className="text-slate-600 leading-relaxed">
              A task cannot begin before its submission arrival time, and execution must complete strictly prior to its declared completion deadline. Any candidate violating this condition is marked non-feasible.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-slate-950">Constraint B: Resource Capacity Bounds</div>
            <div className="font-mono text-slate-950 font-semibold bg-white p-2.5 rounded border border-slate-200">
              ∑ CPU_req(w, t) ≤ Cap_CPU(p)  AND  ∑ RAM_req(w, t) ≤ Cap_RAM(p)
            </div>
            <p className="text-slate-600 leading-relaxed">
              At any given time slot <span className="font-mono">t</span>, the cumulative CPU and memory allocated across all active concurrent workloads in regional pool <span className="font-mono">p</span> cannot exceed its physical host capacity.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Multi-Objective Optimization Formulation */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-950">3. Multi-Objective Evolutionary Engine (NSGA-II)</h3>
        <p className="text-xs text-slate-700 leading-relaxed">
          Instead of condensing carbon, energy, and cost into a single scalar weight (which obscures trade-offs and fails on non-convex Pareto geometries), EcoFusion employs the Non-Dominated Sorting Genetic Algorithm II (NSGA-II):
        </p>

        <ul className="space-y-2 text-xs text-slate-600 list-disc pl-5">
          <li>
            <strong className="text-slate-950">Non-Dominated Sorting:</strong> Chromosomes (schedules) are stratified into dominance fronts F₁, F₂, ... where a schedule X dominates Y if it is strictly superior in at least one objective and no worse in all others.
          </li>
          <li>
            <strong className="text-slate-950">Crowding Distance Density Estimation:</strong> Preserves population diversity along the trade-off curve, preventing premature convergence to extreme corner solutions.
          </li>
          <li>
            <strong className="text-slate-950">Feasibility Preservation:</strong> Infeasible chromosomes with SLA deadline violations are heavily penalized, prioritizing viable schedules in elitist selection.
          </li>
        </ul>
      </div>
    </div>
  );
};
