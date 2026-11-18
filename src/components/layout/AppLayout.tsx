import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DashboardWalkthrough } from '../common/DashboardWalkthrough';
import { simulatorService, type SimulationProgress } from '../../services/simulatorService';
import type { DashboardTab, SimulationResult } from '../../types';
import { ArrowLeft, ArrowRight, Play, RefreshCw, CheckCircle2, Sparkles, Cpu } from 'lucide-react';

interface AppLayoutProps {
  onNavigateLanding?: () => void;
  activeTab?: DashboardTab;
  onTabChange?: (tab: DashboardTab) => void;
  children: (props: {
    activeTab: DashboardTab;
    setActiveTab: (tab: DashboardTab) => void;
    latestResult: SimulationResult | null;
    triggerSimulation: (customOverrides?: Partial<any>) => Promise<SimulationResult | null>;
    isSimulating: boolean;
    openWalkthrough: () => void;
  }) => React.ReactNode;
}

const STEP_SEQUENCE: { id: DashboardTab; label: string }[] = [
  { id: 'overview', label: 'Dashboard' },
  { id: 'workloads', label: 'Workloads' },
  { id: 'resource-pools', label: 'Resource Pools' },
  { id: 'simulation-setup', label: 'Simulation Setup' },
  { id: 'scheduling', label: 'Run Scheduler' },
  { id: 'results', label: 'Results' },
  { id: 'comparisons', label: 'Compare' },
];

export const AppLayout: React.FC<AppLayoutProps> = ({ onNavigateLanding, activeTab: controlledTab, onTabChange, children }) => {
  const [internalTab, setInternalTab] = useState<DashboardTab>('overview');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);
  const [latestResult, setLatestResult] = useState<SimulationResult | null>(() => simulatorService.getLatestResult());
  const [workloadCount, setWorkloadCount] = useState<number>(() => simulatorService.getWorkloads().length);
  const [simProgress, setSimProgress] = useState<SimulationProgress>(() => simulatorService.getSimulationProgress());

  React.useEffect(
    () =>
      simulatorService.subscribe(() => {
        setLatestResult(simulatorService.getLatestResult());
        setWorkloadCount(simulatorService.getWorkloads().length);
        setSimProgress({ ...simulatorService.getSimulationProgress() });
      }),
    []
  );

  const activeTab = controlledTab || internalTab;
  const setActiveTab = (tab: DashboardTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRunSimulation = async (customOverrides?: Partial<any>): Promise<SimulationResult | null> => {
    setIsSimulating(true);
    try {
      const setup = simulatorService.getSimulationSetupConfig();
      const simConfig = simulatorService.getSimulationConfig();
      const currentWorkloadCount = simulatorService.getWorkloads().length;
      const res = await simulatorService.runAsyncSimulation({
        ...simConfig,
        numWorkloads: customOverrides?.numWorkloads ?? (currentWorkloadCount > 0 ? currentWorkloadCount : undefined),
        algorithm: customOverrides?.algorithm ?? setup.algorithm,
        randomSeed: customOverrides?.randomSeed ?? setup.randomSeed,
        ...(customOverrides || {}),
      });
      setLatestResult(res);
      return res;
    } catch {
      return null;
    } finally {
      setIsSimulating(false);
    }
  };

  const currentStepIdx = STEP_SEQUENCE.findIndex((s) => s.id === activeTab);
  const prevStep = currentStepIdx > 0 ? STEP_SEQUENCE[currentStepIdx - 1] : null;
  const nextStep = currentStepIdx >= 0 && currentStepIdx < STEP_SEQUENCE.length - 1 ? STEP_SEQUENCE[currentStepIdx + 1] : null;
  const hasSimulationResult = Boolean(latestResult && latestResult.totalWorkloads > 0);
  const isAtSchedulerWithoutResult = activeTab === 'scheduling' && !hasSimulationResult;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onNavigateLanding={onNavigateLanding} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header
          activeTab={activeTab}
          onRunSimulation={handleRunSimulation}
          isSimulating={isSimulating}
          onNavigateLanding={onNavigateLanding}
          onNavigateTab={setActiveTab}
          onOpenWalkthrough={() => setIsWalkthroughOpen(true)}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto flex flex-col">
          <div className="max-w-[1400px] w-full mx-auto flex-1 flex flex-col justify-between space-y-8">
            <div>
              {children({
                activeTab,
                setActiveTab,
                latestResult,
                triggerSimulation: handleRunSimulation,
                isSimulating,
                openWalkthrough: () => setIsWalkthroughOpen(true),
              })}
            </div>

            {/* Bottom Step-by-Step Navigation Bar */}
            {currentStepIdx !== -1 && (
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 md:px-6 rounded-2xl border shadow-xs">
                <div className="flex items-center gap-3">
                  {prevStep ? (
                    <button
                      onClick={() => setActiveTab(prevStep.id)}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back: {prevStep.label}</span>
                    </button>
                  ) : (
                    <div className="text-xs font-mono text-slate-500 font-semibold">
                      Step 1 of {STEP_SEQUENCE.length} • Start Here
                    </div>
                  )}

                  {prevStep && (
                    <span className="hidden md:inline text-xs font-mono text-slate-400">
                      Step {currentStepIdx + 1} of {STEP_SEQUENCE.length} • {STEP_SEQUENCE[currentStepIdx].label}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3">
                  {isAtSchedulerWithoutResult ? (
                    workloadCount > 0 ? (
                      <button
                        onClick={() => handleRunSimulation()}
                        disabled={isSimulating}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                      >
                        {isSimulating ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Running Simulation…</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-current" />
                            <span>Run Simulation ({workloadCount} Workloads)</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveTab('workloads')}
                        className="px-6 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                      >
                        <span>Load Workloads First</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )
                  ) : nextStep ? (
                    <button
                      onClick={() => setActiveTab(nextStep.id)}
                      className="px-6 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveTab('overview')}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <span>Back to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <DashboardWalkthrough
        isOpen={isWalkthroughOpen}
        onClose={() => setIsWalkthroughOpen(false)}
        onNavigateTab={setActiveTab}
        onRunSimulation={handleRunSimulation}
      />

      {/* Live Multi-Algorithm & NSGA-II Evolution Execution Progress Overlay */}
      {(isSimulating || simProgress.isRunning) && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 md:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 text-emerald-400 flex items-center justify-center shrink-0 shadow-md">
                  <Cpu className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Executing on {simProgress.workloadCount || workloadCount} Workloads
                    </span>
                    {simProgress.generation > 0 && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-emerald-400">
                        Gen {simProgress.generation} / {simProgress.totalGenerations}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-extrabold text-slate-950 mt-1">
                    {simProgress.stageTitle || 'Executing Multi-Algorithm Benchmark Suite'}
                  </h3>
                </div>
              </div>
              <span className="text-lg font-mono font-black text-emerald-600">
                {simProgress.percent}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-slate-950 via-emerald-700 to-emerald-500 rounded-full transition-all duration-200"
                  style={{ width: `${Math.max(5, simProgress.percent)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-600">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  {simProgress.currentAlgorithm}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                {simProgress.detailLog}
              </p>
            </div>

            {/* Completed Algorithms Checklist */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Model Execution Pipeline (Same Dataset)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                {[
                  'Random Placement Baseline',
                  'First-Fit Chronological (FIFO)',
                  'Carbon-Aware Greedy (Single-Param)',
                  'Energy-Aware Greedy (PUE-Only)',
                  'Cost-Aware Greedy (Tariff-Only)',
                  'Earliest Deadline First (SLA-Only)',
                  'EcoFusion NSGA-II (Multi-Objective)',
                ].map((name) => {
                  const isDone = simProgress.completedAlgorithms.includes(name);
                  const isCurrent = simProgress.currentAlgorithm.includes(name.split(' ')[0]);
                  return (
                    <div
                      key={name}
                      className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 font-medium transition-colors ${
                        isDone
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : isCurrent
                          ? 'bg-slate-950 text-white border-slate-950'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : isCurrent ? (
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                      )}
                      <span className="truncate">{name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

