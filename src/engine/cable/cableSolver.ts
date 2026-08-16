// ============================================================
// Cable Solver — Pure TypeScript Engineering Engine
// No React / Browser dependencies
// ============================================================

import type {
  CableGeometry,
  CableProperties,
  PointLoad,
  DistributedLoad,
  CablePoint,
  CableSegment,
  CableSolverResult,
  CalculationStep,
  KeyPoint,
} from '../../models/types';

// ----- Helper: span -----
export function getSpan(geo: CableGeometry): number {
  return geo.rightPylonX - geo.leftPylonX;
}

// ----- Helper: chord elevation difference -----
export function getChordDeltaY(geo: CableGeometry): number {
  return geo.rightPylonY - geo.leftPylonY;
}

// ----- Calculate sag from ratio -----
export function sagFromRatio(span: number, ratio: number): number {
  return span / ratio;
}

// ============================================================
// Analytical: Single Point Load on Cable
// ============================================================
export interface PointLoadAnalytical {
  H: number;
  Va: number;
  Vb: number;
  Ta: number;
  Tb: number;
  Tmax: number;
  sag: number;
  steps: CalculationStep[];
}

export function calculatePointLoadCable(
  span: number,
  load: number,
  loadX: number,
  sag: number
): PointLoadAnalytical {
  const steps: CalculationStep[] = [];
  const a = loadX;
  const b = span - loadX;

  // Vertical reactions
  const Va = (load * b) / span;
  const Vb = (load * a) / span;

  steps.push({
    title: 'Left Vertical Reaction',
    equation: 'V_A = \\frac{P \\cdot b}{L}',
    variables: [
      { name: 'Load', symbol: 'P', value: load, unit: 'kN' },
      { name: 'Distance b', symbol: 'b', value: b, unit: 'm' },
      { name: 'Span', symbol: 'L', value: span, unit: 'm' },
    ],
    result: { name: 'V_A', value: Va, unit: 'kN' },
  });

  steps.push({
    title: 'Right Vertical Reaction',
    equation: 'V_B = \\frac{P \\cdot a}{L}',
    variables: [
      { name: 'Load', symbol: 'P', value: load, unit: 'kN' },
      { name: 'Distance a', symbol: 'a', value: a, unit: 'm' },
      { name: 'Span', symbol: 'L', value: span, unit: 'm' },
    ],
    result: { name: 'V_B', value: Vb, unit: 'kN' },
  });

  // Horizontal tension from moment about load point
  const H = (load * a * b) / (span * sag);

  steps.push({
    title: 'Horizontal Cable Force',
    equation: 'H = \\frac{P \\cdot a \\cdot b}{L \\cdot f}',
    variables: [
      { name: 'Load', symbol: 'P', value: load, unit: 'kN' },
      { name: 'Distance a', symbol: 'a', value: a, unit: 'm' },
      { name: 'Distance b', symbol: 'b', value: b, unit: 'm' },
      { name: 'Span', symbol: 'L', value: span, unit: 'm' },
      { name: 'Sag', symbol: 'f', value: sag, unit: 'm' },
    ],
    result: { name: 'H', value: H, unit: 'kN' },
  });

  // Cable tensions
  const Ta = Math.sqrt(H * H + Va * Va);
  const Tb = Math.sqrt(H * H + Vb * Vb);
  const Tmax = Math.max(Ta, Tb);

  steps.push({
    title: 'Left Cable Tension',
    equation: 'T_A = \\sqrt{H^2 + V_A^2}',
    variables: [
      { name: 'Horizontal', symbol: 'H', value: H, unit: 'kN' },
      { name: 'Vertical', symbol: 'V_A', value: Va, unit: 'kN' },
    ],
    result: { name: 'T_A', value: Ta, unit: 'kN' },
  });

  steps.push({
    title: 'Right Cable Tension',
    equation: 'T_B = \\sqrt{H^2 + V_B^2}',
    variables: [
      { name: 'Horizontal', symbol: 'H', value: H, unit: 'kN' },
      { name: 'Vertical', symbol: 'V_B', value: Vb, unit: 'kN' },
    ],
    result: { name: 'T_B', value: Tb, unit: 'kN' },
  });

  return { H, Va, Vb, Ta, Tb, Tmax, sag, steps };
}

// ============================================================
// Analytical: Parabolic Cable under UDL (self-weight)
// ============================================================
export interface ParabolicCableResult {
  H: number;
  Va: number;
  Vb: number;
  Tmax: number;
  Tmin: number;
  cableLength: number;
  steps: CalculationStep[];
}

export function calculateParabolicCable(
  span: number,
  w: number,      // kN/m (per horizontal projection)
  sag: number,
  leftY: number,
  rightY: number
): ParabolicCableResult {
  const steps: CalculationStep[] = [];

  // For symmetric case (leftY === rightY):
  // H = wL² / (8f)
  const H = (w * span * span) / (8 * sag);

  steps.push({
    title: 'Horizontal Tension (UDL)',
    equation: 'H = \\frac{w L^2}{8 f}',
    variables: [
      { name: 'Load', symbol: 'w', value: w, unit: 'kN/m' },
      { name: 'Span', symbol: 'L', value: span, unit: 'm' },
      { name: 'Sag', symbol: 'f', value: sag, unit: 'm' },
    ],
    result: { name: 'H', value: H, unit: 'kN' },
  });

  // Vertical reactions (symmetric for equal pylon heights)
  const totalLoad = w * span;
  const deltaY = rightY - leftY;
  const Va = totalLoad / 2 + (H * deltaY) / span;
  const Vb = totalLoad / 2 - (H * deltaY) / span;

  const Tmax = Math.sqrt(H * H + Math.max(Va, Vb) ** 2);
  const Tmin = H; // at lowest point

  // Approximate cable length (parabolic)
  const cableLength = span * (1 + (8 * sag * sag) / (3 * span * span));

  steps.push({
    title: 'Approximate Cable Length',
    equation: 'L_c \\approx L \\left(1 + \\frac{8 f^2}{3 L^2}\\right)',
    variables: [
      { name: 'Span', symbol: 'L', value: span, unit: 'm' },
      { name: 'Sag', symbol: 'f', value: sag, unit: 'm' },
    ],
    result: { name: 'L_c', value: cableLength, unit: 'm' },
  });

  return { H, Va, Vb, Tmax, Tmin, cableLength, steps };
}

// ============================================================
// Full Cable Solver — Combines Point Loads + Self-Weight
// Returns discretized cable profile
// ============================================================
export function solveCable(
  geometry: CableGeometry,
  cable: CableProperties,
  pointLoads: PointLoad[],
  distributedLoads: DistributedLoad[],
  includeSelfWeight: boolean,
  segments: number,
  tolerance: number,
  maxIterations: number
): CableSolverResult {
  const span = getSpan(geometry);
  const sag = geometry.sag;
  const leftY = geometry.leftPylonY;
  const rightY = geometry.rightPylonY;
  const w = includeSelfWeight ? cable.unitWeight : 0;

  // Collect vertical point loads sorted by x
  const vLoads = pointLoads
    .filter((p) => p.direction === 'vertical')
    .sort((a, b) => a.x - b.x);

  // Collect distributed loads
  const totalDistW = distributedLoads.reduce((sum, dl) => sum + dl.w, 0);
  const effectiveW = w + totalDistW;

  // --- Step 1: Initial H estimate ---
  let H: number;
  const totalPointLoad = vLoads.reduce((s, p) => s + p.magnitude, 0);

  if (totalPointLoad > 0 && effectiveW === 0) {
    // Pure point loads
    if (vLoads.length === 1) {
      const pl = vLoads[0];
      const a = pl.x;
      const b = span - pl.x;
      H = (pl.magnitude * a * b) / (span * sag);
    } else {
      // Estimate: use moment equilibrium about sag point
      H = estimateH_MultiplePointLoads(span, sag, vLoads);
    }
  } else if (effectiveW > 0 && totalPointLoad === 0) {
    // Pure UDL
    H = (effectiveW * span * span) / (8 * sag);
  } else if (effectiveW > 0 && totalPointLoad > 0) {
    // Combined: start with UDL estimate + point load contribution
    const Hw = (effectiveW * span * span) / (8 * sag);
    let Hp = 0;
    if (vLoads.length === 1) {
      const pl = vLoads[0];
      Hp = (pl.magnitude * pl.x * (span - pl.x)) / (span * sag);
    } else {
      Hp = estimateH_MultiplePointLoads(span, sag, vLoads);
    }
    // Superposition is approximate; iterative solver will refine
    H = Hw + Hp;
  } else {
    // No loads
    H = 1; // default minimal
  }

  // --- Step 2: Iterative solver ---
  let converged = false;
  let iterations = 0;
  let error = Infinity;

  for (let iter = 0; iter < maxIterations; iter++) {
    iterations = iter + 1;

    // Calculate cable profile for current H
    const profile = computeProfile(geometry, H, effectiveW, vLoads, segments);

    // Check sag constraint: the lowest point should match desired sag
    // Find actual sag (max deviation below chord)
    const chordAtX = (x: number) => {
      const t = (x - geometry.leftPylonX) / span;
      return leftY + t * (rightY - leftY);
    };

    let actualMaxSag = 0;
    for (const pt of profile) {
      const chordY = chordAtX(pt.x);
      const deviation = chordY - pt.y;
      if (deviation > actualMaxSag) actualMaxSag = deviation;
    }

    error = Math.abs(actualMaxSag - sag);

    if (error < tolerance) {
      converged = true;
      break;
    }

    // Adjust H: higher H → less sag
    // Newton-like: f/H ratio adjustment
    if (actualMaxSag > 0) {
      H = H * (actualMaxSag / sag);
    } else {
      H = H * 1.5;
    }

    if (H < 0.001) H = 0.001;
  }

  // --- Step 3: Final profile ---
  const finalProfile = computeProfile(geometry, H, effectiveW, vLoads, segments);

  // --- Step 4: Calculate tensions ---
  const points: CablePoint[] = [];
  let cableLength = 0;
  let maxTension = 0;
  let minTension = Infinity;

  for (let i = 0; i < finalProfile.length; i++) {
    const pt = finalProfile[i];
    let slope = 0;
    let ds = 0;

    if (i < finalProfile.length - 1) {
      const next = finalProfile[i + 1];
      const dx = next.x - pt.x;
      const dy = next.y - pt.y;
      slope = dy / dx;
      ds = Math.sqrt(dx * dx + dy * dy);
    } else if (i > 0) {
      const prev = finalProfile[i - 1];
      const dx = pt.x - prev.x;
      const dy = pt.y - prev.y;
      slope = dy / dx;
    }

    cableLength += ds;

    const V = H * slope;
    const T = Math.sqrt(H * H + V * V);
    const stress = cable.area > 0 ? (T * 1000) / cable.area : 0; // T in kN, area in mm², stress in MPa
    const strain = cable.youngsModulus > 0 ? stress / cable.youngsModulus : 0;

    if (T > maxTension) maxTension = T;
    if (T < minTension) minTension = T;

    points.push({
      x: pt.x,
      y: pt.y,
      s: cableLength,
      slope,
      H,
      V: Math.abs(V),
      T,
      stress,
      strain,
    });
  }

  // --- Step 5: Reactions (ANALYTICAL, not from numerical slopes) ---
  //
  //   Taking moments about the right support:
  //     Va * L = Σ Pi*(L - xi) + w*L²/2 + H*(rightY - leftY)
  //
  //   Vertical equilibrium gives:
  //     Vb = totalLoad - Va
  //
  const totalVerticalLoad = totalPointLoad + effectiveW * span;
  const dY = geometry.rightPylonY - geometry.leftPylonY;
  let momentAboutB = 0;
  for (const pl of vLoads) {
    momentAboutB += pl.magnitude * (span - pl.x);
  }
  momentAboutB += (effectiveW * span * span) / 2;
  const VaCalc = (momentAboutB + H * dY) / span;
  const VbCalc = totalVerticalLoad - VaCalc;

  // Equilibrium check
  const Fy = VaCalc + VbCalc - totalVerticalLoad;

  // Build segments
  const cableSegments: CableSegment[] = [];
  const segSize = Math.floor(points.length / Math.min(10, segments));
  for (let i = 0; i < points.length - 1; i += Math.max(1, segSize)) {
    const end = Math.min(i + segSize, points.length - 1);
    const seg: CableSegment = {
      startIndex: i,
      endIndex: end,
      startX: points[i].x,
      endX: points[end].x,
      length: points[end].s - points[i].s,
      avgTension: (points[i].T + points[end].T) / 2,
    };
    cableSegments.push(seg);
  }

  // --- Step 6: Build key points (supports and load locations) ---
  //
  // Cable angle must be computed from the ANALYTICAL shear force, not by
  // interpolating the discretized profile.  At a point load the shear
  // jumps by P, so the slope is different on each side.
  //
  //   V(x) = Va − w·x − Σ Pi   (for all loads at xi ≤ x)
  //   slope = −V / H
  //   angle = atan(slope)        (radians → degrees)
  //   T     = √(H² + V²)
  //
  // Va (= VaCalc) was already computed analytically in Step 5.

  // Helper: analytical shear, slope, angle, tension at position x.
  // `includeLoadAtX` controls whether a load exactly at x is subtracted
  // (false = "just left of load", true = "just right of / at load").
  const analyticalAtX = (
    x: number,
    includeLoadAtX: boolean
  ): { V: number; slope: number; angle: number; T: number } => {
    let V = VaCalc - effectiveW * x;
    for (const pl of vLoads) {
      if (includeLoadAtX ? pl.x <= x : pl.x < x - 1e-9) {
        V -= pl.magnitude;
      }
    }
    const slope = -V / H;                          // dy/dx
    const angle = Math.atan(slope) * (180 / Math.PI); // degrees
    const T = Math.sqrt(H * H + V * V);
    return { V, slope, angle, T };
  };

  const keyPoints: KeyPoint[] = [];

  // Left support — cable leaves to the right
  const leftA = analyticalAtX(0, false);
  keyPoints.push({
    id: 'support-left',
    type: 'support-left',
    x: geometry.leftPylonX,
    y: geometry.leftPylonY,
    angleLeft: 0,
    angleRight: leftA.angle,
    tensionLeft: 0,
    tensionRight: leftA.T,
    H,
    Vup: VaCalc,
    Vdown: 0,
  });

  // Right support — cable arrives from the left
  const rightA = analyticalAtX(span, true);
  keyPoints.push({
    id: 'support-right',
    type: 'support-right',
    x: geometry.rightPylonX,
    y: geometry.rightPylonY,
    angleLeft: rightA.angle,
    angleRight: 0,
    tensionLeft: rightA.T,
    tensionRight: 0,
    H,
    Vup: VbCalc,
    Vdown: 0,
  });

  // Point loads — left side EXCLUDES the load, right side INCLUDES it
  for (const pl of vLoads) {
    const leftSide  = analyticalAtX(pl.x, false); // shear just left of load
    const rightSide = analyticalAtX(pl.x, true);  // shear just right of load

    // Find cable Y at load position from the discretized profile
    let loadY = geometry.leftPylonY;
    for (let i = 0; i < points.length - 1; i++) {
      if (points[i].x <= pl.x && points[i + 1].x >= pl.x) {
        const t = (pl.x - points[i].x) / (points[i + 1].x - points[i].x);
        loadY = points[i].y + t * (points[i + 1].y - points[i].y);
        break;
      }
    }

    keyPoints.push({
      id: pl.id,
      type: 'point-load',
      x: pl.x,
      y: loadY,
      angleLeft: leftSide.angle,
      angleRight: rightSide.angle,
      tensionLeft: leftSide.T,
      tensionRight: rightSide.T,
      H,
      Vup: 0,
      Vdown: pl.magnitude,
      loadMagnitude: pl.magnitude,
      loadDescription: pl.description,
    });
  }

  return {
    converged,
    iterations,
    error,
    horizontalTension: H,
    points,
    segments: cableSegments,
    maxTension,
    minTension,
    cableLength,
    leftReaction: { H, V: VaCalc },
    rightReaction: { H, V: VbCalc },
    equilibriumResidual: { Fx: 0, Fy },
    keyPoints,
  };
}

// ============================================================
// Helper: Compute cable profile for given H
// Ensures both endpoints exactly match the anchor elevations
// ============================================================
interface ProfilePoint {
  x: number;
  y: number;
}

function computeProfile(
  geometry: CableGeometry,
  H: number,
  w: number,
  pointLoads: PointLoad[],
  segments: number
): ProfilePoint[] {
  const span = getSpan(geometry);
  const dx = span / segments;
  const leftX = geometry.leftPylonX;
  const leftY = geometry.leftPylonY;
  const rightY = geometry.rightPylonY;

  // Calculate vertical reactions for current H
  // Taking moments about the right support:
  // Va * L = sum(Pi * (L - xi)) + w * L² / 2 + H * (rightY - leftY)
  let momentRight = 0;
  for (const pl of pointLoads) {
    momentRight += pl.magnitude * (span - pl.x);
  }
  momentRight += (w * span * span) / 2;

  // Elevation difference effect
  const deltaY = rightY - leftY;
  const Va = (momentRight + H * deltaY) / span;

  // Build raw profile using V(x) = Va - w*x - sum(Pi for xi <= x)
  const rawProfile: ProfilePoint[] = [];

  for (let i = 0; i <= segments; i++) {
    const x = i * dx;

    // Vertical shear at x
    let V = Va - w * x;
    for (const pl of pointLoads) {
      if (pl.x <= x + 1e-10) {
        V -= pl.magnitude;
      }
    }

    // Trapezoidal integration of slope
    if (i === 0) {
      rawProfile.push({ x: leftX + x, y: leftY });
    } else {
      const prevX = (i - 1) * dx;
      let Vprev = Va - w * prevX;
      for (const pl of pointLoads) {
        if (pl.x <= prevX + 1e-10) {
          Vprev -= pl.magnitude;
        }
      }

      const slopeHere = -V / H;
      const slopePrev = -Vprev / H;
      const avgSlope = (slopeHere + slopePrev) / 2;

      const prevY = rawProfile[i - 1].y;
      rawProfile.push({ x: leftX + x, y: prevY + avgSlope * dx });
    }
  }

  // Correct the profile to ensure both endpoints match exactly
  // The integrated profile may have numerical drift; apply linear correction
  const computedEndY = rawProfile[rawProfile.length - 1].y;
  const endError = rightY - computedEndY;

  // Apply linear correction proportional to x
  const profile: ProfilePoint[] = rawProfile.map((pt, i) => {
    const t = i / segments; // 0 at left, 1 at right
    return {
      x: pt.x,
      y: pt.y + t * endError, // correct linearly
    };
  });

  // Ensure exact endpoints
  profile[0].y = leftY;
  profile[profile.length - 1].y = rightY;

  return profile;
}

// ============================================================
// Helper: Estimate H for multiple point loads
// ============================================================
function estimateH_MultiplePointLoads(
  span: number,
  sag: number,
  loads: PointLoad[]
): number {
  // Use moment about the midpoint of the span
  // M_mid = Va * L/2 - sum(Pi * (L/2 - xi)) for xi < L/2
  // H = M_mid / f

  let momentMid = 0;

  for (const pl of loads) {
    const a = pl.x;
    const b = span - pl.x;
    momentMid += (pl.magnitude * a * b) / span;
  }

  // H * f = sum of moments at max sag position
  return momentMid / sag;
}
