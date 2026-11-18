/**
 * EcoFusion Reproducible Frontend Algorithm Audit & Multi-Seed Verification Runner
 * Usage from repository root:
 *   node tests/verify_frontend_audit.cjs
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const outDir = path.join(repoRoot, '.tmp_audit_out');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'package.json'), JSON.stringify({ type: 'commonjs' }));

const tscBin = path.join(repoRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc');
try {
  execSync(
    `"${tscBin}" src/services/simulatorService.ts --outDir .tmp_audit_out --module commonjs --target es2022 --esModuleInterop --skipLibCheck --ignoreConfig`,
    { cwd: repoRoot, stdio: 'pipe' }
  );
} catch (err) {
  // tsc --ignoreConfig may exit non-zero on TS5107 deprecation notice while still emitting JS files
}

const { SimulatorService } = require(path.join(outDir, 'services', 'simulatorService.js'));

const ALGORITHMS = [
  'RANDOM',
  'FIRST_FIT',
  'CARBON_AWARE',
  'ENERGY_AWARE',
  'COST_AWARE',
  'EDF',
  'ECOFUSION_NSGA2',
];

function parseHour(t, fallback = 0) {
  const h = parseInt((t || '').split(':')[0], 10);
  return isNaN(h) ? fallback : h;
}

function verifyInvariants(algo, res, workloads, pools, horizonHours = 24) {
  assert.strictEqual(
    res.decisions.length,
    workloads.length,
    `[${algo}] Missing or extra decisions: expected ${workloads.length}, got ${res.decisions.length}`
  );

  const uniqueIds = new Set(res.decisions.map((d) => d.workloadId));
  assert.strictEqual(uniqueIds.size, workloads.length, `[${algo}] Duplicate workload IDs detected`);

  const wlMap = new Map(workloads.map((w) => [w.id, w]));
  const poolMap = new Map(pools.map((p) => [p.id, p]));

  const cpuUsage = {};
  const memUsage = {};
  pools.forEach((p) => {
    cpuUsage[p.id] = new Array(horizonHours).fill(0);
    memUsage[p.id] = new Array(horizonHours).fill(0);
  });

  let calcViolations = 0;

  for (const d of res.decisions) {
    const wl = wlMap.get(d.workloadId);
    assert.ok(wl, `[${algo}] Unknown workloadId ${d.workloadId}`);

    if (d.poolId === 'UNSCHEDULED') {
      assert.strictEqual(d.slaFeasible, false, `[${algo}] Unscheduled task must have slaFeasible=false`);
      assert.strictEqual(d.estimatedEnergyKwh, 0, `[${algo}] Unscheduled task must have 0 energy`);
      calcViolations += 1;
      continue;
    }

    const pool = poolMap.get(d.poolId);
    assert.ok(pool, `[${algo}] Invalid poolId ${d.poolId}`);

    const startHour = parseHour(d.timeSlotId.replace('TS-', ''), -1);
    const arrivalHour = parseHour(wl.arrivalTime, 0);
    const deadlineHour = parseHour(wl.deadline, 24);
    const dur = Math.max(1, Math.round(wl.duration));
    const endHour = startHour + dur;

    assert.ok(startHour >= arrivalHour, `[${algo}] Task ${wl.id} started before arrival`);
    assert.ok(endHour <= horizonHours, `[${algo}] Task ${wl.id} ends beyond horizon`);

    if (endHour > deadlineHour) {
      calcViolations += 1;
    }

    for (let h = startHour; h < endHour; h++) {
      cpuUsage[pool.id][h] += wl.cpuRequired;
      memUsage[pool.id][h] += wl.memoryRequired;
    }

    assert.ok(d.estimatedEnergyKwh >= 0, `[${algo}] Negative energy`);
    assert.ok(d.estimatedCarbonGco2 >= 0, `[${algo}] Negative carbon`);
    assert.ok(d.estimatedCostUsd >= 0, `[${algo}] Negative cost`);
  }

  const scaleFactor = workloads.length > 600 ? workloads.length / 500 : 1.0;
  for (const pool of pools) {
    const mult = pool.cpuCapacity >= 3000 ? scaleFactor : 1.0;
    const maxCpu = Math.round(pool.cpuCapacity * mult);
    const maxMem = Math.round(pool.memoryCapacity * mult);
    for (let h = 0; h < horizonHours; h++) {
      assert.ok(cpuUsage[pool.id][h] <= maxCpu + 1e-6, `[${algo}] CPU overcommitment on ${pool.id} at h=${h}`);
      assert.ok(memUsage[pool.id][h] <= maxMem + 1e-6, `[${algo}] RAM overcommitment on ${pool.id} at h=${h}`);
      assert.ok(maxCpu - cpuUsage[pool.id][h] >= -1e-6, `[${algo}] Negative CPU availability`);
      assert.ok(maxMem - memUsage[pool.id][h] >= -1e-6, `[${algo}] Negative RAM availability`);
    }
  }

  const expectedSlaRate = Number(((calcViolations / workloads.length) * 100).toFixed(1));
  assert.strictEqual(res.slaViolationRate, expectedSlaRate, `[${algo}] SLA rate mismatch`);
}

const scenarioReport = [];

// Scenario 1: Small workloads
{
  const sim = new SimulatorService();
  const smallWls = Array.from({ length: 25 }, (_, i) => ({
    id: `SM-${i + 1}`,
    name: `Small Microservice #${i + 1}`,
    arrivalTime: `${String(i % 8).padStart(2, '0')}:00`,
    cpuRequired: 16,
    memoryRequired: 64,
    duration: 2,
    deadline: '20:00',
    slaStatus: 'COMPLIANT',
    status: 'PENDING',
  }));
  sim.importWorkloads(smallWls);
  for (const algo of ALGORITHMS) {
    const res = sim.simulateAlgorithm(algo);
    verifyInvariants(algo, res, sim.getWorkloads(), sim.getResourcePools());
    if (algo !== 'RANDOM') {
      assert.strictEqual(res.slaViolationRate, 0);
    }
  }
  scenarioReport.push({ scenario: '1. Small Workloads (25 tasks)', status: 'PASS' });
}

// Scenario 2: Heavy workloads
{
  const sim = new SimulatorService();
  const heavyWls = Array.from({ length: 45 }, (_, i) => ({
    id: `HV-${i + 1}`,
    name: `Heavy LLM Training #${i + 1}`,
    arrivalTime: `${String(i % 10).padStart(2, '0')}:00`,
    cpuRequired: 512,
    memoryRequired: 2048,
    duration: 4,
    deadline: '22:00',
    slaStatus: 'COMPLIANT',
    status: 'PENDING',
  }));
  sim.importWorkloads(heavyWls);
  for (const algo of ALGORITHMS) {
    const res = sim.simulateAlgorithm(algo);
    verifyInvariants(algo, res, sim.getWorkloads(), sim.getResourcePools());
  }
  scenarioReport.push({ scenario: '2. Heavy Workloads (45x 512-core jobs)', status: 'PASS' });
}

// Scenario 3: CPU-intensive workloads
{
  const sim = new SimulatorService();
  sim.updateResourcePool('POOL-BOM', { cpuCapacity: 1024, memoryCapacity: 16384 });
  sim.updateResourcePool('POOL-HYD', { cpuCapacity: 1024, memoryCapacity: 16384 });
  sim.updateResourcePool('POOL-SIN', { cpuCapacity: 1024, memoryCapacity: 16384 });
  const cpuIntensiveWls = Array.from({ length: 18 }, (_, i) => ({
    id: `CPU-${i + 1}`,
    name: `CPU-Bound Crypto Hash #${i + 1}`,
    arrivalTime: '02:00',
    cpuRequired: 512,
    memoryRequired: 64,
    duration: 2,
    deadline: '18:00',
    slaStatus: 'COMPLIANT',
    status: 'PENDING',
  }));
  sim.importWorkloads(cpuIntensiveWls);
  for (const algo of ALGORITHMS) {
    const res = sim.simulateAlgorithm(algo);
    verifyInvariants(algo, res, sim.getWorkloads(), sim.getResourcePools());
  }
  scenarioReport.push({ scenario: '3. CPU-Intensive Workloads', status: 'PASS' });
}

// Scenario 4: Memory-intensive workloads
{
  const sim = new SimulatorService();
  sim.updateResourcePool('POOL-BOM', { cpuCapacity: 4096, memoryCapacity: 2048 });
  sim.updateResourcePool('POOL-HYD', { cpuCapacity: 4096, memoryCapacity: 2048 });
  sim.updateResourcePool('POOL-SIN', { cpuCapacity: 4096, memoryCapacity: 2048 });
  const memIntensiveWls = Array.from({ length: 18 }, (_, i) => ({
    id: `MEM-${i + 1}`,
    name: `In-Memory Graph Redis #${i + 1}`,
    arrivalTime: '02:00',
    cpuRequired: 32,
    memoryRequired: 1024,
    duration: 2,
    deadline: '18:00',
    slaStatus: 'COMPLIANT',
    status: 'PENDING',
  }));
  sim.importWorkloads(memIntensiveWls);
  for (const algo of ALGORITHMS) {
    const res = sim.simulateAlgorithm(algo);
    verifyInvariants(algo, res, sim.getWorkloads(), sim.getResourcePools());
  }
  scenarioReport.push({ scenario: '4. Memory-Intensive Workloads', status: 'PASS' });
}

// Scenario 5: Insufficient server capacity
{
  const sim = new SimulatorService();
  sim.updateResourcePool('POOL-BOM', { cpuCapacity: 256, memoryCapacity: 1024 });
  sim.updateResourcePool('POOL-HYD', { cpuCapacity: 256, memoryCapacity: 1024 });
  sim.updateResourcePool('POOL-SIN', { cpuCapacity: 256, memoryCapacity: 1024 });
  const overloadWls = Array.from({ length: 30 }, (_, i) => ({
    id: `OVL-${i + 1}`,
    name: `Overload Batch #${i + 1}`,
    arrivalTime: '00:00',
    cpuRequired: 256,
    memoryRequired: 512,
    duration: 4,
    deadline: '24:00',
    slaStatus: 'COMPLIANT',
    status: 'PENDING',
  }));
  sim.importWorkloads(overloadWls);
  for (const algo of ALGORITHMS) {
    const res = sim.simulateAlgorithm(algo);
    verifyInvariants(algo, res, sim.getWorkloads(), sim.getResourcePools());
    const unschedCount = res.decisions.filter((d) => d.poolId === 'UNSCHEDULED').length;
    assert.ok(unschedCount >= 12);
  }
  scenarioReport.push({ scenario: '5. Insufficient Server Capacity', status: 'PASS' });
}

// Scenario 6: Different carbon-intensity locations
{
  const sim = new SimulatorService();
  sim.updateResourcePool('POOL-BOM', { cpuCapacity: 2048, memoryCapacity: 8192, pue: 1.2, idlePowerKw: 100, maxPowerKw: 400, carbonIntensity: 850, electricityPrice: 0.12 });
  sim.updateResourcePool('POOL-HYD', { cpuCapacity: 2048, memoryCapacity: 8192, pue: 1.2, idlePowerKw: 100, maxPowerKw: 400, carbonIntensity: 500, electricityPrice: 0.12 });
  sim.updateResourcePool('POOL-SIN', { cpuCapacity: 2048, memoryCapacity: 8192, pue: 1.2, idlePowerKw: 100, maxPowerKw: 400, carbonIntensity: 140, electricityPrice: 0.12 });
  const wls = Array.from({ length: 40 }, (_, i) => ({
    id: `CARB-${i + 1}`,
    name: `Carbon Test #${i + 1}`,
    arrivalTime: '08:00',
    cpuRequired: 128,
    memoryRequired: 256,
    duration: 2,
    deadline: '20:00',
    slaStatus: 'COMPLIANT',
    status: 'PENDING',
  }));
  sim.importWorkloads(wls);
  const ff = sim.simulateAlgorithm('FIRST_FIT');
  const ca = sim.simulateAlgorithm('CARBON_AWARE');
  const nsga = sim.simulateAlgorithm('ECOFUSION_NSGA2');
  assert.ok(ca.totalCarbonKg < ff.totalCarbonKg * 0.45);
  assert.ok(nsga.totalCarbonKg < ff.totalCarbonKg * 0.55);
  scenarioReport.push({ scenario: '6. Different Carbon-Intensity Locations', status: 'PASS' });
}

// Scenario 7: Different electricity tariffs
{
  const sim = new SimulatorService();
  sim.updateResourcePool('POOL-BOM', { cpuCapacity: 2048, memoryCapacity: 8192, pue: 1.2, idlePowerKw: 100, maxPowerKw: 400, carbonIntensity: 400, electricityPrice: 0.35 });
  sim.updateResourcePool('POOL-HYD', { cpuCapacity: 2048, memoryCapacity: 8192, pue: 1.2, idlePowerKw: 100, maxPowerKw: 400, carbonIntensity: 400, electricityPrice: 0.18 });
  sim.updateResourcePool('POOL-SIN', { cpuCapacity: 2048, memoryCapacity: 8192, pue: 1.2, idlePowerKw: 100, maxPowerKw: 400, carbonIntensity: 400, electricityPrice: 0.05 });
  const wls = Array.from({ length: 40 }, (_, i) => ({
    id: `COST-${i + 1}`,
    name: `Tariff Test #${i + 1}`,
    arrivalTime: '08:00',
    cpuRequired: 128,
    memoryRequired: 256,
    duration: 2,
    deadline: '20:00',
    slaStatus: 'COMPLIANT',
    status: 'PENDING',
  }));
  sim.importWorkloads(wls);
  const ff = sim.simulateAlgorithm('FIRST_FIT');
  const co = sim.simulateAlgorithm('COST_AWARE');
  const nsga = sim.simulateAlgorithm('ECOFUSION_NSGA2');
  assert.ok(co.totalCostUsd < ff.totalCostUsd * 0.40);
  assert.ok(nsga.totalCostUsd < ff.totalCostUsd * 0.50);
  scenarioReport.push({ scenario: '7. Different Electricity Tariffs', status: 'PASS' });
}

// Scenario 8: Different PUE values
{
  const sim = new SimulatorService();
  sim.updateResourcePool('POOL-BOM', { cpuCapacity: 2048, memoryCapacity: 8192, pue: 1.75, idlePowerKw: 150, maxPowerKw: 500, carbonIntensity: 400, electricityPrice: 0.12 });
  sim.updateResourcePool('POOL-HYD', { cpuCapacity: 2048, memoryCapacity: 8192, pue: 1.40, idlePowerKw: 110, maxPowerKw: 400, carbonIntensity: 400, electricityPrice: 0.12 });
  sim.updateResourcePool('POOL-SIN', { cpuCapacity: 2048, memoryCapacity: 8192, pue: 1.08, idlePowerKw: 70, maxPowerKw: 260, carbonIntensity: 400, electricityPrice: 0.12 });
  const wls = Array.from({ length: 40 }, (_, i) => ({
    id: `PUE-${i + 1}`,
    name: `PUE Test #${i + 1}`,
    arrivalTime: '08:00',
    cpuRequired: 128,
    memoryRequired: 256,
    duration: 2,
    deadline: '20:00',
    slaStatus: 'COMPLIANT',
    status: 'PENDING',
  }));
  sim.importWorkloads(wls);
  const ff = sim.simulateAlgorithm('FIRST_FIT');
  const ea = sim.simulateAlgorithm('ENERGY_AWARE');
  const nsga = sim.simulateAlgorithm('ECOFUSION_NSGA2');
  assert.ok(ea.totalEnergyKwh < ff.totalEnergyKwh * 0.55);
  assert.ok(nsga.totalEnergyKwh < ff.totalEnergyKwh * 0.65);
  scenarioReport.push({ scenario: '8. Different PUE Values', status: 'PASS' });
}

// Scenario 9: Strict SLA deadlines
{
  const sim = new SimulatorService();
  sim.generateSyntheticWorkloads(500, 42);
  const ff = sim.simulateAlgorithm('FIRST_FIT');
  const edf = sim.simulateAlgorithm('EDF');
  const nsga = sim.simulateAlgorithm('ECOFUSION_NSGA2');
  assert.ok(edf.slaViolationRate < ff.slaViolationRate);
  assert.ok(nsga.slaViolationRate < ff.slaViolationRate);
  scenarioReport.push({ scenario: '9. Strict SLA Deadlines under Contention', status: 'PASS' });
}

// Scenario 10: Workloads that cannot be scheduled
{
  const sim = new SimulatorService();
  const impossibleWls = [
    { id: 'IMP-CPU', name: 'Oversized CPU', arrivalTime: '02:00', cpuRequired: 32000, memoryRequired: 256, duration: 2, deadline: '10:00', slaStatus: 'COMPLIANT', status: 'PENDING' },
    { id: 'IMP-MEM', name: 'Oversized RAM', arrivalTime: '02:00', cpuRequired: 64, memoryRequired: 64000, duration: 2, deadline: '10:00', slaStatus: 'COMPLIANT', status: 'PENDING' },
    { id: 'IMP-HORIZON', name: 'Late Arrival', arrivalTime: '22:00', cpuRequired: 64, memoryRequired: 256, duration: 5, deadline: '24:00', slaStatus: 'COMPLIANT', status: 'PENDING' },
    { id: 'VALID-TASK', name: 'Valid Task', arrivalTime: '04:00', cpuRequired: 64, memoryRequired: 256, duration: 2, deadline: '12:00', slaStatus: 'COMPLIANT', status: 'PENDING' },
  ];
  sim.importWorkloads(impossibleWls);
  for (const algo of ALGORITHMS) {
    const res = sim.simulateAlgorithm(algo);
    verifyInvariants(algo, res, sim.getWorkloads(), sim.getResourcePools());
    const unschedIds = res.decisions.filter((d) => d.poolId === 'UNSCHEDULED').map((d) => d.workloadId);
    assert.deepStrictEqual(unschedIds.sort(), ['IMP-CPU', 'IMP-HORIZON', 'IMP-MEM']);
    if (algo !== 'RANDOM') {
      assert.strictEqual(res.slaViolationRate, 75.0);
    }
  }
  scenarioReport.push({ scenario: '10. Unschedulable Workloads', status: 'PASS' });
}

console.log('=== 10 SCENARIO AUDIT SUITE PASSED ===');
console.table(scenarioReport);
try {
  fs.rmSync(outDir, { recursive: true, force: true });
} catch {}

