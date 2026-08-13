// ============================================================
// Dead Block / Anchor Force Calculator — Pure TypeScript
// ============================================================

import type { DeadBlockResult, DeadBlockDefinition, CalculationStep } from '../../models/types';

export interface DeadBlockInput {
  cableTension: number;    // kN
  cableAngle: number;      // degrees from horizontal
  block: DeadBlockDefinition;
}

export function calculateDeadBlockForces(input: DeadBlockInput): {
  result: DeadBlockResult;
  steps: CalculationStep[];
} {
  const { cableTension, cableAngle, block } = input;
  const steps: CalculationStep[] = [];
  const angleRad = (cableAngle * Math.PI) / 180;

  // Horizontal and vertical components
  const Hd = cableTension * Math.cos(angleRad);
  const Vd = cableTension * Math.sin(angleRad);
  const Rd = Math.sqrt(Hd * Hd + Vd * Vd);

  steps.push({
    title: 'Dead Block Horizontal Force',
    equation: 'H_D = T \\cos\\theta',
    variables: [
      { name: 'Cable Tension', symbol: 'T', value: cableTension, unit: 'kN' },
      { name: 'Cable Angle', symbol: '\\theta', value: cableAngle, unit: '°' },
    ],
    result: { name: 'H_D', value: Hd, unit: 'kN' },
  });

  steps.push({
    title: 'Dead Block Vertical Force',
    equation: 'V_D = T \\sin\\theta',
    variables: [
      { name: 'Cable Tension', symbol: 'T', value: cableTension, unit: 'kN' },
      { name: 'Cable Angle', symbol: '\\theta', value: cableAngle, unit: '°' },
    ],
    result: { name: 'V_D', value: Vd, unit: 'kN' },
  });

  // Block weight
  const blockWeight = block.width * block.height * block.depth * block.concreteDensity;

  // Sliding check
  const slidingResistance = (blockWeight - Vd) * block.frictionCoeff;
  const slidingFS = Hd > 0 ? slidingResistance / Hd : null;

  // Overturning check (about toe)
  const resistingMoment = blockWeight * (block.width / 2);
  const overturningMoment = Hd * block.height + Vd * (block.width / 2);
  const overturningFS = overturningMoment > 0 ? resistingMoment / overturningMoment : null;

  // Bearing pressure
  const baseArea = block.width * block.depth;
  const eccentricity = overturningMoment > 0
    ? (overturningMoment - resistingMoment) / (blockWeight - Vd)
    : 0;
  const netVertical = blockWeight - Vd;
  const bearingMax = baseArea > 0 ? (netVertical / baseArea) * (1 + 6 * Math.abs(eccentricity) / block.width) : null;
  const bearingMin = baseArea > 0 ? (netVertical / baseArea) * (1 - 6 * Math.abs(eccentricity) / block.width) : null;

  if (slidingFS !== null) {
    steps.push({
      title: 'Sliding Factor of Safety',
      equation: 'FS_{sliding} = \\frac{(W - V_D) \\mu}{H_D}',
      variables: [
        { name: 'Block Weight', symbol: 'W', value: blockWeight, unit: 'kN' },
        { name: 'Vertical Force', symbol: 'V_D', value: Vd, unit: 'kN' },
        { name: 'Friction', symbol: '\\mu', value: block.frictionCoeff, unit: '' },
        { name: 'Horizontal Force', symbol: 'H_D', value: Hd, unit: 'kN' },
      ],
      result: { name: 'FS_{sliding}', value: slidingFS, unit: '' },
    });
  }

  return {
    result: {
      Hd,
      Vd,
      Rd,
      cableAngle,
      blockWeight,
      slidingFS,
      overturningFS,
      bearingPressureMax: bearingMax,
      bearingPressureMin: bearingMin,
    },
    steps,
  };
}
