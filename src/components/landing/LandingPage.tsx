import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import type { DashboardTab } from '../../types';
import BlurText from './BlurText';
import {
  ArrowRight,
  Compass,
  Timer,
  Scale,
  Plus,
  Minus,
  ChevronRight,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Database,
  Radio,
  GitBranch,
  CalendarClock,
  FileCheck,
  Server,
  TrendingUp,
} from 'lucide-react';
import { baselineComparisons } from '../../data/mockData';

const items = [
  {
    step: '01',
    badge: 'INGESTION',
    title: 'Computational Profile Telemetry',
    description: 'Ingests batch compute requests: CPU cores, RAM allocations, runtime duration, arrival timestamp, and SLA deadline constraints.',
    icon: <Database className="w-5 h-5 text-slate-950" />,
    details: ['CPU & Memory Demands', 'Arrival & SLA Window', 'Trace Profile Ingestion'],
  },
  {
    step: '02',
    badge: 'SIGNALS',
    title: 'Regional Carbon & Electricity Signals',
    description: 'Fetches 24-hour forecasted gCO₂/kWh grid emission factors and spot electricity tariffs across Mumbai, Hyderabad & Singapore.',
    icon: <Radio className="w-5 h-5 text-slate-950" />,
    details: ['gCO₂/kWh Profiles', 'Spot Tariffs', 'PUE Coefficients'],
  },
  {
    step: '03',
    badge: 'OPTIMIZATION',
    title: 'Multi-Objective Pareto Engine',
    description: 'Runs NSGA-II non-dominated sorting across energy consumption, carbon intensity, and operational cost objectives.',
    icon: <GitBranch className="w-5 h-5 text-slate-950" />,
    details: ['Pareto Frontier', 'Crowding Distance', 'Non-Dominated Sorting'],
  },
  {
    step: '04',
    badge: 'PLACEMENT',
    title: 'Resource Pool & Slot Assignment',
    description: 'Assigns the workload to the optimal Spatial-Temporal execution pair (Resource Pool × Time Slot) respecting deadline bounds.',
    icon: <CalendarClock className="w-5 h-5 text-slate-950" />,
    details: ['Geographic Shift', 'Temporal Delay Buffer', 'Zero SLA Violations'],
  },
  {
    step: '05',
    badge: 'LEDGER',
    title: 'Telemetry Ledger & Audit Metrics',
    description: 'Records energy savings (E_IT + E_DC), verified carbon reduction, and cost savings against immediate first-fit baselines.',
    icon: <FileCheck className="w-5 h-5 text-slate-950" />,
    details: ['-28.6% Carbon Reduction', '-14.2% Energy Saved', '-18.1% Operational Cost'],
  },
];

export interface LandingPageProps {
  onLaunchWorkspace: () => void;
  onNavigateTab?: (tab: DashboardTab) => void;
}

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: custom * 0.08,
    },
  }),
};

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchWorkspace, onNavigateTab }) => {
  // State for FAQ accordion
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleNavTab = (tab: DashboardTab) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    } else {
      onLaunchWorkspace();
    }
  };

  const faqs = [
    {
      q: 'Is EcoFusion a production scheduling service or a research prototype?',
      a: 'EcoFusion is an academic research prototype and simulation framework. It provides reproducible trace-driven simulation environments to evaluate multi-objective algorithms (such as NSGA-II) against conventional heuristics. It is designed for benchmarking, thesis validation, and algorithmic experimentation rather than direct hypervisor actuation.',
    },
    {
      q: 'How does spatial workload shifting differ from temporal shifting?',
      a: 'Spatial shifting routes compute tasks across geographically separated resource pools (e.g. Mumbai vs. Hyderabad vs. Singapore) to exploit regional variations in renewable availability and instantaneous grid carbon intensity. Temporal shifting defers delay-tolerant batch tasks to later time windows within user-defined SLA deadlines to match off-peak or high-solar periods.',
    },
    {
      q: 'What datasets are used for workload traces and carbon signals?',
      a: 'EcoFusion utilizes standardized synthetic and trace-driven cluster traces derived from public Google and Alibaba cloud workload telemetry, paired with regional grid carbon profiles modeling regional emissions factors (e.g. CEA India data for Mumbai/Hyderabad and EMA statistics for Singapore).',
    },
    {
      q: 'Why use NSGA-II instead of simple weighted-sum optimization?',
      a: 'Carbon intensity, energy consumption, and operational cost are frequently conflicting objectives with non-linear Pareto frontiers. Weighted-sum scalarization tends to fail on non-convex regions and requires arbitrary weight guessing. NSGA-II preserves population diversity and delivers a non-dominated Pareto front, allowing researchers to explore Pareto-optimal trade-offs rigorously.',
    },
    {
      q: 'How are SLA violations defined and prevented?',
      a: 'Each workload specifies an arrival timestamp, estimated execution duration, and hard completion deadline. During spatial-temporal candidate evaluation, candidate placement pairs that fail the feasibility condition (startTime + duration > deadline) or exceed regional pool capacity limits are filtered out or heavily penalized, keeping SLA violation rates minimal.',
    },
    {
      q: 'Can I export experiment results for academic publication?',
      a: 'Yes. EcoFusion provides structured data exports (JSON format and table views) covering workload assignments, energy ledger metrics (E_IT, E_DC), carbon emissions, electricity costs, and comparative baseline benchmarks for inclusion in papers, reports, and slide decks.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F5F0] text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
      {/* 1. CLEAN NAVIGATION */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-extrabold tracking-tight text-slate-950 text-2xl">EcoFusion</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-base font-bold text-slate-700">
            <a href="#overview" className="hover:text-black transition-colors">
              Overview
            </a>
            <a href="#how-it-works" className="hover:text-black transition-colors">
              Pipeline
            </a>
            <a href="#pillars" className="hover:text-black transition-colors">
              Pillars
            </a>
            <a href="#architecture" className="hover:text-black transition-colors">
              Architecture
            </a>
            <a href="#methodology" className="hover:text-black transition-colors">
              Methodology
            </a>
            <a href="#faq" className="hover:text-black transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onLaunchWorkspace}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-950 text-white text-sm font-extrabold hover:bg-slate-800 transition-all shadow-md cursor-pointer border border-slate-900"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* 2. HERO & INDEX OVERVIEW */}
      <section id="overview" className="relative pt-20 pb-20 md:pt-28 md:pb-24 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl text-left">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.08] mb-8">
              <BlurText
                text="Spatial-Temporal Optimization for Sustainable Cloud Computing"
                delay={100}
                animateBy="words"
                direction="top"
                className="inline-block text-slate-950 text-left"
              />
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-lg md:text-xl text-slate-600 leading-relaxed mb-12 font-normal max-w-3xl"
            >
              EcoFusion is an academic research platform investigating AI-assisted workload placement across
              geographically distributed resource pools and flexible time horizons to minimize carbon emissions,
              energy consumption, and operational costs.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="flex flex-col sm:flex-row items-center gap-5"
            >
              <motion.button
                whileHover={{ scale: 1.03, translateY: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={onLaunchWorkspace}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-slate-950 text-white font-extrabold text-base md:text-lg hover:bg-slate-800 transition-all shadow-xl cursor-pointer"
              >
                <span>Open Research Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>

              <motion.a
                whileHover={{ scale: 1.02, translateY: -2 }}
                whileTap={{ scale: 0.98 }}
                href="#methodology"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-white border-2 border-slate-950 text-slate-950 hover:bg-slate-100 text-base md:text-lg font-bold transition-all"
              >
                <span>View Formulation Guide</span>
              </motion.a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. PIPELINE PROCESS STREAM */}
      <section id="how-it-works" className="py-24 border-b border-slate-200 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeInUp}
            className="text-left max-w-3xl mb-16"
          >
            <div className="inline-flex items-center gap-2 text-xs md:text-sm font-sans uppercase font-extrabold tracking-widest text-slate-500 mb-3">
              Process Flow Stream
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight mb-4">
              Trace-Driven Optimization Pipeline
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed font-normal">
              Explore how incoming computational workload profiles flow through dynamic regional grid evaluation,
              multi-objective evolutionary optimization, and ledger verification.
            </p>
          </motion.div>

          <div className="border-y-2 border-slate-950 py-10 divide-y md:divide-y-0 md:divide-x divide-slate-300 grid grid-cols-1 md:grid-cols-5">
            {items.map((item, idx) => (
              <motion.div
                key={idx}
                custom={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-30px' }}
                variants={fadeInUp}
                className="px-6 py-6 md:py-2 flex flex-col justify-between text-left"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-slate-100 border border-slate-200">
                      {item.icon}
                    </div>
                    <span className="text-sm font-sans font-extrabold text-slate-950">
                      {item.step}
                    </span>
                  </div>
                  <div className="text-xs font-sans font-extrabold uppercase tracking-widest text-slate-500 mb-1">
                    {item.badge}
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-950 mb-3 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6 font-normal">
                    {item.description}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-200 space-y-2">
                  {item.details.map((detail, dIdx) => (
                    <div key={dIdx} className="flex items-center gap-2 text-xs font-sans text-slate-800 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                      <span className="truncate">{detail}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. EDITORIAL OPTIMIZATION PILLARS */}
      <section id="pillars" className="py-24 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeInUp}
            className="text-left max-w-3xl mb-16"
          >
            <div className="inline-flex items-center gap-2 text-xs md:text-sm font-sans uppercase font-extrabold tracking-widest text-slate-500 mb-3">
              Optimization Pillars
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight mb-4">
              How EcoFusion Addresses Cloud Sustainability
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed font-normal">
              Traditional schedulers optimize only for CPU saturation and latency. EcoFusion balances spatial grid
              diversity, temporal demand flexibility, and Pareto-optimal trade-offs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 text-left">
            {/* Pillar 1: WHERE */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={fadeInUp}
              custom={0}
              className="border-l-4 border-slate-950 pl-8 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-950">
                    <Compass className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-sans font-extrabold uppercase tracking-widest text-slate-950">
                    Spatial Optimization
                  </span>
                </div>
                <h3 className="text-2xl font-extrabold text-slate-950 mb-4">WHERE to Execute</h3>
                <p className="text-base text-slate-600 leading-relaxed mb-6 font-normal">
                  Shifting flexible batch workloads across geographically distributed regional resource pools
                  (Mumbai, Hyderabad, and Singapore). Exploits differences in instantaneous grid carbon intensity
                  (e.g., midday solar peaks vs. base-load natural gas CCGT).
                </p>
              </div>
              <div className="py-4 border-t border-slate-200 text-sm font-sans text-slate-950 font-bold">
                Grid variance: up to 190 gCO₂/kWh difference between regional pools.
              </div>
            </motion.div>

            {/* Pillar 2: WHEN */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={fadeInUp}
              custom={1}
              className="border-l-4 border-slate-950 pl-8 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-950">
                    <Timer className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-sans font-extrabold uppercase tracking-widest text-slate-950">
                    Temporal Optimization
                  </span>
                </div>
                <h3 className="text-2xl font-extrabold text-slate-950 mb-4">WHEN to Execute</h3>
                <p className="text-base text-slate-600 leading-relaxed font-normal">
                  Deferring delay-tolerant batch compute tasks (model training, nightly ETL, batch analytics) to
                  upcoming hourly time slots with lower carbon intensity or cheaper electricity tariffs, strictly
                  constrained by workload arrival and deadline windows.
                </p>
              </div>
              <div className="py-4 border-t border-slate-200 text-sm font-sans text-slate-950 font-bold">
                Temporal slack: 2 to 8 hours buffer leveraged for green dispatch windows.
              </div>
            </motion.div>

            {/* Pillar 3: HOW */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={fadeInUp}
              custom={2}
              className="border-l-4 border-slate-950 pl-8 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-950">
                    <Scale className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-sans font-extrabold uppercase tracking-widest text-slate-950">
                    Multi-Objective Trade-offs
                  </span>
                </div>
                <h3 className="text-2xl font-extrabold text-slate-950 mb-4">HOW to Balance</h3>
                <p className="text-base text-slate-600 leading-relaxed font-normal">
                  Solving the conflicting multi-objective formulation: minimizing emissions, total energy, and
                  operational expenses simultaneously using NSGA-II Pareto analysis without arbitrary single-metric
                  scalarization.
                </p>
              </div>
              <div className="py-4 border-t border-slate-200 text-sm font-sans text-slate-950 font-bold">
                Zero SLA compromise: non-viable schedules filtered prior to ranking.
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5. CONTINUOUS TIMELINE ARCHITECTURE */}
      <section id="architecture" className="py-24 border-b border-slate-200 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeInUp}
            className="text-left max-w-3xl mb-16"
          >
            <div className="inline-flex items-center gap-2 text-xs md:text-sm font-sans uppercase font-extrabold tracking-widest text-slate-500 mb-3">
              System Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight mb-4">
              Four-Layer Research Architecture
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed font-normal">
              EcoFusion modularizes ingestion, predictive modeling, evolutionary optimization, and ledger verification.
            </p>
          </motion.div>

          <div className="max-w-4xl relative pl-8 sm:pl-12 border-l-2 border-slate-950 space-y-12 text-left">
            {/* Layer 1 */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0 }}
              className="relative"
            >
              <div className="absolute -left-[41px] sm:-left-[57px] top-1.5 w-6 h-6 rounded-full bg-slate-950 text-white font-sans text-xs font-extrabold flex items-center justify-center ring-4 ring-white shadow-sm">
                1
              </div>
              <div className="text-xs font-sans text-slate-950 uppercase font-extrabold tracking-wider mb-1 flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-950" />
                <span>Input & Ingestion Layer (L1)</span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-950 mb-3">Cluster Workloads & Telemetry Feeds</h3>
              <p className="text-base text-slate-600 leading-relaxed font-normal">
                Ingests synthetic and trace-driven batch workloads, real-time grid carbon intensity signals
                (gCO₂/kWh), and dynamic electricity pricing.
              </p>
            </motion.div>

            {/* Layer 2 */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="relative"
            >
              <div className="absolute -left-[41px] sm:-left-[57px] top-1.5 w-6 h-6 rounded-full bg-slate-950 text-white font-sans text-xs font-extrabold flex items-center justify-center ring-4 ring-white shadow-sm">
                2
              </div>
              <div className="text-xs font-sans text-slate-950 uppercase font-extrabold tracking-wider mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-950" />
                <span>Prediction & Modeling Layer (L2)</span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-950 mb-3">Signal Forecasting & Energy Estimation</h3>
              <p className="text-base text-slate-600 leading-relaxed font-normal">
                Carbon intensity forecasting across candidate time slots, linear CPU utilization modeling, and PUE
                facility cooling overhead calculation.
              </p>
            </motion.div>

            {/* Layer 3 */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -left-[41px] sm:-left-[57px] top-1.5 w-6 h-6 rounded-full bg-slate-950 text-white font-sans text-xs font-extrabold flex items-center justify-center ring-4 ring-white shadow-sm">
                3
              </div>
              <div className="text-xs font-sans text-slate-950 uppercase font-extrabold tracking-wider mb-1 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-slate-950" />
                <span>Optimization Core (L3)</span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-950 mb-3">NSGA-II Multi-Objective Engine</h3>
              <p className="text-base text-slate-600 leading-relaxed font-normal">
                Crowding-distance genetic search generating non-dominated Pareto front, enforcing resource capacity and
                hard deadline feasibility bounds.
              </p>
            </motion.div>

            {/* Layer 4 */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="relative"
            >
              <div className="absolute -left-[41px] sm:-left-[57px] top-1.5 w-6 h-6 rounded-full bg-slate-950 text-white font-sans text-xs font-extrabold flex items-center justify-center ring-4 ring-white shadow-sm">
                4
              </div>
              <div className="text-xs font-sans text-slate-950 uppercase font-extrabold tracking-wider mb-1 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                <span>Execution & Feedback Layer (L4)</span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-950 mb-3">Spatial-Temporal Schedule & Audit Ledger</h3>
              <p className="text-base text-slate-600 leading-relaxed font-normal">
                Generates actionable schedule assignment matrix (Pool × Slot), logs total energy and carbon footprint,
                and computes SLA slack margins.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. EDITORIAL MATHEMATICAL FORMULATION */}
      <section id="methodology" className="py-24 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeInUp}
            className="max-w-3xl mb-16"
          >
            <div className="inline-flex items-center gap-2 text-xs md:text-sm font-sans uppercase font-extrabold tracking-widest text-slate-500 mb-3">
              Mathematical Foundation
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight mb-4">
              Research Formulation & Objective Functions
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed font-normal">
              Rigorous mathematical modeling of server power, data center energy, carbon emissions, and operational
              cost.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl">
            {/* Equation 1: IT Energy */}
            <motion.div
              whileHover={{ x: 4, transition: { duration: 0.2 } }}
              className="border-l-4 border-slate-950 pl-6 py-2"
            >
              <div className="text-xs font-sans text-slate-950 uppercase font-extrabold tracking-wider mb-2 flex items-center gap-2">
                1. IT Equipment Power
              </div>
              <div className="py-3 font-mono text-lg md:text-xl font-extrabold text-slate-950 mb-3">
                E_IT = (P_idle + (P_max - P_idle) × U) × t
              </div>
              <p className="text-base text-slate-600 leading-relaxed font-normal">
                Linear power model estimating IT consumption as a function of server idle power (P_idle), peak power
                (P_max), CPU utilization fraction (U), and task execution duration (t).
              </p>
            </motion.div>

            {/* Equation 2: Total Facility Energy */}
            <motion.div
              whileHover={{ x: 4, transition: { duration: 0.2 } }}
              className="border-l-4 border-slate-950 pl-6 py-2"
            >
              <div className="text-xs font-sans text-slate-950 uppercase font-extrabold tracking-wider mb-2 flex items-center gap-2">
                2. Facility Total Energy
              </div>
              <div className="py-3 font-mono text-lg md:text-xl font-extrabold text-slate-950 mb-3">
                E_DC = E_IT × PUE
              </div>
              <p className="text-base text-slate-600 leading-relaxed font-normal">
                Total data center energy consumption accounting for non-IT cooling, air flow, and power conversion
                losses via regional Power Usage Effectiveness (PUE).
              </p>
            </motion.div>

            {/* Equation 3: Carbon Footprint */}
            <motion.div
              whileHover={{ x: 4, transition: { duration: 0.2 } }}
              className="border-l-4 border-slate-950 pl-6 py-2"
            >
              <div className="text-xs font-sans text-slate-950 uppercase font-extrabold tracking-wider mb-2 flex items-center gap-2">
                3. Carbon Emissions Ledger
              </div>
              <div className="py-3 font-mono text-lg md:text-xl font-extrabold text-slate-950 mb-3">
                Carbon = E_DC × I_carbon(t, r)
              </div>
              <p className="text-base text-slate-600 leading-relaxed font-normal">
                Total operational carbon footprint in gCO₂ calculated by multiplying facility energy by the time-varying
                grid emission factor I_carbon at time slot t and regional pool r.
              </p>
            </motion.div>

            {/* Equation 4: Operational Electricity Cost */}
            <motion.div
              whileHover={{ x: 4, transition: { duration: 0.2 } }}
              className="border-l-4 border-slate-950 pl-6 py-2"
            >
              <div className="text-xs font-sans text-slate-950 uppercase font-extrabold tracking-wider mb-2 flex items-center gap-2">
                4. Electricity Cost & SLA Constraint
              </div>
              <div className="py-3 font-mono text-lg md:text-xl font-extrabold text-slate-950 mb-3">
                Cost = E_DC × Price(t, r) ; t_start + duration ≤ t_deadline
              </div>
              <p className="text-base text-slate-600 leading-relaxed font-normal">
                Financial expense computed from time-of-use tariffs. The hard SLA constraint strictly enforces task
                completion prior to the declared deadline.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 7. BASELINE BENCHMARKS TABLE */}
      <section id="benchmarks" className="py-24 border-b border-slate-200 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeInUp}
            className="max-w-3xl mb-16"
          >
            <div className="inline-flex items-center gap-2 text-xs md:text-sm font-sans uppercase font-extrabold tracking-widest text-slate-500 mb-3">
              Empirical Benchmarks
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight mb-4">
              Baseline Algorithm Comparison
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed font-normal">
              Performance evaluation of EcoFusion (NSGA-II) against standard single-metric heuristics across 24
              simulated workloads.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="border-y-2 border-slate-950"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-base">
                <thead className="bg-slate-950 text-white font-sans uppercase text-xs tracking-wider">
                  <tr>
                    <th className="py-5 px-8 font-bold">Algorithm</th>
                    <th className="py-5 px-6 font-bold text-right">Energy (kWh)</th>
                    <th className="py-5 px-6 font-bold text-right">Carbon (kgCO₂)</th>
                    <th className="py-5 px-6 font-bold text-right">Cost (USD)</th>
                    <th className="py-5 px-6 font-bold text-right">SLA Violation</th>
                    <th className="py-5 px-8 font-bold text-right">Avg Comp. (hrs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm sm:text-base font-sans font-medium">
                  {baselineComparisons.map((row) => (
                    <tr
                      key={row.algorithm}
                      className={
                        row.isEcoFusion
                          ? 'bg-slate-100 font-bold text-slate-950 border-l-4 border-l-slate-950'
                          : 'text-slate-700 hover:bg-slate-50 transition-colors'
                      }
                    >
                      <td className="py-5 px-8 font-sans flex items-center gap-3">
                        {row.isEcoFusion && (
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-pulse" />
                        )}
                        <span className={row.isEcoFusion ? 'font-extrabold text-slate-950 text-base md:text-lg' : 'text-slate-800'}>
                          {row.label}
                        </span>
                        {row.isEcoFusion && (
                          <span className="text-xs uppercase font-sans font-extrabold px-2.5 py-1 rounded-full bg-slate-950 text-white">
                            Our Framework
                          </span>
                        )}
                      </td>
                      <td className="py-5 px-6 text-right text-slate-800 font-mono">{row.totalEnergyKwh.toFixed(1)}</td>
                      <td
                        className={`py-5 px-6 text-right font-mono ${
                          row.isEcoFusion ? 'text-slate-950 font-extrabold text-base md:text-lg' : 'text-slate-800'
                        }`}
                      >
                        {row.totalCarbonKg.toFixed(2)}
                      </td>
                      <td className="py-5 px-6 text-right text-slate-800 font-mono">${row.totalCostUsd.toFixed(2)}</td>
                      <td
                        className={`py-5 px-6 text-right font-bold font-mono ${
                          row.slaViolationRate === 0
                            ? 'text-slate-950 font-bold'
                            : row.slaViolationRate > 10
                            ? 'text-red-600 font-bold'
                            : 'text-amber-600 font-bold'
                        }`}
                      >
                        {row.slaViolationRate.toFixed(1)}%
                      </td>
                      <td className="py-5 px-8 text-right text-slate-800 font-mono">{row.avgCompletionTimeHours.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200 text-sm text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-4 font-normal">
              <span>
                <strong>Note:</strong> Illustrative optimization output based on trace-driven simulation runs. Actual
                results depend on workload characteristics and grid carbon dynamics.
              </span>
              <button
                onClick={() => handleNavTab('comparisons')}
                className="text-slate-950 hover:text-slate-700 font-sans font-extrabold flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                Inspect in Dashboard <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 8. FAQ ACCORDION */}
      <section id="faq" className="py-24 border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-left">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeInUp}
            className="mb-16"
          >
            <div className="inline-flex items-center gap-2 text-xs md:text-sm font-sans uppercase font-extrabold tracking-widest text-slate-500 mb-3">
              Inquiries & Clarifications
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div className="divide-y-2 divide-slate-950 border-y-2 border-slate-950">
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.04 }}
                className="py-6"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full text-left flex items-center justify-between gap-6 cursor-pointer hover:text-slate-600 transition-colors"
                >
                  <span className="text-lg md:text-xl font-extrabold text-slate-950">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: openFaq === idx ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center text-white shrink-0 shadow-sm"
                  >
                    {openFaq === idx ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pt-5 text-base text-slate-600 leading-relaxed font-normal">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. MINIMALIST FOOTER */}
      <footer className="py-16 bg-slate-950 text-slate-300 text-sm border-t border-slate-900 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-white text-lg">EcoFusion Research Platform</span>
          </div>

          <div className="flex flex-wrap items-center gap-8 text-slate-300 font-bold">
            <a href="#overview" className="hover:text-white transition-colors">
              Overview
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              Pipeline
            </a>
            <a href="#pillars" className="hover:text-white transition-colors">
              Pillars
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">
              Architecture
            </a>
            <a href="#methodology" className="hover:text-white transition-colors">
              Formulation
            </a>
            <a href="#benchmarks" className="hover:text-white transition-colors">
              Benchmarks
            </a>
            <button
              onClick={onLaunchWorkspace}
              className="text-white hover:text-slate-300 font-extrabold cursor-pointer underline underline-offset-4"
            >
              Open Dashboard
            </button>
          </div>

          <div className="text-slate-400 text-sm">
            © 2026 EcoFusion Project · Spatial-Temporal Multi-Objective Cloud Research.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
