# Product Requirements Document (PRD)

## Suspension Cable Analysis, Shape Finding & Pylon / Dead Block Force Calculator

**Version:** 1.0.0  
**Platform:** Web Application  
**Primary Stack:** TypeScript + React + Vite + Tailwind CSS  
**Future Desktop Packaging:** Electron  
**Target Users:** Structural Engineers, Bridge Engineers, Civil Engineering Students, Designers  
**Primary Design Philosophy:** Engineering calculation engine + interactive structural visualization + transparent calculations

---

## 1. Product Overview

Develop a web-based structural engineering application for analysis of **flexible suspension cables subjected to self-weight, point loads, distributed loads, temperature effects and elastic deformation**, including calculation of forces transferred through a **pylon/pulley system and ultimately to an anchor/dead block**.

### Primary Outputs

* Cable profile
* Cable sag
* Cable tension at every relevant location
* Horizontal and vertical cable force components
* Maximum cable tension
* Point-load reactions
* Pylon/pulley resultant force
* Anchor/dead-block force
* Cable elongation
* Temperature-induced effects
* Cable stress and utilization
* Interactive diagrams
* Calculation equations and intermediate results
* Load-case and combination results
* PDF engineering report
* JSON project save/load
* Excel calculation export
* DXF geometry export where practical

---

## 2. Technology Stack

### 2.1 Required Technology

* **TypeScript**
* **React**
* **Vite**
* **Tailwind CSS**

### 2.2 Supporting Libraries

* Recharts for charts/plots
* SVG for engineering diagrams
* KaTeX for mathematical equations
* Zustand for state management
* jsPDF for PDF generation
* file-saver for downloads

### 2.3 Architecture Requirement

The calculation engine must remain independent of browser APIs for future Electron packaging:

```
UI Layer
   ↓
React Components
   ↓
Application State
   ↓
Engineering Calculation Engine
   ↓
Pure TypeScript Functions
```

---

## 3. Product Objective

The primary objective is to provide a visual engineering tool that answers:

> "Given a suspension cable geometry, cable properties and loading, what is the cable shape, tension throughout the cable, and what force is transferred to the pylon/pulley and anchor/dead block?"

### Transparency Requirement

Every major result should be traceable to:
1. Input
2. Governing equation
3. Intermediate calculation
4. Final result

---

## 4. Core Engineering Model

### Level 1 — Basic Flexible Cable

Assume:
* Cable is perfectly flexible
* Cable carries tension only
* Cable is initially inextensible
* No bending stiffness

Fundamental equation:
```
T = √(H² + V²)
```

---

## 5. Load Types

### 5.1 Cable Self-Weight
* Input: Cable unit weight (kN/m)
* Distinguish between horizontal projection and arc length basis

### 5.2 Point Load
* Arbitrary horizontal coordinates
* Multiple loads supported
* Each load has: ID, X coordinate, magnitude, direction, load case, description

### 5.3 Distributed Load
* Uniform distributed load (UDL)
* Variable distributed load (future)

### 5.4 Temperature
* Temperature change input
* Coefficient of thermal expansion
* Free thermal expansion: ΔL_T = α × L × ΔT

### 5.5 Cable Elasticity
* Cable area (A) and Young's modulus (E)
* Strain: ε = T/(AE)
* Total elongation: ΔL = ∫(T/AE)ds

---

## 6. Cable Geometry

### 6.1 Anchor Positions
* Left anchor X, Y
* Right anchor X, Y
* Support for different elevations

### 6.2 Anchor Types
* **Pylon + Pulley**: Traditional pylon with pulley and backstay
* **Direct Anchor**: Cable fixed directly to anchor block

### 6.3 Cable Sag
* Sag at center or arbitrary low point
* Sag ratio (L/n) input
* Auto-calculated from ratio

---

## 7. Interactive Cable Diagram

### Required Features
* SVG-based rendering
* Zoom and pan
* Select and drag point loads
* Display toggles: dimensions, tension, force arrows, grid, labels
* Real-time updates on input changes

### Visual Elements
* Pylons (when applicable)
* Pulleys at pylon tops
* Cable profile
* Backstay cables
* Dead blocks
* Point load arrows
* Reaction arrows
* Dimension annotations

---

## 8. Coordinate System

* X = horizontal direction
* Y = vertical direction
* Origin at left support (default)
* Screen Y inverted for SVG rendering

---

## 9. Cable Analysis

### 9.1 Uniformly Distributed Load
Governing equation:
```
H × d²y/dx² = w
```
Result: Parabolic profile

### 9.2 Point Loads
Vertical reactions:
```
V_A = P×b/L
V_B = P×a/L
```
Horizontal tension:
```
H = P×a×b/(L×f)
```

### 9.3 Combined Loading
* Cable divided into segments around point loads
* Each segment has own profile and tension range
* Horizontal tension (H) constant throughout

---

## 10. Cable Solver

### Responsibilities
* Determine cable geometry
* Calculate horizontal tension
* Calculate vertical tension
* Calculate cable coordinates
* Handle point-load discontinuities
* Check equilibrium
* Return convergence status

### Output Interface
```typescript
{
  converged: boolean;
  iterations: number;
  error: number;
  horizontalTension: number;
  points: CablePoint[];
  segments: CableSegment[];
}
```

---

## 11. Pylon / Pulley Module

### Assumptions
* Ideal frictionless pulley (T₁ = T₂)

### Calculations
* Vector resultant: R = T₁ + T₂
* Components: Rx, Ry
* Magnitude and direction

---

## 12. Dead Block Module

### Inputs
* Block location and dimensions
* Concrete density
* Foundation friction coefficient
* Cable angle (computed from geometry)

### Outputs
* Horizontal force: H_D = T×cos(θ)
* Vertical force: V_D = T×sin(θ)
* Sliding FS
* Overturning FS
* Bearing pressure

---

## 13. Cable Stress Check

### Calculations
* Maximum stress: σ_max = T_max/A
* Utilization: UR = σ_max/σ_allow
* Status: PASS / WARNING / FAIL

---

## 14. Results Dashboard

### Cable Section
* Maximum tension
* Minimum tension
* Horizontal tension
* Maximum stress
* Utilization
* Cable elongation

### Pylon Section
* Horizontal force
* Vertical force
* Resultant
* Direction

### Dead Block Section
* Forces
* Sliding FS
* Overturning FS

---

## 15. Charts and Graphs

* Cable profile (Y vs X)
* Tension diagram (T vs X)
* Stress diagram
* Sensitivity analysis (Sag vs Tension)

---

## 16. Input Validation

* Engineering-specific error messages
* Prevent invalid configurations
* Range checking

---

## 17. Calculation Transparency

### Show Calculation Feature
* Expandable calculation steps
* LaTeX equation rendering
* Variable tables
* Educational explanations (optional mode)

---

## 18. Project Management

### Data Model
```typescript
interface SuspensionCableProject {
  name: string;
  geometry: CableGeometry;
  cable: CableProperties;
  loadCases: LoadCase[];
  combinations: LoadCombination[];
  pulley: PulleyDefinition;
  deadBlock: DeadBlockDefinition;
  deadBlockA: DeadBlockDefinition;
  settings: AnalysisSettings;
}
```

### Features
* New project
* Save as JSON
* Load from JSON
* Auto-save to localStorage

---

## 19. Report Generation

### PDF Report Contents
1. Cover page
2. Project information
3. Geometry
4. Cable properties
5. Loading
6. Cable analysis results
7. Pylon forces
8. Dead block forces
9. Stability checks
10. Assumptions

---

## 20. Engineering Checks

### Required Checks
* Solver convergence
* Horizontal equilibrium
* Vertical equilibrium
* Cable stress within limit
* Dead block sliding FS
* Dead block overturning FS

---

## 21. UI Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Suspension Cable Analyzer    File  Project  Export  Settings │
├──────────────┬─────────────────────────────────┬─────────────┤
│              │                                 │             │
│ INPUT PANEL  │       INTERACTIVE DIAGRAM       │   RESULTS   │
│              │                                 │             │
├──────────────┴─────────────────────────────────┴─────────────┤
│ Calculation / Equation / Graph / Tension Profile             │
└──────────────────────────────────────────────────────────────┘
```

---

## 22. MVP Scope

### Included
* Geometry definition (pylon and direct anchor modes)
* Cable properties
* One or more point loads
* Self-weight option
* Cable profile calculation
* Tension calculation
* Interactive diagram with drag support
* Pylon force calculation
* Dead block force and stability
* Engineering checks
* JSON save/load
* PDF report

### Deferred to Future Phases
* Elastic cable integration
* Temperature profile effects
* Load combinations
* Excel export
* DXF export
* Electron packaging

---

## 23. Definition of Done

- [x] User can define span, sag, and anchor types
- [x] User can define cable properties
- [x] User can add point loads
- [x] Self-weight can be enabled
- [x] Cable profile automatically calculated
- [x] Tensions calculated at multiple locations
- [x] Maximum tension identified
- [x] Interactive diagram updates in real-time
- [x] Point loads can be dragged
- [x] Pylon forces calculated
- [x] Dead block forces and stability calculated
- [x] Equilibrium checks displayed
- [x] Calculation equations visible
- [x] Project can be saved/loaded as JSON
- [x] PDF report can be generated
- [x] Calculation engine is pure TypeScript (no React dependencies)

---

## 24. Non-Functional Requirements

* **Responsive**: Works on various screen sizes
* **Fast**: Real-time updates on input changes
* **Modular**: Separated concerns
* **Testable**: Engine can be unit tested
* **Transparent**: Every result traceable
* **Accessible**: Text-based status indicators
* **Maintainable**: Clean code structure
* **Electron-compatible**: No browser-only APIs in engine

---

## 25. Critical Engineering Rule

> **The application must never hide an engineering assumption behind a result.**

For every result, the user should be able to determine:
* What was assumed?
* What equation was used?
* What inputs were used?
* What numerical method was used?
* Did the solver converge?
* What is the governing case?

---

## 26. Future Vision

Evolution from a simple "Cable Tension Calculator" into a complete "Suspension Cable Structural Analysis System" with:

* Multiple cable systems
* Construction-stage analysis
* Design code checks
* Node-based workflow integration
* Desktop packaging

---

*Document Version: 1.0.0*  
*Last Updated: 2024*
