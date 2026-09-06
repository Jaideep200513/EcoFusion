import React, { useState } from 'react';
import { Cpu, Activity, Sliders, Server, ShieldCheck } from 'lucide-react';

export interface AccordionGalleryItem {
  image: string;
  label: string;
  link?: string;
  badge?: string;
  title?: string;
  description?: string;
  color?: 'cyan' | 'amber' | 'indigo' | 'emerald' | 'purple';
}

export interface AccordionGalleryProps {
  items: AccordionGalleryItem[];
  defaultIndex?: number;
  expandRatio?: number;
  trigger?: 'hover' | 'click';
  className?: string;
}

export const AccordionGallery: React.FC<AccordionGalleryProps> = ({
  items,
  defaultIndex = 0,
  expandRatio = 0.66,
  trigger = 'hover',
  className = '',
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(
    defaultIndex >= 0 && defaultIndex < items.length ? defaultIndex : 0
  );
  const [selectedSampleWl, setSelectedSampleWl] = useState<number>(0);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  // Mock workload telemetry profiles
  const sampleWorkloads = [
    {
      id: 'W1',
      tag: 'W1: LLM Fine-Tuning',
      name: 'LLM Fine-Tuning Batch',
      cpu: 64,
      memory: 256,
      duration: 3,
      arrival: '08:00',
      deadline: '16:00',
      selectedPool: 'POOL-BOM (Mumbai)',
      selectedSlot: 'Slot 03 (11:00 - 14:00)',
      decisionRationale: 'Shifted +3h to capture midday solar generation peak in AP-South-1 grid.',
      carbonReduction: '28.6%',
      energyEfficiency: '14.2%',
      operationalCost: '-18.1%',
      slaMargin: '+2.0 hrs slack',
    },
    {
      id: 'W3',
      tag: 'W3: Video Transcoding',
      name: 'Video Transcoding Pipeline',
      cpu: 48,
      memory: 128,
      duration: 2,
      arrival: '09:00',
      deadline: '15:00',
      selectedPool: 'POOL-HYD (Hyderabad)',
      selectedSlot: 'Slot 02 (10:00 - 12:00)',
      decisionRationale: 'Routed to Hyderabad for optimal PUE (1.22) and early completion before peak thermal load.',
      carbonReduction: '21.4%',
      energyEfficiency: '11.8%',
      operationalCost: '-12.5%',
      slaMargin: '+4.0 hrs slack',
    },
    {
      id: 'W5',
      tag: 'W5: Earth Observation',
      name: 'Earth Observation Analysis',
      cpu: 128,
      memory: 512,
      duration: 4,
      arrival: '07:30',
      deadline: '19:00',
      selectedPool: 'POOL-SIN (Singapore)',
      selectedSlot: 'Slot 04 (13:00 - 17:00)',
      decisionRationale: 'Dispatched to Singapore gas-fired CCGT pool with low marginal PUE (1.18) during high solar tariff.',
      carbonReduction: '24.1%',
      energyEfficiency: '16.5%',
      operationalCost: '-9.4%',
      slaMargin: '+2.0 hrs slack',
    },
  ];

  const handleInteraction = (index: number) => {
    setActiveIndex(index);
  };

  const handleImageError = (index: number) => {
    setImgErrors((prev) => ({ ...prev, [index]: true }));
  };

  const count = items.length;
  const inactiveRatio = count > 1 ? (1 - expandRatio) / (count - 1) : 1;

  const getStepIcon = (index: number) => {
    switch (index % 5) {
      case 0:
        return <Cpu className="w-5 h-5 text-cyan-400" />;
      case 1:
        return <Activity className="w-5 h-5 text-amber-400" />;
      case 2:
        return <Sliders className="w-5 h-5 text-indigo-400" />;
      case 3:
        return <Server className="w-5 h-5 text-emerald-400" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-purple-400" />;
    }
  };

  const getStepColorClasses = (index: number, isActive: boolean) => {
    switch (index % 5) {
      case 0:
        return isActive
          ? 'border-cyan-500/50 bg-cyan-950/20 text-cyan-400 shadow-2xl shadow-cyan-500/10'
          : 'border-white/[0.08] hover:border-cyan-500/40 text-slate-400';
      case 1:
        return isActive
          ? 'border-amber-500/50 bg-amber-950/20 text-amber-400 shadow-2xl shadow-amber-500/10'
          : 'border-white/[0.08] hover:border-amber-500/40 text-slate-400';
      case 2:
        return isActive
          ? 'border-indigo-500/50 bg-indigo-950/20 text-indigo-400 shadow-2xl shadow-indigo-500/10'
          : 'border-white/[0.08] hover:border-indigo-500/40 text-slate-400';
      case 3:
        return isActive
          ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-400 shadow-2xl shadow-emerald-500/10'
          : 'border-white/[0.08] hover:border-emerald-500/40 text-slate-400';
      default:
        return isActive
          ? 'border-purple-500/50 bg-purple-950/20 text-purple-400 shadow-2xl shadow-purple-500/10'
          : 'border-white/[0.08] hover:border-purple-500/40 text-slate-400';
    }
  };

  const currentWl = sampleWorkloads[selectedSampleWl] || sampleWorkloads[0];

  return (
    <div className={`w-full flex flex-col gap-6 ${className}`}>
      {/* ACCORDION CONTAINER - Tall and wide layout with zero scrolling needed */}
      <div className="w-full flex flex-col md:flex-row gap-4 h-auto md:h-[760px] lg:h-[780px] min-h-[740px] rounded-3xl p-4 bg-[#0a0b0e] border border-white/[0.08] shadow-2xl">
        {items.map((item, index) => {
          const isActive = activeIndex === index;
          const currentRatio = isActive ? expandRatio : inactiveRatio;
          const flexPercent = (currentRatio * 100).toFixed(2);
          const colorClasses = getStepColorClasses(index, isActive);
          const hasImgError = imgErrors[index];

          const defaultStepBadges = ['STEP 01 · INGESTION', 'STEP 02 · FORECASTING', 'STEP 03 · OPTIMIZATION', 'STEP 04 · PLACEMENT', 'STEP 05 · VERIFICATION'];
          const defaultTitles = [
            'Workload Profile',
            'Grid Signals',
            'NSGA-II Engine',
            'Optimal Assignment',
            'Impact Ledger',
          ];
          const defaultDescriptions = [
            'Ingests compute requests: CPU cores, RAM allocations, runtime duration, arrival timestamp, and SLA deadline constraints.',
            'Fetches 24-hour forecasted gCO₂/kWh grid emission factors and spot electricity tariffs across regional resource pools.',
            'Runs multi-objective non-dominated sorting across energy consumption, carbon intensity, and financial cost objectives.',
            'Determines the optimal execution pair (Resource Pool × Time Slot) maximizing green alignment without SLA breaches.',
            'Logs IT and data center energy ledgers, verified carbon deltas, and off-peak cost savings into research audit trails.',
          ];

          const badgeText = item.badge || defaultStepBadges[index % 5];
          const titleText = item.title || defaultTitles[index % 5];
          const descText = item.description || defaultDescriptions[index % 5];

          return (
            <div
              key={index}
              onClick={() => handleInteraction(index)}
              onMouseEnter={() => trigger === 'hover' && handleInteraction(index)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleInteraction(index);
                }
              }}
              style={{
                flex: `${flexPercent} 1 0%`,
              }}
              className={`relative group h-full rounded-2xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer select-none border ${colorClasses}`}
            >
              {/* Background Image & Overlay */}
              {!hasImgError && item.image ? (
                <img
                  src={item.image}
                  alt={item.label || titleText}
                  className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out ${
                    isActive ? 'scale-105 opacity-25' : 'scale-100 opacity-10 group-hover:opacity-20'
                  }`}
                  loading="lazy"
                  onError={() => handleImageError(index)}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-black opacity-30" />
              )}

              {/* Dark Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#090a0d] via-[#090a0d]/95 to-[#090a0d]/75" />

              {/* Active Glow Accent Top Line */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 animate-pulse z-20" />
              )}

              {/* ======================================================== */}
              {/* EXPANDED PANEL VIEW (Zero Scroll, Spacious Layout)      */}
              {/* ======================================================== */}
              {isActive ? (
                <div className="relative z-10 p-6 md:p-8 h-full flex flex-col justify-between overflow-hidden">
                  <div>
                    {/* Header Top Bar */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="px-3.5 py-1 rounded-full text-xs font-mono tracking-widest uppercase font-bold bg-white/[0.08] text-white border border-white/10">
                          {badgeText}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          Active Phase
                        </span>
                      </div>
                    </div>

                    {/* Step Title & Description */}
                    <div className="flex items-center gap-3.5 mb-3">
                      <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10 shadow-inner">
                        {getStepIcon(index)}
                      </div>
                      <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                        {titleText}
                      </h3>
                    </div>

                    <p className="text-sm md:text-base leading-relaxed text-slate-300 max-w-4xl mb-6">
                      {descText}
                    </p>
                  </div>

                  {/* Interactive Trace Inspector Sandbox Inside Active Panel */}
                  <div className="mt-4 pt-6 border-t border-white/[0.08] space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-mono uppercase tracking-widest text-slate-400">
                          INTERACTIVE TRACE INSPECTOR
                        </div>
                        <h4 className="text-base md:text-lg font-bold text-white mt-1">Select a Sample Workload</h4>
                      </div>

                      {/* Workload Selector Buttons */}
                      <div className="flex flex-wrap gap-3">
                        {sampleWorkloads.map((wl, idx) => (
                          <button
                            key={wl.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSampleWl(idx);
                            }}
                            className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-mono transition-all cursor-pointer ${
                              selectedSampleWl === idx
                                ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/30'
                                : 'bg-white/[0.05] text-slate-300 hover:bg-white/10 border border-white/[0.08]'
                            }`}
                          >
                            {wl.tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Workload Specifications & Deltas Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs md:text-sm">
                      {/* Column 1: Workload Specifications */}
                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3.5 shadow-xl">
                        <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                          WORKLOAD SPECIFICATIONS
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-white/[0.03]">
                          <span className="text-slate-400">Task Identifier:</span>
                          <span className="font-mono text-white font-bold">{currentWl.id}</span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-white/[0.03]">
                          <span className="text-slate-400">Classification:</span>
                          <span className="text-white font-semibold truncate max-w-[160px]">
                            {currentWl.name}
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-white/[0.03]">
                          <span className="text-slate-400">Compute Demands:</span>
                          <span className="font-mono text-white font-semibold">
                            {currentWl.cpu} Cores · {currentWl.memory} GB
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-white/[0.03]">
                          <span className="text-slate-400">Duration:</span>
                          <span className="font-mono text-white">{currentWl.duration} Hours</span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-white/[0.03]">
                          <span className="text-slate-400">Arrival Time:</span>
                          <span className="font-mono text-slate-300">{currentWl.arrival}</span>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span className="text-slate-400">SLA Deadline:</span>
                          <span className="font-mono text-amber-300 font-bold">{currentWl.deadline}</span>
                        </div>
                      </div>

                      {/* Column 2: Placement Decision */}
                      <div className="p-6 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/20 space-y-3.5 shadow-xl">
                        <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                          OPTIMIZED PLACEMENT DECISION
                        </div>
                        <div>
                          <div className="text-xs text-slate-400">Assigned Resource Pool (WHERE):</div>
                          <div className="text-base md:text-lg font-bold text-emerald-400 mt-1">
                            {currentWl.selectedPool}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400">Assigned Time Slot (WHEN):</div>
                          <div className="text-base md:text-lg font-bold text-cyan-400 mt-1">
                            {currentWl.selectedSlot}
                          </div>
                        </div>
                        <div className="pt-3 border-t border-white/[0.06]">
                          <div className="text-xs text-slate-400 mb-1">Decision Rationale:</div>
                          <p className="text-xs md:text-sm text-slate-300 italic leading-relaxed">
                            "{currentWl.decisionRationale}"
                          </p>
                        </div>
                      </div>

                      {/* Column 3: Simulated Deltas */}
                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3.5 shadow-xl">
                        <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                          SIMULATED RESEARCH DELTAS
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3.5 rounded-xl bg-black/50 border border-white/[0.06]">
                            <div className="text-[10px] text-slate-400 uppercase font-mono">Carbon Reduction</div>
                            <div className="text-xl md:text-2xl font-bold text-emerald-400 font-mono mt-1">
                              {currentWl.carbonReduction}
                            </div>
                            <div className="text-[9px] text-slate-500">vs. first-fit</div>
                          </div>
                          <div className="p-3.5 rounded-xl bg-black/50 border border-white/[0.06]">
                            <div className="text-[10px] text-slate-400 uppercase font-mono">Energy Efficiency</div>
                            <div className="text-xl md:text-2xl font-bold text-cyan-400 font-mono mt-1">
                              {currentWl.energyEfficiency}
                            </div>
                            <div className="text-[9px] text-slate-500">PUE ledger</div>
                          </div>
                          <div className="p-3.5 rounded-xl bg-black/50 border border-white/[0.06]">
                            <div className="text-[10px] text-slate-400 uppercase font-mono">Operational Cost</div>
                            <div className="text-xl md:text-2xl font-bold text-indigo-300 font-mono mt-1">
                              {currentWl.operationalCost}
                            </div>
                            <div className="text-[9px] text-slate-500">off-peak tariff</div>
                          </div>
                          <div className="p-3.5 rounded-xl bg-black/50 border border-white/[0.06]">
                            <div className="text-[10px] text-slate-400 uppercase font-mono">SLA Margin</div>
                            <div className="text-xs md:text-sm font-bold text-emerald-300 font-mono mt-1.5">
                              {currentWl.slaMargin}
                            </div>
                            <div className="text-[9px] text-slate-500">deadline bounds</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ======================================================== */
                /* COLLAPSED PANEL VIEW (Clean, Sleek Vertical Step Header) */
                /* ======================================================== */
                <div className="relative z-10 p-5 h-full flex flex-col justify-between items-center text-center">
                  {/* Top Step Icon & Badge */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs font-mono font-bold tracking-widest text-slate-300">
                      0{index + 1}
                    </span>
                    <div className="p-2.5 rounded-xl bg-white/[0.06] border border-white/10 group-hover:border-white/30 transition-all shadow-md">
                      {getStepIcon(index)}
                    </div>
                  </div>

                  {/* Vertical Rotated Title Bar */}
                  <div className="flex-1 flex items-center justify-center my-6 overflow-hidden">
                    <span className="transform -rotate-90 text-xs md:text-sm font-mono font-bold tracking-wider text-slate-200 group-hover:text-white transition-colors whitespace-nowrap px-3.5 py-2 rounded-xl bg-black/60 border border-white/[0.08] backdrop-blur-md shadow-lg">
                      {titleText}
                    </span>
                  </div>

                  {/* Bottom Step Dot */}
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20 group-hover:bg-emerald-400 transition-colors" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AccordionGallery;
