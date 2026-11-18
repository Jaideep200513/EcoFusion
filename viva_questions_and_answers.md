# EcoFusion: Capstone Viva-Voce Defense Questions & Answers (45 Questions)

This guide contains **45 technical viva-voce questions and model answers** organized across 6 thematic sections, including challenging examiner questions on mathematical assumptions, normalization formulas, ablation interpretation, and simulation boundaries.

---

## Section A: Research Problem, Motivation & Cloud Sustainability (Q1–Q7)

### Q1. Why did you choose multi-objective workload orchestration for cloud data centers as your research problem?
**Answer:** Cloud data centers face simultaneous pressures to reduce carbon emissions ($\text{kgCO}_2$), facility energy consumption ($\text{kWh}$), and operational electricity cost ($\text{USD}$) while meeting strict SLA deadlines. Because clean grids, low-PUE facilities, and low electricity tariffs rarely coincide in the same region or hour, single-objective schedulers create severe trade-off blindspots. Multi-objective orchestration addresses all four dimensions simultaneously.

### Q2. Why do single-objective heuristics fail in geographically distributed cloud environments?
**Answer:** Environmental and economic signals are anti-correlated across space and time. For example, Singapore (`POOL-SIN`) has the lowest base carbon intensity ($270\text{ gCO}_2/\text{kWh}$) but the highest electricity tariff ($\$0.165/\text{kWh}$, rising $1.40\times$ during peak hours). Conversely, Mumbai (`POOL-BOM`) has the cheapest tariff ($\$0.085/\text{kWh}$, dropping to $0.60\times$ at night) but relies heavily on coal ($620\text{ gCO}_2/\text{kWh}$). Optimizing only one metric inevitably degrades the others.

### Q3. What is Power Usage Effectiveness (PUE), and how does it differ from IT server energy?
**Answer:** $\text{PUE} = E_{\text{facility}} / E_{\text{IT}}$ is the dimensionless ratio of total data center facility energy (which includes cooling, chillers, lighting, and power distribution losses) to the energy consumed directly by IT compute servers. A $\text{PUE}$ of $1.30$ means that for every $1.0\text{ kWh}$ consumed by servers, an additional $0.30\text{ kWh}$ is consumed by cooling and overhead.

### Q4. Why does PUE vary across time of day in your mathematical model?
**Answer:** Air-cooled and hybrid-chiller data centers experience higher heat-rejection overhead during hot midday hours (`09:00–15:00`) and lower cooling overhead during cooler night hours (`22:00–05:00`). EcoFusion models this via a diurnal thermal offset $\Delta\text{PUE}_{\text{thermal}}(p, h) \in [-0.05, +0.08]$ added to $\text{PUE}_{\text{base}}(p)$ with a physical floor of $1.08$.

### Q5. What is the difference between spatial shifting and temporal shifting in cloud scheduling?
**Answer:** **Spatial shifting** routes a workload to a different geographic data center pool ($p \in \{\text{Mumbai}, \text{Hyderabad}, \text{Singapore}\}$) based on regional grid carbon, PUE, or tariff differences. **Temporal shifting** delays a workload's start time $t_w$ within its feasible slack window $[a_w, \text{deadline}_w - d_w]$ to coincide with midday solar generation or night off-peak electricity tariffs.

### Q6. How can temporal workload shifting inadvertently increase SLA violations?
**Answer:** When a scheduler shifts early-arriving flexible batch jobs ($a_w \in [03:00, 06:00]$) into midday solar hours (`09:00–15:00`) or packs them into early morning slots, those jobs occupy contiguous CPU and RAM capacity. When strict-deadline jobs ($\text{slack} \in \{0, 1\}\text{ h}$) arrive during those hours, capacity is saturated, forcing the urgent jobs past their deadlines.

### Q7. Why did you compare seven specific scheduling algorithms?
**Answer:** The seven algorithms span the complete taxonomy of scheduling paradigms:
1. `RANDOM` (unguided stochastic baseline)
2. `FIRST_FIT` (standard chronological FIFO queue baseline)
3. `CARBON_AWARE` (carbon-only greedy specialist)
4. `ENERGY_AWARE` (energy/PUE-only greedy specialist)
5. `COST_AWARE` (tariff-only greedy specialist)
6. `EDF` (deadline/SLA-only greedy specialist)
7. `ECOFUSION_NSGA2` (proposed ML-guided multi-objective evolutionary scheduler).

---

## Section B: Physical Mathematical Models & Fairness (Q8–Q15)

### Q8. How is server IT power calculated for each workload, and why is idle power included?
**Answer:** Enterprise servers consume $25\%\text{–}30\%$ of peak power even when idle. In EcoFusion, a workload requiring $c_w$ cores on a pool of capacity $C_{\text{CPU}}(p)$ is allocated a proportional share $c_w / C_{\text{CPU}}(p)$ of the pool's idle power plus utilization-dependent dynamic power:
$$P_{\text{IT}}(w, p, h) = \frac{c_w}{C_{\text{CPU}}(p)}\Bigl[P_{\text{idle}}(p) + \bigl(P_{\text{max}}(p) - P_{\text{idle}}(p)\bigr)\cdot\bigl(0.45 + 0.55\,u_{\text{CPU}}(p, h)\bigr)\Bigr]$$

### Q9. Why was allocating 100% of server idle power to the first workload in a slot a bug in the pre-audit backend?
**Answer:** Charging 100% of `pool.idle_power` only when `used_cpu == 0` penalized whichever workload happened to be placed first in an empty time slot while making subsequent workloads in that slot appear artificially energy-free. Proportional capacity-share allocation ($c_w / C_{\text{CPU}}(p)$) ensures consistent marginal attribution across all tasks.

### Q10. How are carbon emissions and electricity cost integrated for multi-hour workloads?
**Answer:** Rather than multiplying total workload energy by the carbon intensity or tariff of the start hour $t_w$ alone, EcoFusion integrates hour-by-hour across every occupied slot $h \in \{t_w, \dots, t_w + d_w - 1\}$:
$$C_{\text{gCO2}} = \sum_{h=t_w}^{t_w+d_w-1} E_{\text{facility}}(w, p, h)\cdot \text{CI}_{\text{eff}}(p, h), \qquad \text{Cost}_{\text{USD}} = \sum_{h=t_w}^{t_w+d_w-1} E_{\text{facility}}(w, p, h)\cdot \text{Tariff}_{\text{eff}}(p, h)$$

### Q11. How is an SLA violation defined mathematically in EcoFusion?
**Answer:** A workload $w$ incurs an SLA violation if and only if (a) it cannot be scheduled anywhere within the 24-hour horizon (`status == UNSCHEDULED`), or (b) its completion hour exceeds its hard deadline ($t_w + d_w > \text{deadline}_w$). The SLA violation rate is $100 \times (\text{violated tasks} / N)\%$.

### Q12. What makes the comparison across all seven algorithms strictly fair?
**Answer:** All seven algorithms receive the exact same workload array $\mathcal{W}$, the exact same pool CPU and RAM capacities, the exact same arrival and deadline constraints, and are evaluated by the exact same `calculateMetrics()` function using actual workload demands $(c_w, m_w, d_w)$. No algorithm receives a resource-sizing discount or artificial SLA penalty.

### Q13. Why was the pre-audit `0.85x` right-sizing multiplier unfair to the baseline algorithms?
**Answer:** In the pre-audit code, `calculateMetrics()` evaluated EcoFusion on $0.85\times$ predicted CPU and duration while evaluating the six baselines on $1.0\times$ actual demands. That gave EcoFusion an automatic $\sim 27\%$ energy, carbon, and cost reduction regardless of where it placed workloads. Removing that discount restored scientific fairness.

### Q14. How are CPU and Memory (RAM) constraints enforced simultaneously?
**Answer:** Both engines maintain 2D reservation matrices $\text{CPU}_{\text{used}}[p][h]$ and $\text{MEM}_{\text{used}}[p][h]$ across all pools $p$ and hours $h \in [0, 23]$. A candidate placement $(p, t_w)$ is rejected if **either** $\text{CPU}_{\text{used}}[p][h] + c_w > C_{\text{CPU}}(p)$ **or** $\text{MEM}_{\text{used}}[p][h] + m_w > C_{\text{MEM}}(p)$ for any hour $h \in [t_w, t_w + d_w - 1]$.

### Q15. What happens when a workload's resource request exceeds cluster capacity or arrives too late to finish within 24 hours?
**Answer:** As verified in Automated Test Scenarios 5 and 10, if $\mathcal{C}_w = \emptyset$ (no pool and slot can fit the workload within $[a_w, 24]$), all seven algorithms explicitly assign `poolId = 'UNSCHEDULED'`, set `slaFeasible = false`, record $0\text{ kWh}$ energy, and increment the SLA violation counter by $1$.

---

## Section C: Machine Learning Pipeline & Target Leakage (Q16–Q22)

### Q16. Why did you use a Random Forest Regressor for workload demand prediction?
**Answer:** Random Forest ensembles handle non-linear interactions between categorical job domains, arrival hours, and priority tiers without requiring feature scaling, are resistant to overfitting on tabular cloud trace metadata, and provide prediction confidence estimates via inter-tree variance.

### Q17. What is target leakage in machine learning, and where did it exist before the audit?
**Answer:** Target leakage occurs when information from the ground-truth prediction target is inadvertently included in the input features. Prior to the audit, `extract_features_from_workload(wl)` copied `wl.cpu_required`, `wl.memory_required`, and `wl.duration` directly into `historical_cpu_mean`, `historical_memory_mean`, and `historical_duration_mean`.

### Q18. How did you eliminate target leakage in the corrected feature engineering pipeline?
**Answer:** We replaced the target copies with pre-execution contextual priors conditioned strictly on submission metadata available before execution: `arrival_time`, `hour_of_day`, `priority` / job domain category, and SLA slack window. We also added unit test `test_ml_no_target_leakage`, which verifies that two workloads with identical arrival context but different ground-truth CPU/RAM targets ($16$ vs. $512$ cores) produce the exact same input feature vector.

### Q19. If ML predictions do not change physical workload sizes, how do they influence EcoFusion's scheduling decisions?
**Answer:** The Random Forest predictions $(\hat{c}_w, \hat{m}_w, \hat{d}_w)$ are used to compute each workload's urgency score:
$$U_w = 0.65\,\text{deadline}_w + 0.35\,\bigl(\text{deadline}_w - a_w - \hat{d}_w\bigr)$$
with ties broken by descending predicted energy footprint $\hat{c}_w \cdot \hat{d}_w$. This orders chromosome genes so that tight-slack, long-duration heavy jobs are decoded and repaired first, reserving contested peak-hour capacity before flexible batch jobs are placed.

### Q20. What did the Phase 2 ML Urgency-Ordering Ablation prove empirically?
**Answer:** Across 5 seeds (`42, 101, 202, 303, 404`), running NSGA-II with chronological FIFO ordering (`FULL_NSGA2_FIFO_GEN8`) resulted in **$7.40 \pm 1.39\%$ SLA violations** and a Composite Score of **$65.42 \pm 3.82$**. Using Random Forest urgency ordering (`FULL_NSGA2_ML_GEN8`) reduced SLA violations by **$77.8\%$ relative (to $1.64 \pm 1.08\%$)** and improved the Composite Score by **$+7.42$ points (to $72.84 \pm 4.67$)**.

### Q21. Tough Examiner Question: Doesn't sorting by known deadline (`EDF`) achieve the same gain without needing a Random Forest model?
**Answer:** We tested that exact hypothesis in our Phase 2 control experiment (`FULL_NSGA2_DEADLINE_GEN8`), which sorts workloads strictly by known $(\text{deadline}_w, a_w)$ without ML predictions. Pure deadline ordering improved the Composite Score from $65.42$ (FIFO) to $69.84$ ($+4.42$ points, SLA $2.36 \pm 0.84\%$). Adding Random Forest predicted duration $\hat{d}_w$ and CPU $\hat{c}_w$ (`FULL_NSGA2_ML_GEN8`) contributed an **additional $+3.00$ points ($69.84 \to 72.84$)**, cut SLA violations by a further **$30.5\%$ relative ($2.36\% \to 1.64\%$)**, and saved **$\$54.80$ in electricity cost** because $\hat{d}_w$ and $\hat{c}_w$ distinguish 5-hour heavy jobs (`slack = 0h`) from 1-hour small jobs (`slack = 4h`) that share the same deadline hour.

### Q22. Why does FIFO ordering (`FULL_NSGA2_FIFO_GEN8`) achieve slightly lower energy ($14,459.4\text{ kWh}$) and cost ($\$1,908.66$) than ML urgency ordering ($14,591.9\text{ kWh}$, $\$1,965.77$)?
**Answer:** Under FIFO ordering, early-arriving flexible batch jobs ($03:00\text{–}06:00$) are decoded first and claim the coolest night/morning PUE and off-peak tariff slots (`03:00–08:00`), slightly lowering energy and cost. However, doing so blocks morning surge jobs (`05:00–08:00`) that have zero slack, causing SLA violations to jump from $1.64\%$ to $7.40\%$.

---

## Section D: NSGA-II Optimization, Pareto Front & Ablation (Q23–Q32)

### Q23. Why did you choose NSGA-II over a single weighted-sum objective function?
**Answer:** A single weighted-sum objective collapses all four metrics into one scalar, requiring predetermined weights before optimization and failing to discover non-convex regions of the trade-off surface. NSGA-II evolves a population of schedules simultaneously and returns a set of non-dominated Pareto solutions ($\mathcal{F}_1$), allowing operators to inspect the full trade-off frontier.

### Q24. How is a complete schedule encoded as a chromosome in EcoFusion?
**Answer:** Each chromosome is an integer array $\mathbf{x} \in \mathbb{Z}^N$ of length $N$ (number of workloads). For the $i$-th urgency-ordered workload, gene $x_i = p_i \cdot |\mathcal{T}| + t_i$ encodes both the assigned resource pool index $p_i = \lfloor x_i / |\mathcal{T}| \rfloor \in \{0, 1, 2\}$ and start time slot $t_i = x_i \bmod |\mathcal{T}| \in \{0, \dots, 23\}$.

### Q25. What is Pareto dominance, and how does Fast Non-Dominated Sorting work?
**Answer:** Schedule $\mathbf{a}$ Pareto-dominates schedule $\mathbf{b}$ ($\mathbf{a} \prec \mathbf{b}$) if $\mathbf{a}$ is no worse than $\mathbf{b}$ in all four objectives ($\forall m \in \{1..4\}, f_m(\mathbf{a}) \le f_m(\mathbf{b})$) and strictly better in at least one objective ($\exists m, f_m(\mathbf{a}) < f_m(\mathbf{b})$). Fast Non-Dominated Sorting partitions the combined population $R_g = P_g \cup Q_g$ into successive non-dominated fronts $\mathcal{F}_1, \mathcal{F}_2, \dots$ in $\mathcal{O}(M N_{\text{pop}}^2)$ time.

### Q26. What is the purpose of Crowding Distance in NSGA-II?
**Answer:** Within the same Pareto front $\mathcal{F}_k$, Crowding Distance $d_i$ measures the normalized L1 perimeter of the cuboid formed by an individual's immediate neighbors $(i-1, i+1)$ along each objective axis. Boundary solutions receive $d = \infty$, and interior solutions in less crowded regions receive larger $d_i$, preserving diversity across the Pareto frontier without requiring user-tuned sharing parameters.

### Q27. How does the CPU & RAM Feasibility Repair operator work during chromosome evaluation?
**Answer:** Standard crossover and mutation can place too many workloads into the same pool and hour, violating $C_{\text{CPU}}(p)$ or $C_{\text{MEM}}(p)$. During decoding (`evaluateAndRepairChromosome`), if gene $x_i$ violates arrival time, horizon end, deadline, or remaining CPU/RAM capacity, the repair operator scans all capacity-feasible $(p, t)$ pairs and assigns the pair minimizing the chromosome's directional objective proxy $\psi(p, t)$.

### Q28. Tough Examiner Question: In your Phase 1 ablation, `GEN0_HEURISTIC_POP` ($g=0$) already gets $71.34 \pm 3.50$, while `FULL_NSGA2_ML_GEN8` ($g=8$) gets $72.84 \pm 4.67$. Doesn't that mean the heuristic repair operator is doing most of the work rather than NSGA-II evolution?
**Answer:** Yes, and we explicitly disclose this in Section 17 of the paper and Section 4 of `research_methodology.md`. EcoFusion is a **hybrid memetic evolutionary algorithm**: initializing the first 7 individuals of $P_0$ with directional repair vectors provides strong initial coverage ($71.34 \pm 3.50$ in $226\text{ ms}$ vs. $66.44 \pm 3.77$ for a single balanced heuristic). The 8 subsequent generations of crossover, mutation, and tournament selection provide two distinct benefits: (1) they improve the mean Composite Score by $+1.50$ points (winning on 4 of 5 seeds) and reduce mean energy by $76.8\text{ kWh}$, and (2) they expand the non-dominated Pareto front $\mathcal{F}_1(P_{\text{final}})$ from **$8.60 \pm 1.36$ to $14.00 \pm 0.00$ distinct solutions**. Furthermore, when warm-start heuristic seeds are disabled (`GEN0_STOCHASTIC_POP` $\to$ `GEN8_STOCHASTIC_NSGA`), the 8 evolutionary generations improve the Composite Score by **$+3.36$ points ($66.68 \to 70.04$)**.

### Q29. Tough Examiner Question: Why did `GEN0_HEURISTIC_POP` score higher than `FULL_NSGA2_ML_GEN8` on Seed 404 ($70.4$ vs. $69.3$)?
**Answer:** That occurs due to a slight mathematical difference between the **internal population knee selector** (`scoreIndividual`) and the **external 7-algorithm benchmark score** (`calculateComparisons`). Inside `runPopulationNsga2`, `scoreIndividual` normalizes Carbon, Energy, and Cost using lower-bounded denominators $\max(1500, \Delta C)$, $\max(850, \Delta E)$, and $\max(600, \Delta\text{Cost})$ with weights $[0.4, 0.3, 0.3, 1.5]$. On Seed 404, `GEN8` evolved a knee solution with lower carbon ($5,144.59$ vs. $5,164.95\text{ kg}$), lower energy ($14,813.1$ vs. $14,819.9\text{ kWh}$), and lower SLA violations ($2.4\%$ vs. $2.6\%$), but $+\$79.86$ higher cost ($\$1,991.84$ vs. $\$1,911.98$). When evaluated by the external benchmark formula—which normalizes strictly by the empirical min/max across the 7 algorithms with equal $0.25$ weights—that $+\$79.86$ cost difference lowered the external composite score by $1.1$ points.

### Q30. How does EcoFusion select a single deployed schedule from the Pareto front $\mathcal{F}_1$?
**Answer:** It computes the 4D Utopia Euclidean Distance from each individual in the final population to the population minimum vector $(C_{\min}, E_{\min}, \text{Cost}_{\min}, 0\%\text{ SLA})$ and selects the **Best Compromise Knee solution** with minimum distance, while also exposing the `Carbon Priority`, `Cost Priority`, and `Energy Priority` Pareto extremes in the UI so operators can switch policies interactively.

### Q31. Why does EcoFusion not beat `CARBON_AWARE` on carbon, `ENERGY_AWARE` on energy, or `COST_AWARE` on cost?
**Answer:** Because in a fair physical simulation without artificial discounts, a single-objective greedy specialist that ignores cost and PUE will naturally achieve lower carbon ($4,116.44\text{ kg}$) than a balanced compromise schedule ($4,781.51\text{ kg}$). However, `CARBON_AWARE` pays $\$2,365.94$ and suffers $12.0\%$ SLA violations, whereas EcoFusion achieves balanced performance across all four metrics ($0.8\%$ SLA violations, $79.2/100$ composite score).

### Q32. What are the differences between the browser TypeScript NSGA-II and the backend Python NSGA-II?
**Answer:** To ensure sub-second interactive browser execution on 500–1,000 workloads, the TypeScript engine ([src/services/simulatorService.ts](file:///c:/VSCODE%20PROJECTS/EcoFusion/src/services/simulatorService.ts)) uses `popSize = 14, generations = 8`, uniform crossover ($p_c = 0.5$), and directional proxy repair. The offline Python backend ([backend/app/optimization/nsga2_optimizer.py](file:///c:/VSCODE%20PROJECTS/EcoFusion/backend/app/optimization/nsga2_optimizer.py)) defaults to `population_size = 50, generations = 50`, two-point crossover ($p_c = 0.9$), and first-feasible slot repair.

---

## Section E: Evaluation Metrics, Reproducibility & Testing (Q33–Q39)

### Q33. Is the reported $79.2$ (single-seed) or $72.84$ (5-seed) score a physical efficiency percentage?
**Answer:** **No.** It is a **Composite Multi-Objective Utopia Proximity Score** defined as $100 \cdot (1 - D_{\text{Utopia}})$, where $D_{\text{Utopia}}$ is the root-mean-square normalized Euclidean distance to the empirical ideal point across Carbon, Energy, Cost, and SLA. It is a multi-criteria decision analysis (MCDA) index, not thermodynamic efficiency.

### Q34. Why is the SLA penalty in the Composite Score anchored to a $15\%$ ceiling ($\min(1.2, \text{SLA}/15.0)$) instead of normalizing against `RANDOM`'s $49.0\%$ SLA violation rate?
**Answer:** In cloud SLAs, violation rates above $10\%\text{–}15\%$ represent severe operational failure. If the SLA term were normalized against `RANDOM`'s $49.0\%$ violation rate, a scheduler with $12\%\text{–}13\%$ SLA violations (`FIRST_FIT` or `CARBON_AWARE`) would appear to have only a $\sim 0.25$ normalized SLA penalty. Anchoring the SLA scale to $15.0\%$ ensures that $4\%\text{–}13\%$ SLA violation rates are penalized realistically.

### Q35. Why did you run experiments across five random seeds (`42, 101, 202, 303, 404`)?
**Answer:** A single synthetic workload trace (`Seed 42`) could happen to have arrival bursts that favor one heuristic. Evaluating five independent seeds tests both **identical-seed determinism** (running the same seed twice yields bit-for-bit identical results) and **cross-trace robustness** ($\text{Mean} \pm \text{SD}$ across 5 distinct workload arrival/demand traces and PRNG sequences).

### Q36. Is a sample size of $n = 5$ seeds large enough to claim parametric statistical significance ($p < 0.01$) for small differences?
**Answer:** For large effect sizes—such as `FULL_NSGA2_ML_GEN8` ($1.64 \pm 1.08\%$ SLA) vs. `FULL_NSGA2_FIFO_GEN8` ($7.40 \pm 1.39\%$ SLA), where every single seed shows a $>4.8\%$ SLA reduction—$n = 5$ is unmistakable. However, for small effect sizes—such as the $+1.50$-point mean difference between `GEN0_HEURISTIC_POP` ($71.34 \pm 3.50$) and `FULL_NSGA2_ML_GEN8` ($72.84 \pm 4.67$)—$n = 5$ has limited statistical power, which is why we report descriptive $\text{Mean} \pm \text{SD}$ and seed win ratios (`4/5` seeds) rather than overclaiming parametric $p$-values.

### Q37. How does your deterministic pseudo-random number generator (PRNG) guarantee reproducibility?
**Answer:** Both workload generation (`generateSyntheticWorkloads`) and stochastic algorithm choices (`RANDOM` and `runPopulationNsga2`) use a seeded Linear Congruential Generator (`seed = (seed * 9301 + 49297) % 233280`) rather than `Math.random()`. Automated assertions verify `assert.deepStrictEqual(run1, run2)` for every seed.

### Q38. What are the 10 automated test scenarios and 9 physical invariants verified in your test suite?
**Answer:** The 10 scenarios test Small tasks, Heavy tasks, CPU-bound tasks, RAM-bound tasks, Insufficient cluster capacity, Carbon spread, Tariff spread, PUE spread, Strict SLA deadlines, and Unschedulable tasks (`32,000` CPU, `64,000` GB RAM, and horizon overflow). Across every scenario and all 7 algorithms, the suite asserts 9 invariants: (1) no missing tasks, (2) no duplicate task IDs, (3) zero CPU overcommitment, (4) zero RAM overcommitment, (5) non-negative resource availability, (6) valid $[a_w, H]$ execution intervals, (7) non-negative physical metrics, (8) exact SLA rate consistency, and (9) bit-for-bit seed determinism.

### Q39. Why does `First-Fit` perform poorly on both Carbon ($6,088.38\text{ kg}$) and SLA violations ($13.4\%$) on Seed 42?
**Answer:** First-Fit processes tasks in chronological arrival order and checks pools in configuration order (`poolOrder = 0, 1, 2`), where Pool 0 is `POOL-BOM` (Mumbai, coal-heavy grid with $620\text{ gCO}_2/\text{kWh}$ and $\text{PUE} = 1.30$). It packs early-arriving flexible batch jobs into Mumbai first, driving up carbon emissions, and saturates morning slots across all three pools before strict-deadline morning surge tasks arrive.

---

## Section F: Limitations, Practical Deployment & Future Work (Q40–Q45)

### Q40. What are the limitations of using a 1-hour time-slot discretization ($\Delta t = 1\text{ h}$)?
**Answer:** Rounding workload durations to integer hours (`Math.max(1, Math.round(duration))`) means a 15-minute microservice batch job reserves a full 1-hour slot, over-estimating capacity occupancy and preventing sub-hour task packing.

### Q41. Why is EcoFusion described as a simulation framework rather than a production Kubernetes scheduler?
**Answer:** EcoFusion models workload execution, server power curves, regional grid carbon intensities, and Time-of-Use tariffs mathematically in a discrete-event simulator. It does not interface with live container runtimes (`containerd`), hardware RAPL power meters, or real-time grid telemetry APIs (such as ElectricityMaps or WattTime).

### Q42. Does EcoFusion model network data-transfer latency or energy when placing a workload in Singapore vs. Mumbai?
**Answer:** Not in the current version. Workloads are modeled as compute-bound batch jobs whose input state is available across regions without wide-area network (WAN) egress energy or data-gravity latency penalties. Adding WAN transfer modeling is a key item in Future Work.

### Q43. Does EcoFusion support task preemption or live cross-region VM migration mid-execution?
**Answer:** No. Once a workload is scheduled at start slot $t_w$ on pool $p$, it executes contiguously across $[t_w, t_w + d_w - 1]$ without preemption or live migration.

### Q44. What is the computational runtime overhead of EcoFusion NSGA-II compared to greedy heuristics?
**Answer:** On $N = 500$ workloads in Node.js, a single greedy pass takes $\sim 16\text{ ms}$, initializing the 14-individual hybrid population $P_0$ takes $\sim 226\text{ ms}$, and running Full EcoFusion NSGA-II for 8 generations (`126` full schedule evaluations + repair) takes **$936.74 \pm 84.09\text{ ms}$** ($\sim 0.94\text{ seconds}$)—fast enough for interactive batch scheduling while trading $\sim 0.9\text{ s}$ of compute time for superior multi-objective balance.

### Q45. How would you extend EcoFusion for a real-world cloud deployment in future work?
**Answer:** Three steps: (1) reduce slot granularity to $\Delta t = 5\text{ minutes}$ with rolling-horizon rescheduling, (2) integrate live regional marginal carbon intensity APIs and WAN data-transfer costs into `calculateMetrics`, and (3) deploy the trained Random Forest predictor and NSGA-II solver as a custom Kubernetes batch scheduler plugin (e.g., via Kueue or Volcano).
