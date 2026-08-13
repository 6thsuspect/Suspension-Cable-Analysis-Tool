// ============================================================
// Pulley / Pylon Force Calculator — Pure TypeScript
// ============================================================

import type { PulleyResult, CalculationStep } from '../../models/types';

export interface PulleyInput {
  T1: number;       // kN — tension entering
  T2: number;       // kN — tension leaving
  angle1: number;   // radians — angle of cable segment 1 from horizontal
  angle2: number;   // radians — angle of cable segment 2 from horizontal
  frictionless: boolean;
}

export function calculatePulleyResultant(input: PulleyInput): {
  result: PulleyResult;
  steps: CalculationStep[];
} {
  const { T1, T2, angle1, angle2 } = input;
  const steps: CalculationStep[] = [];

  // Cable tension vectors (both pulling away from pulley)
  // Segment 1: comes from left, pulls to the left-down
  const T1x = T1 * Math.cos(angle1);
  const T1y = T1 * Math.sin(angle1);

  // Segment 2: goes to right/down to dead block
  const T2x = T2 * Math.cos(angle2);
  const T2y = T2 * Math.sin(angle2);

  // Resultant on pulley = vector sum of tensions
  const Rx = T1x + T2x;
  const Ry = T1y + T2y;
  const R = Math.sqrt(Rx * Rx + Ry * Ry);
  const direction = Math.atan2(Ry, Rx) * (180 / Math.PI);

  // Angle between cable segments
  const angleBetween = Math.abs(angle1 - angle2);

  steps.push({
    title: 'Pulley Resultant Force',
    equation: '\\vec{R} = \\vec{T_1} + \\vec{T_2}',
    variables: [
      { name: 'T₁', symbol: 'T_1', value: T1, unit: 'kN' },
      { name: 'T₂', symbol: 'T_2', value: T2, unit: 'kN' },
      { name: 'Angle 1', symbol: '\\theta_1', value: angle1 * 180 / Math.PI, unit: '°' },
      { name: 'Angle 2', symbol: '\\theta_2', value: angle2 * 180 / Math.PI, unit: '°' },
    ],
    result: { name: 'R', value: R, unit: 'kN' },
  });

  steps.push({
    title: 'Resultant Components',
    equation: 'R_x = T_1 \\cos\\theta_1 + T_2 \\cos\\theta_2',
    variables: [
      { name: 'Rx', symbol: 'R_x', value: Rx, unit: 'kN' },
      { name: 'Ry', symbol: 'R_y', value: Ry, unit: 'kN' },
    ],
    result: { name: 'R', value: R, unit: 'kN' },
  });

  return {
    result: {
      Rx,
      Ry,
      R,
      direction,
      T1,
      T2,
      angle1: angle1 * 180 / Math.PI,
      angle2: angle2 * 180 / Math.PI,
      angleBetween: angleBetween * 180 / Math.PI,
    },
    steps,
  };
}
