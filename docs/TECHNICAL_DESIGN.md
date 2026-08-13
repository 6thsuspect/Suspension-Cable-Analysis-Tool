# Technical Design

This document details the technical implementation of the Suspension Cable Analyzer, including algorithms, numerical methods, and engineering formulations.

---

## Table of Contents

1. [Cable Mechanics Theory](#cable-mechanics-theory)
2. [Cable Solver Algorithm](#cable-solver-algorithm)
3. [Profile Computation](#profile-computation)
4. [Pulley Force Analysis](#pulley-force-analysis)
5. [Dead Block Stability](#dead-block-stability)
6. [Numerical Methods](#numerical-methods)
7. [Coordinate System](#coordinate-system)
8. [Unit Handling](#unit-handling)

---

## Cable Mechanics Theory

### Fundamental Assumptions

The application uses the **flexible cable** model:

1. **Perfectly flexible**: Cable carries tension only (no bending moment, shear, or compression)
2. **Inextensible** (initial model): Cable length does not change under load
3. **Concentrated mass**: Self-weight treated as distributed load per horizontal projection
4. **Small deflections**: Slopes are moderate (typically < 30°)

### Governing Equation

For a cable element in equilibrium:

```
        ↑ T + dT
        │
    ────┼──── ds
        │θ + dθ
        ↓ T
        
    w·dx (downward load)
```

The differential equation of cable equilibrium:

```
H × (d²y/dx²) = w(x)
```

Where:
- `H` = horizontal component of tension (constant for vertical loads)
- `y` = vertical deflection
- `w(x)` = distributed load intensity

### Cable Tension Components

At any point on the cable:

```
T = √(H² + V²)

where:
V = H × (dy/dx)
```

The horizontal component `H` is constant throughout the cable when only vertical loads act.

---

## Cable Solver Algorithm

### Overview

The solver determines the cable profile that satisfies:
1. Equilibrium at every point
2. Boundary conditions (anchor positions)
3. Sag constraint (maximum vertical deviation from chord)

### Algorithm Steps

```
ALGORITHM: SolveCable

INPUT:
  geometry: {leftX, leftY, rightX, rightY, sag}
  cable: {unitWeight, ...}
  pointLoads: [{x, magnitude}, ...]
  settings: {segments, tolerance, maxIterations}

OUTPUT:
  CableSolverResult

PROCEDURE:
  1. Calculate span = rightX - leftX
  2. Calculate effective distributed load w = cable.unitWeight (if enabled)
  3. Calculate total point load = Σ pointLoads[i].magnitude
  
  4. ESTIMATE initial H:
     IF only point loads:
       H = Σ(P_i × a_i × b_i) / (span × sag)
     ELSE IF only distributed load:
       H = w × span² / (8 × sag)
     ELSE:
       H = H_distributed + H_pointLoads
  
  5. ITERATE to find correct H:
     FOR iter = 1 TO maxIterations:
       profile = computeProfile(geometry, H, w, pointLoads, segments)
       actualSag = findMaximumSag(profile)
       error = |actualSag - targetSag|
       
       IF error < tolerance:
         converged = TRUE
         BREAK
       
       // Newton-like adjustment
       H = H × (actualSag / targetSag)
     
  6. COMPUTE final profile with converged H
  
  7. APPLY endpoint correction:
     // Ensure profile exactly matches anchor elevations
     endError = rightY - profile[last].y
     FOR each point i in profile:
       profile[i].y += (i / segments) × endError
  
  8. CALCULATE tensions at each point:
     FOR i = 0 TO segments:
       slope = (profile[i+1].y - profile[i].y) / dx
       V = |H × slope|
       T = √(H² + V²)
       stress = T / cableArea
  
  9. CALCULATE reactions:
     Va = -H × firstSlope
     Vb = H × lastSlope
  
  10. CHECK equilibrium:
      ΣFy = Va + Vb - totalLoad
  
  11. RETURN results
```

### Convergence Criteria

The solver converges when:
```
|actualSag - targetSag| < tolerance
```

Default tolerance: `1e-6 m`
Default max iterations: `100`

---

## Profile Computation

### Point Load Case

For a cable with point load P at position a from left support:

```
         A                    B
         ●━━━━━━━━━━━●━━━━━━━━●
         │          │        │
         │    a     │   b    │
         │◄────────►│◄──────►│
         │          ▼P       │
         │          │        │
         │          │f       │
         │          ▼        │
                    ●
```

**Reactions**:
```
V_A = P × b / L
V_B = P × a / L
```

**Horizontal Tension** (from moment equilibrium at load point):
```
H = P × a × b / (L × f)
```

**Cable Profile**:
```
Left segment (0 ≤ x ≤ a):
  y(x) = leftY - (V_A / H) × x

Right segment (a ≤ x ≤ L):
  y(x) = rightY - (V_B / H) × (L - x)
```

### Distributed Load Case (Parabolic Cable)

For uniformly distributed load w:

```
H = w × L² / (8 × f)

y(x) = leftY - (w × x² / (2H)) + chordCorrection
```

The cable profile is parabolic.

**Cable Length** (approximate):
```
L_cable ≈ L × (1 + 8f²/(3L²))
```

### Combined Loading

For combined point loads and distributed load:

1. Calculate effective distributed load `w_eff = w_cable`
2. For each segment between point loads, solve equilibrium
3. Use numerical integration to build profile
4. Apply boundary corrections

**Vertical Shear Function**:
```
V(x) = V_A - w × x - Σ P_i  (for all P_i where x_i ≤ x)
```

**Slope at any point**:
```
dy/dx = -V(x) / H
```

---

## Pulley Force Analysis

### Vector Formulation

At a pulley, two cable segments meet. The resultant force on the pulley is the vector sum of the two tensions:

```
         ↗ T₁
        /
       ●──────→ R (resultant on pulley)
        \
         ↘ T₂
```

**Resultant Components**:
```
R_x = T₁ × cos(θ₁) + T₂ × cos(θ₂)
R_y = T₁ × sin(θ₁) + T₂ × sin(θ₂)
```

**Resultant Magnitude**:
```
R = √(R_x² + R_y²)
```

**Resultant Direction**:
```
φ = atan2(R_y, R_x)
```

### Frictionless Pulley

For a frictionless pulley:
```
T₁ = T₂ = T
```

The resultant simplifies to:
```
R = 2T × cos(α/2)
```

Where `α` is the angle between the two cable segments.

### Angle Conventions

- **Main span cable**: Angle measured from horizontal, positive counterclockwise
- **Backstay cable**: Angle from pulley toward dead block
- **Resultant**: Points in direction of combined pull on pylon

---

## Dead Block Stability

### Force Decomposition

Cable force on dead block:
```
H_D = T × cos(θ)  (horizontal, toward span)
V_D = T × sin(θ)  (vertical, downward)
```

### Block Weight

```
W = width × height × depth × γ_concrete
```

Typical concrete density: `γ = 24 kN/m³`

### Sliding Check

Factor of safety against sliding:
```
FS_sliding = (W - V_D) × μ / H_D
```

Where:
- `μ` = friction coefficient between block and foundation
- `(W - V_D)` = net vertical force (normal force)
- `H_D` = driving horizontal force

**Acceptance Criterion**: `FS_sliding ≥ 1.5`

### Overturning Check

Moments about the toe (front edge):
```
M_resisting = W × (width/2)
M_overturning = H_D × height + V_D × (width/2)

FS_overturning = M_resisting / M_overturning
```

**Acceptance Criterion**: `FS_overturning ≥ 2.0`

### Bearing Pressure

Net vertical force and eccentricity:
```
N = W - V_D
e = (M_overturning - M_resisting) / N
```

Bearing pressures (assuming linear distribution):
```
q_max = (N / A) × (1 + 6e/width)
q_min = (N / A) × (1 - 6e/width)
```

**Acceptance Criterion**: `q_min ≥ 0` (no uplift)

---

## Numerical Methods

### Iterative H-Finding

The solver uses a **Newton-like iteration** to find the horizontal tension:

```
H_new = H_old × (actualSag / targetSag)
```

This converges quickly because:
- Sag is approximately inversely proportional to H
- Doubling H roughly halves the sag

### Profile Integration

The cable profile is computed using **trapezoidal integration**:

```
y[i] = y[i-1] + (slope[i-1] + slope[i]) / 2 × dx
```

Where:
```
slope[i] = -V[i] / H
V[i] = V_A - w × x[i] - Σ(point loads before x[i])
```

### Endpoint Correction

After integration, numerical drift may cause the computed endpoint to differ from the target. A linear correction is applied:

```
correction_factor = (rightY - computed_rightY) / span

y_corrected[i] = y_computed[i] + (x[i] / span) × correction_factor
```

This preserves the shape while ensuring exact boundary conditions.

### Convergence Monitoring

The solver tracks:
- **Iterations**: Number of H adjustments
- **Error**: `|actualSag - targetSag|`
- **Equilibrium Residual**: `|ΣF_x|` and `|ΣF_y|`

---

## Coordinate System

### Global Coordinates

```
    Y ↑
      │
      │    (rightX, rightY)
      │   ●
      │  /
      │ /  Cable
      │/
      ●─────────────────────► X
  (leftX, leftY)
```

- **X**: Horizontal, positive to the right
- **Y**: Vertical, positive upward
- **Origin**: User-defined (typically at left support)

### Sign Conventions

| Quantity | Positive Direction |
|----------|-------------------|
| X coordinate | Right |
| Y coordinate | Up |
| Vertical force | Up |
| Horizontal force | Into span |
| Sag | Downward (positive value) |
| Slope | Counterclockwise from horizontal |

### Diagram Coordinates

The SVG diagram uses inverted Y (screen coordinates):
```
y_screen = -y_world
```

This is handled in the rendering layer only; all calculations use standard engineering coordinates.

---

## Unit Handling

### Internal Units

All calculations use consistent SI units:

| Quantity | Unit | Notes |
|----------|------|-------|
| Length | m | meters |
| Force | kN | kilonewtons |
| Stress | MPa | N/mm² |
| Area | mm² | square millimeters |
| Moment | kNm | kilonewton-meters |
| Pressure | kPa | kilonewtons per square meter |
| Temperature | °C | Celsius |

### Unit Conversions

**Stress Calculation**:
```typescript
// T in kN, area in mm²
// stress in MPa (N/mm²)
stress = (T * 1000) / area;  // kN → N
```

**Elongation Calculation**:
```typescript
// T in kN, ds in m, A in mm², E in MPa
// dL in mm
dL = (T * 1000 * ds * 1000) / (A * E);
```

### Display Formatting

Results are formatted based on magnitude:
```typescript
if (Math.abs(value) < 0.001) {
  return value.toExponential(3);
} else if (Math.abs(value) >= 1000) {
  return value.toLocaleString();
} else {
  return value.toFixed(2);
}
```

---

## Stress and Elongation

### Cable Stress

```
σ = T / A

where:
σ = stress (MPa)
T = tension (kN) → convert to N
A = area (mm²)
```

### Utilization Ratio

```
UR = σ_max / σ_allowable
```

| UR Range | Status |
|----------|--------|
| ≤ 0.85 | PASS |
| 0.85 - 1.0 | WARNING |
| > 1.0 | FAIL |

### Elastic Elongation

```
ΔL = ∫ (T / AE) ds

Numerical:
ΔL = Σ (T_i × Δs_i) / (A × E)
```

### Thermal Elongation

```
ΔL_T = α × L × ΔT

where:
α = thermal expansion coefficient (per °C)
L = cable length (m)
ΔT = temperature change (°C)
```

---

## Validation

### Equilibrium Checks

After solving, the following must be satisfied:

**Horizontal Equilibrium**:
```
ΣF_x = H_left - H_right = 0
```
(Always satisfied since H is constant)

**Vertical Equilibrium**:
```
ΣF_y = V_A + V_B - W_cable - Σ P_i ≈ 0
```

Tolerance: `|ΣF_y| < 1.0 kN`

### Moment Check

Taking moments about left support:
```
Σ M_A = V_B × L - Σ(P_i × x_i) - W × L/2 ≈ 0
```

### Benchmark Cases

The solver is validated against analytical solutions:

**Case 1: Single Point Load at Center**
```
P = 550 kN, L = 104 m, f = 10.4 m
Expected: H = 1375 kN
```

**Case 2: Uniform Distributed Load**
```
w = 1 kN/m, L = 100 m, f = 5 m
Expected: H = 250 kN
```

---

## Performance Considerations

### Computational Complexity

- Profile computation: O(n) where n = segments
- Tension calculation: O(n)
- Overall per analysis: O(n × iterations)

Typical values:
- Segments: 100
- Iterations: 10-20
- Total: ~2000 operations

### Optimization Opportunities

1. **Caching**: Reuse profile for same H
2. **Early termination**: Stop when error plateaus
3. **Adaptive segments**: Fewer segments for preview, more for final
4. **Web Workers**: Offload to background thread for large models

---

## Error Conditions

### Non-Convergence

If the solver doesn't converge:
- `converged = false`
- Results are returned but may be inaccurate
- Warning displayed to user

Common causes:
- Sag too small relative to span
- Conflicting constraints
- Numerical instability

### Invalid Inputs

The engine validates:
- `span > 0`
- `sag > 0 && sag < span/2`
- `cable.area > 0`
- `cable.youngsModulus > 0`
- Point load positions within span

### Recovery Strategies

1. **Clamp values**: Prevent impossible states
2. **Default fallback**: Use sensible defaults
3. **User notification**: Display clear error messages
