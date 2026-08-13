# Changelog

All notable changes to the Suspension Cable Analyzer are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Load combinations and multiple load cases
- Excel export with formulas
- DXF geometry export
- Web Worker support for large models
- Electron desktop packaging

---

## [0.1.0] - 2024-XX-XX

### Added

#### Core Analysis
- **Cable solver** with iterative H-finding algorithm
- Support for **single and multiple point loads**
- **Cable self-weight** as distributed load
- **Parabolic cable profile** for uniform loads
- **Segmented profile** for point loads
- Automatic sag-to-H convergence

#### Anchor System
- **Pylon + Pulley mode**: Cable over pulley with backstay to dead block
- **Direct Anchor mode**: Cable fixed directly to anchor (no pylon/backstay)
- Independent configuration for left and right anchors
- Support for **different anchor elevations** (asymmetric pylons)

#### Pylon/Pulley Analysis
- **Pulley resultant force** calculation (vector sum of tensions)
- Force decomposition into Rx, Ry components
- Support for frictionless pulley assumption
- Cable angles at pulley

#### Dead Block Stability
- **Sliding factor of safety** calculation
- **Overturning factor of safety** calculation
- **Bearing pressure** estimation
- Block weight from dimensions and concrete density
- Automatic cable angle computation from geometry

#### Stress Analysis
- Maximum cable stress calculation
- **Utilization ratio** with PASS/WARNING/FAIL status
- Elastic elongation calculation
- Support for allowable stress input

#### Engineering Checks
- Solver convergence check
- Horizontal equilibrium check
- Vertical equilibrium check
- Cable stress limit check
- Dead block sliding FS check
- Dead block overturning FS check

#### User Interface
- **Three-panel layout**: Inputs | Diagram | Results
- Tabbed input panels: Geometry, Cable, Loads, Dead Block, Settings
- Tabbed results panels: Cable, Pylon, Anchor, Checks, Assumptions

#### Interactive Diagram
- **Real-time SVG visualization**
- Pylons drawn from ground to anchor elevation
- Pulleys at pylon tops
- Backstay cables to dead blocks
- **Draggable point loads**
- Cable profile with tooltips
- Reaction arrows (V and H) at both supports
- Toggle options: Grid, Labels, Force Arrows, Dimensions, Tension

#### Charts
- **Cable profile** chart (Y vs X)
- **Tension diagram** (T, H, V vs X)
- **Stress diagram** (σ vs X with allowable line)
- **Sensitivity analysis** (H and Tmax vs sag ratio)

#### Calculation Transparency
- **Calculation trace panel** with expandable steps
- LaTeX equation rendering with KaTeX
- Variable tables with values and units
- **Educational mode** with physical explanations
- Step-by-step traceability

#### Data Management
- **Auto-save** to localStorage
- **JSON export** of complete project
- **JSON import** with migration support
- **New project** creation
- Project versioning

#### Report Generation
- **PDF report** with jsPDF
- Cover page with project info
- Geometry section
- Cable properties section
- Loading summary
- Analysis results
- Pylon forces
- Dead block forces and stability
- Engineering checks summary
- Assumptions list

#### Settings
- Configurable number of cable segments
- Adjustable convergence tolerance
- Maximum iterations setting
- Self-weight toggle
- Elasticity toggle (placeholder)
- Temperature toggle (placeholder)
- Educational mode toggle

### Technical

#### Architecture
- **Pure TypeScript calculation engine** (no React dependencies)
- Zustand for state management
- Reactive analysis (auto-recalculate on input change)
- Separation of UI and calculation layers

#### Engine Modules
- `cableSolver.ts` - Main cable analysis
- `pulleyCalc.ts` - Pulley force calculator
- `deadBlockCalc.ts` - Dead block stability
- `stressCalc.ts` - Stress and elongation
- `temperatureCalc.ts` - Temperature effects (basic)
- `engineeringChecks.ts` - Validation checks

#### Data Models
- `CableGeometry` with anchor types
- `CableProperties` with material data
- `PointLoad` with position and magnitude
- `CableSolverResult` with full profile
- `PulleyResult` with force components
- `DeadBlockResult` with stability factors
- `CalculationStep` for transparency

### Fixed
- Cable endpoint now correctly connects to anchor elevation
- Profile integration corrected with linear endpoint adjustment
- Reaction arrows displayed at both pylons

### Known Issues
- Elastic cable elongation not fully integrated into profile
- Temperature effects are calculated but don't modify profile
- No undo/redo functionality
- Limited input validation error messages

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 0.1.0 | 2024-XX | Initial MVP release |

---

## Roadmap

### v0.2.0 - Enhanced Analysis
- Elastic cable integration
- Temperature-modified sag
- Improved numerical solver
- Unit system toggle (SI/Imperial)

### v0.3.0 - Advanced Features
- Multiple load cases
- Load combinations with factors
- Distributed load support
- Excel export

### v0.4.0 - Export & Integration
- DXF geometry export
- Enhanced PDF reports
- Project templates

### v0.5.0 - Performance & UX
- Web Worker calculations
- Undo/redo support
- Keyboard shortcuts
- Improved mobile support

### v1.0.0 - Production Release
- Comprehensive test suite
- Design code checks (Eurocode, etc.)
- Electron desktop app
- Full documentation

---

## Migration Notes

### Migrating to 0.1.0

Projects saved with pre-release versions may need migration:

1. **Anchor elevations**: Old projects with `leftPylonY = 0` are automatically elevated to default pylon height
2. **Anchor types**: Missing `leftAnchorType`/`rightAnchorType` default to `'pylon'`
3. **Dead block A**: Missing `deadBlockA` is created with default values

Migration is handled automatically by `migrateProject()` in the store.

---

## Contributors

- Initial development by [Your Team]

---

## Links

- [Documentation](./README.md)
- [User Guide](./USER_GUIDE.md)
- [API Reference](./API_REFERENCE.md)
- [Issue Tracker](https://github.com/your-org/suspension-cable-analyzer/issues)
