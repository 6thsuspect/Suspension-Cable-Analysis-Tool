# Architecture

This document describes the system architecture of the Suspension Cable Analyzer, including module organization, data flow, and design decisions.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Layer Architecture](#layer-architecture)
3. [Module Structure](#module-structure)
4. [Data Flow](#data-flow)
5. [State Management](#state-management)
6. [Component Architecture](#component-architecture)
7. [Engine Architecture](#engine-architecture)
8. [Future Considerations](#future-considerations)

---

## Design Philosophy

### Core Principles

1. **Separation of Concerns**: Engineering calculations are completely independent of the UI layer
2. **Transparency**: Every result must be traceable to inputs and equations
3. **Testability**: The calculation engine can be unit tested without React
4. **Portability**: The engine has no browser dependencies (Electron compatible)
5. **Educational Value**: The application teaches cable mechanics while calculating

### Key Design Decision

> **The engineering calculation engine is implemented as pure TypeScript functions with no React or browser dependencies.**

This enables:
- Independent unit testing
- Future CLI tools
- Electron desktop packaging
- Server-side calculations
- Validation against hand calculations

---

## Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   Input     │ │  Diagram    │ │      Results            ││
│  │   Panels    │ │  (SVG)      │ │      Panel              ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
│  ┌─────────────────────────────┐ ┌─────────────────────────┐│
│  │        Charts               │ │   Calculation Trace     ││
│  │      (Recharts)             │ │      (KaTeX)            ││
│  └─────────────────────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Zustand Store                         ││
│  │  • Project state        • UI state                       ││
│  │  • Analysis results     • Diagram options                ││
│  │  • Calculation steps    • Active tab                     ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      CALCULATION LAYER                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐│
│  │  Cable   │ │  Pulley  │ │  Dead    │ │  Temperature     ││
│  │  Solver  │ │  Calc    │ │  Block   │ │  & Stress        ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Engineering Checks                          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        DATA LAYER                            │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐ │
│  │  Type Definitions│ │  LocalStorage    │ │  JSON        │ │
│  │  (models/)       │ │  Persistence     │ │  Export      │ │
│  └──────────────────┘ └──────────────────┘ └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Module Structure

```
src/
├── components/                 # React UI Components
│   ├── layout/
│   │   └── Header.tsx         # App header with file operations
│   ├── inputs/
│   │   ├── InputPanel.tsx     # Tab container for inputs
│   │   ├── GeometryInput.tsx  # Geometry/anchor configuration
│   │   ├── CableInput.tsx     # Cable properties
│   │   ├── LoadInput.tsx      # Point loads
│   │   ├── DeadBlockInput.tsx # Dead block configuration
│   │   ├── SettingsInput.tsx  # Analysis settings
│   │   └── NumberInput.tsx    # Reusable number input
│   ├── diagrams/
│   │   └── CableDiagram.tsx   # Interactive SVG diagram
│   ├── charts/
│   │   └── ChartsPanel.tsx    # Recharts visualizations
│   ├── results/
│   │   └── ResultsPanel.tsx   # Results display
│   └── calculations/
│       └── CalculationPanel.tsx # Calculation trace
│
├── engine/                     # Pure TypeScript Calculation Engine
│   ├── cable/
│   │   └── cableSolver.ts     # Cable analysis algorithms
│   ├── pulley/
│   │   └── pulleyCalc.ts      # Pulley force calculations
│   ├── deadBlock/
│   │   └── deadBlockCalc.ts   # Dead block stability
│   ├── temperature/
│   │   └── temperatureCalc.ts # Temperature effects
│   ├── stress/
│   │   └── stressCalc.ts      # Stress and elongation
│   └── checks/
│       └── engineeringChecks.ts # Validation checks
│
├── models/
│   └── types.ts               # TypeScript interfaces
│
├── store/
│   └── useProjectStore.ts     # Zustand state management
│
├── utils/
│   └── cn.ts                  # Tailwind class utilities
│
├── App.tsx                    # Root application component
├── main.tsx                   # React entry point
└── index.css                  # Global styles
```

---

## Data Flow

### Analysis Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   User       │────▶│   Input      │────▶│   Zustand    │
│   Input      │     │   Component  │     │   Store      │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  │ updateGeometry()
                                                  │ updateCable()
                                                  │ updatePointLoad()
                                                  ▼
                                          ┌──────────────┐
                                          │  runAnalysis │
                                          │  (automatic) │
                                          └──────┬───────┘
                                                  │
        ┌─────────────────────────────────────────┼─────────────────────────────────────────┐
        │                                         │                                         │
        ▼                                         ▼                                         ▼
┌──────────────┐                         ┌──────────────┐                         ┌──────────────┐
│  solveCable  │                         │  calculate   │                         │  calculate   │
│              │                         │  Pulley      │                         │  DeadBlock   │
└──────┬───────┘                         └──────┬───────┘                         └──────┬───────┘
        │                                         │                                         │
        │ CableSolverResult                       │ PulleyResult                            │ DeadBlockResult
        │                                         │                                         │
        └─────────────────────────────────────────┼─────────────────────────────────────────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │   Store      │
                                          │   Update     │
                                          └──────┬───────┘
                                                  │
                     ┌────────────────────────────┼────────────────────────────┐
                     │                            │                            │
                     ▼                            ▼                            ▼
             ┌──────────────┐             ┌──────────────┐             ┌──────────────┐
             │   Diagram    │             │   Results    │             │   Charts     │
             │   Update     │             │   Update     │             │   Update     │
             └──────────────┘             └──────────────┘             └──────────────┘
```

### Reactive Update Chain

1. User changes input → Store action called
2. Store updates project state
3. `runAnalysis()` triggered automatically
4. All calculation engines execute
5. Results stored in state
6. React components re-render with new data

---

## State Management

### Zustand Store Structure

```typescript
interface ProjectStore {
  // === Project Data ===
  project: SuspensionCableProject;

  // === Calculation Results ===
  solverResult: CableSolverResult | null;
  stressResult: StressResult | null;
  elongationResult: ElongationResult | null;
  pulleyResult: PulleyResult | null;       // Right pylon
  pulleyResultA: PulleyResult | null;      // Left pylon
  deadBlockResult: DeadBlockResult | null;  // Right anchor
  deadBlockResultA: DeadBlockResult | null; // Left anchor
  temperatureResult: TemperatureResult | null;
  engineeringChecks: EngineeringCheck[];
  calculationSteps: CalculationStep[];

  // === UI State ===
  activeTab: string;
  showCalculations: boolean;
  diagramOptions: DiagramOptions;

  // === Actions ===
  updateGeometry: (geo: Partial<CableGeometry>) => void;
  updateCable: (cable: Partial<CableProperties>) => void;
  // ... more actions
  runAnalysis: () => void;
  exportProject: () => string;
  importProject: (json: string) => void;
}
```

### State Update Pattern

```typescript
// Action triggers analysis automatically
updateGeometry: (geo) => {
  set((state) => ({
    project: {
      ...state.project,
      geometry: { ...state.project.geometry, ...geo },
    },
  }));
  get().runAnalysis();  // ← Automatic re-analysis
},
```

### Persistence

```typescript
// Auto-save on every analysis
runAnalysis: () => {
  // ... calculations ...
  get().saveToLocalStorage();
},

// Load on app start
loadFromLocalStorage: () => {
  const saved = localStorage.getItem('suspension-cable-project');
  if (saved) {
    set({ project: migrateProject(JSON.parse(saved)) });
  }
  get().runAnalysis();
}
```

---

## Component Architecture

### Component Hierarchy

```
App
├── Header
│   └── File operations (New, Open, Save, PDF)
├── InputPanel
│   ├── GeometryInput
│   │   └── NumberInput (reusable)
│   ├── CableInput
│   ├── LoadInput
│   ├── DeadBlockInput
│   └── SettingsInput
├── CableDiagram
│   └── SVG elements (interactive)
├── ResultsPanel
│   ├── CableResults
│   ├── PylonResults
│   ├── DeadBlockResults
│   ├── ChecksPanel
│   └── AssumptionsPanel
├── ChartsPanel
│   ├── ProfileChart
│   ├── TensionChart
│   ├── StressChart
│   └── SensitivityChart
└── CalculationPanel
    └── CalculationStep (KaTeX rendering)
```

### Component Patterns

**Container Components**: Connect to store, orchestrate data
```typescript
const ResultsPanel: React.FC = () => {
  const { solverResult, stressResult } = useProjectStore();
  // Render based on state
};
```

**Presentational Components**: Pure rendering, receive props
```typescript
const ResultRow: React.FC<{
  label: string;
  value: number;
  unit: string;
}> = ({ label, value, unit }) => (
  <div className="flex justify-between">
    <span>{label}</span>
    <span>{value.toFixed(2)} {unit}</span>
  </div>
);
```

---

## Engine Architecture

### Design Principles

1. **Pure Functions**: No side effects, deterministic output
2. **Typed I/O**: Explicit interfaces for inputs and outputs
3. **Calculation Steps**: Return steps for transparency
4. **Error Handling**: Validate inputs, report convergence status

### Engine Module Pattern

```typescript
// Input interface
interface CalculatorInput {
  param1: number;
  param2: number;
}

// Output interface
interface CalculatorResult {
  value1: number;
  value2: number;
}

// Calculator function
export function calculate(input: CalculatorInput): {
  result: CalculatorResult;
  steps: CalculationStep[];
} {
  const steps: CalculationStep[] = [];

  // Step 1
  const intermediate = input.param1 * input.param2;
  steps.push({
    title: 'Intermediate Calculation',
    equation: 'x = a \\times b',
    variables: [
      { name: 'a', symbol: 'a', value: input.param1, unit: '' },
      { name: 'b', symbol: 'b', value: input.param2, unit: '' },
    ],
    result: { name: 'x', value: intermediate, unit: '' },
  });

  // Return result and steps
  return {
    result: { value1: intermediate, value2: intermediate * 2 },
    steps,
  };
}
```

### Calculation Flow in Engine

```
solveCable()
    │
    ├── Estimate initial H
    │
    ├── Iteration loop:
    │   ├── computeProfile()
    │   ├── Calculate actual sag
    │   ├── Compare to target sag
    │   └── Adjust H
    │
    ├── Apply endpoint correction
    │
    ├── Calculate tensions at all points
    │
    ├── Calculate reactions
    │
    └── Return CableSolverResult
```

---

## Future Considerations

### Electron Packaging

The architecture supports Electron without modification:

```
┌─────────────────────────────────────────┐
│            Electron Main Process        │
│  • File system access                   │
│  • Native dialogs                       │
│  • Menu bar                             │
└───────────────────┬─────────────────────┘
                    │ IPC
┌───────────────────┴─────────────────────┐
│           Electron Renderer             │
│  ┌─────────────────────────────────────┐│
│  │     Current React Application       ││
│  │  (No changes required)              ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### Web Worker Support

For large models, calculations can be offloaded:

```typescript
// Future implementation
const worker = new Worker('./engine/worker.ts');
worker.postMessage({ type: 'SOLVE_CABLE', data: input });
worker.onmessage = (e) => {
  const result = e.data as CableSolverResult;
  // Update store
};
```

### Node-Based Workflow

The engine is designed to support future node-based composition:

```
[Geometry Node] ──┐
                  ├──▶ [Cable Solver Node] ──▶ [Tension Node]
[Load Node] ──────┘                                │
                                                   ▼
                                          [Pulley Node] ──▶ [Report Node]
```

---

## Performance Considerations

### Optimization Strategies

1. **Memoization**: Use `useMemo` for expensive computations
2. **Selective Re-render**: Component-level state subscriptions
3. **Lazy Evaluation**: Only compute what's displayed
4. **Debounced Updates**: Rate-limit during drag operations

### Current Optimizations

```typescript
// Memoized cable path
const cablePath = useMemo(() => {
  if (!solverResult) return '';
  // Build path string
}, [solverResult, geometry]);

// Filtered point array for charts
const chartData = useMemo(() => {
  return points.filter((_, i) => i % 2 === 0);
}, [points]);
```

---

## Security Considerations

### Input Validation

All user inputs are validated before calculation:

```typescript
// Geometry validation
if (span <= 0) throw new Error('Span must be positive');
if (sag <= 0) throw new Error('Sag must be positive');
if (sag >= span / 2) throw new Error('Sag too large');

// Cable validation
if (cable.area <= 0) throw new Error('Cable area must be positive');
if (cable.youngsModulus <= 0) throw new Error('E must be positive');
```

### JSON Import

Imported projects are validated and migrated:

```typescript
function migrateProject(raw: unknown): SuspensionCableProject {
  const base = createDefaultProject();
  const p = (raw ?? {}) as Partial<SuspensionCableProject>;
  // Merge with defaults, ensuring all required fields exist
  return { ...base, ...p, /* validated fields */ };
}
```

---

## Summary

The Suspension Cable Analyzer architecture follows these key patterns:

1. **Layered Architecture**: Clear separation between UI, state, and calculations
2. **Pure Calculation Engine**: No UI dependencies in engineering code
3. **Reactive State Management**: Automatic re-analysis on input changes
4. **Transparent Calculations**: Every result traceable via calculation steps
5. **Future-Ready**: Designed for Electron, workers, and node-based workflows
