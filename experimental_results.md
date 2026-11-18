# EcoFusion: Empirical Benchmark, Multi-Seed Statistical Evaluation & Test Verification Results

> **Experimental Scope Disclosure:** All results reported in this document are generated deterministically by the verified EcoFusion simulation engine ([src/services/simulatorService.ts](file:///c:/VSCODE%20PROJECTS/EcoFusion/src/services/simulatorService.ts) and [backend/app/](file:///c:/VSCODE%20PROJECTS/EcoFusion/backend/app)) using identical workload traces, identical regional data center capacities, and identical physical evaluation equations across all seven scheduling algorithms. No metric is hardcoded or artificially injected.

---

## 1. Single-Seed Benchmark Evaluation (`N = 500` Workloads, `randomSeed = 42`)

### 1.1 Primary Comparison Table across All 7 Scheduling Algorithms

| Algorithm | Carbon Emissions ($\text{kgCO}_2$) | Facility Energy ($\text{kWh}$) | Operational Cost ($\text{USD}$) | SLA Violation Rate ($\%$) | Avg Completion Time ($\text{h}$) | Carbon Gain vs. FIFO ($\%$) | Energy Gain vs. FIFO ($\%$) | Cost Gain vs. FIFO ($\%$) | Composite Score ($0\text{–}100$) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Random Placement (`RANDOM`)** | 4,533.52 | 14,274.3 | \$2,209.73 | 49.0% | 6.2 h | +25.5% | +1.2% | -28.3% | 19.5 |
| **First-Fit FIFO (`FIRST_FIT`)** | 6,088.38 | 14,453.7 | \$1,721.67 | 13.4% | 5.0 h | 0.0% *(Ref)* | 0.0% *(Ref)* | 0.0% *(Ref)* | 19.1 |
| **Carbon-Aware (`CARBON_AWARE`)** | **4,116.44** | 14,546.5 | \$2,365.94 | 12.0% | 6.5 h | **+32.4%** | -0.6% | -37.4% | 18.8 |
| **Energy-Aware (`ENERGY_AWARE`)** | 4,801.11 | **13,549.2** | \$1,897.93 | 6.6% | 6.1 h | +21.1% | **+6.3%** | -10.2% | 68.5 |
| **Cost-Aware (`COST_AWARE`)** | 5,633.07 | 14,236.1 | **\$1,708.14** | 4.0% | 4.9 h | +7.5% | +1.5% | **+0.8%** | 46.7 |
| **Earliest Deadline First (`EDF`)** | 4,730.30 | 14,506.8 | \$1,963.76 | 1.4% | **3.6 h** | +22.3% | -0.4% | -14.1% | 45.7 |
| **EcoFusion (`ECOFUSION_NSGA2`)** | **4,781.51** | **13,705.6** | **\$1,825.81** | **0.8%** | 4.9 h | **+21.5%** | **+5.2%** | -6.0% | **79.2** |

### 1.2 Analysis of Single-Objective vs. Multi-Objective Trade-Offs
1. **Carbon-Aware Specialist (`CARBON_AWARE`)** achieves the absolute lowest carbon emissions ($4,116.44\text{ kgCO}_2$), outperforming EcoFusion on carbon alone by $13.9\%$. However, because it routes workloads heavily to Singapore (`POOL-SIN`, $\$0.165/\text{kWh}$ base tariff, $1.40\times$ midday solar tariff multiplier), it incurs the **highest electricity cost ($\$2,365.94$)** and a **$12.0\%$ SLA violation rate** due to midday solar slot congestion.
2. **Energy-Aware Specialist (`ENERGY_AWARE`)** achieves the absolute lowest facility energy consumption ($13,549.2\text{ kWh}$) by concentrating workloads in Hyderabad (`POOL-HYD`, base $\text{PUE} = 1.14$) and cool night hours, but suffers a **$6.6\%$ SLA violation rate** when morning surge workloads encounter occupied `POOL-HYD` slots.
3. **Cost-Aware Specialist (`COST_AWARE`)** achieves the absolute lowest electricity expenditure ($\$1,708.14$) by packing Mumbai (`POOL-BOM`, $\$0.085/\text{kWh}$) during night off-peak hours ($0.60\times$ tariff), but generates **$5,633.07\text{ kgCO}_2$** due to coal-heavy night generation.
4. **Earliest Deadline First (`EDF`)** achieves the fastest average completion time ($3.6\text{ h}$) and a low $1.4\%$ SLA violation rate, but consumes **$14,506.8\text{ kWh}$** and costs **$\$1,963.76$** because it dispatches jobs immediately at arrival without exploiting solar or off-peak windows.
5. **EcoFusion (`ECOFUSION_NSGA2`)** does not artificially win every individual metric; instead, it achieves the **lowest SLA violation rate ($0.8\%$, $4/500$ tasks)**, the **second-lowest energy ($13,705.6\text{ kWh}$, within $1.15\%$ of `ENERGY_AWARE`)**, competitive carbon ($4,781.51\text{ kgCO}_2$, $-21.5\%$ vs. `FIRST_FIT`), and balanced cost ($\$1,825.81$), yielding the highest **Composite Multi-Objective Utopia Proximity Score ($79.2 / 100$)**.

---

## 2. Five-Seed Statistical Evaluation (`N = 500`, Seeds `42, 101, 202, 303, 404`)

To verify that benchmark conclusions are not an artifact of a single random seed, all 7 algorithms were evaluated across 5 independent workload traces and PRNG initializations (`randomSeed` $\in \{42, 101, 202, 303, 404\}$):

| Algorithm | Carbon Emissions ($\text{kgCO}_2$, $\text{Mean} \pm \text{SD}$) | Facility Energy ($\text{kWh}$, $\text{Mean} \pm \text{SD}$) | Electricity Cost ($\text{USD}$, $\text{Mean} \pm \text{SD}$) | SLA Violation Rate ($\%$, $\text{Mean} \pm \text{SD}$) | Composite Score ($0\text{–}100$, $\text{Mean} \pm \text{SD}$) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Random Placement (`RANDOM`)** | $4,910.73 \pm 287.91$ | $15,030.48 \pm 653.09$ | $\$2,321.65 \pm 139.20$ | $51.12 \pm 1.52\%$ | $18.68 \pm 1.13$ |
| **First-Fit FIFO (`FIRST_FIT`)** | $6,355.36 \pm 271.44$ | $15,175.98 \pm 613.93$ | $\$1,838.97 \pm 111.53$ | $14.12 \pm 1.87\%$ | $17.02 \pm 2.68$ |
| **Carbon-Aware (`CARBON_AWARE`)** | **$4,440.93 \pm 296.07$** | $15,253.22 \pm 633.40$ | $\$2,509.60 \pm 146.90$ | $15.76 \pm 2.65\%$ | $13.26 \pm 3.80$ |
| **Energy-Aware (`ENERGY_AWARE`)** | $5,213.00 \pm 339.47$ | **$14,240.94 \pm 605.37$** | $\$1,983.48 \pm 102.83$ | $9.12 \pm 1.59\%$ | $61.20 \pm 4.82$ |
| **Cost-Aware (`COST_AWARE`)** | $5,997.20 \pm 372.53$ | $14,958.94 \pm 628.52$ | **$\$1,801.86 \pm 86.31$** | $4.60 \pm 1.23\%$ | $43.86 \pm 3.17$ |
| **Earliest Deadline First (`EDF`)** | $5,079.07 \pm 293.82$ | $15,182.40 \pm 614.25$ | $\$2,076.22 \pm 141.67$ | $3.92 \pm 2.64\%$ | $44.72 \pm 3.68$ |
| **EcoFusion (`ECOFUSION_NSGA2`)** | $5,031.14 \pm 217.16$ | $14,591.88 \pm 637.83$ | $\$1,965.77 \pm 127.42$ | **$1.64 \pm 1.08\%$** | **$72.84 \pm 4.67$** |

### Key Statistical Findings
- **Rank Stability:** Across all 5 seeds, `CARBON_AWARE` consistently achieves the lowest carbon ($4,440.93 \pm 296.07\text{ kg}$), `ENERGY_AWARE` achieves the lowest energy ($14,240.94 \pm 605.37\text{ kWh}$), `COST_AWARE` achieves the lowest cost ($\$1,801.86 \pm \$86.31$), and `ECOFUSION_NSGA2` achieves both the **lowest SLA violation rate ($1.64 \pm 1.08\%$)** and the **highest Composite Multi-Objective Score ($72.84 \pm 4.67$)**.
- **Bit-for-Bit Determinism:** Re-running any seed $s \in \{42, 101, 202, 303, 404\}$ produces identical assignments and objective values (`deepStrictEqual` verified).

---

## 3. Pareto Frontier Analysis (`N = 500`, Seed `42`)

Instead of returning a single rigid schedule, EcoFusion NSGA-II extracts four distinct non-dominated Pareto solutions from $\mathcal{F}_1$ alongside the dominated First-Fit baseline reference:

| Solution ID | Solution Key | Label | Carbon ($\text{kgCO}_2$) | Energy ($\text{kWh}$) | Cost ($\text{USD}$) | SLA Margin | Trade-Off Interpretation |
| :---: | :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| **1** | `balanced` | **EcoFusion NSGA-II Balanced** | **4,781.51** | **13,705.6** | **\$1,825.81** | High ($0.8\%$ viol.) | Selected knee point minimizing weighted 4D Utopia Euclidean distance |
| **2** | `carbon` | **Carbon Priority (Pareto Extreme)** | **4,242.94** | 14,060.5 | \$2,020.49 | Medium | Saves an additional $538.57\text{ kgCO}_2$ vs. Balanced at $+\$194.68$ cost |
| **3** | `cost` | **Cost Priority (Pareto Extreme)** | 5,329.64 | 13,653.4 | **\$1,711.50** | High | Reduces cost by $\$114.31$ vs. Balanced at $+548.13\text{ kgCO}_2$ carbon |
| **4** | `energy` | **Energy Priority (Pareto Extreme)** | 5,025.45 | **13,610.6** | \$1,796.42 | Medium | Minimizes facility $\text{kWh}$ along the Pareto frontier |
| **5** | `baseline` | *First-Fit Heuristic Baseline* | *6,088.38* | *14,453.7* | *\$1,721.67* | *Tight ($13.4\%$ viol.)* | *Dominated in Carbon, Energy, and SLA by Solution 3 (`Cost Priority`)* |

---

## 4. Before-and-After Audit Comparison Record

| Metric / Property | Pre-Audit Implementation (Flawed) | Post-Audit Verified Implementation |
| :--- | :--- | :--- |
| **SLA Violation Mechanism** | Hardcoded modulo rules (`wlIndex % 5 === 0`, `wlIndex % 9 === 0`, etc.) | Genuine capacity contention when $[a_w, \text{deadline}_w]$ slots are full or task is `UNSCHEDULED` |
| **Pool Capacity Enforcement** | Inflated by `minHourlyCapacityPerPool`; RAM ignored in frontend | Strict per-hour CPU (`cpuUsage`) and RAM (`memUsage`) reservation limits |
| **Workload Demand Evaluation** | EcoFusion evaluated on $0.85\times$ right-sized demands; baselines on $1.0\times$ | All 7 algorithms evaluated on identical $1.0\times$ physical workload demands |
| **ML Feature Engineering** | Target leakage (`wl.cpu_required` copied into `historical_cpu_mean`) | Leakage-free pre-execution context priors (arrival hour, category/priority, slack) |
| **NSGA-II Execution** | Single-pass greedy loop + fixed multipliers (`0.91`, `1.04`) for Pareto points | Genuine population-based NSGA-II (`runPopulationNsga2`) with non-dominated sorting & crowding distance |
| **EcoFusion Efficiency Score** | $100.0 / 100$ with $0.0\%$ SLA violations | $79.2 / 100$ (Seed 42) and $72.84 \pm 4.67$ (5-seed mean) with $0.8\%$ ($1.64 \pm 1.08\%$) SLA violations |

---

## 5. Automated 10-Scenario Stress Test Results

| Scenario # | Scenario Name | Workload & Pool Configuration | Invariants Checked | Status | Empirical Verification Summary |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **1** | Small Workloads | 25 tasks (16 CPU, 64 GB RAM, 2h) | All 9 | **PASS** | 25/25 scheduled; $0.0\%$ SLA violations on all 6 non-random schedulers |
| **2** | Heavy Workloads | 45 tasks (512 CPU, 2048 GB RAM, 4h) | All 9 | **PASS** | Zero CPU/RAM overcommitment across all 24 hours; dynamic power verified |
| **3** | CPU-Intensive | 18 tasks (512 CPU, 64 GB RAM) on 1024-CPU pools | All 9 | **PASS** | Strictly capped at $\le 2$ concurrent tasks/pool/hour by CPU limit |
| **4** | Memory-Intensive | 18 tasks (32 CPU, 1024 GB RAM) on 2048-GB RAM pools | All 9 | **PASS** | Strictly capped at $\le 2$ concurrent tasks/pool/hour by RAM limit |
| **5** | Insufficient Capacity | 30 tasks (256 CPU, 4h) on 3 pools of 256 CPU (max 18 blocks) | All 9 | **PASS** | 18 tasks scheduled, 12 tasks marked `UNSCHEDULED`, zero overcommitment |
| **6** | Carbon-Intensity Spread | Pools at `140`, `500`, `850` $\text{gCO}_2/\text{kWh}$ (equal PUE/tariff) | All 9 | **PASS** | `FIRST_FIT`: $1,053.47\text{ kg}$ vs. `CARBON_AWARE`: $186.78\text{ kg}$ & `NSGA2`: $231.20\text{ kg}$ |
| **7** | Electricity Tariff Spread | Pools at $\$0.05$, $\$0.18$, $\$0.35/\text{kWh}$ (equal PUE/carbon) | All 9 | **PASS** | `FIRST_FIT`: $\$687.76$ vs. `COST_AWARE`: $\$112.98$ & `NSGA2`: $\$158.29$ |
| **8** | PUE Spread | Pools at `PUE 1.08`, `1.40`, `1.75` (equal carbon/tariff) | All 9 | **PASS** | `FIRST_FIT`: $3,628.5\text{ kWh}$ vs. `ENERGY_AWARE`: $985.6\text{ kWh}$ & `NSGA2`: $1,005.8\text{ kWh}$ |
| **9** | Strict SLA Deadlines | 500 tasks with $0\text{–}1\text{h}$ peak-surge slack | All 9 | **PASS** | `FIRST_FIT`: $13.4\%$ SLA violations vs. `EDF`: $1.4\%$ & `NSGA2`: $0.8\%$ |
| **10** | Unschedulable Tasks | 3 impossible tasks (32k CPU, 64k GB RAM, $22\text{h}+5\text{h}>24\text{h}$) + 1 valid task | All 9 | **PASS** | All 7 algorithms marked the 3 impossible tasks `UNSCHEDULED` and scheduled the valid task |

---

## 6. Phase 1 Ablation Study: NSGA-II Evolutionary Search vs. Generation-0 Initialization

Executed via [tests/run_ablation_experiments.cjs](file:///c:/VSCODE%20PROJECTS/EcoFusion/tests/run_ablation_experiments.cjs) across the 5 random seeds (`42, 101, 202, 303, 404`) on $N = 500$ workloads using the frozen physical evaluation kernel.

### 6.1 Five-Seed Statistical Comparison ($\text{Mean} \pm \text{SD}$)

| Evolutionary Variant | Carbon ($\text{kgCO}_2$) | Energy ($\text{kWh}$) | Cost ($\text{USD}$) | SLA Violation ($\%$) | Composite Score ($0\text{–}100$) | Distinct $\mathcal{F}_1$ Solutions (of 14) | $\mathcal{F}_1$ Carbon Span ($\text{kg}$) | Runtime ($\text{ms}$) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`GEN0_SINGLE_BALANCED`** *(Single-Pass Balanced Seed $p=0$, $g=0$)* | $4,667.71 \pm 298.29$ | $14,721.04 \pm 556.54$ | $\$2,077.40 \pm 123.01$ | $3.04 \pm 1.67\%$ | $66.44 \pm 3.77$ | $1.00 \pm 0.00$ | $0.00 \pm 0.00$ | $16.16 \pm 4.41$ |
| **`GEN0_STOCHASTIC_POP`** *(Pure Random Init + Repair $P_0$, $g=0$)* | $4,981.07 \pm 380.68$ | $14,731.60 \pm 542.73$ | $\$2,011.40 \pm 100.56$ | $1.96 \pm 1.30\%$ | $66.68 \pm 1.66$ | $9.80 \pm 0.98$ | $437.50 \pm 118.16$ | $141.09 \pm 17.03$ |
| **`GEN8_STOCHASTIC_NSGA`** *(Pure Random Init Evolved to $g=8$)* | $5,059.22 \pm 290.44$ | $14,615.50 \pm 595.19$ | $\$2,004.96 \pm 143.15$ | $1.72 \pm 1.11\%$ | $70.04 \pm 3.51$ | **$14.00 \pm 0.00$** | $481.72 \pm 110.10$ | $815.42 \pm 48.18$ |
| **`GEN0_HEURISTIC_POP`** *(Hybrid Heuristic+Random $P_0$, $g=0$)* | $5,011.31 \pm 284.64$ | $14,668.64 \pm 582.03$ | $\$1,933.22 \pm 122.92$ | $1.68 \pm 1.11\%$ | $71.34 \pm 3.50$ | $8.60 \pm 1.36$ | $893.44 \pm 180.50$ | $226.18 \pm 61.73$ |
| **`FULL_NSGA2_ML_GEN8`** *(Full EcoFusion Hybrid NSGA-II, $g=8$)* | $5,031.14 \pm 217.16$ | **$14,591.88 \pm 637.83$** | $\$1,965.77 \pm 127.42$ | **$1.64 \pm 1.08\%$** | **$72.84 \pm 4.67$** | **$14.00 \pm 0.00$** | **$893.90 \pm 180.21$** | $936.74 \pm 84.09$ |

### 6.2 Per-Seed Breakdown (`GEN0_HEURISTIC_POP` at $g=0$ vs. `FULL_NSGA2_ML_GEN8` at $g=8$)

| Seed | `GEN0` Carbon | `GEN0` Energy | `GEN0` Cost | `GEN0` SLA | `GEN0` Score | `GEN8` Carbon | `GEN8` Energy | `GEN8` Cost | `GEN8` SLA | `GEN8` Score | Winner (`GEN8` vs. `GEN0`) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **42** | 4,655.52 | 13,912.6 | \$1,811.94 | 0.6% | 75.8 | 4,781.51 | **13,705.6** | \$1,825.81 | 0.8% | **79.2** | `GEN8` ($+3.4$ pts, $-207.0\text{ kWh}$) |
| **101** | 5,025.76 | 14,494.8 | \$1,842.57 | 0.8% | 71.9 | **4,908.57** | **14,381.9** | \$1,919.92 | 1.0% | **76.0** | `GEN8` ($+4.1$ pts, $-117.2\text{ kg CO}_2$, $-112.9\text{ kWh}$) |
| **202** | 4,760.88 | 14,439.1 | \$1,938.02 | 1.0% | 65.3 | 4,923.74 | **14,407.8** | **\$1,893.91** | **0.6%** | **66.1** | `GEN8` ($+0.8$ pts, $-\$44.11$, $-0.4\%$ SLA) |
| **303** | 5,449.46 | 15,676.8 | \$2,161.57 | 3.4% | 73.3 | **5,397.28** | **15,651.0** | \$2,197.39 | 3.4% | **73.6** | `GEN8` ($+0.3$ pts, $-52.2\text{ kg CO}_2$, $-25.8\text{ kWh}$) |
| **404** | 5,164.95 | 14,819.9 | **\$1,911.98** | 2.6% | **70.4** | **5,144.59** | **14,813.1** | \$1,991.84 | **2.4%** | 69.3 | `GEN0` ($+1.1$ pts due to $-\$79.86$ lower cost) |

### 6.3 Scientific Interpretation of Phase 1 Ablation
1. **Substantial Role of Directional Feasibility Repair ($P_0$):** Moving from a single balanced heuristic chromosome (`GEN0_SINGLE_BALANCED`: $66.44 \pm 3.77$, SLA $3.04\%$) to the 14-individual directional population $P_0$ (`GEN0_HEURISTIC_POP`: $71.34 \pm 3.50$, SLA $1.68\%$) already provides $+4.90$ composite score points because the 7 directional weight vectors span the Pareto simplex at initialization.
2. **Measurable Gain from Evolutionary Operators ($g = 0 \to 8$):**
   - Without warm-start heuristics (`GEN0_STOCHASTIC_POP` $\to$ `GEN8_STOCHASTIC_NSGA`), 8 generations of tournament selection, uniform crossover, and guided mutation improve the Composite Score by **$+3.36$ points ($66.68 \to 70.04$)** and reduce energy by $116.10\text{ kWh}$.
   - With warm-start heuristics (`GEN0_HEURISTIC_POP` $\to$ `FULL_NSGA2_ML_GEN8`), 8 generations of evolution improve the mean Composite Score by **$+1.50$ points ($71.34 \to 72.84$, winning on 4 of 5 seeds)**, reduce mean facility energy by $76.76\text{ kWh}$, reduce carbon standard deviation from $284.64\text{ kg}$ to $217.16\text{ kg}$, and expand the non-dominated front $\mathcal{F}_1(P_{\text{final}})$ from **$8.60 \pm 1.36$ to $14.00 \pm 0.00$ distinct Pareto solutions** ($100\%$ non-dominated population diversity).
   - **Honest Trade-Off Disclosure:** On Seed 404, `GEN0_HEURISTIC_POP` scored $70.4$ vs. $69.3$ for `FULL_NSGA2_ML_GEN8` because crossover shifted workloads slightly toward lower carbon ($-20.36\text{ kg}$) and lower SLA violations ($2.4\%$ vs. $2.6\%$) at the expense of $+\$79.86$ higher cost, and the internal population Utopia selector uses fixed normalization denominators (`1500, 850, 600`) whereas the external 7-algorithm benchmark normalizes against the empirical min/max of the 7 algorithms on that seed.

---

## 7. Phase 2 Ablation Study: Random Forest Urgency Ordering vs. Pure Deadline vs. FIFO Ordering

To isolate the exact contribution of the Random Forest demand & laxity predictor, `runPopulationNsga2` ($G = 8$, $N_{\text{pop}} = 14$) was executed under three workload ordering regimes across all 5 seeds (`42, 101, 202, 303, 404`):
- **Variant A (`FULL_NSGA2_ML_GEN8`):** Workloads ordered by Random Forest context-conditioned urgency $U_w = 0.65\,\text{deadline}_w + 0.35(\text{deadline}_w - a_w - \hat{d}_w)$, tie-broken by descending predicted energy footprint $\hat{c}_w \cdot \hat{d}_w$.
- **Variant B (`FULL_NSGA2_DEADLINE_GEN8`):** Workloads ordered strictly by known hard deadline $(\text{deadline}_w, a_w, \text{id}_w)$ without using ML predictions $\hat{d}_w$ or $\hat{c}_w$.
- **Variant C (`FULL_NSGA2_FIFO_GEN8`):** Workloads ordered chronologically by arrival time $(a_w, \text{id}_w)$ (FIFO).

### 7.1 Five-Seed Statistical Comparison ($\text{Mean} \pm \text{SD}$)

| Ordering Regime in NSGA-II | Carbon ($\text{kgCO}_2$) | Energy ($\text{kWh}$) | Cost ($\text{USD}$) | SLA Violation Rate ($\%$) | Composite Score ($0\text{–}100$) | Runtime ($\text{ms}$) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`FULL_NSGA2_FIFO_GEN8`** *(No-ML Chronological FIFO)* | $5,194.06 \pm 330.00$ | **$14,459.40 \pm 620.56$** | **$\$1,908.66 \pm 101.18$** | $7.40 \pm 1.39\%$ | $65.42 \pm 3.82$ | $1,075.52 \pm 332.11$ |
| **`FULL_NSGA2_DEADLINE_GEN8`** *(No-ML Pure Deadline)* | $5,033.03 \pm 390.44$ | $14,602.50 \pm 625.14$ | $\$2,020.57 \pm 119.52$ | $2.36 \pm 0.84\%$ | $69.84 \pm 3.58$ | $906.68 \pm 151.56$ |
| **`FULL_NSGA2_ML_GEN8`** *(Proposed RF Urgency + Energy Tie-Break)* | **$5,031.14 \pm 217.16$** | $14,591.88 \pm 637.83$ | $\$1,965.77 \pm 127.42$ | **$1.64 \pm 1.08\%$** | **$72.84 \pm 4.67$** | $936.74 \pm 84.09$ |

### 7.2 Scientific Interpretation of Phase 2 Ablation
1. **FIFO vs. ML Urgency Ordering ($65.42 \to 72.84$, $+7.42$ points):**
   When NSGA-II decodes and repairs chromosomes in FIFO arrival order (`FULL_NSGA2_FIFO_GEN8`), early-arriving flexible batch jobs ($a_w \in [03:00, 06:00]$ with $5\text{–}10\text{ h}$ slack) claim the cheapest and lowest-energy morning slots, achieving slightly lower energy ($14,459.40\text{ kWh}$) and cost ($\$1,908.66$). However, this starves strict-deadline morning surge jobs ($a_w \in [05:00, 08:00]$, $\text{slack} \in \{0, 1\}\text{ h}$), causing SLA violations to surge **$4.5\times$ from $1.64 \pm 1.08\%$ to $7.40 \pm 1.39\%$** across every single seed (`5.6%, 7.8%, 6.0%, 9.2%, 8.4%`).
2. **Pure Deadline vs. Random Forest Laxity Ordering ($69.84 \to 72.84$, $+3.00$ points):**
   Decomposing the $+7.42$-point gain over FIFO reveals that **approximately $60\%$ ($+4.42$ points, $65.42 \to 69.84$) comes from deadline ordering**, while the remaining **$40\%$ ($+3.00$ points, $69.84 \to 72.84$, cutting SLA violations from $2.36\%$ to $1.64\%$ and saving $\$54.80$ in electricity cost)** comes specifically from the Random Forest context-conditioned duration ($\hat{d}_w$) and CPU ($\hat{c}_w$) predictions. When multiple workloads share the same deadline hour (`deadline = 12:00`), Pure Deadline ordering cannot distinguish a 5-hour `Climate Mesh` job (`slack = 0h`) from a 1-hour `IoT` job (`slack = 4h`), whereas the Random Forest predictor estimates $\hat{d}_w$ and $\hat{c}_w$ from the pre-execution job category and arrival context, prioritizing the long, heavy, zero-slack job first.

