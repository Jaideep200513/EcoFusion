# EcoFusion: Technical Algorithm & Mathematical Model Reference

This document provides the complete technical specification, pseudocode, constraint-handling rules, and computational complexity of all seven scheduling algorithms implemented in [src/services/simulatorService.ts](file:///c:/VSCODE%20PROJECTS/EcoFusion/src/services/simulatorService.ts) and [backend/app/schedulers/](file:///c:/VSCODE%20PROJECTS/EcoFusion/backend/app/schedulers).

---

## 1. Common Feasibility & Physical Evaluation Kernel

Every scheduling algorithm operates over:
- Workloads $\mathcal{W} = \{w_1, \dots, w_N\}$ with $(a_w, c_w, m_w, d_w, \text{deadline}_w)$
- Active resource pools $\mathcal{P} = \{p_1, \dots, p_M\}$ with $(C_{\text{CPU}}(p), C_{\text{MEM}}(p), \text{PUE}_{\text{base}}(p), P_{\text{idle}}(p), P_{\text{max}}(p), \text{CI}_{\text{base}}(p), \text{Tariff}_{\text{base}}(p))$
- Hourly time slots $\mathcal{T} = \{0, 1, \dots, H-1\}$ ($H = 24$)

### Hard Feasibility Predicate $\text{CanFit}(w, p, t)$
A candidate assignment $(p, t)$ is capacity-eligible for workload $w$ if and only if:
1. $t \ge a_w$ (cannot start before arrival)
2. $t + d_w \le H$ (must complete within simulation horizon)
3. $\forall h \in \{t, \dots, t + d_w - 1\}$:
   $$\text{CPU}_{\text{used}}[p][h] + c_w \le C_{\text{CPU}}(p) \quad \land \quad \text{MEM}_{\text{used}}[p][h] + m_w \le C_{\text{MEM}}(p)$$

### SLA Compliance Predicate $\text{IsSlaFeasible}(w, t)$
$$\text{IsSlaFeasible}(w, t) \iff (t + d_w \le \text{deadline}_w)$$

---

## 2. Specification of Individual Scheduling Algorithms

### Algorithm 1: Random Placement Heuristic (`RANDOM`)
- **Paradigm:** Unguided stochastic baseline.
- **Workload Ordering:** Chronological arrival order $(a_w, \text{id}_w)$.
- **Candidate Selection:**
  1. Collect all capacity-eligible pairs $\mathcal{C}_w = \{(p, t) \mid \text{CanFit}(w, p, t)\}$.
  2. If $\mathcal{C}_w = \emptyset$, mark $w$ as `UNSCHEDULED` ($\text{SLA violation} = \text{true}$).
  3. Filter near-arrival window $\mathcal{C}_w^{\text{near}} = \{(p, t) \in \mathcal{C}_w \mid t + d_w \le \text{deadline}_w + 2\}$. Let $\mathcal{S}_w = \mathcal{C}_w^{\text{near}}$ if non-empty, else $\mathcal{C}_w$.
  4. Sample $(p^*, t^*) \sim \text{Uniform}(\mathcal{S}_w)$ using the seeded LCG PRNG (`seed = (seed * 9301 + 49297) % 233280`).
- **Time Complexity:** $\mathcal{O}(N \cdot |\mathcal{P}| \cdot |\mathcal{T}| \cdot \bar{d})$.

---

### Algorithm 2: First-Fit Chronological (`FIRST_FIT`)
- **Paradigm:** FIFO queue-order greedy placement.
- **Workload Ordering:** Strictly chronological arrival order $(a_w, \text{id}_w)$.
- **Candidate Selection:**
  1. Collect all capacity-eligible pairs $\mathcal{C}_w = \{(p, t) \mid \text{CanFit}(w, p, t)\}$.
  2. Sort $\mathcal{C}_w$ lexicographically by:
     - Primary key: $\text{IsSlaFeasible}(w, t)$ (`true` before `false`)
     - Secondary key: Server pool configuration index $\text{poolOrder}(p) \in \{0, \dots, |\mathcal{P}|-1\}$
     - Tertiary key: Chronological start hour $t$
  3. Select $\mathcal{C}_w[0]$ and reserve CPU and RAM across $[t^*, t^* + d_w - 1]$.
- **Time Complexity:** $\mathcal{O}(N \cdot |\mathcal{P}| \cdot |\mathcal{T}| \cdot \bar{d})$.

---

### Algorithm 3: Carbon-Aware Heuristic (`CARBON_AWARE`)
- **Paradigm:** Single-objective carbon emissions minimization.
- **Workload Ordering:** Chronological arrival order $(a_w, \text{id}_w)$.
- **Candidate Selection:**
  1. For each $(p, t) \in \mathcal{C}_w$, compute exact PUE-adjusted carbon emissions $\hat{C}_{\text{gCO2}}(w, p, t)$.
  2. Sort $\mathcal{C}_w$ lexicographically by:
     - Primary key: $\text{IsSlaFeasible}(w, t)$ (`true` before `false`)
     - Secondary key: $\hat{C}_{\text{gCO2}}(w, p, t)$ (ascending)
  3. Select $\mathcal{C}_w[0]$.
- **Time Complexity:** $\mathcal{O}(N \cdot |\mathcal{P}| \cdot |\mathcal{T}| \cdot \bar{d})$.

---

### Algorithm 4: Energy-Aware Heuristic (`ENERGY_AWARE`)
- **Paradigm:** Single-objective facility energy ($\text{kWh}$) minimization.
- **Workload Ordering:** Chronological arrival order $(a_w, \text{id}_w)$.
- **Candidate Selection:**
  1. For each $(p, t) \in \mathcal{C}_w$, compute PUE-adjusted facility energy $\hat{E}_{\text{facility}}(w, p, t)$.
  2. Sort $\mathcal{C}_w$ lexicographically by:
     - Primary key: $\text{IsSlaFeasible}(w, t)$ (`true` before `false`)
     - Secondary key: $\hat{E}_{\text{facility}}(w, p, t)$ (ascending)
  3. Select $\mathcal{C}_w[0]$.
- **Time Complexity:** $\mathcal{O}(N \cdot |\mathcal{P}| \cdot |\mathcal{T}| \cdot \bar{d})$.

---

### Algorithm 5: Cost-Aware Heuristic (`COST_AWARE`)
- **Paradigm:** Single-objective electricity tariff expenditure ($\text{USD}$) minimization.
- **Workload Ordering:** Chronological arrival order $(a_w, \text{id}_w)$.
- **Candidate Selection:**
  1. For each $(p, t) \in \mathcal{C}_w$, compute Time-of-Use electricity cost $\hat{\text{Cost}}_{\text{USD}}(w, p, t)$.
  2. Sort $\mathcal{C}_w$ lexicographically by:
     - Primary key: $\text{IsSlaFeasible}(w, t)$ (`true` before `false`)
     - Secondary key: $\hat{\text{Cost}}_{\text{USD}}(w, p, t)$ (ascending)
     - Tertiary key: Chronological start hour $t$ (compact off-peak packing)
  3. Select $\mathcal{C}_w[0]$.
- **Time Complexity:** $\mathcal{O}(N \cdot |\mathcal{P}| \cdot |\mathcal{T}| \cdot \bar{d})$.

---

### Algorithm 6: Earliest Deadline First (`EDF`)
- **Paradigm:** Deadline-driven SLA & latency prioritization.
- **Workload Ordering:** Sorted by earliest hard deadline $(\text{deadline}_w, a_w, \text{id}_w)$.
- **Candidate Selection:**
  1. Collect all capacity-eligible pairs $\mathcal{C}_w$.
  2. Sort $\mathcal{C}_w$ lexicographically by:
     - Primary key: $\text{IsSlaFeasible}(w, t)$ (`true` before `false`)
     - Secondary key: Earliest start hour $t$ (ascending)
     - Tertiary key: Current pool CPU utilization $u_{\text{CPU}}(p, t) = \text{CPU}_{\text{used}}[p][t] / C_{\text{CPU}}(p)$ (ascending, load-balancing across pools)
  3. Select $\mathcal{C}_w[0]$.
- **Time Complexity:** $\mathcal{O}(N \log N + N \cdot |\mathcal{P}| \cdot |\mathcal{T}| \cdot \bar{d})$.

---

### Algorithm 7: EcoFusion Proposed Multi-Objective NSGA-II (`ECOFUSION_NSGA2`)
- **Paradigm:** ML-guided evolutionary multi-objective optimization.
- **Step 1 — ML Demand & Laxity Urgency Ordering:**
  Each workload $w$ is evaluated by the non-leaking Random Forest Regressor ensemble (`predictWorkloadDemands`) to obtain $(\hat{c}_w, \hat{m}_w, \hat{d}_w)$. Workloads are ordered by composite deadline-laxity urgency:
  $$U_w = 0.65\,\text{deadline}_w + 0.35\,\bigl(\text{deadline}_w - a_w - \hat{d}_w\bigr)$$
  (tie-broken by descending predicted energy footprint $\hat{c}_w \cdot \hat{d}_w$).
- **Step 2 — Integer Chromosome Representation:**
  $\mathbf{x} = [x_0, x_1, \dots, x_{N-1}] \in \mathbb{Z}^N$, where $p_i = \lfloor x_i / |\mathcal{T}| \rfloor$ and $t_i = x_i \bmod |\mathcal{T}|$.
- **Step 3 — Feasibility Repair & Exact 4-Objective Evaluation (`evaluateAndRepairChromosome`):**
  For $i = 0 \dots N-1$ in urgency order:
  - Check if decoded $(p_i, t_i)$ satisfies $t_i \ge a_w$, $t_i + d_w \le H$, $t_i + d_w \le \text{deadline}_w$, and $\text{CanFit}(w_i, p_i, t_i)$.
  - If invalid, scan all $(p, t)$ satisfying $\text{CanFit}(w_i, p, t)$ and select the pair minimizing the directional repair score $\psi(p, t) = w_c \tilde{C}(p, t) + w_e(\tilde{E}(p, t) + 0.35\,u(p, t)) + w_{\$}\tilde{\text{Cost}}(p, t) + \Phi_{\text{SLA}}(t)$.
  - Reserve CPU and RAM across $[t_i^*, t_i^* + d_w - 1]$ and accumulate exact physical metrics via `calculateMetrics`.
- **Step 4 — Fast Non-Dominated Sorting & Crowding Distance:**
  Ranks combined population $R_g = P_g \cup Q_g$ ($|R_g| = 2 N_{\text{pop}}$) into Pareto fronts $\mathcal{F}_1, \mathcal{F}_2, \dots$ in $\mathcal{O}(M_{\text{obj}} \cdot N_{\text{pop}}^2)$ time and assigns L1 normalized crowding distance $d_i$.
- **Step 5 — Genetic Operators & Elitist Survival:**
  Generates $N_{\text{pop}}$ offspring per generation via Binary Crowded-Tournament Selection, Uniform Crossover ($p_c = 0.5$), and Guided Slot Mutation ($p_m = 0.08$), retaining the top $N_{\text{pop}}$ individuals into $P_{g+1}$.
- **Step 6 — Compromise Selection:**
  Selects the knee individual from $P_{G_{\max}}$ minimizing weighted 4D Utopia distance alongside Carbon, Cost, and Energy Pareto extreme solutions.
- **Time Complexity:** $\mathcal{O}\bigl(G_{\max} \cdot N_{\text{pop}} \cdot N \cdot |\mathcal{P}| \cdot |\mathcal{T}| \cdot \bar{d} + G_{\max} \cdot M_{\text{obj}} \cdot N_{\text{pop}}^2\bigr)$.
