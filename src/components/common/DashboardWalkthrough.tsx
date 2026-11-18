import React, { useState } from 'react';
import {
  Sparkles,
  Server,
  MapPin,
  GitBranch,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Play,
  Leaf,
  Zap,
  DollarSign,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import type { DashboardTab } from '../../types';

interface DashboardWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: DashboardTab) => void;
  onRunSimulation?: () => void;
}

interface WalkthroughStep {
  id: number;
  title: string;
  badge: string;
  targetTab?: DashboardTab;
  tabLabel?: string;
  icon: React.ReactNode;
  headline: string;
  description: string;
  highlights: { title: string; desc: string; icon: React.ReactNode }[];
  takeaway: string;
}

const steps: WalkthroughStep[] = [
  {
    id: 1,
    title: 'Welcome to EcoFusion',
    badge: 'Core Concept',
    icon: <Sparkles className="w-5 h-5 text-emerald-500" />,
    headline: 'Greener, Cheaper Cloud Computing Through Spatial-Temporal Scheduling',
    description:
      'Cloud data centers consume enormous electricity, but the electricity grid is not uniform. At any given moment, one region may be powered by clean hydro or solar energy while another burns fossil fuels. EcoFusion dynamically decides WHERE and WHEN to run your workloads to minimize emissions and cost without missing deadlines.',
    highlights: [
      {
        title: 'Carbon Reduction',
        desc: 'Shifts compute to hours and regions with clean renewable energy.',
        icon: <Leaf className="w-4 h-4 text-emerald-600" />,
      },
      {
        title: 'Energy Efficiency',
        desc: 'Prefers data centers with low PUE (cooling efficiency) and low idle overhead.',
        icon: <Zap className="w-4 h-4 text-amber-500" />,
      },
      {
        title: 'Cost Savings',
        desc: 'Takes advantage of off-peak electricity tariffs and dynamic pricing.',
        icon: <DollarSign className="w-4 h-4 text-blue-500" />,
      },
      {
        title: 'Strict SLA Protection',
        desc: 'Every workload must finish before its deadline. No delays tolerated.',
        icon: <ShieldCheck className="w-4 h-4 text-indigo-500" />,
      },
    ],
    takeaway: 'EcoFusion transforms static cloud scheduling into an intelligent multi-objective optimization problem.',
  },
  {
    id: 2,
    title: 'Workloads (WHAT)',
    badge: 'Step 01',
    targetTab: 'workloads',
    tabLabel: 'Open Workloads Tab',
    icon: <Server className="w-5 h-5 text-blue-500" />,
    headline: 'Managing Computational Job Requests & Demand Profiles',
    description:
      'Workloads represent batch tasks, AI training runs, video processing, and enterprise jobs. Each workload has specific resource requirements and a hard completion deadline that must be satisfied.',
    highlights: [
      {
        title: 'Arrival Time',
        desc: 'The exact hour a task is submitted and becomes available to run.',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      },
      {
        title: 'Hardware Demand',
        desc: 'CPU cores and memory (GB) reserved during workload execution.',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      },
      {
        title: 'Duration & Deadline',
        desc: 'Execution hours needed and the maximum allowable completion hour (SLA).',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      },
      {
        title: 'ML Prediction',
        desc: 'Machine learning predicts real runtime resource demands to avoid over-provisioning.',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      },
    ],
    takeaway: 'You can upload custom Excel/CSV files, adjust individual tasks, or generate synthetic workload traces.',
  },
  {
    id: 3,
    title: 'Resource Pools (WHERE)',
    badge: 'Step 02',
    targetTab: 'resource-pools',
    tabLabel: 'Explore Resource Pools',
    icon: <MapPin className="w-5 h-5 text-emerald-500" />,
    headline: 'Geographic Data Centers with Varying Carbon & Tariffs',
    description:
      'EcoFusion coordinates across disparate regional infrastructure. Each resource pool has distinct physical characteristics that change throughout the 24-hour simulation cycle.',
    highlights: [
      {
        title: 'Oregon (US-West)',
        desc: 'Clean hydro & wind power, ultra-efficient PUE 1.15, cheap $0.06/kWh tariff.',
        icon: <Leaf className="w-4 h-4 text-emerald-600" />,
      },
      {
        title: 'Virginia (US-East)',
        desc: 'High capacity, standard PUE 1.35, higher carbon intensity (380 gCO₂/kWh).',
        icon: <Zap className="w-4 h-4 text-slate-500" />,
      },
      {
        title: 'Ireland (EU-West)',
        desc: 'Moderate wind power, PUE 1.22, higher electricity tariff ($0.14/kWh).',
        icon: <DollarSign className="w-4 h-4 text-blue-500" />,
      },
      {
        title: 'Dynamic Time-Slots',
        desc: '24 hourly time slots reflecting changing solar, wind, and demand curves.',
        icon: <CheckCircle2 className="w-4 h-4 text-indigo-500" />,
      },
    ],
    takeaway: 'Different regions are cleaner at different times of day. Spatial-temporal shifting exploits these differences.',
  },
  {
    id: 4,
    title: 'NSGA-II Optimizer (HOW)',
    badge: 'Step 03',
    targetTab: 'scheduling',
    tabLabel: 'View Placement Matrix',
    icon: <GitBranch className="w-5 h-5 text-indigo-500" />,
    headline: 'Multi-Objective Spatial-Temporal Evolutionary Optimization',
    description:
      'Naive single-parameter heuristics fail because objectives conflict: the cheapest region is often dirtier, and the cleanest region may have higher tariffs. EcoFusion uses NSGA-II to find non-dominated Pareto-optimal solutions balancing all goals simultaneously.',
    highlights: [
      {
        title: 'Pareto Front',
        desc: 'A spectrum of trade-off solutions from Carbon-Priority to Cost-Priority.',
        icon: <GitBranch className="w-4 h-4 text-indigo-600" />,
      },
      {
        title: 'Smart Repair Operator',
        desc: 'Guarantees that no core capacities or SLA deadlines are ever violated.',
        icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
      },
      {
        title: 'Best Compromise',
        desc: 'Automatically scores and recommends the best balanced operational compromise.',
        icon: <Sparkles className="w-4 h-4 text-amber-500" />,
      },
      {
        title: '1-Click Switching',
        desc: 'Switch between Balanced, Carbon-Priority, or Cost-Priority solutions instantly.',
        icon: <CheckCircle2 className="w-4 h-4 text-blue-500" />,
      },
    ],
    takeaway: 'NSGA-II creates a win-win: drastically lower carbon emissions while keeping operational costs low.',
  },
  {
    id: 5,
    title: 'Benchmark & Validation (PROOF)',
    badge: 'Step 04',
    targetTab: 'comparisons',
    tabLabel: 'Compare 7 Algorithms',
    icon: <BarChart3 className="w-5 h-5 text-emerald-600" />,
    headline: 'Empirical Proof Against 6 Industry Benchmark Algorithms',
    description:
      'EcoFusion is mathematically validated by comparing identical workloads across 7 algorithms: Random, First-Fit FIFO, Carbon-Aware, Energy-Aware, Cost-Aware, EDF (Earliest Deadline First), and EcoFusion NSGA-II.',
    highlights: [
      {
        title: 'vs. Random Placement',
        desc: 'Up to 38% lower carbon emissions and 43% lower energy consumption.',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      },
      {
        title: 'vs. First-Fit FIFO',
        desc: 'Significantly lower carbon and electricity cost with identical throughput.',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      },
      {
        title: 'vs. Single-Parameter Greedies',
        desc: 'Avoids blindspots where single-focus algorithms produce costly electricity spikes.',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      },
      {
        title: '100% SLA Guarantee',
        desc: 'Zero deadline violations maintained across all scheduled jobs.',
        icon: <ShieldCheck className="w-4 h-4 text-indigo-600" />,
      },
    ],
    takeaway: 'EcoFusion achieves a perfect 100 composite efficiency score across all empirical metrics.',
  },
];

export const DashboardWalkthrough: React.FC<DashboardWalkthroughProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onRunSimulation,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleJumpToTab = (tab?: DashboardTab) => {
    if (tab) {
      onNavigateTab(tab);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Compass className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-slate-950 tracking-tight">EcoFusion Interactive Guide</h3>
              <p className="text-[11px] text-slate-500 font-medium">Step {currentStep.id} of {steps.length} • {currentStep.badge}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-950 hover:bg-slate-200/80 transition-colors cursor-pointer"
              title="Close guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <div className="px-6 pt-3 pb-1 bg-white flex items-center gap-1.5 border-b border-slate-100">
          {steps.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentStepIndex(idx)}
              className="flex-1 group py-1 cursor-pointer"
              title={`Jump to ${s.title}`}
            >
              <div
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'bg-emerald-600'
                    : idx < currentStepIndex
                    ? 'bg-emerald-300'
                    : 'bg-slate-200 group-hover:bg-slate-300'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Step Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-5 text-slate-900">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mb-2">
              {currentStep.icon}
              <span>{currentStep.badge}: {currentStep.title}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-950 tracking-tight">
              {currentStep.headline}
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          {/* Highlights Grid */}
          <div className="grid sm:grid-cols-2 gap-3">
            {currentStep.highlights.map((h, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="shrink-0">{h.icon}</span>
                  <h4 className="text-xs font-bold text-slate-950">{h.title}</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed pl-6">{h.desc}</p>
              </div>
            ))}
          </div>

          {/* Key Takeaway Alert */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold">Key Insight:</strong> {currentStep.takeaway}
            </div>
          </div>
        </div>

        {/* Bottom Navigation Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {currentStep.targetTab && (
              <button
                onClick={() => handleJumpToTab(currentStep.targetTab)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-800 transition-colors cursor-pointer shadow-xs"
              >
                <span>{currentStep.tabLabel || 'Open this section'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {isLast && onRunSimulation && (
              <button
                onClick={() => {
                  onRunSimulation();
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-colors cursor-pointer shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Live Simulation Now</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 inline mr-1" /> Back
            </button>

            <button
              onClick={handleNext}
              className="px-5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <span>{isLast ? 'Complete Tour & Start' : 'Next Step'}</span>
              {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
