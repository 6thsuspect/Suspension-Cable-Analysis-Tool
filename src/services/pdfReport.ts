// ============================================================
// PDF Report Generator - Step-by-Step Engineering Calculations
// All text uses only ASCII-safe characters for jsPDF Helvetica
// ============================================================
import { jsPDF } from 'jspdf';
import type {
  SuspensionCableProject,
  CableSolverResult,
  StressResult,
  ElongationResult,
  PulleyResult,
  DeadBlockResult,
  EngineeringCheck,
  KeyPoint,
} from '../models/types';

// -- Layout constants --
const LM = 20;
const PW = 170;
const PH = 275;

let doc: jsPDF;
let y: number;
let pageNo: number;
let sectionNo: number;

// -- Page management --
function checkPage(need = 16) {
  if (y + need > PH) { doc.addPage(); y = 20; pageNo++; footer(); }
}
function footer() {
  doc.setFontSize(7); doc.setTextColor(150);
  doc.text('Suspension Cable Analyzer  -  Page ' + pageNo, 105, 290, { align: 'center' });
  doc.setTextColor(0);
}

// -- Text helpers (ASCII only) --
function heading(title: string) {
  checkPage(22);
  doc.setFontSize(14); doc.setFont('helvetica', 'bold');
  doc.text(sectionNo + '. ' + title, LM, y); y += 2;
  doc.setDrawColor(0, 130, 180); doc.setLineWidth(0.5);
  doc.line(LM, y, LM + PW, y); y += 8;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.setDrawColor(0); doc.setLineWidth(0.2);
  sectionNo++;
}
function subHeading(title: string) {
  checkPage(14);
  doc.setFontSize(10); doc.setFont('helvetica', 'bold');
  doc.text(title, LM, y); y += 6;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
}
function ln(text: string, indent = 0) {
  checkPage();
  doc.text(text, LM + indent, y); y += 5;
}
function paramRow(name: string, symbol: string, value: string, unit: string) {
  checkPage();
  doc.text(name, LM + 8, y);
  doc.setFont('helvetica', 'bold');
  doc.text(symbol, LM + 70, y);
  doc.setFont('helvetica', 'normal');
  doc.text('=', LM + 85, y);
  doc.text(value, LM + 90, y);
  doc.text(unit, LM + 125, y);
  y += 5;
}
function resultBox(label: string, value: string) {
  checkPage(12);
  doc.setFillColor(235, 248, 255);
  doc.roundedRect(LM + 4, y - 3, PW - 8, 10, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text(label + '  =  ' + value, LM + 10, y + 3);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  y += 12;
}
function passFailBox(label: string, pass: boolean) {
  checkPage(10);
  if (pass) {
    doc.setFillColor(220, 255, 220);
  } else {
    doc.setFillColor(255, 225, 220);
  }
  doc.roundedRect(LM + 4, y - 3, PW - 8, 8, 1, 1, 'F');
  const icon = pass ? '[PASS]' : '[FAIL]';
  doc.text(icon + '  ' + label, LM + 8, y + 2);
  y += 10;
}
function hr() {
  checkPage(5);
  doc.setDrawColor(200); doc.line(LM, y, LM + PW, y); y += 5; doc.setDrawColor(0);
}
function gap(h = 4) { y += h; }
function fv(v: number, d = 2) { return v.toFixed(d); }

/** Replace every non-ASCII character with a safe equivalent for jsPDF Helvetica */
function sanitize(s: string): string {
  return s
    .replace(/Σ/g, 'Sum')
    .replace(/σ/g, 'sigma')
    .replace(/α/g, 'alpha')
    .replace(/θ/g, 'theta')
    .replace(/μ/g, 'mu')
    .replace(/γ/g, 'gamma')
    .replace(/ε/g, 'epsilon')
    .replace(/Δ/g, 'delta')
    .replace(/π/g, 'pi')
    .replace(/√/g, 'sqrt')
    .replace(/≈/g, '~')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/×/g, 'x')
    .replace(/·/g, '*')
    .replace(/°/g, 'deg')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/⁻/g, '-')
    .replace(/⁶/g, '6')
    .replace(/₁/g, '_1')
    .replace(/₂/g, '_2')
    .replace(/₃/g, '_3')
    .replace(/—/g, ' - ')
    .replace(/–/g, '-')
    .replace(/'/g, "'")
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/✓/g, '[OK]')
    .replace(/✗/g, '[X]')
    .replace(/•/g, '-')
    .replace(/↑/g, '(up)')
    .replace(/↓/g, '(down)')
    .replace(/←/g, '<-')
    .replace(/→/g, '->')
    .replace(/⃗/g, '')
    .replace(/[^\x20-\x7E]/g, '');  // strip anything still non-ASCII
}

// -- Diagram: Cable Schematic --
function drawCableSchematic(
  project: SuspensionCableProject,
  solverResult: CableSolverResult
) {
  checkPage(65);
  const geo = project.geometry;
  const span = geo.rightPylonX - geo.leftPylonX;
  const dx0 = LM + 5; const dw = PW - 10;
  const dy0 = y; const dh = 55;
  doc.setDrawColor(200); doc.rect(dx0, dy0, dw, dh);

  const allX = [geo.leftPylonX, geo.rightPylonX];
  const allY = [geo.leftPylonY, geo.rightPylonY, geo.leftPylonY - geo.sag, 0];
  if (geo.leftAnchorType === 'pylon') { allX.push(project.deadBlockA.x); allY.push(project.deadBlockA.y); }
  if (geo.rightAnchorType === 'pylon') { allX.push(project.deadBlock.x); allY.push(project.deadBlock.y); }
  const xMin = Math.min(...allX) - 5; const xMax = Math.max(...allX) + 5;
  const yMin = Math.min(...allY) - 3; const yMax = Math.max(...allY) + 3;
  const sx = (xx: number) => dx0 + ((xx - xMin) / (xMax - xMin)) * dw;
  const sy = (yy: number) => dy0 + dh - ((yy - yMin) / (yMax - yMin)) * dh;

  // Ground
  doc.setDrawColor(120); doc.setLineDashPattern([1, 1], 0);
  doc.line(dx0, sy(0), dx0 + dw, sy(0));
  doc.setLineDashPattern([], 0);

  // Pylons
  doc.setDrawColor(60); doc.setFillColor(100, 100, 110);
  if (geo.leftAnchorType === 'pylon') {
    doc.rect(sx(geo.leftPylonX) - 1.5, sy(geo.leftPylonY), 3, sy(0) - sy(geo.leftPylonY), 'FD');
  } else {
    doc.circle(sx(geo.leftPylonX), sy(geo.leftPylonY), 2, 'FD');
  }
  if (geo.rightAnchorType === 'pylon') {
    doc.rect(sx(geo.rightPylonX) - 1.5, sy(geo.rightPylonY), 3, sy(0) - sy(geo.rightPylonY), 'FD');
  } else {
    doc.circle(sx(geo.rightPylonX), sy(geo.rightPylonY), 2, 'FD');
  }

  // Cable
  const pts = solverResult.points;
  doc.setDrawColor(0, 140, 180); doc.setLineWidth(0.6);
  for (let i = 0; i < pts.length - 1; i += 2) {
    const j = Math.min(i + 2, pts.length - 1);
    doc.line(sx(pts[i].x), sy(pts[i].y), sx(pts[j].x), sy(pts[j].y));
  }

  // Backstays
  doc.setLineWidth(0.3); doc.setLineDashPattern([2, 1], 0);
  if (geo.leftAnchorType === 'pylon') {
    doc.line(sx(geo.leftPylonX), sy(geo.leftPylonY), sx(project.deadBlockA.x), sy(project.deadBlockA.y));
    doc.setFillColor(140, 80, 20);
    doc.rect(sx(project.deadBlockA.x) - 3, sy(project.deadBlockA.y) - 4, 6, 4, 'FD');
  }
  if (geo.rightAnchorType === 'pylon') {
    doc.line(sx(geo.rightPylonX), sy(geo.rightPylonY), sx(project.deadBlock.x), sy(project.deadBlock.y));
    doc.setFillColor(140, 80, 20);
    doc.rect(sx(project.deadBlock.x) - 3, sy(project.deadBlock.y) - 4, 6, 4, 'FD');
  }
  doc.setLineDashPattern([], 0);

  // Point loads
  doc.setDrawColor(200, 30, 30); doc.setLineWidth(0.5);
  const activeLC = project.loadCases.find(l => l.id === project.activeLoadCaseId);
  if (activeLC) {
    for (const pl of activeLC.pointLoads) {
      let ly = geo.leftPylonY;
      for (let i = 0; i < pts.length - 1; i++) {
        if (pts[i].x <= pl.x && pts[i + 1].x >= pl.x) {
          const t = (pl.x - pts[i].x) / (pts[i + 1].x - pts[i].x);
          ly = pts[i].y + t * (pts[i + 1].y - pts[i].y); break;
        }
      }
      const px = sx(pl.x); const py = sy(ly);
      doc.line(px, py - 12, px, py);
      doc.triangle(px, py, px - 2, py - 4, px + 2, py - 4, 'F');
      doc.setFontSize(7); doc.setTextColor(200, 30, 30);
      doc.text(pl.magnitude + ' kN', px + 2, py - 13);
      doc.setTextColor(0);
    }
  }

  // Span dimension
  doc.setDrawColor(100); doc.setFontSize(6); doc.setLineWidth(0.15);
  const dimY0 = sy(0) + 6;
  doc.line(sx(geo.leftPylonX), dimY0, sx(geo.rightPylonX), dimY0);
  doc.line(sx(geo.leftPylonX), dimY0 - 2, sx(geo.leftPylonX), dimY0 + 2);
  doc.line(sx(geo.rightPylonX), dimY0 - 2, sx(geo.rightPylonX), dimY0 + 2);
  doc.text('L = ' + span.toFixed(1) + ' m', (sx(geo.leftPylonX) + sx(geo.rightPylonX)) / 2, dimY0 + 4, { align: 'center' });

  // Labels
  doc.setFontSize(7); doc.setTextColor(60);
  doc.text('A', sx(geo.leftPylonX), sy(0) + 10, { align: 'center' });
  doc.text('B', sx(geo.rightPylonX), sy(0) + 10, { align: 'center' });
  doc.setTextColor(0); doc.setLineWidth(0.2);
  y += dh + 12;
}

// -- Diagram: Free Body Diagram --
function drawFBD(kp: KeyPoint, H: number, label: string) {
  checkPage(55);
  const bx = LM + 5; const bw = 85; const bh = 48;
  doc.setDrawColor(180); doc.rect(bx, y, bw, bh);
  doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
  doc.text(label, bx + 2, y + 4.5); doc.setFont('helvetica', 'normal');

  const cx = bx + bw / 2; const cy_ = y + bh / 2 + 4;
  const aLen = 18;
  const aLR = (kp.angleLeft * Math.PI) / 180;
  const aRR = (kp.angleRight * Math.PI) / 180;

  const isSupport = kp.type !== 'point-load';
  const isLeft = kp.type === 'support-left';

  // Horizontal reference
  doc.setDrawColor(210); doc.setLineWidth(0.15);
  doc.line(cx - 25, cy_, cx + 25, cy_);

  // Node
  doc.setDrawColor(80);
  doc.setFillColor(isSupport ? 30 : 220, isSupport ? 160 : 60, isSupport ? 80 : 60);
  doc.circle(cx, cy_, 3, 'FD');

  // Left cable
  if (kp.tensionLeft > 0) {
    const ex = cx - aLen * Math.cos(aLR);
    const ey = cy_ + aLen * Math.sin(aLR);
    doc.setDrawColor(0, 100, 160); doc.setLineWidth(0.5);
    doc.line(ex, ey, cx - 3 * Math.cos(aLR), cy_ + 3 * Math.sin(aLR));
    doc.setFillColor(0, 100, 160);
    doc.circle(cx - 3 * Math.cos(aLR), cy_ + 3 * Math.sin(aLR), 1.2, 'F');
    doc.setFontSize(5.5); doc.setTextColor(0, 80, 140);
    doc.text('T_L=' + fv(kp.tensionLeft, 0) + 'kN', ex - 2, ey - 2, { align: 'right' });
    doc.setTextColor(100, 50, 200);
    doc.text(Math.abs(kp.angleLeft).toFixed(1) + 'deg', ex + 2, ey + 5);
  }

  // Right cable
  if (kp.tensionRight > 0) {
    const ex = cx + aLen * Math.cos(aRR);
    const ey = cy_ - aLen * Math.sin(aRR);
    doc.setDrawColor(0, 100, 160); doc.setLineWidth(0.5);
    doc.line(ex, ey, cx + 3 * Math.cos(aRR), cy_ - 3 * Math.sin(aRR));
    doc.setFillColor(0, 100, 160);
    doc.circle(cx + 3 * Math.cos(aRR), cy_ - 3 * Math.sin(aRR), 1.2, 'F');
    doc.setFontSize(5.5); doc.setTextColor(0, 80, 140);
    doc.text('T_R=' + fv(kp.tensionRight, 0) + 'kN', ex + 2, ey - 2);
    doc.setTextColor(100, 50, 200);
    doc.text(Math.abs(kp.angleRight).toFixed(1) + 'deg', ex - 10, ey + 5);
  }

  // Vertical reaction (support, arrow pointing up)
  if (isSupport && kp.Vup > 0) {
    doc.setDrawColor(20, 150, 60); doc.setFillColor(20, 150, 60); doc.setLineWidth(0.6);
    doc.line(cx, cy_ + 20, cx, cy_ + 6);
    doc.triangle(cx, cy_ + 4, cx - 2, cy_ + 9, cx + 2, cy_ + 9, 'F');
    doc.setFontSize(5.5); doc.setTextColor(20, 130, 60);
    doc.text('V=' + fv(kp.Vup, 1) + 'kN (up)', cx + 4, cy_ + 18);
  }

  // Point load (arrow pointing down into node)
  if (kp.type === 'point-load' && kp.Vdown > 0) {
    doc.setDrawColor(200, 30, 30); doc.setFillColor(200, 30, 30); doc.setLineWidth(0.6);
    doc.line(cx, cy_ - 20, cx, cy_ - 6);
    doc.triangle(cx, cy_ - 4, cx - 2, cy_ - 9, cx + 2, cy_ - 9, 'F');
    doc.setFontSize(5.5); doc.setTextColor(200, 30, 30);
    doc.text('P=' + fv(kp.Vdown, 0) + 'kN (down)', cx + 4, cy_ - 16);
  }

  // Horizontal reaction (support)
  if (isSupport) {
    const dir = isLeft ? -1 : 1;
    doc.setDrawColor(10, 100, 200); doc.setFillColor(10, 100, 200); doc.setLineWidth(0.4);
    doc.line(cx + dir * 22, cy_, cx + dir * 6, cy_);
    const tipX = cx + dir * 4;
    doc.triangle(tipX, cy_, tipX + dir * 4, cy_ - 2, tipX + dir * 4, cy_ + 2, 'F');
    doc.setFontSize(5); doc.setTextColor(10, 80, 180);
    doc.text('H=' + fv(H, 0) + 'kN', cx + dir * 24, cy_ - 2, { align: dir < 0 ? 'right' : 'left' });
  }

  // Support triangle
  if (isSupport) {
    doc.setDrawColor(80); doc.setFillColor(255, 255, 255); doc.setLineWidth(0.3);
    doc.triangle(cx, cy_ + 4, cx - 6, cy_ + 14, cx + 6, cy_ + 14);
    doc.line(cx - 8, cy_ + 15, cx + 8, cy_ + 15);
  }

  doc.setTextColor(0); doc.setDrawColor(0); doc.setLineWidth(0.2);
  y += bh + 4;
}

// ====================================================================
// MAIN EXPORT
// ====================================================================
export function generatePDFReport(
  project: SuspensionCableProject,
  solverResult: CableSolverResult | null,
  stressResult: StressResult | null,
  elongationResult: ElongationResult | null,
  pulleyResult: PulleyResult | null,
  pulleyResultA: PulleyResult | null,
  deadBlockResult: DeadBlockResult | null,
  deadBlockResultA: DeadBlockResult | null,
  engineeringChecks: EngineeringCheck[]
) {
  doc = new jsPDF();
  y = 20; pageNo = 1; sectionNo = 1;
  const geo = project.geometry;
  const span = geo.rightPylonX - geo.leftPylonX;
  const cab = project.cable;
  const activeLC = project.loadCases.find(l => l.id === project.activeLoadCaseId);
  const pointLoads = activeLC?.pointLoads ?? [];
  const w = project.settings.includeSelfWeight ? cab.unitWeight : 0;

  // ===================== COVER =====================
  doc.setFontSize(28); doc.setFont('helvetica', 'bold');
  doc.text('Suspension Cable', LM, 50);
  doc.text('Analysis Report', LM, 62);
  doc.setFont('helvetica', 'normal');
  doc.setDrawColor(0, 130, 180); doc.setLineWidth(1);
  doc.line(LM, 68, LM + PW, 68); doc.setLineWidth(0.2); doc.setDrawColor(0);
  doc.setFontSize(12);
  doc.text('Project: ' + project.name, LM, 82);
  doc.text('Date: ' + new Date().toLocaleDateString(), LM, 90);
  doc.text('Version: ' + project.version, LM, 98);
  doc.setFontSize(9);
  doc.text('Step-by-step engineering calculation with formulas,', LM, 115);
  doc.text('intermediate results, free-body diagrams and checks.', LM, 121);
  footer();

  // ===================== 1. GEOMETRY =====================
  doc.addPage(); y = 20; pageNo++; footer();
  heading('Geometry & Configuration');

  subHeading('1.1  Cable Span');
  paramRow('Left anchor X', 'X_A', fv(geo.leftPylonX), 'm');
  paramRow('Left anchor Y', 'Y_A', fv(geo.leftPylonY), 'm');
  paramRow('Right anchor X', 'X_B', fv(geo.rightPylonX), 'm');
  paramRow('Right anchor Y', 'Y_B', fv(geo.rightPylonY), 'm');
  gap();
  ln('Formula:');
  ln('  L  =  X_B  -  X_A', 4);
  ln('  L  =  ' + fv(geo.rightPylonX) + '  -  ' + fv(geo.leftPylonX), 4);
  resultBox('Span L', fv(span) + ' m');

  subHeading('1.2  Cable Sag');
  paramRow('Sag ratio', 'n', geo.sagRatio ? fv(geo.sagRatio, 0) : '-', '');
  ln('Formula:');
  ln('  f  =  L / n', 4);
  ln('  f  =  ' + fv(span) + ' / ' + (geo.sagRatio ? fv(geo.sagRatio, 0) : '-'), 4);
  resultBox('Sag f', fv(geo.sag) + ' m');

  subHeading('1.3  Anchor Types');
  ln('Left  (A):  ' + (geo.leftAnchorType === 'pylon' ? 'Pylon + Pulley + Backstay' : 'Direct to Anchor Block'));
  ln('Right (B):  ' + (geo.rightAnchorType === 'pylon' ? 'Pylon + Pulley + Backstay' : 'Direct to Anchor Block'));

  if (solverResult) {
    gap(4); subHeading('1.4  System Schematic');
    drawCableSchematic(project, solverResult);
  }

  // ===================== 2. CABLE PROPERTIES =====================
  heading('Cable Properties');
  paramRow('Cross-section area', 'A', fv(cab.area, 0), 'mm2');
  paramRow('Diameter', 'D', fv(cab.diameter, 0), 'mm');
  paramRow("Young's modulus", 'E', fv(cab.youngsModulus, 0), 'MPa');
  paramRow('Unit weight', 'w', fv(cab.unitWeight, 3), 'kN/m');
  paramRow('Allowable stress', 'f_allow', fv(cab.allowableStress, 0), 'MPa');
  paramRow('Ultimate strength', 'f_ult', fv(cab.ultimateStrength, 0), 'MPa');
  paramRow('Thermal coeff.', 'alpha', (cab.thermalCoeff * 1e6).toFixed(1), 'x10^-6 /degC');
  paramRow('Weight basis', '', cab.weightBasis === 'horizontal' ? 'per horizontal projection' : 'per arc length', '');

  // ===================== 3. LOADING =====================
  heading('Loading');
  subHeading('3.1  Point Loads');
  if (pointLoads.length === 0) { ln('No point loads defined.'); }
  pointLoads.forEach((pl, i) => {
    ln('Load ' + (i + 1) + ': ' + pl.description);
    paramRow('Position', 'x_' + (i + 1), fv(pl.x), 'm');
    paramRow('Magnitude', 'P_' + (i + 1), fv(pl.magnitude, 0), 'kN');
    gap(2);
  });

  subHeading('3.2  Self-Weight');
  if (w > 0) {
    ln('Cable self-weight included: w = ' + fv(w, 3) + ' kN/m');
    ln('Total self-weight: W_sw = w x L = ' + fv(w, 3) + ' x ' + fv(span) + ' = ' + fv(w * span, 1) + ' kN');
  } else {
    ln('Cable self-weight not included.');
  }

  if (!solverResult) {
    heading('Analysis');
    ln('No analysis results available - solver did not run.');
    doc.save(project.name.replace(/\s+/g, '-') + '-Report.pdf');
    return;
  }

  // ===================== 4. STEP-BY-STEP CALCULATION =====================
  heading('Cable Analysis - Step-by-Step');
  const H = solverResult.horizontalTension;

  // 4.1 Vertical reactions
  subHeading('4.1  Vertical Reactions');
  ln('Taking moments about support B:');
  gap(2);
  ln('  V_A x L  =  Sum[ P_i x (L - x_i) ]  +  w x L^2 / 2  +  H x (Y_B - Y_A)', 4);
  gap(2);

  const dYv = geo.rightPylonY - geo.leftPylonY;
  let momStr = '';
  let momVal = 0;
  pointLoads.forEach((pl, i) => {
    const m = pl.magnitude * (span - pl.x);
    momVal += m;
    momStr += (i > 0 ? ' + ' : '') + fv(pl.magnitude, 0) + ' x ' + fv(span - pl.x);
  });
  const wMom = w * span * span / 2;
  momVal += wMom;
  if (w > 0) momStr += ' + ' + fv(w, 3) + ' x ' + fv(span) + '^2 / 2';
  const hMom = H * dYv;
  momVal += hMom;
  if (Math.abs(dYv) > 0.001) momStr += ' + ' + fv(H) + ' x ' + fv(dYv);
  ln('  Moment sum = ' + momStr, 4);
  ln('             = ' + fv(momVal, 1) + ' kNm', 4);
  gap(2);
  const Va = momVal / span;
  ln('  V_A  =  ' + fv(momVal, 1) + ' / ' + fv(span), 4);
  resultBox('V_A', fv(Va, 2) + ' kN');

  const totalLoad = pointLoads.reduce((s, p) => s + p.magnitude, 0) + w * span;
  const Vb = totalLoad - Va;
  ln('From vertical equilibrium:  V_B = Total Load - V_A');
  ln('  V_B  =  ' + fv(totalLoad, 1) + '  -  ' + fv(Va, 2), 4);
  resultBox('V_B', fv(Vb, 2) + ' kN');

  ln('Check: V_A + V_B = ' + fv(Va, 2) + ' + ' + fv(Vb, 2) + ' = ' + fv(Va + Vb, 2) + ' kN');
  ln('Total applied load = ' + fv(totalLoad, 2) + ' kN');
  passFailBox('Vertical Equilibrium: ' + fv(Va + Vb, 2) + ' ~ ' + fv(totalLoad, 2) + ' kN', Math.abs(Va + Vb - totalLoad) < 1);

  // 4.2 Horizontal tension
  subHeading('4.2  Horizontal Tension');
  if (pointLoads.length === 1 && w === 0) {
    const pl = pointLoads[0]; const a = pl.x; const b = span - pl.x;
    ln('Single point load - analytical solution:');
    gap(2);
    ln('  H  =  P x a x b  /  ( L x f )', 4);
    gap(2);
    paramRow('Load', 'P', fv(pl.magnitude, 0), 'kN');
    paramRow('Dist. from A', 'a', fv(a), 'm');
    paramRow('Dist. from B', 'b', fv(b), 'm');
    paramRow('Sag', 'f', fv(geo.sag), 'm');
    gap(2);
    ln('  H  =  ' + fv(pl.magnitude, 0) + ' x ' + fv(a) + ' x ' + fv(b) + '  /  ( ' + fv(span) + ' x ' + fv(geo.sag) + ' )', 4);
    ln('  H  =  ' + fv(pl.magnitude * a * b, 1) + '  /  ' + fv(span * geo.sag, 1), 4);
  } else if (w > 0 && pointLoads.length === 0) {
    ln('Uniform distributed load - parabolic cable:');
    ln('  H  =  w x L^2  /  ( 8 x f )', 4);
    ln('  H  =  ' + fv(w, 3) + ' x ' + fv(span) + '^2  /  ( 8 x ' + fv(geo.sag) + ' )', 4);
  } else {
    ln('Combined loading - iterative numerical solution.');
    ln('The solver adjusts H until the computed sag matches the target.');
  }
  ln('Solver converged in ' + solverResult.iterations + ' iterations, residual = ' + solverResult.error.toExponential(2));
  resultBox('H', fv(H, 2) + ' kN');

  // 4.3 Cable tensions at supports
  subHeading('4.3  Cable Tensions at Supports');
  ln('Cable tension at any point:');
  ln('  T  =  sqrt( H^2  +  V^2 )', 4);
  gap(2);
  const kps = solverResult.keyPoints;
  const kpA = kps.find(k => k.type === 'support-left');
  const kpB = kps.find(k => k.type === 'support-right');
  if (kpA) {
    ln('At Support A:');
    ln('  T_A  =  sqrt( ' + fv(H) + '^2  +  ' + fv(Va) + '^2 )', 4);
    ln('  T_A  =  sqrt( ' + fv(H * H, 0) + '  +  ' + fv(Va * Va, 0) + ' )', 4);
    resultBox('T_A', fv(kpA.tensionRight, 2) + ' kN');
    ln('  Cable angle at A:  theta_A  =  atan( V_A / H )  =  atan( ' + fv(Va) + ' / ' + fv(H) + ' )', 4);
    resultBox('theta_A', fv(Math.abs(kpA.angleRight), 2) + ' deg below horizontal');
  }
  if (kpB) {
    ln('At Support B:');
    ln('  T_B  =  sqrt( ' + fv(H) + '^2  +  ' + fv(Vb) + '^2 )', 4);
    ln('  T_B  =  sqrt( ' + fv(H * H, 0) + '  +  ' + fv(Vb * Vb, 0) + ' )', 4);
    resultBox('T_B', fv(kpB.tensionLeft, 2) + ' kN');
    ln('  Cable angle at B:  theta_B  =  atan( V_B / H )  =  atan( ' + fv(Vb) + ' / ' + fv(H) + ' )', 4);
    resultBox('theta_B', fv(Math.abs(kpB.angleLeft), 2) + ' deg below horizontal');
  }

  // 4.4 Cable tensions & angles at point loads
  const kpLoads = kps.filter(k => k.type === 'point-load');
  if (kpLoads.length > 0) {
    subHeading('4.4  Tensions & Angles at Point Loads');
    ln('At a point load, the shear force jumps by P, producing');
    ln('different cable angles on the left and right sides.');
    gap(2);
    ln('  V_left(x)  = V_A - w*x - Sum(P_i)   [loads before x]', 4);
    ln('  V_right(x) = V_left(x) - P_current', 4);
    ln('  theta = atan( V / H )', 4);
    gap(4);
    kpLoads.forEach((kp, idx) => {
      ln('-- Load ' + (idx + 1) + ': ' + (kp.loadDescription ?? '') + ' at x = ' + fv(kp.x) + ' m --');
      const VL = kp.tensionLeft * Math.sin(kp.angleLeft * Math.PI / 180);
      const VR = kp.tensionRight * Math.sin(kp.angleRight * Math.PI / 180);
      ln('  Left side :  theta_L = ' + fv(kp.angleLeft, 2) + 'deg,  T_L = ' + fv(kp.tensionLeft, 2) + ' kN,  V_L = ' + fv(Math.abs(VL), 2) + ' kN', 4);
      ln('  Right side:  theta_R = ' + fv(kp.angleRight, 2) + 'deg,  T_R = ' + fv(kp.tensionRight, 2) + ' kN,  V_R = ' + fv(Math.abs(VR), 2) + ' kN', 4);
      ln('  Equilibrium: |V_L| + |V_R| = ' + fv(Math.abs(VL) + Math.abs(VR), 1) + ' kN  ~  P = ' + fv(kp.Vdown, 0) + ' kN', 4);
      passFailBox('Load ' + (idx + 1) + ' vertical equilibrium', Math.abs(Math.abs(VL) + Math.abs(VR) - kp.Vdown) < 2);
      gap(2);
    });
  }

  // 4.5 Maximum tension
  subHeading('4.5  Maximum & Minimum Tension');
  resultBox('T_max', fv(solverResult.maxTension, 2) + ' kN');
  resultBox('T_min', fv(solverResult.minTension, 2) + ' kN');
  ln('Cable length (arc): L_c = ' + fv(solverResult.cableLength, 3) + ' m');

  // ===================== 5. FREE-BODY DIAGRAMS =====================
  heading('Free-Body Diagrams');
  ln('Each FBD shows forces acting on the node: cable tensions (blue),');
  ln('vertical reaction (green, up) or applied load (red, down), with angles.');
  gap(4);
  kps.forEach(kp => {
    let lbl: string;
    if (kp.type === 'support-left') lbl = 'FBD - Support A (Left)';
    else if (kp.type === 'support-right') lbl = 'FBD - Support B (Right)';
    else lbl = 'FBD - Load "' + (kp.loadDescription ?? '') + '" at x = ' + fv(kp.x) + ' m';
    drawFBD(kp, H, lbl);
    gap(2);
  });

  // ===================== 6. STRESS CHECK =====================
  heading('Cable Stress Check');
  if (stressResult) {
    ln('Maximum stress:');
    ln('  sigma_max  =  T_max x 1000  /  A', 4);
    ln('  sigma_max  =  ' + fv(solverResult.maxTension, 0) + ' x 1000  /  ' + fv(cab.area, 0), 4);
    resultBox('sigma_max', fv(stressResult.maxStress, 1) + ' MPa');
    gap(2);
    ln('Utilization ratio:');
    ln('  UR  =  sigma_max  /  f_allow', 4);
    ln('  UR  =  ' + fv(stressResult.maxStress, 1) + '  /  ' + fv(stressResult.allowableStress, 0), 4);
    resultBox('UR', fv(stressResult.utilization * 100, 1) + ' %');
    passFailBox('Cable stress: ' + stressResult.status, stressResult.status !== 'FAIL');
  }
  if (elongationResult) {
    subHeading('Cable Elongation');
    ln('  dL  =  Sum( T_i x ds_i )  /  ( A x E )', 4);
    resultBox('Elastic elongation', fv(elongationResult.elasticElongation, 2) + ' mm');
    resultBox('Final cable length', fv(elongationResult.finalLength, 3) + ' m');
  }

  // ===================== 7. PYLON / PULLEY =====================
  const hasPylons = geo.leftAnchorType === 'pylon' || geo.rightAnchorType === 'pylon';
  if (hasPylons) {
    heading('Pylon / Pulley Forces');
    ln('Pulley resultant = vector sum of cable tensions:');
    ln('  R  =  T1  +  T2   (vector sum)', 4);
    ln('  R_x = T1*cos(theta_1) + T2*cos(theta_2)', 4);
    ln('  R_y = T1*sin(theta_1) + T2*sin(theta_2)', 4);
    ln('  R   = sqrt( R_x^2  +  R_y^2 )', 4);
    gap(4);
    const writePulley = (label: string, pr: PulleyResult | null) => {
      if (!pr) return;
      subHeading(label);
      paramRow('T1 (main span)', 'T1', fv(pr.T1, 1), 'kN');
      paramRow('T2 (backstay)', 'T2', fv(pr.T2, 1), 'kN');
      paramRow('Angle between', 'alpha', fv(pr.angleBetween, 1), 'deg');
      gap(2);
      ln('  R_x  =  ' + fv(pr.Rx, 2) + ' kN', 4);
      ln('  R_y  =  ' + fv(pr.Ry, 2) + ' kN', 4);
      resultBox('Resultant R', fv(pr.R, 2) + ' kN @ ' + fv(pr.direction, 1) + ' deg');
    };
    if (geo.leftAnchorType === 'pylon') writePulley('Pylon A (Left)', pulleyResultA);
    if (geo.rightAnchorType === 'pylon') writePulley('Pylon B (Right)', pulleyResult);
  }

  // ===================== 8. DEAD BLOCK =====================
  heading('Dead Block / Anchor Forces');
  ln('Cable force on anchor block:');
  ln('  H_D  =  T x cos(theta)', 4);
  ln('  V_D  =  T x sin(theta)', 4);
  ln('  R_D  =  sqrt( H_D^2  +  V_D^2 )', 4);
  gap(4);

  const writeBlock = (label: string, db: DeadBlockResult | null, blk: typeof project.deadBlock) => {
    if (!db) return;
    subHeading(label);
    paramRow('Cable tension', 'T', fv(db.Rd, 1), 'kN');
    paramRow('Cable angle', 'theta', fv(db.cableAngle, 1), 'deg');
    gap(2);
    ln('  H_D  =  ' + fv(db.Rd, 1) + ' x cos(' + fv(db.cableAngle, 1) + 'deg)', 4);
    resultBox('H_D', fv(db.Hd, 2) + ' kN');
    ln('  V_D  =  ' + fv(db.Rd, 1) + ' x sin(' + fv(db.cableAngle, 1) + 'deg)', 4);
    resultBox('V_D', fv(db.Vd, 2) + ' kN');
    gap(2);

    subHeading('Block Weight');
    ln('  W  =  width x height x depth x gamma', 4);
    ln('  W  =  ' + fv(blk.width) + ' x ' + fv(blk.height) + ' x ' + fv(blk.depth) + ' x ' + fv(blk.concreteDensity), 4);
    resultBox('W', fv(db.blockWeight, 1) + ' kN');
    gap(2);

    subHeading('Sliding Check');
    ln('  FS_sliding  =  (W - V_D) x mu  /  H_D', 4);
    if (db.slidingFS !== null) {
      ln('  FS  =  (' + fv(db.blockWeight, 1) + ' - ' + fv(db.Vd, 1) + ') x ' + fv(blk.frictionCoeff) + '  /  ' + fv(db.Hd, 1), 4);
      resultBox('FS_sliding', fv(db.slidingFS, 2));
      passFailBox('Sliding FS ' + fv(db.slidingFS, 2) + ' >= 1.50', db.slidingFS >= 1.5);
    }
    gap(2);

    subHeading('Overturning Check');
    ln('  FS_OT  =  M_resisting  /  M_overturning', 4);
    const Mres = db.blockWeight * blk.width / 2;
    const Movr = db.Hd * blk.height + db.Vd * blk.width / 2;
    ln('  M_resist  =  W x (width/2)  =  ' + fv(db.blockWeight, 1) + ' x ' + fv(blk.width / 2) + '  =  ' + fv(Mres, 1) + ' kNm', 4);
    ln('  M_over    =  H_D x h + V_D x (w/2)  =  ' + fv(Movr, 1) + ' kNm', 4);
    if (db.overturningFS !== null) {
      resultBox('FS_overturning', fv(db.overturningFS, 2));
      passFailBox('Overturning FS ' + fv(db.overturningFS, 2) + ' >= 2.00', db.overturningFS >= 2.0);
    }
    hr();
  };

  writeBlock('Anchor A (Left)', deadBlockResultA, project.deadBlockA);
  writeBlock('Anchor B (Right)', deadBlockResult, project.deadBlock);

  // ===================== 9. CHECKS =====================
  heading('Engineering Checks Summary');
  engineeringChecks.forEach(ch => {
    const safeVal = sanitize(ch.value);
    const safeName = sanitize(ch.name);
    passFailBox(safeName + ': ' + safeVal, ch.passed);
    if (ch.details) {
      doc.setFontSize(7); doc.setTextColor(100);
      ln('  ' + sanitize(ch.details), 6);
      doc.setFontSize(9); doc.setTextColor(0);
    }
  });

  // ===================== 10. ASSUMPTIONS =====================
  heading('Analysis Assumptions');
  const assumptions = [
    'Cable treated as perfectly flexible (no bending stiffness)',
    'Cable carries tension only',
    project.pulley.frictionless ? 'Pulleys assumed frictionless (T1 = T2)' : 'Pulley friction included',
    'All loads assumed vertical',
    'Self-weight applied per ' + (cab.weightBasis === 'horizontal' ? 'horizontal projection' : 'actual cable length'),
    'Small-strain elastic behaviour assumed',
    'Left anchor: ' + (geo.leftAnchorType === 'pylon' ? 'Pylon + Pulley + Backstay' : 'Direct to anchor block'),
    'Right anchor: ' + (geo.rightAnchorType === 'pylon' ? 'Pylon + Pulley + Backstay' : 'Direct to anchor block'),
    'Dead-block stability checks are preliminary - final design requires geotechnical investigation',
  ];
  assumptions.forEach(a => { ln('-  ' + a); gap(1); });

  // ===================== 11. RESULTS SUMMARY =====================
  heading('Results Summary');
  doc.setFontSize(9);
  const rows: [string, string][] = [
    ['Span L', fv(span) + ' m'],
    ['Sag f', fv(geo.sag) + ' m'],
    ['Horizontal Tension H', fv(H, 2) + ' kN'],
    ['Max Tension T_max', fv(solverResult.maxTension, 2) + ' kN'],
    ['Min Tension T_min', fv(solverResult.minTension, 2) + ' kN'],
    ['V_A', fv(Va, 2) + ' kN'],
    ['V_B', fv(Vb, 2) + ' kN'],
    ['Cable Length', fv(solverResult.cableLength, 3) + ' m'],
  ];
  if (stressResult) {
    rows.push(['Max Stress', fv(stressResult.maxStress, 1) + ' MPa']);
    rows.push(['Utilization', fv(stressResult.utilization * 100, 1) + ' %  (' + stressResult.status + ')']);
  }
  if (elongationResult) {
    rows.push(['Elastic Elongation', fv(elongationResult.elasticElongation, 2) + ' mm']);
  }

  checkPage(rows.length * 6 + 10);
  doc.setFillColor(240, 248, 255);
  doc.roundedRect(LM, y - 2, PW, rows.length * 6 + 6, 2, 2, 'F');
  rows.forEach(([l, v]) => {
    doc.text(l, LM + 6, y + 3);
    doc.setFont('helvetica', 'bold');
    doc.text(v, LM + PW - 6, y + 3, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += 6;
  });
  y += 8;

  // End
  checkPage(12);
  doc.setFontSize(8); doc.setTextColor(120);
  doc.text('-- End of Report --', 105, y, { align: 'center' });
  doc.text('Generated by Suspension Cable Analyzer', 105, y + 6, { align: 'center' });
  doc.setTextColor(0);

  doc.save(project.name.replace(/\s+/g, '-') + '-Report.pdf');
}
