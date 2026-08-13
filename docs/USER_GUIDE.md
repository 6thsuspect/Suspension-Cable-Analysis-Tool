# User Guide

Welcome to the **Suspension Cable Analyzer**! This guide will help you understand how to use the application to analyze suspension cable systems.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [User Interface Overview](#user-interface-overview)
3. [Defining Geometry](#defining-geometry)
4. [Cable Properties](#cable-properties)
5. [Adding Loads](#adding-loads)
6. [Dead Block Configuration](#dead-block-configuration)
7. [Analysis Settings](#analysis-settings)
8. [Understanding Results](#understanding-results)
9. [Interactive Diagram](#interactive-diagram)
10. [Charts and Graphs](#charts-and-graphs)
11. [Calculation Transparency](#calculation-transparency)
12. [Saving and Loading Projects](#saving-and-loading-projects)
13. [Generating Reports](#generating-reports)
14. [Common Workflows](#common-workflows)
15. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Launching the Application

Open the application in your web browser. You'll see the main interface with:
- **Input panels** on the left
- **Interactive diagram** in the center
- **Results panels** on the right
- **Charts/Calculations** at the bottom

### Quick Start Tutorial

1. **Set the span**: Go to Geometry tab, set Left Pylon X = 0, Right Pylon X = 100
2. **Set pylon heights**: Set both anchor elevations to 15 m
3. **Set sag**: Enter 10 m sag (or sag ratio = 10)
4. **Add a load**: Go to Loads tab, add a 500 kN point load at X = 50 m
5. **View results**: Check the Results panel for cable tensions and reactions

---

## User Interface Overview

```
┌────────────────────────────────────────────────────────────────┐
│  🔗 Suspension Cable Analyzer     [New] [Open] [Save] [PDF]   │
├──────────────┬──────────────────────────────┬──────────────────┤
│              │                              │                  │
│   INPUT      │      INTERACTIVE             │    RESULTS       │
│   PANELS     │      DIAGRAM                 │    PANELS        │
│              │                              │                  │
│  📐 Geometry │      Cable profile           │  🔗 Cable        │
│  🔗 Cable    │      with pylons,            │  🏗️ Pylon        │
│  ⬇️ Loads    │      loads, and              │  🧱 Anchor       │
│  🧱 Dead Blk │      reactions               │  ✓ Checks        │
│  ⚙️ Settings │                              │  📋 Assume       │
│              │                              │                  │
├──────────────┴──────────────────────────────┴──────────────────┤
│   📈 Charts & Graphs  |  📝 Calculations                       │
└────────────────────────────────────────────────────────────────┘
```

---

## Defining Geometry

### Geometry Tab

The Geometry tab defines the cable support positions and sag.

#### Left Anchor (A)

| Field | Description |
|-------|-------------|
| **Anchor Type** | Choose "Pylon + Pulley" or "Direct to Anchor" |
| **Pylon X / Anchor X** | Horizontal position (m) |
| **Anchor Elev. Y** | Elevation of cable attachment point (m) |

#### Right Anchor (B)

Same fields as Left Anchor, for the right support.

#### Anchor Types

**Pylon + Pulley Mode**:
- A pylon structure rises from ground to the anchor elevation
- A pulley sits at the pylon top
- Cable passes over the pulley and continues as a backstay to a dead block

**Direct to Anchor Mode**:
- Cable is fixed directly at the anchor point
- No pylon structure or backstay
- Use when the anchor is at a higher elevation (e.g., anchored to a hillside)

#### Cable Sag

| Field | Description |
|-------|-------------|
| **Sag** | Maximum vertical drop from chord line (m) |
| **Sag Ratio** | Ratio L/n (e.g., 10 means sag = span/10) |

**Tip**: Changing the sag ratio automatically updates the sag value, and vice versa.

---

## Cable Properties

### Cable Tab

Define the cable's physical and material properties.

#### Cross Section

| Field | Unit | Description |
|-------|------|-------------|
| **Diameter** | mm | Cable diameter |
| **Area** | mm² | Cross-sectional area |

#### Material Properties

| Field | Unit | Description |
|-------|------|-------------|
| **Young's Modulus E** | MPa | Elastic modulus |
| **Allowable Stress** | MPa | Design stress limit |
| **Ultimate Strength** | MPa | Ultimate tensile strength |
| **Thermal Coefficient** | ×10⁻⁶/°C | Coefficient of thermal expansion |

#### Self Weight

| Field | Unit | Description |
|-------|------|-------------|
| **Unit Weight** | kN/m | Cable weight per meter |
| **Weight Basis** | - | Per horizontal projection or per arc length |

**Common Cable Types**:

| Type | Diameter (mm) | Area (mm²) | E (MPa) | Unit Weight (kN/m) |
|------|---------------|------------|---------|-------------------|
| Steel Wire Rope | 50 | 1500 | 160,000 | 0.12 |
| Strand | 80 | 4000 | 160,000 | 0.32 |
| Locked Coil | 100 | 6500 | 165,000 | 0.53 |

---

## Adding Loads

### Loads Tab

#### Point Loads

Click **+ Add** to create a new point load.

| Field | Unit | Description |
|-------|------|-------------|
| **Description** | - | Name for the load |
| **Position X** | m | Distance from left support |
| **Magnitude P** | kN | Load value |
| **Position Slider** | - | Drag to adjust position |

**Tips**:
- You can add multiple point loads
- Drag loads in the diagram for quick positioning
- Remove loads with the ✕ button

#### Self-Weight

Toggle **Include cable self-weight** to add distributed load from cable weight.

---

## Dead Block Configuration

### Dead Block Tab

Configure the anchor blocks for each support.

#### Pylon Mode (Backstay Block)

When anchor type is "Pylon + Pulley":

| Field | Unit | Description |
|-------|------|-------------|
| **X Position** | m | Horizontal position of block center |
| **Y Position** | m | Elevation of block top |
| **Width** | m | Block width (perpendicular to cable) |
| **Height** | m | Block height |
| **Depth** | m | Block depth (into page) |
| **Concrete Density** | kN/m³ | Unit weight of concrete |
| **Friction μ** | - | Foundation friction coefficient |

The effective cable angle is calculated automatically from the geometry.

#### Direct Anchor Mode

When anchor type is "Direct to Anchor":
- The cable tension acts directly at the anchor point
- Enter block properties for stability check

---

## Analysis Settings

### Settings Tab

#### Solver Settings

| Setting | Default | Description |
|---------|---------|-------------|
| **Cable Segments** | 100 | Discretization (more = more accurate) |
| **Convergence Tolerance** | 1e-6 | Solver precision |
| **Max Iterations** | 100 | Maximum solver iterations |

#### Analysis Options

| Option | Description |
|--------|-------------|
| **Include self-weight** | Add cable weight to analysis |
| **Include elasticity** | Calculate cable elongation |
| **Include temperature** | Calculate thermal effects |

#### Display Mode

| Mode | Description |
|------|-------------|
| **Educational Mode** | Show explanations with calculations |
| **Professional Mode** | Concise output for experienced users |

---

## Understanding Results

### Cable Results Tab

| Result | Unit | Description |
|--------|------|-------------|
| **Horizontal Tension H** | kN | Constant horizontal force component |
| **Maximum Tension** | kN | Highest cable tension |
| **Minimum Tension** | kN | Lowest cable tension (at lowest point) |
| **Left Reaction V_A** | kN | Vertical reaction at left support |
| **Right Reaction V_B** | kN | Vertical reaction at right support |
| **Cable Length** | m | Total arc length of cable |
| **Max Stress** | MPa | Maximum cable stress |
| **Utilization** | % | Stress / Allowable stress |

**Status Indicators**:
- 🟢 **PASS**: Utilization ≤ 85%
- 🟡 **WARNING**: 85% < Utilization ≤ 100%
- 🔴 **FAIL**: Utilization > 100%

### Pylon Results Tab

For each pylon in "Pylon + Pulley" mode:

| Result | Unit | Description |
|--------|------|-------------|
| **Horizontal Rx** | kN | Horizontal force on pylon |
| **Vertical Ry** | kN | Vertical force on pylon |
| **Resultant R** | kN | Total force magnitude |
| **Direction** | ° | Force direction from horizontal |
| **T₁ (main span)** | kN | Main cable tension at pulley |
| **T₂ (backstay)** | kN | Backstay tension |

### Anchor Results Tab

For each anchor block:

| Result | Unit | Description |
|--------|------|-------------|
| **Horizontal H_D** | kN | Horizontal cable force |
| **Vertical V_D** | kN | Vertical cable force |
| **Resultant R_D** | kN | Total force |
| **Block Weight** | kN | Concrete block weight |
| **Sliding FS** | - | Factor of safety against sliding |
| **Overturning FS** | - | Factor of safety against overturning |

**Minimum Required FS**:
- Sliding: ≥ 1.5
- Overturning: ≥ 2.0

### Engineering Checks Tab

Summary of all validation checks:

| Check | Criterion |
|-------|-----------|
| ✓ Solver Convergence | Converged within tolerance |
| ✓ Horizontal Equilibrium | ΣFx ≈ 0 |
| ✓ Vertical Equilibrium | ΣFy ≈ 0 |
| ✓ Cable Stress | Utilization ≤ 100% |
| ✓ Sliding FS (A) | ≥ 1.5 |
| ✓ Sliding FS (B) | ≥ 1.5 |
| ✓ Overturning FS (A) | ≥ 2.0 |
| ✓ Overturning FS (B) | ≥ 2.0 |

---

## Interactive Diagram

### Diagram Features

The central diagram shows the cable system in real-time.

#### Diagram Elements

| Element | Description |
|---------|-------------|
| **Pylons** | Grey rectangles from ground to anchor |
| **Pulleys** | Cyan circles at pylon tops |
| **Cable** | Cyan curve showing cable profile |
| **Backstays** | Dashed lines to dead blocks |
| **Dead Blocks** | Brown rectangles at anchors |
| **Point Loads** | Red arrows with labels |
| **Reactions** | Green (vertical) and cyan (horizontal) arrows |

#### Toggle Options

| Button | Shows/Hides |
|--------|-------------|
| **Grid** | Background grid |
| **Labels** | Element names |
| **ForceArrows** | Load and reaction arrows |
| **Dimensions** | Span and sag annotations |
| **Tension** | Tension values along cable |

### Interacting with the Diagram

#### Dragging Point Loads

1. Click and hold on a point load (red circle)
2. Drag left or right
3. Release to set new position
4. Results update automatically

#### Viewing Cable Data

Hover over the cable to see a tooltip with:
- X, Y coordinates
- Tension
- H, V components
- Slope

---

## Charts and Graphs

### Charts Tab

Four visualization options:

#### 📈 Cable Profile

Shows Y vs X — the cable shape.
- Horizontal axis: Position along span
- Vertical axis: Elevation
- Reference lines at point load positions

#### ⚡ Tension

Shows tension variation along the cable.
- **T** (cyan): Total tension
- **H** (green dashed): Horizontal component
- **V** (orange dashed): Vertical component

#### 🔧 Stress

Shows stress vs position.
- **Stress** (red): Cable stress
- **Allowable** (green dashed): Stress limit

#### 📊 Sensitivity

Shows how forces change with sag ratio.
- X-axis: Sag ratio (L/n)
- Y-axis: Horizontal tension and max tension

**Use this to understand**: "If I increase sag, how much does tension decrease?"

---

## Calculation Transparency

### Calculations Tab

Every major result shows the underlying equation and values.

#### Calculation Step Format

```
┌─────────────────────────────────────────┐
│ 3. Horizontal Cable Force      1375 kN │
├─────────────────────────────────────────┤
│         P × a × b                       │
│    H = ─────────────                    │
│          L × f                          │
│                                         │
│  P  = 550 kN                            │
│  a  = 52 m                              │
│  b  = 52 m                              │
│  L  = 104 m                             │
│  f  = 10.4 m                            │
│                                         │
│  H = 1375 kN                            │
│                                         │
│ 💡 Why?                                 │
│ The horizontal component remains        │
│ constant throughout the cable...        │
└─────────────────────────────────────────┘
```

Click any step to expand/collapse.

### Educational Mode

When enabled in Settings, each calculation includes:
- The governing equation (rendered with KaTeX)
- All input values with units
- The computed result
- An explanation of the physical meaning

---

## Saving and Loading Projects

### File Operations

| Button | Action |
|--------|--------|
| **New** | Start a fresh project |
| **Open** | Load a JSON project file |
| **Save JSON** | Download project as JSON |
| **PDF Report** | Generate engineering report |

### Auto-Save

The application automatically saves your work to browser storage.
- Saves after every change
- Restores when you reopen the application

### Project File Format

Projects are saved as JSON files:

```json
{
  "name": "My Cable Project",
  "version": "0.1.0",
  "geometry": {
    "leftPylonX": 0,
    "leftPylonY": 12,
    "rightPylonX": 104,
    "rightPylonY": 12,
    "sag": 10.4,
    "leftAnchorType": "pylon",
    "rightAnchorType": "pylon"
  },
  "cable": { ... },
  "loadCases": [ ... ],
  ...
}
```

---

## Generating Reports

### PDF Report

Click **PDF Report** to generate a professional calculation report.

#### Report Contents

1. **Cover Page**: Project name, date, version
2. **Geometry**: Span, pylon positions, sag
3. **Cable Properties**: Area, modulus, allowable stress
4. **Loading**: Point loads, self-weight
5. **Cable Analysis**: H, Tmax, Tmin, reactions
6. **Stress Check**: Max stress, utilization, status
7. **Pylon Forces**: Resultant forces at each pylon
8. **Dead Block Forces**: Cable forces, stability checks
9. **Engineering Checks**: Summary of all validations
10. **Assumptions**: Analysis assumptions

---

## Common Workflows

### Workflow 1: Simple Point Load Analysis

1. Set span and pylon heights in Geometry
2. Set cable properties in Cable
3. Add one point load in Loads
4. Check results in Cable tab
5. Verify stress is acceptable

### Workflow 2: Comparing Sag Options

1. Set up geometry with initial sag
2. Note H and Tmax in results
3. Change sag ratio (e.g., 8 → 10 → 12)
4. Compare tensions in Sensitivity chart
5. Choose optimal sag for your design

### Workflow 3: Dead Block Design

1. Complete cable analysis
2. Go to Dead Block tab
3. Enter initial block dimensions
4. Check stability FS in Anchor results
5. Adjust dimensions until FS acceptable

### Workflow 4: Direct Anchor Configuration

1. In Geometry, select "Direct to Anchor" for one side
2. Set anchor elevation (e.g., higher than opposite pylon)
3. Note: No pylon or backstay on that side
4. Cable tension goes directly to anchor block

---

## Troubleshooting

### Problem: "Solver did not converge"

**Causes**:
- Sag too small for the loads
- Conflicting geometry

**Solutions**:
- Increase sag
- Check that span > 0
- Reduce number of point loads for testing

### Problem: Results seem wrong

**Checks**:
1. Verify units (kN, m, mm²)
2. Check equilibrium residuals in Checks tab
3. Compare with hand calculation for simple case

### Problem: Cable doesn't connect to pylon

**Cause**: Legacy saved project with old geometry

**Solution**: 
- Start a New project
- Re-enter geometry values

### Problem: Stress shows FAIL

**Solutions**:
- Increase cable area
- Increase sag (reduces tension)
- Use higher strength cable
- Reduce loads

### Problem: Sliding FS too low

**Solutions**:
- Increase block weight (larger block)
- Increase block width
- Steeper backstay angle (block further away)
- Higher friction coefficient

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl/Cmd + S` | Save project (JSON) |
| `Ctrl/Cmd + O` | Open project |
| `Ctrl/Cmd + N` | New project |

---

## Glossary

| Term | Definition |
|------|------------|
| **Sag** | Maximum vertical drop of cable below the chord line |
| **Chord** | Straight line between cable supports |
| **Horizontal Tension (H)** | Horizontal component of cable force (constant) |
| **Vertical Reaction (V)** | Vertical support force |
| **Backstay** | Cable segment from pulley to dead block |
| **Dead Block** | Concrete anchor block |
| **Factor of Safety (FS)** | Resistance / Demand ratio |
| **Utilization Ratio** | Actual stress / Allowable stress |

---

## Getting Help

If you encounter issues:
1. Check this User Guide
2. Review the assumptions in the Assumptions tab
3. Compare with a simple benchmark case
4. Check the Technical Design document for theory

---

*Happy analyzing! 🔗*
