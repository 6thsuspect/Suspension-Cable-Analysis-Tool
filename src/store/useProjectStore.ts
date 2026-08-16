// ============================================================
// Zustand Project Store
// ============================================================

import { create } from 'zustand';
import type {
  SuspensionCableProject,
  CableGeometry,
  CableProperties,
  PointLoad,
  LoadCase,
  AnalysisSettings,
  DeadBlockDefinition,
  PulleyDefinition,
  CableSolverResult,
  StressResult,
  ElongationResult,
  PulleyResult,
  DeadBlockResult,
  TemperatureResult,
  EngineeringCheck,
  CalculationStep,
} from '../models/types';
import { solveCable, calculatePointLoadCable } from '../engine/cable/cableSolver';
import { calculateCableStress, calculateElongation } from '../engine/stress/stressCalc';
import { calculatePulleyResultant } from '../engine/pulley/pulleyCalc';
import { calculateDeadBlockForces } from '../engine/deadBlock/deadBlockCalc';
import { calculateTemperatureEffect } from '../engine/temperature/temperatureCalc';
import { runEngineeringChecks } from '../engine/checks/engineeringChecks';

// ----- Default project -----
const defaultGeometry: CableGeometry = {
  leftPylonX: 0,
  leftPylonY: 12,   // cable anchor elevation at top of left pylon (or direct anchor elevation)
  rightPylonX: 104,
  rightPylonY: 12,  // cable anchor elevation at top of right pylon (or direct anchor elevation)
  sag: 10.4,
  sagRatio: 10,
  leftAnchorType: 'pylon',   // 'pylon' = pylon with pulley + backstay, 'direct' = fixed to anchor block
  rightAnchorType: 'pylon',
};

const defaultCable: CableProperties = {
  area: 5000,
  diameter: 80,
  youngsModulus: 160000,
  unitWeight: 0.5,
  allowableStress: 800,
  ultimateStrength: 1600,
  thermalCoeff: 12e-6,
  weightBasis: 'horizontal',
};

const defaultPointLoad: PointLoad = {
  id: 'pl-1',
  x: 52,
  magnitude: 550,
  direction: 'vertical',
  loadCaseId: 'lc-1',
  description: 'Main Cable Load',
};

const defaultLoadCase: LoadCase = {
  id: 'lc-1',
  name: 'LC01 — Dead + Point Load',
  includeSelfWeight: true,
  pointLoads: [defaultPointLoad],
  distributedLoads: [],
  temperature: null,
};

const defaultSettings: AnalysisSettings = {
  segments: 100,
  tolerance: 1e-6,
  maxIterations: 100,
  includeSelfWeight: true,
  includeElasticity: true,
  includeTemperature: false,
  educationalMode: true,
};

// Anchor at Pylon B (right side)
const defaultDeadBlock: DeadBlockDefinition = {
  x: 120,
  y: -15,
  width: 3,
  height: 2.5,
  depth: 3,
  concreteDensity: 24,
  frictionCoeff: 0.5,
  cableAngle: 45,
};

// Anchor at Pylon A (left side)
const defaultDeadBlockA: DeadBlockDefinition = {
  x: -16,
  y: -15,
  width: 3,
  height: 2.5,
  depth: 3,
  concreteDensity: 24,
  frictionCoeff: 0.5,
  cableAngle: 45,
};

const defaultPulley: PulleyDefinition = {
  diameter: 500,
  frictionCoeff: 0,
  frictionless: true,
};

function createDefaultProject(name = 'Suspension Cable Project'): SuspensionCableProject {
  return {
    name,
    description: 'Default suspension cable analysis with anchors at both pylons',
    version: '0.1.0',
    geometry: { ...defaultGeometry },
    cable: { ...defaultCable },
    loadCases: [{ ...defaultLoadCase, pointLoads: [{ ...defaultPointLoad }] }],
    combinations: [],
    pulley: { ...defaultPulley },
    pylon: { leftHeight: 12, rightHeight: 12 },
    deadBlock: { ...defaultDeadBlock },
    deadBlockA: { ...defaultDeadBlockA },
    settings: { ...defaultSettings },
    activeLoadCaseId: 'lc-1',
  };
}

// Migrate older saved projects (missing deadBlockA, anchor types, or old ground-level anchors)
function migrateProject(raw: unknown): SuspensionCableProject {
  const base = createDefaultProject();
  const p = (raw ?? {}) as Partial<SuspensionCableProject>;
  const geometry = { ...base.geometry, ...(p.geometry ?? {}) };
  // Legacy projects anchored the cable at ground level (y = 0); lift anchors to pylon tops
  if (geometry.leftPylonY === 0 && geometry.rightPylonY === 0) {
    geometry.leftPylonY = base.pylon.leftHeight;
    geometry.rightPylonY = base.pylon.rightHeight;
  }
  // Ensure anchor types exist
  if (!geometry.leftAnchorType) geometry.leftAnchorType = 'pylon';
  if (!geometry.rightAnchorType) geometry.rightAnchorType = 'pylon';

  return {
    ...base,
    ...p,
    geometry,
    cable: { ...base.cable, ...(p.cable ?? {}) },
    pulley: { ...base.pulley, ...(p.pulley ?? {}) },
    pylon: { ...base.pylon, ...(p.pylon ?? {}) },
    deadBlock: { ...base.deadBlock, ...(p.deadBlock ?? {}) },
    deadBlockA: { ...base.deadBlockA, ...(p.deadBlockA ?? {}) },
    settings: { ...base.settings, ...(p.settings ?? {}) },
  } as SuspensionCableProject;
}

// ----- Store Interface -----
interface ProjectStore {
  // Project data
  project: SuspensionCableProject;

  // Results
  solverResult: CableSolverResult | null;
  stressResult: StressResult | null;
  elongationResult: ElongationResult | null;
  pulleyResult: PulleyResult | null;      // Pylon B (right)
  pulleyResultA: PulleyResult | null;     // Pylon A (left)
  deadBlockResult: DeadBlockResult | null;   // Anchor B (right)
  deadBlockResultA: DeadBlockResult | null;  // Anchor A (left)
  temperatureResult: TemperatureResult | null;
  engineeringChecks: EngineeringCheck[];
  calculationSteps: CalculationStep[];
  pointLoadAnalytical: ReturnType<typeof calculatePointLoadCable> | null;

  // UI state
  activeTab: string;
  showCalculations: boolean;
  diagramOptions: {
    showGrid: boolean;
    showLabels: boolean;
    showForceArrows: boolean;
    showDimensions: boolean;
    showTension: boolean;
  };
  labelStyle: {
    cableColor: string;
    pylonColor: string;
    loadColor: string;
    reactionColor: string;
    angleColor: string;
    dimColor: string;
    cableWidth: number;
    pylonWidth: number;
    fontSize: number;
    labelOffset: number;
  };

  // Actions
  updateGeometry: (geo: Partial<CableGeometry>) => void;
  updateCable: (cable: Partial<CableProperties>) => void;
  updateSettings: (settings: Partial<AnalysisSettings>) => void;
  updateDeadBlock: (db: Partial<DeadBlockDefinition>) => void;
  updateDeadBlockA: (db: Partial<DeadBlockDefinition>) => void;
  updatePulley: (p: Partial<PulleyDefinition>) => void;
  addPointLoad: (pl: PointLoad) => void;
  updatePointLoad: (id: string, updates: Partial<PointLoad>) => void;
  removePointLoad: (id: string) => void;
  movePointLoad: (id: string, x: number) => void;
  setActiveTab: (tab: string) => void;
  toggleCalculations: () => void;
  toggleDiagramOption: (option: keyof ProjectStore['diagramOptions']) => void;
  updateLabelStyle: (style: Partial<ProjectStore['labelStyle']>) => void;
  runAnalysis: () => void;
  exportProject: () => string;
  importProject: (json: string) => void;
  newProject: () => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: createDefaultProject(),
  solverResult: null,
  stressResult: null,
  elongationResult: null,
  pulleyResult: null,
  pulleyResultA: null,
  deadBlockResult: null,
  deadBlockResultA: null,
  temperatureResult: null,
  engineeringChecks: [],
  calculationSteps: [],
  pointLoadAnalytical: null,
  activeTab: 'geometry',
  showCalculations: false,
  diagramOptions: {
    showGrid: true,
    showLabels: true,
    showForceArrows: true,
    showDimensions: true,
    showTension: false,
  },
  labelStyle: {
    cableColor: '#0891b2',
    pylonColor: '#475569',
    loadColor: '#dc2626',
    reactionColor: '#16a34a',
    angleColor: '#8b5cf6',
    dimColor: '#64748b',
    cableWidth: 0.8,
    pylonWidth: 3,
    fontSize: 2,
    labelOffset: 3,
  },

  updateGeometry: (geo) => {
    set((state) => ({
      project: {
        ...state.project,
        geometry: { ...state.project.geometry, ...geo },
      },
    }));
    get().runAnalysis();
  },

  updateCable: (cable) => {
    set((state) => ({
      project: {
        ...state.project,
        cable: { ...state.project.cable, ...cable },
      },
    }));
    get().runAnalysis();
  },

  updateSettings: (settings) => {
    set((state) => ({
      project: {
        ...state.project,
        settings: { ...state.project.settings, ...settings },
      },
    }));
    get().runAnalysis();
  },

  updateDeadBlock: (db) => {
    set((state) => ({
      project: {
        ...state.project,
        deadBlock: { ...state.project.deadBlock, ...db },
      },
    }));
    get().runAnalysis();
  },

  updateDeadBlockA: (db) => {
    set((state) => ({
      project: {
        ...state.project,
        deadBlockA: { ...state.project.deadBlockA, ...db },
      },
    }));
    get().runAnalysis();
  },

  updatePulley: (p) => {
    set((state) => ({
      project: {
        ...state.project,
        pulley: { ...state.project.pulley, ...p },
      },
    }));
    get().runAnalysis();
  },

  addPointLoad: (pl) => {
    set((state) => {
      const lc = state.project.loadCases.find((l) => l.id === state.project.activeLoadCaseId);
      if (!lc) return state;
      const updatedLC = { ...lc, pointLoads: [...lc.pointLoads, pl] };
      return {
        project: {
          ...state.project,
          loadCases: state.project.loadCases.map((l) => (l.id === lc.id ? updatedLC : l)),
        },
      };
    });
    get().runAnalysis();
  },

  updatePointLoad: (id, updates) => {
    set((state) => {
      const loadCases = state.project.loadCases.map((lc) => ({
        ...lc,
        pointLoads: lc.pointLoads.map((pl) =>
          pl.id === id ? { ...pl, ...updates } : pl
        ),
      }));
      return { project: { ...state.project, loadCases } };
    });
    get().runAnalysis();
  },

  removePointLoad: (id) => {
    set((state) => {
      const loadCases = state.project.loadCases.map((lc) => ({
        ...lc,
        pointLoads: lc.pointLoads.filter((pl) => pl.id !== id),
      }));
      return { project: { ...state.project, loadCases } };
    });
    get().runAnalysis();
  },

  movePointLoad: (id, x) => {
    const { project } = get();
    const span = project.geometry.rightPylonX - project.geometry.leftPylonX;
    const clampedX = Math.max(0.1, Math.min(span - 0.1, x));
    get().updatePointLoad(id, { x: clampedX });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleCalculations: () => set((s) => ({ showCalculations: !s.showCalculations })),
  toggleDiagramOption: (option) =>
    set((s) => ({
      diagramOptions: { ...s.diagramOptions, [option]: !s.diagramOptions[option] },
    })),
  updateLabelStyle: (style) =>
    set((s) => ({
      labelStyle: { ...s.labelStyle, ...style },
    })),

  runAnalysis: () => {
    const { project } = get();
    const { geometry, cable, settings } = project;
    const activeLC = project.loadCases.find((l) => l.id === project.activeLoadCaseId);
    if (!activeLC) return;

    const span = geometry.rightPylonX - geometry.leftPylonX;
    const allSteps: CalculationStep[] = [];

    // Anchor type shortcuts
    const leftIsPylon = geometry.leftAnchorType === 'pylon';
    const rightIsPylon = geometry.rightAnchorType === 'pylon';

    // 1. Analytical point load (for single point load transparency)
    let analytical = null;
    if (activeLC.pointLoads.length === 1 && !settings.includeSelfWeight) {
      const pl = activeLC.pointLoads[0];
      analytical = calculatePointLoadCable(span, pl.magnitude, pl.x, geometry.sag);
      allSteps.push(...analytical.steps);
    }

    // 2. Full solver
    const solverResult = solveCable(
      geometry,
      cable,
      activeLC.pointLoads,
      activeLC.distributedLoads,
      settings.includeSelfWeight,
      settings.segments,
      settings.tolerance,
      settings.maxIterations
    );

    // 3. Stress check
    const stressCalc = calculateCableStress(solverResult.maxTension, cable);
    allSteps.push(...stressCalc.steps);

    // 4. Elongation
    const elongCalc = calculateElongation(solverResult.points, cable);
    allSteps.push(...elongCalc.steps);

    const pts = solverResult.points;
    const n = pts.length;

    // Helper: cable end slope as angle (radians)
    const slopeAngleLeft = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
    const slopeAngleRight = Math.atan2(pts[n - 1].y - pts[n - 2].y, pts[n - 1].x - pts[n - 2].x);

    // Tensions at ends
    const Tleft = pts[0].T;
    const Tright = pts[n - 1].T;

    // ========== LEFT SIDE (Pylon A / Direct Anchor A) ==========
    let pulleyCalcA: ReturnType<typeof calculatePulleyResultant> | null = null;
    let deadBlockCalcA: ReturnType<typeof calculateDeadBlockForces>;

    if (leftIsPylon) {
      // Pylon mode: pulley at pylon top, backstay to dead block A
      const angleMainA = slopeAngleLeft; // cable going into span (right-down)
      const angleBackA = Math.atan2(
        project.deadBlockA.y - geometry.leftPylonY,
        project.deadBlockA.x - geometry.leftPylonX
      );
      const T2left = project.pulley.frictionless ? Tleft : Tleft * 0.95;
      pulleyCalcA = calculatePulleyResultant({
        T1: Tleft,
        T2: T2left,
        angle1: angleMainA,
        angle2: angleBackA,
        frictionless: project.pulley.frictionless,
      });
      allSteps.push(...pulleyCalcA.steps);

      // Dead block receives backstay tension
      const dropA = geometry.leftPylonY - project.deadBlockA.y;
      const reachA = Math.abs(project.deadBlockA.x - geometry.leftPylonX);
      const angleAdeg = (Math.atan2(dropA, reachA) * 180) / Math.PI;
      deadBlockCalcA = calculateDeadBlockForces({
        cableTension: T2left,
        cableAngle: angleAdeg,
        block: project.deadBlockA,
      });
    } else {
      // Direct anchor mode: cable fixed directly to anchor block A (no pylon, no pulley)
      // Cable tension acts at the cable end slope
      const cableAngleDeg = Math.abs(slopeAngleLeft) * (180 / Math.PI);
      deadBlockCalcA = calculateDeadBlockForces({
        cableTension: Tleft,
        cableAngle: cableAngleDeg,
        block: project.deadBlockA,
      });
    }
    allSteps.push(...deadBlockCalcA.steps);

    // ========== RIGHT SIDE (Pylon B / Direct Anchor B) ==========
    let pulleyCalcB: ReturnType<typeof calculatePulleyResultant> | null = null;
    let deadBlockCalcB: ReturnType<typeof calculateDeadBlockForces>;

    if (rightIsPylon) {
      // Pylon mode: pulley at pylon top, backstay to dead block B
      const angleMainB = Math.PI + slopeAngleRight; // reverse direction (left-down into span)
      const angleBackB = Math.atan2(
        project.deadBlock.y - geometry.rightPylonY,
        project.deadBlock.x - geometry.rightPylonX
      );
      const T2right = project.pulley.frictionless ? Tright : Tright * 0.95;
      pulleyCalcB = calculatePulleyResultant({
        T1: Tright,
        T2: T2right,
        angle1: angleMainB,
        angle2: angleBackB,
        frictionless: project.pulley.frictionless,
      });
      allSteps.push(...pulleyCalcB.steps);

      // Dead block receives backstay tension
      const dropB = geometry.rightPylonY - project.deadBlock.y;
      const reachB = Math.abs(project.deadBlock.x - geometry.rightPylonX);
      const angleBdeg = (Math.atan2(dropB, reachB) * 180) / Math.PI;
      deadBlockCalcB = calculateDeadBlockForces({
        cableTension: T2right,
        cableAngle: angleBdeg,
        block: project.deadBlock,
      });
    } else {
      // Direct anchor mode: cable fixed directly to anchor block B (no pylon, no pulley)
      const cableAngleDeg = Math.abs(slopeAngleRight) * (180 / Math.PI);
      deadBlockCalcB = calculateDeadBlockForces({
        cableTension: Tright,
        cableAngle: cableAngleDeg,
        block: project.deadBlock,
      });
    }
    allSteps.push(...deadBlockCalcB.steps);

    // 7. Temperature
    let tempResult: TemperatureResult | null = null;
    if (settings.includeTemperature && activeLC.temperature) {
      const tempCalc = calculateTemperatureEffect({
        deltaT: activeLC.temperature.deltaT,
        thermalCoeff: cable.thermalCoeff,
        cableLength: solverResult.cableLength,
        cableArea: cable.area,
        youngsModulus: cable.youngsModulus,
      });
      tempResult = tempCalc.result;
      allSteps.push(...tempCalc.steps);
    }

    // 8. Engineering checks
    const checks = runEngineeringChecks(
      solverResult,
      stressCalc.result,
      deadBlockCalcB.result,
      deadBlockCalcA.result
    );

    set({
      solverResult,
      stressResult: stressCalc.result,
      elongationResult: elongCalc.result,
      pulleyResult: pulleyCalcB?.result ?? null,
      pulleyResultA: pulleyCalcA?.result ?? null,
      deadBlockResult: deadBlockCalcB.result,
      deadBlockResultA: deadBlockCalcA.result,
      temperatureResult: tempResult,
      engineeringChecks: checks,
      calculationSteps: allSteps,
      pointLoadAnalytical: analytical,
    });

    // Auto save
    get().saveToLocalStorage();
  },

  exportProject: () => {
    return JSON.stringify(get().project, null, 2);
  },

  importProject: (json) => {
    try {
      const parsed = JSON.parse(json) as SuspensionCableProject;
      set({ project: migrateProject(parsed) });
      get().runAnalysis();
    } catch (e) {
      console.error('Failed to import project:', e);
    }
  },

  newProject: () => {
    set({ project: createDefaultProject('New Suspension Cable Project') });
    get().runAnalysis();
  },

  saveToLocalStorage: () => {
    try {
      localStorage.setItem('suspension-cable-project', JSON.stringify(get().project));
    } catch {
      // Storage full or unavailable
    }
  },

  loadFromLocalStorage: () => {
    try {
      const saved = localStorage.getItem('suspension-cable-project');
      if (saved) {
        const parsed = JSON.parse(saved) as SuspensionCableProject;
        set({ project: migrateProject(parsed) });
      }
    } catch {
      // Ignore corrupted storage
    }
    get().runAnalysis();
  },
}));
