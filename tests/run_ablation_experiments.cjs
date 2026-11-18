/**
 * EcoFusion Phase 1 & Phase 2 Scientific Ablation Experiment Runner
 * Executes strictly against the frozen SimulatorService mathematical and physical kernel
 * across the 5 documented random seeds: [42, 101, 202, 303, 404].
 *
 * Usage:
 *   node tests/run_ablation_experiments.cjs
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { performance } = require('perf_hooks');

const repoRoot = path.resolve(__dirname, '..');
const outDir = path.join(repoRoot, '.tmp_ablation_out');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'package.json'), JSON.stringify({ type: 'commonjs' }));

const tscBin = path.join(repoRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc');
try {
  execSync(
    `"${tscBin}" src/services/simulatorService.ts --outDir .tmp_ablation_out --module commonjs --target es2022 --esModuleInterop --skipLibCheck --ignoreConfig`,
    { cwd: repoRoot, stdio: 'pipe' }
  );
} catch (err) {
  // Ignore TS5107 deprecation warning exit code if JS is emitted
}

const { SimulatorService } = require(path.join(outDir, 'services', 'simulatorService.js'));

const SEEDS = [42, 101, 202, 303, 404];

function parseHour(t, fallback = 0) {
  const h = parseInt((t || '').split(':')[0], 10);
  return isNaN(h) ? fallback : h;
}

/**
 * Exact replica of frozen SimulatorService.runPopulationNsga2 with parameterized:
 *   - numGenerations (0 for Gen-0 initial population vs 8 for Full NSGA-II)
 *   - orderingMode ('ML_URGENCY' vs 'FIFO')
 *   - warmStartHeuristics (true for standard hybrid P_0 vs false for purely stochastic P_0)
 */
function runAblationNsga2(sim, wls, effectivePools, slots, options) {
  const {
    numGenerations = 8,
    orderingMode = 'ML_URGENCY',
    warmStartHeuristics = true,
    seedValue = 42,
  } = options;

  const t0 = performance.now();
  const numWorkloads = wls.length;
  const numPools = effectivePools.length;
  const numSlots = slots.length;
  const horizonHours = numSlots;
  const poolCaps = sim.getEffectivePoolCapacities(effectivePools, wls);

  // Workload Ordering: ML_URGENCY (frozen default) vs DEADLINE_NO_ML vs FIFO
  const orderedWorkloads =
    orderingMode === 'ML_URGENCY'
      ? [...wls].sort((a, b) => {
          const dlA = parseHour(a.deadline, 24);
          const dlB = parseHour(b.deadline, 24);
          const predDurA = a.predictedDuration ?? a.duration;
          const predDurB = b.predictedDuration ?? b.duration;
          const urgencyA = dlA * 0.65 + (dlA - parseHour(a.arrivalTime, 0) - predDurA) * 0.35;
          const urgencyB = dlB * 0.65 + (dlB - parseHour(b.arrivalTime, 0) - predDurB) * 0.35;
          if (Math.abs(urgencyA - urgencyB) > 0.01) return urgencyA - urgencyB;
          const predEnergyA = (a.predictedCpu ?? a.cpuRequired) * predDurA;
          const predEnergyB = (b.predictedCpu ?? b.cpuRequired) * predDurB;
          return predEnergyB - predEnergyA;
        })
      : orderingMode === 'DEADLINE_NO_ML'
      ? [...wls].sort((a, b) => {
          const dlDiff = parseHour(a.deadline, 24) - parseHour(b.deadline, 24);
          if (dlDiff !== 0) return dlDiff;
          const arrDiff = parseHour(a.arrivalTime, 0) - parseHour(b.arrivalTime, 0);
          return arrDiff !== 0 ? arrDiff : a.id.localeCompare(b.id);
        })
      : [...wls].sort((a, b) => {
          const arrDiff = parseHour(a.arrivalTime, 0) - parseHour(b.arrivalTime, 0);
          return arrDiff !== 0 ? arrDiff : a.id.localeCompare(b.id);
        });

  let seed = seedValue + 777;
  const rng = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const rawSlotMetrics = effectivePools.map((pool) =>
    slots.map((slot) =>
      sim.calculateMetrics(
        {
          id: 'REF',
          name: 'REF',
          arrivalTime: '00:00',
          cpuRequired: 64,
          memoryRequired: 256,
          duration: 1,
          deadline: '24:00',
          slaStatus: 'COMPLIANT',
          status: 'PENDING',
        },
        pool,
        slot
      )
    )
  );

  const allSlotC = rawSlotMetrics.flatMap((row) => row.map((m) => m.estimatedCarbonGco2));
  const allSlotE = rawSlotMetrics.flatMap((row) => row.map((m) => m.estimatedEnergyKwh));
  const allSlotCost = rawSlotMetrics.flatMap((row) => row.map((m) => m.estimatedCostUsd));
  const minSlotC = Math.min(...allSlotC);
  const spanSlotC = Math.max(...allSlotC) - minSlotC || 1;
  const minSlotE = Math.min(...allSlotE);
  const spanSlotE = Math.max(...allSlotE) - minSlotE || 1;
  const minSlotCost = Math.min(...allSlotCost);
  const spanSlotCost = Math.max(...allSlotCost) - minSlotCost || 1;

  const normSlotC = rawSlotMetrics.map((row) =>
    row.map((m) => (m.estimatedCarbonGco2 - minSlotC) / spanSlotC)
  );
  const normSlotE = rawSlotMetrics.map((row) =>
    row.map((m) => (m.estimatedEnergyKwh - minSlotE) / spanSlotE)
  );
  const normSlotCost = rawSlotMetrics.map((row) =>
    row.map((m) => (m.estimatedCostUsd - minSlotCost) / spanSlotCost)
  );
  const baseSlotScore = effectivePools.map((_, pIdx) =>
    slots.map((__, sIdx) => 0.4 * normSlotC[pIdx][sIdx] + 0.3 * normSlotE[pIdx][sIdx] + 0.3 * normSlotCost[pIdx][sIdx])
  );

  const evaluateAndRepairChromosome = (genes, prefWeights) => {
    const cpuUsage = effectivePools.map(() => new Array(horizonHours).fill(0));
    const memUsage = effectivePools.map(() => new Array(horizonHours).fill(0));
    const repairedGenes = new Int32Array(numWorkloads);

    let totalEnergyKwh = 0;
    let totalCarbonG = 0;
    let totalCostUsd = 0;
    let slaViolations = 0;
    let sumCompletionHours = 0;
    let scheduledCount = 0;
    const decisions = [];

    const canFit = (pIdx, sHour, dur, cpuReq, memReq) => {
      if (sHour < 0 || sHour + dur > horizonHours) return false;
      const cap = poolCaps[effectivePools[pIdx].id];
      for (let h = sHour; h < sHour + dur; h++) {
        if (cpuUsage[pIdx][h] + cpuReq > cap.cpu || memUsage[pIdx][h] + memReq > cap.mem) {
          return false;
        }
      }
      return true;
    };

    for (let i = 0; i < numWorkloads; i++) {
      const wl = orderedWorkloads[i];
      const arrivalHour = parseHour(wl.arrivalTime, 0);
      const reqDur = Math.max(1, Math.round(wl.duration));
      const deadlineHour = parseHour(wl.deadline, 24);

      const rawGene = genes[i];
      let pIdx = Math.max(0, Math.min(numPools - 1, Math.floor(rawGene / numSlots)));
      let sIdx = Math.max(0, Math.min(numSlots - 1, rawGene % numSlots));
      let sHour = parseHour(slots[sIdx].startTime, sIdx);

      const geneValid =
        rawGene >= 0 &&
        sHour >= arrivalHour &&
        sHour + reqDur <= horizonHours &&
        sHour + reqDur <= deadlineHour &&
        canFit(pIdx, sHour, reqDur, wl.cpuRequired, wl.memoryRequired);

      if (!geneValid) {
        let bestP = -1;
        let bestS = -1;
        let bestScore = Infinity;

        for (let candP = 0; candP < numPools; candP++) {
          const pool = effectivePools[candP];
          const cap = poolCaps[pool.id];
          for (let candS = 0; candS < numSlots; candS++) {
            const candHour = parseHour(slots[candS].startTime, candS);
            if (candHour < arrivalHour || candHour + reqDur > horizonHours) continue;
            if (!canFit(candP, candHour, reqDur, wl.cpuRequired, wl.memoryRequired)) continue;

            const isSlaOk = candHour + reqDur <= deadlineHour;
            const util = cpuUsage[candP][candHour] / cap.cpu;

            let cSum = 0;
            let eSum = 0;
            let costSum = 0;
            for (let off = 0; off < reqDur; off++) {
              const idx = Math.min(numSlots - 1, candS + off);
              cSum += normSlotC[candP][idx];
              eSum += normSlotE[candP][idx];
              costSum += normSlotCost[candP][idx];
            }
            const cProxy = cSum / reqDur;
            const eProxy = eSum / reqDur + util * 0.35;
            const costProxy = costSum / reqDur;
            const slaPen = isSlaOk ? 0 : prefWeights.sla * 12.0;

            const score =
              prefWeights.c * cProxy + prefWeights.e * eProxy + prefWeights.cost * costProxy + slaPen;

            if (score < bestScore) {
              bestScore = score;
              bestP = candP;
              bestS = candS;
            }
          }
        }

        pIdx = bestP;
        sIdx = bestS;
      }

      if (pIdx === -1 || sIdx === -1) {
        repairedGenes[i] = 0;
        slaViolations += 1;
        decisions.push({
          workloadId: wl.id,
          poolId: 'UNSCHEDULED',
          datacenterId: 'UNSCHEDULED',
          timeSlotId: 'UNSCHEDULED',
          estimatedEnergyKwh: 0,
          estimatedCarbonGco2: 0,
          estimatedCostUsd: 0,
          slaFeasible: false,
          slaMarginHours: -1,
        });
        continue;
      }

      repairedGenes[i] = pIdx * numSlots + sIdx;
      const chosenPool = effectivePools[pIdx];
      const chosenSlot = slots[sIdx];
      sHour = parseHour(chosenSlot.startTime, sIdx);
      const completionHour = sHour + reqDur;

      const usageMap = {};
      for (let h = sHour; h < completionHour; h++) {
        usageMap[h] = cpuUsage[pIdx][h];
      }

      const metrics = sim.calculateMetrics(wl, chosenPool, chosenSlot, usageMap, poolCaps[chosenPool.id].cpu);

      for (let h = sHour; h < completionHour; h++) {
        cpuUsage[pIdx][h] += wl.cpuRequired;
        memUsage[pIdx][h] += wl.memoryRequired;
      }

      const slaFeasible = completionHour <= deadlineHour;
      if (!slaFeasible) {
        slaViolations += 1;
      }

      totalEnergyKwh += metrics.estimatedEnergyKwh;
      totalCarbonG += metrics.estimatedCarbonGco2;
      totalCostUsd += metrics.estimatedCostUsd;
      sumCompletionHours += completionHour - arrivalHour;
      scheduledCount += 1;

      decisions.push({
        workloadId: wl.id,
        poolId: chosenPool.id,
        datacenterId: chosenPool.id,
        timeSlotId: chosenSlot.id,
        estimatedEnergyKwh: metrics.estimatedEnergyKwh,
        estimatedCarbonGco2: metrics.estimatedCarbonGco2,
        estimatedCostUsd: metrics.estimatedCostUsd,
        slaFeasible,
        slaMarginHours: deadlineHour - completionHour,
      });
    }

    const carbonKg = Number((totalCarbonG / 1000).toFixed(2));
    const energyKwh = Number(totalEnergyKwh.toFixed(1));
    const costUsd = Number(totalCostUsd.toFixed(2));
    const slaRate = Number(((slaViolations / numWorkloads) * 100).toFixed(1));
    const avgComp = scheduledCount > 0 ? Number((sumCompletionHours / scheduledCount).toFixed(1)) : 0;

    return {
      genes: repairedGenes,
      objectives: [carbonKg, energyKwh, costUsd, slaRate],
      avgCompletionHours: avgComp,
      decisions,
      rank: 1,
      crowdingDistance: 0,
    };
  };

  const fastNonDominatedSort = (pop) => {
    const S = pop.map(() => []);
    const n = new Array(pop.length).fill(0);
    const fronts = [[]];

    const dominates = (a, b) => {
      let strictlyBetter = false;
      for (let m = 0; m < 4; m++) {
        if (a.objectives[m] > b.objectives[m]) return false;
        if (a.objectives[m] < b.objectives[m]) strictlyBetter = true;
      }
      return strictlyBetter;
    };

    for (let p = 0; p < pop.length; p++) {
      for (let q = 0; q < pop.length; q++) {
        if (p === q) continue;
        if (dominates(pop[p], pop[q])) {
          S[p].push(q);
        } else if (dominates(pop[q], pop[p])) {
          n[p] += 1;
        }
      }
      if (n[p] === 0) {
        pop[p].rank = 1;
        fronts[0].push(p);
      }
    }

    let i = 0;
    while (fronts[i] && fronts[i].length > 0) {
      const nextFront = [];
      for (const p of fronts[i]) {
        for (const q of S[p]) {
          n[q] -= 1;
          if (n[q] === 0) {
            pop[q].rank = i + 2;
            nextFront.push(q);
          }
        }
      }
      i += 1;
      if (nextFront.length > 0) {
        fronts.push(nextFront);
      }
    }

    return fronts.filter((f) => f.length > 0).map((f) => f.map((idx) => pop[idx]));
  };

  const assignCrowdingDistance = (front) => {
    const l = front.length;
    if (l === 0) return;
    front.forEach((ind) => {
      ind.crowdingDistance = 0;
    });
    if (l <= 2) {
      front.forEach((ind) => {
        ind.crowdingDistance = Infinity;
      });
      return;
    }

    for (let m = 0; m < 4; m++) {
      front.sort((a, b) => a.objectives[m] - b.objectives[m]);
      front[0].crowdingDistance = Infinity;
      front[l - 1].crowdingDistance = Infinity;
      const minVal = front[0].objectives[m];
      const maxVal = front[l - 1].objectives[m];
      const range = maxVal - minVal;
      if (range <= 1e-9) continue;

      for (let i = 1; i < l - 1; i++) {
        if (front[i].crowdingDistance !== Infinity) {
          front[i].crowdingDistance += (front[i + 1].objectives[m] - front[i - 1].objectives[m]) / range;
        }
      }
    }
  };

  const tournamentSelect = (pop) => {
    const a = pop[Math.floor(rng() * pop.length)];
    const b = pop[Math.floor(rng() * pop.length)];
    if (a.rank !== b.rank) return a.rank < b.rank ? a : b;
    return a.crowdingDistance >= b.crowdingDistance ? a : b;
  };

  const popSize = 14;
  const weightVectors = [
    { c: 0.52, e: 0.26, cost: 0.22, sla: 1.2 },
    { c: 0.85, e: 0.08, cost: 0.07, sla: 0.9 },
    { c: 0.08, e: 0.85, cost: 0.07, sla: 0.9 },
    { c: 0.08, e: 0.07, cost: 0.85, sla: 0.9 },
    { c: 0.65, e: 0.20, cost: 0.15, sla: 1.2 },
    { c: 0.25, e: 0.25, cost: 0.50, sla: 1.2 },
    { c: 0.35, e: 0.45, cost: 0.20, sla: 1.2 },
  ];

  let population = [];
  for (let p = 0; p < popSize; p++) {
    const genes = new Int32Array(numWorkloads);
    const wv = weightVectors[p % weightVectors.length];
    for (let i = 0; i < numWorkloads; i++) {
      if (warmStartHeuristics && p < weightVectors.length) {
        genes[i] = -1;
      } else {
        const wl = orderedWorkloads[i];
        const arrH = parseHour(wl.arrivalTime, 0);
        const dur = Math.max(1, Math.round(wl.duration));
        const dlH = Math.min(horizonHours, Math.max(arrH + dur, parseHour(wl.deadline, 24)));
        const maxStart = Math.max(arrH, dlH - dur);
        const randSlot = Math.min(numSlots - 1, arrH + Math.floor(rng() * (maxStart - arrH + 1)));
        const randPool = Math.floor(rng() * numPools);
        genes[i] = randPool * numSlots + randSlot;
      }
    }
    population.push(evaluateAndRepairChromosome(genes, wv));
  }

  let fronts = fastNonDominatedSort(population);
  fronts.forEach((f) => assignCrowdingDistance(f));

  for (let gen = 0; gen < numGenerations; gen++) {
    const offspring = [];
    while (offspring.length < popSize) {
      const parent1 = tournamentSelect(population);
      const parent2 = tournamentSelect(population);
      const childGenes = new Int32Array(numWorkloads);

      for (let i = 0; i < numWorkloads; i++) {
        childGenes[i] = rng() < 0.5 ? parent1.genes[i] : parent2.genes[i];

        if (rng() < 0.08) {
          const wl = orderedWorkloads[i];
          const arrH = parseHour(wl.arrivalTime, 0);
          const dur = Math.max(1, Math.round(wl.duration));
          const dlH = Math.min(horizonHours, Math.max(arrH + dur, parseHour(wl.deadline, 24)));
          const maxStart = Math.max(arrH, dlH - dur);
          const candS = Math.min(numSlots - 1, arrH + Math.floor(rng() * (maxStart - arrH + 1)));
          let bestP = 0;
          for (let p = 1; p < numPools; p++) {
            if (baseSlotScore[p][candS] < baseSlotScore[bestP][candS]) bestP = p;
          }
          childGenes[i] = bestP * numSlots + candS;
        }
      }

      const wv = weightVectors[(gen + offspring.length) % weightVectors.length];
      offspring.push(evaluateAndRepairChromosome(childGenes, wv));
    }

    const combined = [...population, ...offspring];
    fronts = fastNonDominatedSort(combined);
    const nextPop = [];

    for (const front of fronts) {
      assignCrowdingDistance(front);
      if (nextPop.length + front.length <= popSize) {
        nextPop.push(...front);
      } else {
        front.sort((a, b) => b.crowdingDistance - a.crowdingDistance);
        nextPop.push(...front.slice(0, popSize - nextPop.length));
        break;
      }
    }
    population = nextPop;
  }

  const wCarbon = 0.4;
  const wEnergy = 0.3;
  const wCost = 0.3;

  const minC = Math.min(...population.map((ind) => ind.objectives[0]));
  const maxC = Math.max(...population.map((ind) => ind.objectives[0])) || 1;
  const minE = Math.min(...population.map((ind) => ind.objectives[1]));
  const maxE = Math.max(...population.map((ind) => ind.objectives[1])) || 1;
  const minCost = Math.min(...population.map((ind) => ind.objectives[2]));
  const maxCost = Math.max(...population.map((ind) => ind.objectives[2])) || 1;

  const scoreIndividual = (ind, wc, we, w$) => {
    const nC = (ind.objectives[0] - minC) / Math.max(1500, maxC - minC);
    const nE = (ind.objectives[1] - minE) / Math.max(850, maxE - minE);
    const nCost = (ind.objectives[2] - minCost) / Math.max(600, maxCost - minCost);
    const nSla = ind.objectives[3] / 15.0;
    return Math.sqrt(wc * nC ** 2 + we * nE ** 2 + w$ * nCost ** 2 + 1.5 * nSla ** 2);
  };

  const bestCompromise = [...population].sort(
    (a, b) => scoreIndividual(a, wCarbon, wEnergy, wCost) - scoreIndividual(b, wCarbon, wEnergy, wCost)
  )[0];

  // Re-rank final population P_final (size 14) to measure true final Front F_1 of P_final
  const finalFronts = fastNonDominatedSort(population);
  const front1 = finalFronts[0] || population;
  const distinctFront1 = new Set(front1.map((ind) => ind.objectives.join('|'))).size;
  const f1C = front1.map((ind) => ind.objectives[0]);
  const f1E = front1.map((ind) => ind.objectives[1]);
  const f1Cost = front1.map((ind) => ind.objectives[2]);
  const carbonSpread = Number((Math.max(...f1C) - Math.min(...f1C)).toFixed(2));
  const energySpread = Number((Math.max(...f1E) - Math.min(...f1E)).toFixed(1));
  const costSpread = Number((Math.max(...f1Cost) - Math.min(...f1Cost)).toFixed(2));

  const elapsedMs = performance.now() - t0;

  return {
    carbonKg: bestCompromise.objectives[0],
    energyKwh: bestCompromise.objectives[1],
    costUsd: bestCompromise.objectives[2],
    slaViolPct: bestCompromise.objectives[3],
    avgCompH: bestCompromise.avgCompletionHours,
    singleBalancedInd0: population[0],
    front1Size: front1.length,
    distinctFront1,
    carbonSpread,
    energySpread,
    costSpread,
    elapsedMs,
  };
}

/**
 * Compute Composite Utopia Score against the seed's 6 baseline algorithms
 */
function computeCompositeScore(candidate, baselineResults) {
  const all = [...baselineResults, candidate];
  const minC = Math.min(...all.map((r) => r.carbonKg));
  const maxC = Math.max(...all.map((r) => r.carbonKg)) || 1;
  const minE = Math.min(...all.map((r) => r.energyKwh));
  const maxE = Math.max(...all.map((r) => r.energyKwh)) || 1;
  const minCost = Math.min(...all.map((r) => r.costUsd));
  const maxCost = Math.max(...all.map((r) => r.costUsd)) || 1;

  const normC = (candidate.carbonKg - minC) / (maxC - minC || 1);
  const normE = (candidate.energyKwh - minE) / (maxE - minE || 1);
  const normCost = (candidate.costUsd - minCost) / (maxCost - minCost || 1);
  const normSla = Math.min(1.2, candidate.slaViolPct / 15.0);
  const rmsDist = Math.sqrt((normC ** 2 + normE ** 2 + normCost ** 2 + normSla ** 2) / 4.0);
  return Number(Math.max(10.0, 100 * (1 - rmsDist)).toFixed(1));
}

function meanStd(arr) {
  const m = arr.reduce((s, v) => s + v, 0) / arr.length;
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
  return `${m.toFixed(2)} ± ${Math.sqrt(variance).toFixed(2)}`;
}

const variants = {
  GEN0_SINGLE_BALANCED: { carbon: [], energy: [], cost: [], sla: [], eff: [], f1Distinct: [], timeMs: [] },
  GEN0_HEURISTIC_POP:   { carbon: [], energy: [], cost: [], sla: [], eff: [], f1Distinct: [], timeMs: [] },
  GEN0_STOCHASTIC_POP:  { carbon: [], energy: [], cost: [], sla: [], eff: [], f1Distinct: [], timeMs: [] },
  GEN8_STOCHASTIC_NSGA: { carbon: [], energy: [], cost: [], sla: [], eff: [], f1Distinct: [], timeMs: [] },
  FULL_NSGA2_ML_GEN8:       { carbon: [], energy: [], cost: [], sla: [], eff: [], f1Distinct: [], timeMs: [] },
  FULL_NSGA2_DEADLINE_GEN8: { carbon: [], energy: [], cost: [], sla: [], eff: [], f1Distinct: [], timeMs: [] },
  FULL_NSGA2_FIFO_GEN8:     { carbon: [], energy: [], cost: [], sla: [], eff: [], f1Distinct: [], timeMs: [] },
};

const perSeedDetails = [];

for (const seed of SEEDS) {
  const sim = new SimulatorService();
  sim.updateConfig({ randomSeed: seed });
  sim.updateSimulationSetupConfig({ randomSeed: seed });
  sim.generateSyntheticWorkloads(500, seed);

  const wls = sim.getWorkloads();
  const pools = sim.getResourcePools();
  const slots = sim.getTimeSlots().slice(0, 24);

  // Get the 6 baseline algorithms for Utopia reference on this seed
  const baseAlgos = ['RANDOM', 'FIRST_FIT', 'CARBON_AWARE', 'ENERGY_AWARE', 'COST_AWARE', 'EDF'];
  const baseResults = baseAlgos.map((a) => {
    const r = sim.simulateAlgorithm(a);
    return {
      carbonKg: r.totalCarbonKg,
      energyKwh: r.totalEnergyKwh,
      costUsd: r.totalCostUsd,
      slaViolPct: r.slaViolationRate,
    };
  });

  // Verify bit-for-bit match between frozen sim.simulateAlgorithm('ECOFUSION_NSGA2') and FULL_NSGA2_ML_GEN8
  const frozenNsga2 = sim.simulateAlgorithm('ECOFUSION_NSGA2');
  const fullMlGen8 = runAblationNsga2(sim, wls, pools, slots, {
    numGenerations: 8,
    orderingMode: 'ML_URGENCY',
    warmStartHeuristics: true,
    seedValue: seed,
  });

  assert.strictEqual(fullMlGen8.carbonKg, frozenNsga2.totalCarbonKg, `Seed ${seed} carbon match failed`);
  assert.strictEqual(fullMlGen8.energyKwh, frozenNsga2.totalEnergyKwh, `Seed ${seed} energy match failed`);
  assert.strictEqual(fullMlGen8.costUsd, frozenNsga2.totalCostUsd, `Seed ${seed} cost match failed`);
  assert.strictEqual(fullMlGen8.slaViolPct, frozenNsga2.slaViolationRate, `Seed ${seed} SLA match failed`);

  // Run Gen 0 (Hybrid Heuristic + Random Population P_0, g=0)
  const gen0HeuristicPop = runAblationNsga2(sim, wls, pools, slots, {
    numGenerations: 0,
    orderingMode: 'ML_URGENCY',
    warmStartHeuristics: true,
    seedValue: seed,
  });

  // Run Gen 0 (Stochastic Random Population P_0 without warm-start heuristics, g=0)
  const gen0StochasticPop = runAblationNsga2(sim, wls, pools, slots, {
    numGenerations: 0,
    orderingMode: 'ML_URGENCY',
    warmStartHeuristics: false,
    seedValue: seed,
  });

  // Run Gen 8 (Stochastic Random Population evolved for 8 generations without warm-start heuristics)
  const gen8StochasticNsga = runAblationNsga2(sim, wls, pools, slots, {
    numGenerations: 8,
    orderingMode: 'ML_URGENCY',
    warmStartHeuristics: false,
    seedValue: seed,
  });

  // Run Full NSGA-II with Pure Deadline Ordering (No ML predictions)
  const fullDeadlineGen8 = runAblationNsga2(sim, wls, pools, slots, {
    numGenerations: 8,
    orderingMode: 'DEADLINE_NO_ML',
    warmStartHeuristics: true,
    seedValue: seed,
  });

  // Run Full NSGA-II with FIFO Workload Ordering (Phase 2 ML Ablation)
  const fullFifoGen8 = runAblationNsga2(sim, wls, pools, slots, {
    numGenerations: 8,
    orderingMode: 'FIFO',
    warmStartHeuristics: true,
    seedValue: seed,
  });

  const record = (key, res) => {
    const eff = computeCompositeScore(res, baseResults);
    variants[key].carbon.push(res.carbonKg);
    variants[key].energy.push(res.energyKwh);
    variants[key].cost.push(res.costUsd);
    variants[key].sla.push(res.slaViolPct);
    variants[key].eff.push(eff);
    variants[key].f1Distinct.push(res.distinctFront1);
    variants[key].cSpread = variants[key].cSpread || [];
    variants[key].cSpread.push(res.carbonSpread);
    variants[key].timeMs.push(res.elapsedMs);
    return { ...res, eff };
  };

  // Single-pass balanced heuristic (Individual 0 of P_0)
  const ind0 = gen0HeuristicPop.singleBalancedInd0;
  record('GEN0_SINGLE_BALANCED', {
    carbonKg: ind0.objectives[0],
    energyKwh: ind0.objectives[1],
    costUsd: ind0.objectives[2],
    slaViolPct: ind0.objectives[3],
    distinctFront1: 1,
    carbonSpread: 0,
    elapsedMs: gen0HeuristicPop.elapsedMs / 14,
  });

  const rGen0H = record('GEN0_HEURISTIC_POP', gen0HeuristicPop);
  const rGen0S = record('GEN0_STOCHASTIC_POP', gen0StochasticPop);
  const rGen8S = record('GEN8_STOCHASTIC_NSGA', gen8StochasticNsga);
  const rFullMl = record('FULL_NSGA2_ML_GEN8', fullMlGen8);
  const rFullDl = record('FULL_NSGA2_DEADLINE_GEN8', fullDeadlineGen8);
  const rFullFifo = record('FULL_NSGA2_FIFO_GEN8', fullFifoGen8);

  perSeedDetails.push({
    seed,
    gen0H_C: rGen0H.carbonKg,
    gen0H_E: rGen0H.energyKwh,
    gen0H_Cost: rGen0H.costUsd,
    gen0H_SLA: rGen0H.slaViolPct,
    gen0H_Eff: rGen0H.eff,
    fullMl_C: rFullMl.carbonKg,
    fullMl_E: rFullMl.energyKwh,
    fullMl_Cost: rFullMl.costUsd,
    fullMl_SLA: rFullMl.slaViolPct,
    fullMl_Eff: rFullMl.eff,
    fifo_C: rFullFifo.carbonKg,
    fifo_E: rFullFifo.energyKwh,
    fifo_Cost: rFullFifo.costUsd,
    fifo_SLA: rFullFifo.slaViolPct,
    fifo_Eff: rFullFifo.eff,
  });
}

console.log('=== PER-SEED ABLATION DETAILS (Seeds 42, 101, 202, 303, 404) ===');
console.table(perSeedDetails);

console.log('\n=== PHASE 1 & PHASE 2 FIVE-SEED SUMMARY (Mean ± SD across 5 Seeds) ===');
console.table(
  Object.entries(variants)
    .filter(([_, v]) => v.carbon.length > 0)
    .map(([name, v]) => ({
      variant: name,
      carbonKg: meanStd(v.carbon),
      energyKwh: meanStd(v.energy),
      costUsd: meanStd(v.cost),
      slaViolPct: meanStd(v.sla),
      compositeScore: meanStd(v.eff),
      paretoF1Distinct: meanStd(v.f1Distinct),
      f1CarbonSpanKg: meanStd(v.cSpread),
      runtimeMs: meanStd(v.timeMs),
    }))
);

try {
  fs.rmSync(outDir, { recursive: true, force: true });
} catch {}
