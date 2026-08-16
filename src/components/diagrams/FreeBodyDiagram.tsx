import React, { useMemo } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import type { KeyPoint } from '../../models/types';

export const FreeBodyDiagram: React.FC = () => {
  const { solverResult } = useProjectStore();

  if (!solverResult || !solverResult.keyPoints || solverResult.keyPoints.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-slate-400">
        Run analysis to see free body diagrams
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 bg-slate-50">
      <h3 className="text-sm font-bold text-slate-700 mb-4">
        Free Body Diagrams at Key Points
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {solverResult.keyPoints.map((kp) => (
          <FBDCard key={kp.id} keyPoint={kp} H={solverResult.horizontalTension} />
        ))}
      </div>
    </div>
  );
};

interface FBDCardProps {
  keyPoint: KeyPoint;
  H: number;
}

const FBDCard: React.FC<FBDCardProps> = ({ keyPoint: kp, H }) => {
  const title = useMemo(() => {
    if (kp.type === 'support-left') return 'Left Support (A)';
    if (kp.type === 'support-right') return 'Right Support (B)';
    return kp.loadDescription || `Point Load at X = ${kp.x.toFixed(1)} m`;
  }, [kp]);

  const isSupport = kp.type === 'support-left' || kp.type === 'support-right';
  const isLeftSupport = kp.type === 'support-left';
  const isRightSupport = kp.type === 'support-right';

  // SVG parameters
  const width = 220;
  const height = 180;
  const cx = width / 2;
  const cy = height / 2 + 10;
  const nodeRadius = 8;
  const arrowLength = 45;

  // Calculate arrow endpoints based on angles.
  //
  // Engineering: angle θ is from +x, CCW positive, y-up.
  // SVG: y is downward.
  //
  // At a node the cable tension PULLS the node along the cable.
  //
  // LEFT cable  — pulls the node toward the left support (upper-left).
  //   The cable arrives at the node going to the right at angle θ_L.
  //   The tension force acts in the OPPOSITE direction: upper-left.
  //   SVG direction: dx = −cos(θ_L),  dy = +sin(θ_L)   ← (flip both from cable dir, then flip y for SVG → +sin)
  //
  //   ...but sin(θ_L) is NEGATIVE for a cable going down-right, so
  //   dy = +sin(negative) = negative → UP in SVG ✓.
  //
  // RIGHT cable — pulls the node toward the right support (upper-right).
  //   The cable leaves the node going to the right at angle θ_R.
  //   The tension force acts IN the cable direction: upper-right.
  //   SVG direction: dx = +cos(θ_R),  dy = −sin(θ_R)
  //
  const angleLeftRad = (kp.angleLeft * Math.PI) / 180;
  const angleRightRad = (kp.angleRight * Math.PI) / 180;

  const leftArrowEnd = {
    x: cx - arrowLength * Math.cos(angleLeftRad),          // to the left
    y: cy + arrowLength * Math.sin(angleLeftRad),          // sin(neg) → UP in SVG ✓
  };
  const rightArrowEnd = {
    x: cx + arrowLength * Math.cos(angleRightRad),         // to the right
    y: cy - arrowLength * Math.sin(angleRightRad),         // −sin(pos) → UP in SVG ✓
  };

  // Node-edge intersection points (where arrow meets the node circle)
  const leftNodeEdge = {
    x: cx - nodeRadius * Math.cos(angleLeftRad),
    y: cy + nodeRadius * Math.sin(angleLeftRad),
  };
  const rightNodeEdge = {
    x: cx + nodeRadius * Math.cos(angleRightRad),
    y: cy - nodeRadius * Math.sin(angleRightRad),
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`px-3 py-2 text-xs font-bold ${
        isSupport ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
      }`}>
        {title}
      </div>

      {/* SVG Free-Body Diagram */}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 bg-slate-50">
        {/* Horizontal reference line */}
        <line x1={20} y1={cy} x2={width - 20} y2={cy} stroke="#cbd5e1" strokeWidth={0.5} strokeDasharray="3 2" />

        {/* ── Left cable tension arrow ── */}
        {(kp.tensionLeft > 0) && !isLeftSupport && (
          <g>
            <line
              x1={leftArrowEnd.x} y1={leftArrowEnd.y}
              x2={leftNodeEdge.x} y2={leftNodeEdge.y}
              stroke="#0891b2" strokeWidth={2}
            />
            {/* arrowhead at node edge */}
            <circle cx={leftNodeEdge.x} cy={leftNodeEdge.y} r={2.5} fill="#0891b2" />

            {/* Tension label */}
            <text x={leftArrowEnd.x - 3} y={leftArrowEnd.y - 5}
              fontSize={8} fill="#0891b2" textAnchor="end" fontWeight="bold">
              T_L = {kp.tensionLeft.toFixed(0)} kN
            </text>

            {/* Angle arc + label */}
            {Math.abs(kp.angleLeft) > 0.05 && (
              <>
                {/* Small arc showing angle to horizontal */}
                <path
                  d={`M ${cx - 18} ${cy}
                      A 18 18 0 0 ${kp.angleLeft < 0 ? 1 : 0}
                      ${cx - 18 * Math.cos(angleLeftRad)} ${cy + 18 * Math.sin(angleLeftRad)}`}
                  fill="none" stroke="#8b5cf6" strokeWidth={1} />
                <text
                  x={cx - 25} y={kp.angleLeft < 0 ? cy + 5 : cy - 3}
                  fontSize={8} fill="#8b5cf6" textAnchor="end" fontWeight="bold">
                  {Math.abs(kp.angleLeft).toFixed(1)}°
                </text>
              </>
            )}
          </g>
        )}

        {/* ── Right cable tension arrow ── */}
        {(kp.tensionRight > 0) && !isRightSupport && (
          <g>
            <line
              x1={rightArrowEnd.x} y1={rightArrowEnd.y}
              x2={rightNodeEdge.x} y2={rightNodeEdge.y}
              stroke="#0891b2" strokeWidth={2}
            />
            {/* arrowhead at node edge */}
            <circle cx={rightNodeEdge.x} cy={rightNodeEdge.y} r={2.5} fill="#0891b2" />

            {/* Tension label */}
            <text x={rightArrowEnd.x + 3} y={rightArrowEnd.y - 5}
              fontSize={8} fill="#0891b2" textAnchor="start" fontWeight="bold">
              T_R = {kp.tensionRight.toFixed(0)} kN
            </text>

            {/* Angle arc + label */}
            {Math.abs(kp.angleRight) > 0.05 && (
              <>
                <path
                  d={`M ${cx + 18} ${cy}
                      A 18 18 0 0 ${kp.angleRight > 0 ? 1 : 0}
                      ${cx + 18 * Math.cos(angleRightRad)} ${cy - 18 * Math.sin(angleRightRad)}`}
                  fill="none" stroke="#8b5cf6" strokeWidth={1} />
                <text
                  x={cx + 25} y={kp.angleRight > 0 ? cy + 5 : cy - 3}
                  fontSize={8} fill="#8b5cf6" textAnchor="start" fontWeight="bold">
                  {Math.abs(kp.angleRight).toFixed(1)}°
                </text>
              </>
            )}
          </g>
        )}

        {/* ── Vertical reaction (support, pointing UP = down in SVG from below node) ── */}
        {isSupport && kp.Vup > 0 && (
          <g>
            <line x1={cx} y1={cy + nodeRadius + 40} x2={cx} y2={cy + nodeRadius + 5} stroke="#16a34a" strokeWidth={2.5} />
            <polygon points={`${cx},${cy + nodeRadius + 2} ${cx - 4},${cy + nodeRadius + 10} ${cx + 4},${cy + nodeRadius + 10}`} fill="#16a34a" />
            <text x={cx + 8} y={cy + nodeRadius + 32} fontSize={9} fill="#16a34a" fontWeight="bold">
              V = {kp.Vup.toFixed(1)} kN ↑
            </text>
          </g>
        )}

        {/* ── Horizontal reaction at support ── */}
        {isSupport && (
          <g>
            {/* Arrow coming from outside and pointing INTO the node (cable pulls toward span) */}
            <line
              x1={isLeftSupport ? cx - nodeRadius - 35 : cx + nodeRadius + 35} y1={cy}
              x2={isLeftSupport ? cx - nodeRadius - 5 : cx + nodeRadius + 5} y2={cy}
              stroke="#0ea5e9" strokeWidth={2} />
            <polygon
              points={
                isLeftSupport
                  ? `${cx - nodeRadius - 2},${cy} ${cx - nodeRadius - 10},${cy - 4} ${cx - nodeRadius - 10},${cy + 4}`
                  : `${cx + nodeRadius + 2},${cy} ${cx + nodeRadius + 10},${cy - 4} ${cx + nodeRadius + 10},${cy + 4}`
              }
              fill="#0ea5e9" />
            <text
              x={isLeftSupport ? cx - nodeRadius - 38 : cx + nodeRadius + 38}
              y={cy - 5} fontSize={9} fill="#0ea5e9"
              textAnchor={isLeftSupport ? 'end' : 'start'} fontWeight="bold">
              H = {H.toFixed(0)} kN
            </text>
          </g>
        )}

        {/* ── Point load arrow (downward = positive y in SVG, from above node) ── */}
        {kp.type === 'point-load' && kp.Vdown > 0 && (
          <g>
            <line x1={cx} y1={cy - nodeRadius - 40} x2={cx} y2={cy - nodeRadius - 5} stroke="#dc2626" strokeWidth={2.5} />
            <polygon points={`${cx},${cy - nodeRadius - 2} ${cx - 4},${cy - nodeRadius - 10} ${cx + 4},${cy - nodeRadius - 10}`} fill="#dc2626" />
            <text x={cx + 8} y={cy - nodeRadius - 28} fontSize={9} fill="#dc2626" fontWeight="bold">
              P = {kp.Vdown.toFixed(0)} kN ↓
            </text>
          </g>
        )}

        {/* ── Central node ── */}
        <circle cx={cx} cy={cy} r={nodeRadius}
          fill={isSupport ? '#10b981' : '#ef4444'}
          stroke={isSupport ? '#059669' : '#dc2626'}
          strokeWidth={2} />

        {/* ── Support symbol (triangle + hatch) ── */}
        {isSupport && (
          <g>
            <polygon
              points={`${cx},${cy + nodeRadius + 2} ${cx - 10},${cy + nodeRadius + 18} ${cx + 10},${cy + nodeRadius + 18}`}
              fill="none" stroke="#475569" strokeWidth={1.5} />
            <line x1={cx - 12} y1={cy + nodeRadius + 20} x2={cx + 12} y2={cy + nodeRadius + 20} stroke="#475569" strokeWidth={1} />
          </g>
        )}
      </svg>

      {/* Data table */}
      <div className="px-3 py-2 bg-white border-t border-slate-100">
        <table className="w-full text-[10px]">
          <tbody>
            <tr>
              <td className="text-slate-500 py-0.5">Position:</td>
              <td className="text-right font-mono">X = {kp.x.toFixed(1)} m, Y = {kp.y.toFixed(2)} m</td>
            </tr>
            {!isLeftSupport && kp.tensionLeft > 0 && (
              <>
                <tr>
                  <td className="text-slate-500 py-0.5">T<sub>L</sub> (left):</td>
                  <td className="text-right font-mono font-bold">{kp.tensionLeft.toFixed(1)} kN</td>
                </tr>
                <tr>
                  <td className="text-slate-500 py-0.5">θ<sub>L</sub> (left):</td>
                  <td className="text-right font-mono text-purple-600">{kp.angleLeft.toFixed(2)}°</td>
                </tr>
              </>
            )}
            {!isRightSupport && kp.tensionRight > 0 && (
              <>
                <tr>
                  <td className="text-slate-500 py-0.5">T<sub>R</sub> (right):</td>
                  <td className="text-right font-mono font-bold">{kp.tensionRight.toFixed(1)} kN</td>
                </tr>
                <tr>
                  <td className="text-slate-500 py-0.5">θ<sub>R</sub> (right):</td>
                  <td className="text-right font-mono text-purple-600">{kp.angleRight.toFixed(2)}°</td>
                </tr>
              </>
            )}
            {kp.type === 'point-load' && Math.abs(kp.angleLeft) !== Math.abs(kp.angleRight) && (
              <tr>
                <td className="text-slate-500 py-0.5">Δθ:</td>
                <td className="text-right font-mono text-amber-600">
                  {Math.abs(Math.abs(kp.angleLeft) - Math.abs(kp.angleRight)).toFixed(2)}°
                </td>
              </tr>
            )}
            <tr className="border-t border-slate-100">
              <td className="text-slate-500 py-0.5">H (horizontal):</td>
              <td className="text-right font-mono text-cyan-600">{kp.H.toFixed(1)} kN</td>
            </tr>
            {isSupport && (
              <tr>
                <td className="text-slate-500 py-0.5">V (reaction ↑):</td>
                <td className="text-right font-mono text-emerald-600">{kp.Vup.toFixed(1)} kN</td>
              </tr>
            )}
            {kp.type === 'point-load' && (
              <>
                <tr>
                  <td className="text-slate-500 py-0.5">V<sub>L</sub> = T<sub>L</sub>·sin θ<sub>L</sub>:</td>
                  <td className="text-right font-mono">
                    {Math.abs(kp.tensionLeft * Math.sin(kp.angleLeft * Math.PI / 180)).toFixed(1)} kN
                  </td>
                </tr>
                <tr>
                  <td className="text-slate-500 py-0.5">V<sub>R</sub> = T<sub>R</sub>·sin θ<sub>R</sub>:</td>
                  <td className="text-right font-mono">
                    {Math.abs(kp.tensionRight * Math.sin(kp.angleRight * Math.PI / 180)).toFixed(1)} kN
                  </td>
                </tr>
                <tr className="border-t border-slate-100">
                  <td className="text-slate-500 py-0.5">Applied load P:</td>
                  <td className="text-right font-mono text-red-600 font-bold">{kp.Vdown.toFixed(1)} kN ↓</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Equilibrium check with actual values */}
      <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 text-[9px]">
        <div className="font-bold text-slate-600 mb-1">Equilibrium Check:</div>
        {isSupport ? (
          <div className="space-y-0.5 text-slate-500">
            <div>
              ΣFx: H = T·cos(θ) → {kp.H.toFixed(1)} ≈ {(
                (isLeftSupport ? kp.tensionRight : kp.tensionLeft) * 
                Math.cos((isLeftSupport ? kp.angleRight : kp.angleLeft) * Math.PI / 180)
              ).toFixed(1)} kN 
              <span className="text-emerald-600 ml-1">✓</span>
            </div>
            <div>
              ΣFy: V = T·sin(θ) → {kp.Vup.toFixed(1)} ≈ {Math.abs(
                (isLeftSupport ? kp.tensionRight : kp.tensionLeft) * 
                Math.sin((isLeftSupport ? kp.angleRight : kp.angleLeft) * Math.PI / 180)
              ).toFixed(1)} kN
              <span className="text-emerald-600 ml-1">✓</span>
            </div>
          </div>
        ) : (
          <div className="space-y-0.5 text-slate-500">
            <div>
              ΣFx: T_L·cos(θ_L) = T_R·cos(θ_R) → {(kp.tensionLeft * Math.cos(kp.angleLeft * Math.PI / 180)).toFixed(1)} ≈ {(kp.tensionRight * Math.cos(kp.angleRight * Math.PI / 180)).toFixed(1)} kN
              <span className="text-emerald-600 ml-1">✓</span>
            </div>
            <div>
              ΣFy: T_L·sin|θ_L| + T_R·sin|θ_R| = P → {(
                Math.abs(kp.tensionLeft * Math.sin(kp.angleLeft * Math.PI / 180)) + 
                Math.abs(kp.tensionRight * Math.sin(kp.angleRight * Math.PI / 180))
              ).toFixed(1)} ≈ {kp.Vdown.toFixed(1)} kN
              <span className="text-emerald-600 ml-1">✓</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
