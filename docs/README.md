# Suspension Cable Analyzer

<p align="center">
  <strong>A web-based structural engineering application for analysis of flexible suspension cables</strong>
</p>

<p align="center">
  <a href="https://img.shields.io/badge/version-0.1.1-blue.svg">
    <img src="https://img.shields.io/badge/version-0.1.1-blue.svg" alt="Version">
  </a>
  <a href="./LICENSE.md">
    <img src="https://img.shields.io/badge/license-Apache%20License%202.0-green.svg" alt="Apache License 2.0">
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-5.0+-blue.svg" alt="TypeScript">
  </a>
  <a href="https://react.dev/">
    <img src="https://img.shields.io/badge/React-19.x-61dafb.svg" alt="React">
  </a>
</p>

---

## Overview

The **Suspension Cable Analyzer** is a professional-grade engineering tool for analyzing suspension cable systems subjected to self-weight, point loads, distributed loads, temperature effects, and elastic deformation. It calculates forces transferred through pylon/pulley systems and to anchor/dead blocks.

### Key Features

- 🔗 **Cable Analysis**: Horizontal tension, vertical reactions, cable profile, maximum tension
- 🏗️ **Pylon/Pulley Forces**: Resultant forces at pulley locations with vector decomposition
- 🧱 **Dead Block Stability**: Sliding, overturning, and bearing pressure checks
- 📊 **Interactive Diagrams**: Real-time SVG visualization with drag-and-drop loads
- 📐 **Transparent Calculations**: Every result traceable to equations and inputs
- 📄 **PDF Reports**: Professional engineering calculation reports
- 💾 **Project Save/Load**: JSON import/export with auto-save

---

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/suspension-cable-analyzer.git
cd suspension-cable-analyzer

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Usage

1. **Define Geometry**: Set pylon positions and cable sag in the Geometry tab
2. **Set Cable Properties**: Enter cable area, modulus, unit weight in the Cable tab
3. **Add Loads**: Add point loads and enable self-weight in the Loads tab
4. **View Results**: See cable forces, pylon reactions, and stability checks in the Results panel
5. **Export**: Generate PDF report or save project as JSON

---

## Application Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Suspension Cable Analyzer    File  Project  Export  Settings │
├──────────────┬─────────────────────────────────┬─────────────┤
│              │                                 │             │
│ INPUT PANEL  │       INTERACTIVE DIAGRAM       │   RESULTS   │
│              │                                 │             │
│ • Geometry   │         Cable Profile           │ • Cable     │
│ • Cable      │         with Loads              │ • Pylon     │
│ • Loads      │         and Reactions           │ • Anchor    │
│ • Dead Block │                                 │ • Checks    │
│ • Settings   │                                 │             │
│              │                                 │             │
├──────────────┴─────────────────────────────────┴─────────────┤
│ Charts & Graphs  |  Calculation Trace                        │
└──────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### Anchor Types

Each end of the cable can be configured as:

| Type | Description |
|------|-------------|
| **Pylon + Pulley** | Cable passes over pulley at pylon top, backstay to dead block |
| **Direct Anchor** | Cable fixed directly to anchor block (no pylon/backstay) |

### Analysis Model

The application uses the **flexible cable** assumption:
- Cable carries tension only (no bending, compression, or shear)
- Horizontal tension component is constant under vertical loads
- Cable profile follows equilibrium shape (parabolic for UDL, segmented for point loads)

### Key Equations

**Horizontal Tension (Point Load)**:
```
H = P × a × b / (L × f)
```

**Cable Tension**:
```
T = √(H² + V²)
```

**Pulley Resultant**:
```
R = T₁ + T₂  (vector sum)
```

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| UI Framework | React 19 |
| Language | TypeScript 5 |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS 4 |
| State Management | Zustand |
| Charts | Recharts |
| Math Rendering | KaTeX |
| PDF Generation | jsPDF |

---

## Project Structure

```
src/
├── components/          # React UI components
│   ├── layout/          # Header, navigation
│   ├── inputs/          # Input panels (geometry, cable, loads)
│   ├── diagrams/        # SVG cable diagram
│   ├── charts/          # Recharts visualizations
│   ├── results/         # Results display panels
│   └── calculations/    # Calculation trace panel
├── engine/              # Pure TypeScript calculation engine
│   ├── cable/           # Cable solver
│   ├── pulley/          # Pulley force calculator
│   ├── deadBlock/       # Dead block stability
│   ├── temperature/     # Temperature effects
│   ├── stress/          # Stress and elongation
│   └── checks/          # Engineering checks
├── models/              # TypeScript interfaces
├── store/               # Zustand state management
└── utils/               # Utility functions
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [User Guide](./USER_GUIDE.md) | How to use the application |
| [Technical Design](./TECHNICAL_DESIGN.md) | Implementation details |
| [API Reference](./API_REFERENCE.md) | Engineering engine API |
| [Architecture](./ARCHITECTURE.md) | System architecture |
| [Development Guide](./DEVELOPMENT_GUIDE.md) | Contributing guide |
| [Changelog](./CHANGELOG.md) | Version history |

---

## Roadmap
### v0.1.0 
- ✅ Single/multiple point loads
- ✅ Cable self-weight
- ✅ Pylon and direct anchor modes
- ✅ Interactive diagram
- ✅ PDF export

### v0.1.1 (Current) — MVP
- ✅ Button added Zooms in/out by 30%, centered on the current viewport
- ✅ Button added Fit Automatically resets the viewport so the entire cable system is visible
- ✅ Label Settings button to modify Dynamic figure panel 
- ✅ PDF export report modified
- ✅ Display the angle of cables with respect to the horizontal

### v0.1.2 — Enhanced Analysis
- [ ] Elastic cable elongation
- [ ] Temperature effects
- [ ] Numerical cable solver improvements

### v0.1.3 — Advanced Features
- [ ] Load combinations
- [ ] Multiple load cases
- [ ] Excel export
- [ ] DXF export

### v0.1.4 — Production Release
- [ ] Full validation test suite
- [ ] Code-based design checks
- [ ] Electron desktop packaging

---

## Contributing

Contributions are welcome! Please read the [Development Guide](./DEVELOPMENT_GUIDE.md) for setup instructions and coding standards.

---

## License

Apache License 2.0 — see [LICENSE](../LICENSE) for details.

---

## Acknowledgments

This application was designed to be both educational and practical, making cable mechanics transparent while supporting professional engineering workflows.

---

<p align="center">
  <strong>Built for Structural Engineers</strong><br>
  <em>Transparent • Accurate • Educational</em>
</p>
