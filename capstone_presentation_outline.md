# EcoFusion: Capstone Defense Presentation Outline (18 Slides)

**Title:** *EcoFusion: An AI-Driven Multi-Objective Workload Orchestration Framework for Sustainable Cloud Data Centers*

---

## Slide 1: Title Slide
- **Title:** EcoFusion: An AI-Driven Multi-Objective Workload Orchestration Framework for Sustainable Cloud Data Centers
- **Subtitle:** Co-Optimizing Grid Carbon, Facility PUE Energy, Time-of-Use Electricity Cost, and Hard SLA Deadlines
- **Visual:** EcoFusion architecture badge and 4D objective trade-off diagram (Carbon, Energy, Cost, SLA).
- **Speaker Notes:** Introduce EcoFusion as a reproducible spatial-temporal cloud scheduling simulation and optimization framework addressing multi-metric sustainability trade-offs.

---

## Slide 2: Background & Motivation
- **Key Points:**
  - Cloud data centers consume substantial electricity and face growing regulatory pressure to reduce Scope 2 carbon emissions.
  - Multi-region cloud infrastructures (`Mumbai`, `Hyderabad`, `Singapore`) exhibit wide spatial and diurnal variations in grid carbon intensity ($\text{gCO}_2/\text{kWh}$), cooling efficiency ($\text{PUE}$), and electricity tariffs ($\$/\text{kWh}$).
  - Batch compute workloads (`LLM Fine-Tuning`, `Climate HPC`, `Genomics`) often have $2\text{–}10\text{ hours}$ of deadline slack that can be exploited spatially and temporally.
- **Visual:** Diurnal 24-hour curves of solar carbon dip (`09:00–15:00`), night tariff discount (`22:00–05:00`), and ambient PUE.

---

## Slide 3: The Research Problem
- **Key Points:**
  - **Spatial Conflict:** Clean grids (`Singapore`: $270\text{ gCO}_2/\text{kWh}$) have expensive tariffs ($\$0.165/\text{kWh}$), while cheap grids (`Mumbai`: $\$0.085/\text{kWh}$) rely on coal ($620\text{ gCO}_2/\text{kWh}$).
  - **Temporal Contention Conflict:** Deferring early batch jobs into midday solar or off-peak windows saturates CPU and RAM capacity when strict-deadline morning surge jobs ($\text{slack} \in \{0, 1\}\text{ h}$) arrive.
- **Visual:** 3-Pool regional comparison table (`POOL-BOM`, `POOL-HYD`, `POOL-SIN`).

---

## Slide 4: Research Objectives
- **Key Points:**
  1. Formulate a unified, utilization-aware spatial-temporal physical model for IT power, PUE facility energy, carbon emissions, ToU cost, and SLA compliance.
  2. Build a leakage-free Random Forest demand & laxity predictor using strictly pre-execution arrival context.
  3. Design a constraint-repaired multi-objective NSGA-II scheduler with 4D Utopia knee selection.
  4. Benchmark 7 scheduling algorithms fairly across 500 workloads, 10 stress scenarios, and 5 random seeds, including evolutionary and ML ablation studies.

---

## Slide 5: Literature Review & Research Gap
- **Key Points:**
  - Prior work optimizes single metrics in isolation (Carbon-only, Energy/PUE-only, Tariff-only, or EDF latency-only).
  - Common simulation pitfalls in literature: (a) ignoring multi-metric trade-off penalties, (b) target leakage in ML workload predictors, and (c) unfair resource-sizing discounts applied only to the proposed scheduler.
  - **EcoFusion's Differentiation:** 100% shared physical evaluation equations, zero target leakage, and transparent multi-seed ablations.

---

## Slide 6: Proposed EcoFusion System Architecture
- **Key Points:**
  - **Stage 1:** Workload trace ingestion ($500 / 750 / 1000$ tasks or Excel `.xlsx` import) + 3 regional data center pools.
  - **Stage 2:** Leakage-free Random Forest Regressor predicting $(\hat{c}_w, \hat{m}_w, \hat{d}_w)$ to rank tasks by urgency $U_w$.
  - **Stage 3:** Population-based NSGA-II with CPU/RAM feasibility repair alongside 6 baseline schedulers.
  - **Stage 4:** Pareto front $\mathcal{F}_1$ extraction and 4D Utopia Euclidean Distance compromise selection.
- **Visual:** Diagram 1 from `final_research_paper.md`.

---

## Slide 7: Mathematical Model & Physical Equations
- **Key Equations (with Units):**
  - **IT Power ($\text{kW}$):** $P_{\text{IT}}(w, p, h) = \frac{c_w}{C_{\text{CPU}}(p)}\bigl[P_{\text{idle}}(p) + (P_{\text{max}}(p) - P_{\text{idle}}(p))(0.45 + 0.55\,u_{\text{CPU}}(p, h))\bigr]$
  - **Facility Energy ($\text{kWh}$):** $E_{\text{facility}}(w, p, t_w) = \sum_{h=t_w}^{t_w+d_w-1} P_{\text{IT}}(w, p, h)\cdot \Delta t \cdot \text{PUE}_{\text{eff}}(p, h)$
  - **Carbon ($\text{kgCO}_2$) & Cost ($\text{USD}$):** Integrated hour-by-hour against $\text{CI}_{\text{eff}}(p, h)$ and $\text{Tariff}_{\text{eff}}(p, h)$.
  - **Hard Capacity:** $\text{CPU}_{\text{used}}(p, h) \le C_{\text{CPU}}(p)$ and $\text{MEM}_{\text{used}}(p, h) \le C_{\text{MEM}}(p)$ for all $h$.

---

## Slide 8: Seven Scheduling Algorithms Compared
- **Key Points:**
  1. `RANDOM`: Seeded stochastic placement baseline.
  2. `FIRST_FIT`: Chronological FIFO queue into first available pool (`POOL-BOM` first).
  3. `CARBON_AWARE`: Greedy minimum $\text{gCO}_2$ within SLA window.
  4. `ENERGY_AWARE`: Greedy minimum PUE-adjusted $\text{kWh}$ within SLA window.
  5. `COST_AWARE`: Greedy minimum ToU $\text{USD}$ within SLA window.
  6. `EDF`: Earliest Deadline First with lowest-utilization pool tie-breaking.
  7. `ECOFUSION_NSGA2`: Proposed ML-guided multi-objective evolutionary scheduler.

---

## Slide 9: Random Forest Pipeline & Zero Target Leakage
- **Key Points:**
  - **Pre-Execution Features Only:** `arrival_time`, `hour_of_day`, `priority`/category, SLA window, and historical category prior means.
  - **Leakage Prevention:** Ground-truth `cpuRequired`, `memoryRequired`, and `duration` are never passed as input features (verified by `test_ml_no_target_leakage`).
  - **Scheduling Role:** Computes urgency $U_w = 0.65\,\text{dl}_w + 0.35(\text{dl}_w - a_w - \hat{d}_w)$ and energy tie-breaker $\hat{c}_w \cdot \hat{d}_w$ so tight-slack heavy tasks reserve peak capacity before flexible tasks are shifted.

---

## Slide 10: NSGA-II Chromosome, Repair & Evolutionary Operators
- **Key Points:**
  - **Encoding:** Integer vector $\mathbf{x} \in \mathbb{Z}^N$, gene $x_i = p_i \cdot |\mathcal{T}| + t_i$.
  - **Initialization ($P_0$, Size 14):** 7 directional heuristic seeds + 7 random chromosomes.
  - **Deterministic Feasibility Repair:** Resolves arrival, horizon, deadline, or CPU/RAM collisions using normalized directional score $\psi(p, t)$.
  - **Evolution ($G = 8$ in Browser / $50$ in Backend):** Fast Non-Dominated Sorting, L1 Crowding Distance, Binary Crowded-Tournament Selection, Uniform Crossover ($p_c = 0.5$), Guided Mutation ($p_m = 0.08$).

---

## Slide 11: Experimental Setup & Verification Methodology
- **Key Points:**
  - **Dataset:** $N = 500$ workloads across 3 diurnal arrival waves ($36\%$ early batch, $36\%$ strict morning surge, $28\%$ midday mixed).
  - **Seeds:** 5 independent random seeds (`42, 101, 202, 303, 404`).
  - **Stress Verification:** 10 automated scenarios (Small, Heavy, CPU-bound, RAM-bound, Insufficient Capacity, Carbon/Tariff/PUE spreads, Strict SLA, Unschedulable tasks) verifying 9 physical invariants.

---

## Slide 12: Main Benchmark Results (`N = 500`, Seed 42)
- **Visual:** Table 1 and Figures 1–4 from `final_research_paper.md`.
- **Key Findings:**
  - Each single-parameter specialist wins its isolated metric (`CARBON_AWARE`: $4,116.44\text{ kg}$; `ENERGY_AWARE`: $13,549.2\text{ kWh}$; `COST_AWARE`: $\$1,708.14$; `EDF`: $3.6\text{ h}$ completion).
  - `ECOFUSION_NSGA2` achieves the **lowest SLA violation rate ($0.8\%$)**, **#2 lowest energy ($13,705.6\text{ kWh}$)**, and **highest Composite Utopia Proximity Score ($79.2 / 100$)**.

---

## Slide 13: Five-Seed Statistical Evaluation (`Seeds 42, 101, 202, 303, 404`)
- **Visual:** Table 2 and Figure 5 from `final_research_paper.md`.
- **Key Findings ($\text{Mean} \pm \text{SD}$):**
  - `CARBON_AWARE`: $4,440.93 \pm 296.07\text{ kg CO}_2$ (Score: $13.26 \pm 3.80$)
  - `ENERGY_AWARE`: $14,240.94 \pm 605.37\text{ kWh}$ (Score: $61.20 \pm 4.82$)
  - `COST_AWARE`: $\$1,801.86 \pm \$86.31$ (Score: $43.86 \pm 3.17$)
  - `EDF`: $3.92 \pm 2.64\%$ SLA violations (Score: $44.72 \pm 3.68$)
  - `ECOFUSION_NSGA2`: **$1.64 \pm 1.08\%$ SLA violations** and **$72.84 \pm 4.67$ Composite Score** (#1 across all 5 seeds).

---

## Slide 14: Ablation Studies (NSGA-II Evolution & ML Urgency Ordering)
- **Visual:** Tables 3–4 and Figures 6–7 from `final_research_paper.md`.
- **Key Findings:**
  - **Phase 1 (NSGA-II Ablation):** Hybrid $P_0$ repair ($g=0$) reaches $71.34 \pm 3.50$ ($8.60$ distinct $\mathcal{F}_1$ solutions); 8 generations of evolution ($g=8$) improve score to **$72.84 \pm 4.67$** (winning 4/5 seeds) and expand $\mathcal{F}_1$ to **$14.00 \pm 0.00$ distinct Pareto solutions**. Without warm-start heuristics, evolution improves stochastic chromosomes from $66.68 \to 70.04$ ($+3.36$ pts).
  - **Phase 2 (ML Ordering Ablation):** FIFO ordering suffers **$7.40 \pm 1.39\%$ SLA violations** (Score: $65.42$). Pure Deadline ordering reduces SLA violations to **$2.36 \pm 0.84\%$** (Score: $69.84$, $+4.42$ pts). Random Forest Urgency ordering further reduces SLA violations to **$1.64 \pm 1.08\%$** and raises Score to **$72.84 \pm 4.67$** ($+3.00$ additional pts).

---

## Slide 15: Pareto Frontier Analysis
- **Visual:** Figure 8 from `final_research_paper.md` (Carbon vs. Cost Pareto frontier).
- **Key Points:**
  - EcoFusion exposes 4 selectable non-dominated schedules: `Balanced Knee` ($4,781.51\text{ kg}$, $\$1,825.81$), `Carbon Priority` ($4,242.94\text{ kg}$, $\$2,020.49$), `Cost Priority` ($5,329.64\text{ kg}$, $\$1,711.50$), and `Energy Priority` ($5,025.45\text{ kg}$, $13,610.6\text{ kWh}$).
  - `Cost Priority` strictly dominates `First-Fit Baseline` across Carbon ($-758.74\text{ kg}$), Energy ($-800.3\text{ kWh}$), Cost ($-\$10.17$), and SLA.

---

## Slide 16: Project Limitations & Methodological Transparency
- **Key Points:**
  1. **Simulation vs. Live Hardware:** Discrete-event simulation parameterized after regional cloud profiles, not physical RAPL hardware telemetry.
  2. **Hourly Discretization ($\Delta t = 1\text{ h}$):** Integer-hour slot rounding over-allocates sub-hour tasks.
  3. **Non-Preemptive Execution:** Contiguous execution without live WAN migration modeling.
  4. **Normalization & Budget Nuances:** Browser engine uses `popSize = 14, generations = 8` for interactive UI speed (vs. `50x50` in Python backend), and internal vs. external Utopia normalization denominators can cause minor single-seed rank inversions (e.g., Seed 404).

---

## Slide 17: Conclusion & Core Contributions
- **Key Points:**
  - Formulated and verified a fair, leakage-free, multi-objective spatial-temporal cloud scheduling framework.
  - Demonstrated empirically why single-objective heuristics fail under multi-resource contention and anti-correlated grid signals.
  - Verified all 7 schedulers across 10 stress scenarios, 9 physical invariants (`10/10` frontend, `34/34` backend `pytest`), and 5 random seeds.

---

## Slide 18: Future Research Directions
- **Key Points:**
  - Sub-hour time-slot discretization ($\Delta t = 5\text{–}15\text{ minutes}$) for serverless bursts.
  - Live container preemption, checkpoint-restart overhead, and cross-region WAN data-transfer modeling.
  - 30-seed large-scale hypervolume benchmarks across $500, 750,$ and $1,000+$ workload traces.
