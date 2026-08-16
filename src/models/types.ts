// ============================================================
// Suspension Cable Analyzer — Core Data Models
// ============================================================

// --- Anchor Type ---
export type AnchorType = 'pylon' | 'direct';

// --- Geometry ---
export interface CableGeometry {
  leftPylonX: number;       // m
  leftPylonY: number;       // m (pylon top / anchor elevation)
  rightPylonX: number;      // m
  rightPylonY: number;      // m (pylon top / anchor elevation)
  sag: number;              // m (positive downward from chord)
  sagRatio: number | null;  // e.g. 10 means L/10
  leftAnchorType: AnchorType;   // 'pylon' = pylon+pulley+backstay, 'direct' = cable fixed to anchor
  rightAnchorType: AnchorType;
}

export interface PylonDefinition {
  leftHeight: number;  // m above ground
  rightHeight: number; // m above ground
}

// --- Cable Properties ---
export interface CableProperties {
  area: number;             // mm²
  diameter: number;         // mm
  youngsModulus: number;     // MPa (N/mm²)
  unitWeight: number;       // kN/m
  allowableStress: number;  // MPa
  ultimateStrength: number; // MPa
  thermalCoeff: number;     // per °C
  weightBasis: 'horizontal' | 'arc'; // weight per horizontal projection or arc length
}

// --- Point Load ---
export interface PointLoad {
  id: string;
  x: number;          // m from left support
  magnitude: number;  // kN
  direction: 'vertical' | 'horizontal';
  loadCaseId: string;
  description: string;
}

// --- Distributed Load ---
export interface DistributedLoad {
  id: string;
  startX: number;  // m
  endX: number;    // m
  w: number;       // kN/m (uniform)
  loadCaseId: string;
  description: string;
}

// --- Temperature ---
export interface TemperatureLoad {
  deltaT: number;  // °C
}

// --- Load Case ---
export interface LoadCase {
  id: string;
  name: string;
  includeSelfWeight: boolean;
  pointLoads: PointLoad[];
  distributedLoads: DistributedLoad[];
  temperature: TemperatureLoad | null;
}

// --- Load Combination ---
export interface LoadCombination {
  id: string;
  name: string;
  factors: { loadCaseId: string; factor: number }[];
}

// --- Pulley ---
export interface PulleyDefinition {
  diameter: number;       // mm
  frictionCoeff: number;  // dimensionless
  frictionless: boolean;
}

// --- Dead Block ---
export interface DeadBlockDefinition {
  x: number;         // m
  y: number;         // m
  width: number;     // m
  height: number;    // m
  depth: number;     // m
  concreteDensity: number;    // kN/m³
  frictionCoeff: number;      // foundation friction
  cableAngle: number;         // degrees from horizontal
}

// --- Analysis Settings ---
export interface AnalysisSettings {
  segments: number;           // cable discretization
  tolerance: number;          // convergence tolerance
  maxIterations: number;
  includeSelfWeight: boolean;
  includeElasticity: boolean;
  includeTemperature: boolean;
  educationalMode: boolean;
}

// --- Cable Point (discretized) ---
export interface CablePoint {
  x: number;
  y: number;
  s: number;     // arc length from start
  slope: number; // dy/dx
  H: number;     // horizontal tension kN
  V: number;     // vertical tension kN
  T: number;     // total tension kN
  stress: number; // MPa
  strain: number;
}

// --- Cable Segment ---
export interface CableSegment {
  startIndex: number;
  endIndex: number;
  startX: number;
  endX: number;
  length: number;
  avgTension: number;
}

// --- Key Point (support or load location) ---
export interface KeyPoint {
  id: string;
  type: 'support-left' | 'support-right' | 'point-load';
  x: number;
  y: number;
  angleLeft: number;   // degrees - cable angle on left side (from horizontal)
  angleRight: number;  // degrees - cable angle on right side (from horizontal)
  tensionLeft: number;  // kN - tension in cable on left side
  tensionRight: number; // kN - tension in cable on right side
  H: number;           // kN - horizontal component
  Vup: number;         // kN - vertical reaction (upward, for supports)
  Vdown: number;       // kN - vertical load (downward, for point loads)
  loadMagnitude?: number; // kN - point load magnitude (if applicable)
  loadDescription?: string;
}

// --- Solver Result ---
export interface CableSolverResult {
  converged: boolean;
  iterations: number;
  error: number;
  horizontalTension: number; // kN
  points: CablePoint[];
  segments: CableSegment[];
  maxTension: number;
  minTension: number;
  cableLength: number;
  leftReaction: { H: number; V: number };
  rightReaction: { H: number; V: number };
  equilibriumResidual: { Fx: number; Fy: number };
  keyPoints: KeyPoint[];  // angles and forces at supports and load points
}

// --- Pulley Result ---
export interface PulleyResult {
  Rx: number;
  Ry: number;
  R: number;
  direction: number; // degrees
  T1: number;
  T2: number;
  angle1: number;
  angle2: number;
  angleBetween: number;
}

// --- Dead Block Result ---
export interface DeadBlockResult {
  Hd: number;
  Vd: number;
  Rd: number;
  cableAngle: number;
  blockWeight: number;
  slidingFS: number | null;
  overturningFS: number | null;
  bearingPressureMax: number | null;
  bearingPressureMin: number | null;
}

// --- Temperature Result ---
export interface TemperatureResult {
  deltaT: number;
  freeExpansion: number;     // mm
  thermalStrain: number;
  thermalForce: number | null; // kN (only if restrained)
  originalLength: number;     // m
}

// --- Elongation Result ---
export interface ElongationResult {
  originalLength: number;     // m
  elasticElongation: number;  // mm
  thermalElongation: number;  // mm
  totalDeformation: number;   // mm
  finalLength: number;        // m
}

// --- Cable Stress Result ---
export interface StressResult {
  maxStress: number;    // MPa
  allowableStress: number; // MPa
  utilization: number;  // ratio
  status: 'PASS' | 'WARNING' | 'FAIL';
}

// --- Engineering Check ---
export interface EngineeringCheck {
  id: string;
  name: string;
  passed: boolean;
  value: string;
  details: string;
}

// --- Calculation Step (for transparency) ---
export interface CalculationStep {
  title: string;
  equation: string;       // LaTeX
  variables: { name: string; symbol: string; value: number; unit: string }[];
  result: { name: string; value: number; unit: string };
  explanation?: string;
}

// --- Project ---
export interface SuspensionCableProject {
  name: string;
  description: string;
  version: string;
  geometry: CableGeometry;
  cable: CableProperties;
  loadCases: LoadCase[];
  combinations: LoadCombination[];
  pulley: PulleyDefinition;
  pylon: PylonDefinition;
  deadBlock: DeadBlockDefinition;   // anchor at Pylon B (right)
  deadBlockA: DeadBlockDefinition;  // anchor at Pylon A (left)
  settings: AnalysisSettings;
  activeLoadCaseId: string;
}
