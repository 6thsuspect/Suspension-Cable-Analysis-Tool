// ============================================================
// Engineering Checks — Pure TypeScript
// ============================================================

import type { EngineeringCheck, CableSolverResult, StressResult, DeadBlockResult } from '../../models/types';

export function runEngineeringChecks(
  solverResult: CableSolverResult,
  stressResult: StressResult | null,
  deadBlockResult: DeadBlockResult | null,
  deadBlockResultA: DeadBlockResult | null = null
): EngineeringCheck[] {
  const checks: EngineeringCheck[] = [];

  // 1. Solver convergence
  checks.push({
    id: 'solver-convergence',
    name: 'Cable Solver Convergence',
    passed: solverResult.converged,
    value: solverResult.converged
      ? `Converged in ${solverResult.iterations} iterations`
      : `Did NOT converge after ${solverResult.iterations} iterations`,
    details: `Residual error: ${solverResult.error.toExponential(3)}`,
  });

  // 2. Equilibrium check
  const fxOk = Math.abs(solverResult.equilibriumResidual.Fx) < 0.1;
  const fyOk = Math.abs(solverResult.equilibriumResidual.Fy) < 1.0;
  checks.push({
    id: 'equilibrium-x',
    name: 'Horizontal Equilibrium',
    passed: fxOk,
    value: `ΣFx = ${solverResult.equilibriumResidual.Fx.toFixed(4)} kN`,
    details: fxOk ? 'Satisfied' : 'Not satisfied — check model',
  });

  checks.push({
    id: 'equilibrium-y',
    name: 'Vertical Equilibrium',
    passed: fyOk,
    value: `ΣFy = ${solverResult.equilibriumResidual.Fy.toFixed(4)} kN`,
    details: fyOk ? 'Satisfied' : 'Not satisfied — check model',
  });

  // 3. Cable stress
  if (stressResult) {
    checks.push({
      id: 'cable-stress',
      name: 'Cable Stress Check',
      passed: stressResult.status !== 'FAIL',
      value: `Utilization = ${(stressResult.utilization * 100).toFixed(1)}% — ${stressResult.status}`,
      details: `σ_max = ${stressResult.maxStress.toFixed(1)} MPa, σ_allow = ${stressResult.allowableStress.toFixed(1)} MPa`,
    });
  }

  // 4. Anchor B (right) sliding
  if (deadBlockResult && deadBlockResult.slidingFS !== null) {
    const slidingOk = deadBlockResult.slidingFS >= 1.5;
    checks.push({
      id: 'sliding-b',
      name: 'Anchor B Sliding FS',
      passed: slidingOk,
      value: `FS = ${deadBlockResult.slidingFS.toFixed(2)}`,
      details: slidingOk ? 'FS ≥ 1.5 — Acceptable' : 'FS < 1.5 — Review required',
    });
  }

  // 5. Anchor B (right) overturning
  if (deadBlockResult && deadBlockResult.overturningFS !== null) {
    const otOk = deadBlockResult.overturningFS >= 2.0;
    checks.push({
      id: 'overturning-b',
      name: 'Anchor B Overturning FS',
      passed: otOk,
      value: `FS = ${deadBlockResult.overturningFS.toFixed(2)}`,
      details: otOk ? 'FS ≥ 2.0 — Acceptable' : 'FS < 2.0 — Review required',
    });
  }

  // 6. Anchor A (left) sliding
  if (deadBlockResultA && deadBlockResultA.slidingFS !== null) {
    const slidingOk = deadBlockResultA.slidingFS >= 1.5;
    checks.push({
      id: 'sliding-a',
      name: 'Anchor A Sliding FS',
      passed: slidingOk,
      value: `FS = ${deadBlockResultA.slidingFS.toFixed(2)}`,
      details: slidingOk ? 'FS ≥ 1.5 — Acceptable' : 'FS < 1.5 — Review required',
    });
  }

  // 7. Anchor A (left) overturning
  if (deadBlockResultA && deadBlockResultA.overturningFS !== null) {
    const otOk = deadBlockResultA.overturningFS >= 2.0;
    checks.push({
      id: 'overturning-a',
      name: 'Anchor A Overturning FS',
      passed: otOk,
      value: `FS = ${deadBlockResultA.overturningFS.toFixed(2)}`,
      details: otOk ? 'FS ≥ 2.0 — Acceptable' : 'FS < 2.0 — Review required',
    });
  }

  return checks;
}
