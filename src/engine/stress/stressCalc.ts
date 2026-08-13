// ============================================================
// Cable Stress & Elongation Calculator — Pure TypeScript
// ============================================================

import type {
  CableProperties,
  CablePoint,
  StressResult,
  ElongationResult,
  CalculationStep,
} from '../../models/types';

export function calculateCableStress(
  maxTension: number,  // kN
  cable: CableProperties
): { result: StressResult; steps: CalculationStep[] } {
  const steps: CalculationStep[] = [];

  // Convert: T in kN, area in mm² → stress in MPa (N/mm²)
  const maxStress = (maxTension * 1000) / cable.area; // kN→N / mm²
  const utilization = cable.allowableStress > 0 ? maxStress / cable.allowableStress : 0;

  let status: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
  if (utilization > 1.0) status = 'FAIL';
  else if (utilization > 0.85) status = 'WARNING';

  steps.push({
    title: 'Maximum Cable Stress',
    equation: '\\sigma_{max} = \\frac{T_{max}}{A}',
    variables: [
      { name: 'Max Tension', symbol: 'T_{max}', value: maxTension, unit: 'kN' },
      { name: 'Cable Area', symbol: 'A', value: cable.area, unit: 'mm²' },
    ],
    result: { name: '\\sigma_{max}', value: maxStress, unit: 'MPa' },
  });

  steps.push({
    title: 'Utilization Ratio',
    equation: 'UR = \\frac{\\sigma_{max}}{\\sigma_{allow}}',
    variables: [
      { name: 'Max Stress', symbol: '\\sigma_{max}', value: maxStress, unit: 'MPa' },
      { name: 'Allowable Stress', symbol: '\\sigma_{allow}', value: cable.allowableStress, unit: 'MPa' },
    ],
    result: { name: 'UR', value: utilization, unit: '' },
  });

  return { result: { maxStress, allowableStress: cable.allowableStress, utilization, status }, steps };
}

export function calculateElongation(
  points: CablePoint[],
  cable: CableProperties,
  thermalElongation: number = 0
): { result: ElongationResult; steps: CalculationStep[] } {
  const steps: CalculationStep[] = [];

  let elasticElongation = 0; // mm
  let originalLength = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const ds = Math.sqrt(dx * dx + dy * dy);
    originalLength += ds;

    const avgT = (points[i].T + points[i + 1].T) / 2; // kN
    // dL = T * ds / (A * E)
    // T in kN = 1000 N, ds in m = 1000 mm, A in mm², E in MPa (N/mm²)
    // dL = (T * 1000) * (ds * 1000) / (A * E) → in mm
    const dL = (avgT * 1000 * ds * 1000) / (cable.area * cable.youngsModulus);
    elasticElongation += dL;
  }

  const totalDeformation = elasticElongation + thermalElongation;
  const finalLength = originalLength + totalDeformation / 1000; // convert mm back to m

  steps.push({
    title: 'Elastic Elongation',
    equation: '\\Delta L = \\sum \\frac{T_i \\cdot \\Delta s_i}{A \\cdot E}',
    variables: [
      { name: 'Cable Area', symbol: 'A', value: cable.area, unit: 'mm²' },
      { name: "Young's Modulus", symbol: 'E', value: cable.youngsModulus, unit: 'MPa' },
      { name: 'Segments', symbol: 'n', value: points.length - 1, unit: '' },
    ],
    result: { name: '\\Delta L', value: elasticElongation, unit: 'mm' },
  });

  return {
    result: {
      originalLength,
      elasticElongation,
      thermalElongation,
      totalDeformation,
      finalLength,
    },
    steps,
  };
}
