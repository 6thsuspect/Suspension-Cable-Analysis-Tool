// ============================================================
// Temperature Effects Calculator — Pure TypeScript
// ============================================================

import type { TemperatureResult, CalculationStep } from '../../models/types';

export interface TemperatureInput {
  deltaT: number;         // °C
  thermalCoeff: number;   // per °C
  cableLength: number;    // m
  cableArea: number;      // mm²
  youngsModulus: number;   // MPa
}

export function calculateTemperatureEffect(input: TemperatureInput): {
  result: TemperatureResult;
  steps: CalculationStep[];
} {
  const { deltaT, thermalCoeff, cableLength, cableArea, youngsModulus } = input;
  const steps: CalculationStep[] = [];

  // Free expansion
  const freeExpansion = thermalCoeff * cableLength * deltaT * 1000; // mm
  const thermalStrain = thermalCoeff * deltaT;

  // Force if fully restrained
  const thermalForce = thermalStrain * youngsModulus * cableArea / 1000; // kN

  steps.push({
    title: 'Free Thermal Expansion',
    equation: '\\Delta L_T = \\alpha \\cdot L \\cdot \\Delta T',
    variables: [
      { name: 'Thermal Coefficient', symbol: '\\alpha', value: thermalCoeff, unit: '/°C' },
      { name: 'Cable Length', symbol: 'L', value: cableLength, unit: 'm' },
      { name: 'Temperature Change', symbol: '\\Delta T', value: deltaT, unit: '°C' },
    ],
    result: { name: '\\Delta L_T', value: freeExpansion, unit: 'mm' },
  });

  steps.push({
    title: 'Thermal Strain',
    equation: '\\varepsilon_T = \\alpha \\cdot \\Delta T',
    variables: [
      { name: 'Thermal Coefficient', symbol: '\\alpha', value: thermalCoeff, unit: '/°C' },
      { name: 'Temperature Change', symbol: '\\Delta T', value: deltaT, unit: '°C' },
    ],
    result: { name: '\\varepsilon_T', value: thermalStrain, unit: '' },
  });

  steps.push({
    title: 'Restrained Thermal Force',
    equation: 'F_T = \\varepsilon_T \\cdot E \\cdot A',
    variables: [
      { name: 'Thermal Strain', symbol: '\\varepsilon_T', value: thermalStrain, unit: '' },
      { name: "Young's Modulus", symbol: 'E', value: youngsModulus, unit: 'MPa' },
      { name: 'Cable Area', symbol: 'A', value: cableArea, unit: 'mm²' },
    ],
    result: { name: 'F_T', value: thermalForce, unit: 'kN' },
    explanation: 'This force applies only if the cable is fully restrained against thermal expansion. For a freely hanging cable, temperature changes the cable length and thus the sag.',
  });

  return {
    result: {
      deltaT,
      freeExpansion,
      thermalStrain,
      thermalForce,
      originalLength: cableLength,
    },
    steps,
  };
}
