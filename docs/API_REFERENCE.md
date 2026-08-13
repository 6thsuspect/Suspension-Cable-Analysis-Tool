# API Reference

This document provides a complete reference for the Suspension Cable Analyzer's engineering calculation engine. The engine is implemented as pure TypeScript functions with no React or browser dependencies, making it independently testable and portable.

---

## Table of Contents

1. [Data Models](#data-models)
2. [Cable Solver](#cable-solver)
3. [Pulley Calculator](#pulley-calculator)
4. [Dead Block Calculator](#dead-block-calculator)
5. [Stress Calculator](#stress-calculator)
6. [Temperature Calculator](#temperature-calculator)
7. [Engineering Checks](#engineering-checks)

---

## Data Models

All types are defined in `src/models/types.ts`.

### AnchorType

```typescript
type AnchorType = 'pylon' | 'direct';
```

| Value | Description |
|-------|-------------|
| `'pylon'` | Cable passes over pulley at pylon top with backstay to dead block |
| `'direct'` | Cable fixed directly to anchor (no pylon or backstay) |

---

### CableGeometry

```typescript
interface CableGeometry {
  leftPylonX: number;        // m - X coordinate of left anchor
  leftPylonY: number;        // m - Y elevation of left anchor (pylon top or direct)
  rightPylonX: number;       // m - X coordinate of right anchor
  rightPylonY: number;       // m - Y elevation of right anchor
  sag: number;               // m - Maximum sag below chord line
  sagRatio: number | null;   // Sag ratio (e.g., 10 means L/10)
  leftAnchorType: AnchorType;
  rightAnchorType: AnchorType;
}
```

---

### CableProperties

```typescript
interface CableProperties {
  area: number;              // mm² - Cross-sectional area
  diameter: number;          // mm - Cable diameter
  youngsModulus: number;     // MPa - Young's modulus (E)
  unitWeight: number;        // kN/m - Weight per unit length
  allowableStress: number;   // MPa - Allowable stress limit
  ultimateStrength: number;  // MPa - Ultimate tensile strength
  thermalCoeff: number;      // per °C - Coefficient of thermal expansion
  weightBasis: 'horizontal' | 'arc';  // How unit weight is applied
}
```

---

### PointLoad

```typescript
interface PointLoad {
  id: string;                // Unique identifier
  x: number;                 // m - Position from left support
  magnitude: number;         // kN - Load magnitude
  direction: 'vertical' | 'horizontal';
  loadCaseId: string;        // Parent load case ID
  description: string;       // User description
}
```

---

### CablePoint

Represents a discretized point along the cable profile.

```typescript
interface CablePoint {
  x: number;      // m - Horizontal position
  y: number;      // m - Vertical position (elevation)
  s: number;      // m - Arc length from start
  slope: number;  // dy/dx - Local slope
  H: number;      // kN - Horizontal tension component
  V: number;      // kN - Vertical tension component (absolute)
  T: number;      // kN - Total tension
  stress: number; // MPa - Cable stress
  strain: number; // Strain (dimensionless)
}
```

---

### CableSolverResult

```typescript
interface CableSolverResult {
  converged: boolean;           // Did the solver converge?
  iterations: number;           // Number of iterations used
  error: number;                // Final residual error
  horizontalTension: number;    // kN - Horizontal tension H
  points: CablePoint[];         // Discretized cable profile
  segments: CableSegment[];     // Cable segments for reporting
  maxTension: number;           // kN - Maximum cable tension
  minTension: number;           // kN - Minimum cable tension
  cableLength: number;          // m - Total cable arc length
  leftReaction: { H: number; V: number };   // kN - Left support reactions
  rightReaction: { H: number; V: number };  // kN - Right support reactions
  equilibriumResidual: { Fx: number; Fy: number };  // kN - Equilibrium check
}
```

---

### PulleyResult

```typescript
interface PulleyResult {
  Rx: number;          // kN - Horizontal component of resultant
  Ry: number;          // kN - Vertical component of resultant
  R: number;           // kN - Resultant magnitude
  direction: number;   // degrees - Resultant direction from horizontal
  T1: number;          // kN - Tension in cable segment 1 (main span)
  T2: number;          // kN - Tension in cable segment 2 (backstay)
  angle1: number;      // degrees - Angle of segment 1
  angle2: number;      // degrees - Angle of segment 2
  angleBetween: number; // degrees - Angle between cable segments
}
```

---

### DeadBlockResult

```typescript
interface DeadBlockResult {
  Hd: number;                    // kN - Horizontal force on block
  Vd: number;                    // kN - Vertical force on block
  Rd: number;                    // kN - Resultant force
  cableAngle: number;            // degrees - Cable angle at block
  blockWeight: number;           // kN - Weight of concrete block
  slidingFS: number | null;      // Factor of safety against sliding
  overturningFS: number | null;  // Factor of safety against overturning
  bearingPressureMax: number | null;  // kPa - Maximum bearing pressure
  bearingPressureMin: number | null;  // kPa - Minimum bearing pressure
}
```

---

### DeadBlockDefinition

```typescript
interface DeadBlockDefinition {
  x: number;              // m - X position of block center
  y: number;              // m - Y position of block top
  width: number;          // m - Block width (perpendicular to cable)
  height: number;         // m - Block height
  depth: number;          // m - Block depth (into page)
  concreteDensity: number; // kN/m³ - Concrete unit weight
  frictionCoeff: number;   // Foundation friction coefficient
  cableAngle: number;      // degrees - Cable angle (legacy, now computed)
}
```

---

### CalculationStep

For transparent calculations and educational display.

```typescript
interface CalculationStep {
  title: string;           // Step title
  equation: string;        // LaTeX equation
  variables: {
    name: string;          // Variable name
    symbol: string;        // LaTeX symbol
    value: number;         // Numeric value
    unit: string;          // Unit of measure
  }[];
  result: {
    name: string;          // Result name
    value: number;         // Numeric value
    unit: string;          // Unit of measure
  };
  explanation?: string;    // Optional educational explanation
}
```

---

## Cable Solver

**Module**: `src/engine/cable/cableSolver.ts`

### solveCable()

Main cable analysis function. Solves for cable profile and tensions given geometry, properties, and loading.

```typescript
function solveCable(
  geometry: CableGeometry,
  cable: CableProperties,
  pointLoads: PointLoad[],
  distributedLoads: DistributedLoad[],
  includeSelfWeight: boolean,
  segments: number,
  tolerance: number,
  maxIterations: number
): CableSolverResult
```

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `geometry` | `CableGeometry` | Cable geometry definition |
| `cable` | `CableProperties` | Cable material and section properties |
| `pointLoads` | `PointLoad[]` | Array of point loads |
| `distributedLoads` | `DistributedLoad[]` | Array of distributed loads |
| `includeSelfWeight` | `boolean` | Include cable self-weight? |
| `segments` | `number` | Number of cable discretization segments |
| `tolerance` | `number` | Convergence tolerance |
| `maxIterations` | `number` | Maximum solver iterations |

**Returns**: `CableSolverResult`

**Algorithm**:
1. Estimate initial horizontal tension H
2. Iteratively adjust H to match sag constraint
3. Compute full cable profile using equilibrium equations
4. Apply linear correction to ensure endpoints match anchor elevations
5. Calculate tensions, stresses, and reactions at all points

---

### calculatePointLoadCable()

Analytical solution for a cable with a single point load.

```typescript
function calculatePointLoadCable(
  span: number,
  load: number,
  loadX: number,
  sag: number
): {
  H: number;
  Va: number;
  Vb: number;
  Ta: number;
  Tb: number;
  Tmax: number;
  sag: number;
  steps: CalculationStep[];
}
```

**Parameters**:

| Parameter | Type | Unit | Description |
|-----------|------|------|-------------|
| `span` | `number` | m | Cable span |
| `load` | `number` | kN | Point load magnitude |
| `loadX` | `number` | m | Load position from left support |
| `sag` | `number` | m | Cable sag |

**Equations Used**:

```
V_A = P × b / L
V_B = P × a / L
H = P × a × b / (L × f)
T = √(H² + V²)
```

---

### calculateParabolicCable()

Analytical solution for cable under uniform distributed load.

```typescript
function calculateParabolicCable(
  span: number,
  w: number,
  sag: number,
  leftY: number,
  rightY: number
): {
  H: number;
  Va: number;
  Vb: number;
  Tmax: number;
  Tmin: number;
  cableLength: number;
  steps: CalculationStep[];
}
```

**Parameters**:

| Parameter | Type | Unit | Description |
|-----------|------|------|-------------|
| `span` | `number` | m | Cable span |
| `w` | `number` | kN/m | Uniform load intensity |
| `sag` | `number` | m | Cable sag |
| `leftY` | `number` | m | Left support elevation |
| `rightY` | `number` | m | Right support elevation |

**Equations Used**:

```
H = w × L² / (8 × f)
L_cable ≈ L × (1 + 8f²/(3L²))
```

---

### Helper Functions

#### getSpan()

```typescript
function getSpan(geo: CableGeometry): number
```
Returns the horizontal span between anchors.

#### sagFromRatio()

```typescript
function sagFromRatio(span: number, ratio: number): number
```
Calculates sag from span and sag ratio (e.g., L/10).

---

## Pulley Calculator

**Module**: `src/engine/pulley/pulleyCalc.ts`

### calculatePulleyResultant()

Calculates the resultant force on a pulley from two cable tensions.

```typescript
function calculatePulleyResultant(input: PulleyInput): {
  result: PulleyResult;
  steps: CalculationStep[];
}
```

**Input Interface**:

```typescript
interface PulleyInput {
  T1: number;           // kN - Tension in cable segment 1
  T2: number;           // kN - Tension in cable segment 2
  angle1: number;       // radians - Angle of segment 1 from horizontal
  angle2: number;       // radians - Angle of segment 2 from horizontal
  frictionless: boolean; // Assume frictionless pulley?
}
```

**Equations Used**:

```
R⃗ = T⃗₁ + T⃗₂

Rx = T₁ × cos(θ₁) + T₂ × cos(θ₂)
Ry = T₁ × sin(θ₁) + T₂ × sin(θ₂)
R = √(Rx² + Ry²)
```

For frictionless pulley: `T₁ = T₂`

---

## Dead Block Calculator

**Module**: `src/engine/deadBlock/deadBlockCalc.ts`

### calculateDeadBlockForces()

Calculates forces on anchor block and stability factors of safety.

```typescript
function calculateDeadBlockForces(input: DeadBlockInput): {
  result: DeadBlockResult;
  steps: CalculationStep[];
}
```

**Input Interface**:

```typescript
interface DeadBlockInput {
  cableTension: number;      // kN - Cable tension at block
  cableAngle: number;        // degrees - Cable angle below horizontal
  block: DeadBlockDefinition; // Block geometry and properties
}
```

**Equations Used**:

**Force Components**:
```
H_D = T × cos(θ)
V_D = T × sin(θ)
R_D = √(H_D² + V_D²)
```

**Block Weight**:
```
W = width × height × depth × γ_concrete
```

**Sliding Factor of Safety**:
```
FS_sliding = (W - V_D) × μ / H_D
```

**Overturning Factor of Safety**:
```
M_resisting = W × (width/2)
M_overturning = H_D × height + V_D × (width/2)
FS_overturning = M_resisting / M_overturning
```

**Bearing Pressure**:
```
q_max = (W - V_D) / A × (1 + 6e/width)
q_min = (W - V_D) / A × (1 - 6e/width)
```

---

## Stress Calculator

**Module**: `src/engine/stress/stressCalc.ts`

### calculateCableStress()

Calculates maximum cable stress and utilization ratio.

```typescript
function calculateCableStress(
  maxTension: number,
  cable: CableProperties
): {
  result: StressResult;
  steps: CalculationStep[];
}
```

**Result Interface**:

```typescript
interface StressResult {
  maxStress: number;      // MPa
  allowableStress: number; // MPa
  utilization: number;     // Ratio (0-1+)
  status: 'PASS' | 'WARNING' | 'FAIL';
}
```

**Equations**:
```
σ_max = T_max / A
UR = σ_max / σ_allow
```

**Status Logic**:
- `PASS`: UR ≤ 0.85
- `WARNING`: 0.85 < UR ≤ 1.0
- `FAIL`: UR > 1.0

---

### calculateElongation()

Calculates cable elastic elongation.

```typescript
function calculateElongation(
  points: CablePoint[],
  cable: CableProperties,
  thermalElongation?: number
): {
  result: ElongationResult;
  steps: CalculationStep[];
}
```

**Result Interface**:

```typescript
interface ElongationResult {
  originalLength: number;     // m
  elasticElongation: number;  // mm
  thermalElongation: number;  // mm
  totalDeformation: number;   // mm
  finalLength: number;        // m
}
```

**Equations**:
```
ΔL = Σ (T_i × Δs_i) / (A × E)
```

---

## Temperature Calculator

**Module**: `src/engine/temperature/temperatureCalc.ts`

### calculateTemperatureEffect()

Calculates thermal expansion/contraction effects.

```typescript
function calculateTemperatureEffect(input: TemperatureInput): {
  result: TemperatureResult;
  steps: CalculationStep[];
}
```

**Input Interface**:

```typescript
interface TemperatureInput {
  deltaT: number;         // °C - Temperature change
  thermalCoeff: number;   // per °C - Coefficient of thermal expansion
  cableLength: number;    // m - Cable length
  cableArea: number;      // mm² - Cable area
  youngsModulus: number;  // MPa - Young's modulus
}
```

**Equations**:
```
ΔL_T = α × L × ΔT
ε_T = α × ΔT
F_T = ε_T × E × A  (if restrained)
```

---

## Engineering Checks

**Module**: `src/engine/checks/engineeringChecks.ts`

### runEngineeringChecks()

Runs all engineering validation checks and returns results.

```typescript
function runEngineeringChecks(
  solverResult: CableSolverResult,
  stressResult: StressResult | null,
  deadBlockResult: DeadBlockResult | null,
  deadBlockResultA?: DeadBlockResult | null
): EngineeringCheck[]
```

**Check Interface**:

```typescript
interface EngineeringCheck {
  id: string;       // Unique check identifier
  name: string;     // Check name
  passed: boolean;  // Pass/fail status
  value: string;    // Result value as string
  details: string;  // Additional details
}
```

**Checks Performed**:

| Check ID | Description | Pass Criteria |
|----------|-------------|---------------|
| `solver-convergence` | Did solver converge? | `converged === true` |
| `equilibrium-x` | Horizontal equilibrium | `|ΣFx| < 0.1 kN` |
| `equilibrium-y` | Vertical equilibrium | `|ΣFy| < 1.0 kN` |
| `cable-stress` | Cable stress check | `UR ≤ 1.0` |
| `sliding-a` | Anchor A sliding | `FS ≥ 1.5` |
| `sliding-b` | Anchor B sliding | `FS ≥ 1.5` |
| `overturning-a` | Anchor A overturning | `FS ≥ 2.0` |
| `overturning-b` | Anchor B overturning | `FS ≥ 2.0` |

---

## Usage Example

```typescript
import { solveCable } from './engine/cable/cableSolver';
import { calculatePulleyResultant } from './engine/pulley/pulleyCalc';
import { calculateDeadBlockForces } from './engine/deadBlock/deadBlockCalc';
import { calculateCableStress } from './engine/stress/stressCalc';
import { runEngineeringChecks } from './engine/checks/engineeringChecks';

// Define geometry
const geometry: CableGeometry = {
  leftPylonX: 0,
  leftPylonY: 12,
  rightPylonX: 104,
  rightPylonY: 12,
  sag: 10.4,
  sagRatio: 10,
  leftAnchorType: 'pylon',
  rightAnchorType: 'pylon',
};

// Define cable properties
const cable: CableProperties = {
  area: 5000,
  diameter: 80,
  youngsModulus: 160000,
  unitWeight: 0.5,
  allowableStress: 800,
  ultimateStrength: 1600,
  thermalCoeff: 12e-6,
  weightBasis: 'horizontal',
};

// Define point load
const pointLoads: PointLoad[] = [{
  id: 'pl-1',
  x: 52,
  magnitude: 550,
  direction: 'vertical',
  loadCaseId: 'lc-1',
  description: 'Main load',
}];

// Solve cable
const result = solveCable(
  geometry,
  cable,
  pointLoads,
  [],           // no distributed loads
  true,         // include self-weight
  100,          // segments
  1e-6,         // tolerance
  100           // max iterations
);

console.log('Horizontal Tension:', result.horizontalTension, 'kN');
console.log('Max Tension:', result.maxTension, 'kN');
console.log('Converged:', result.converged);
```

---

## Error Handling

All calculation functions validate inputs and throw descriptive errors:

```typescript
// Example error cases
if (span <= 0) throw new Error('Span must be positive');
if (sag <= 0) throw new Error('Sag must be positive');
if (cable.area <= 0) throw new Error('Cable area must be positive');
```

The solver indicates non-convergence via the `converged` flag rather than throwing:

```typescript
if (!result.converged) {
  console.warn('Solver did not converge. Results may be inaccurate.');
}
```

---

## Units Convention

| Quantity | Unit | Notes |
|----------|------|-------|
| Length | m | Meters |
| Force | kN | Kilonewtons |
| Stress | MPa | N/mm² |
| Area | mm² | Square millimeters |
| Unit weight | kN/m | Per meter length |
| Angle | radians | Internal calculations |
| Angle (display) | degrees | User interface |
| Temperature | °C | Celsius |

---

## Version Compatibility

This API is designed for:
- TypeScript 5.0+
- ES2020+ module syntax
- No browser-specific APIs (Electron compatible)
