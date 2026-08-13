import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useProjectStore } from '../../store/useProjectStore';

interface TooltipInfo {
  x: number;
  y: number;
  tension: number;
  H: number;
  V: number;
  slope: number;
  screenX: number;
  screenY: number;
}

export const CableDiagram: React.FC = () => {
  const { project, solverResult, diagramOptions, movePointLoad, toggleDiagramOption } = useProjectStore();
  const { geometry, cable } = project;
  const activeLC = project.loadCases.find((l) => l.id === project.activeLoadCaseId);

  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [viewBox, setViewBox] = useState({ x: -20, y: -30, w: 160, h: 80 });

  const span = geometry.rightPylonX - geometry.leftPylonX;

  // Auto-fit viewbox
  useEffect(() => {
    const padding = 20;
    const minX = Math.min(geometry.leftPylonX, project.deadBlockA.x) - padding;
    const maxX = Math.max(geometry.rightPylonX, project.deadBlock.x) + padding;
    const anchorY = Math.max(geometry.leftPylonY, geometry.rightPylonY);
    const lowY = Math.min(
      0,
      Math.min(geometry.leftPylonY, geometry.rightPylonY) - geometry.sag,
      project.deadBlock.y - project.deadBlock.height,
      project.deadBlockA.y - project.deadBlockA.height
    );
    const minY = lowY - padding;
    const maxY = anchorY + padding;

    setViewBox({
      x: minX,
      y: -(maxY + 5),
      w: maxX - minX,
      h: maxY - minY + 10,
    });
  }, [geometry, project.deadBlock, project.deadBlockA]);

  // Cable profile path — ensure it connects exactly to anchor points
  const cablePath = useMemo(() => {
    if (!solverResult || solverResult.points.length < 2) return '';
    const pts = solverResult.points;
    
    // Start exactly at left anchor
    let d = `M ${geometry.leftPylonX} ${-geometry.leftPylonY}`;
    
    // Draw through all intermediate points
    for (let i = 1; i < pts.length - 1; i++) {
      d += ` L ${pts[i].x} ${-pts[i].y}`;
    }
    
    // End exactly at right anchor
    d += ` L ${geometry.rightPylonX} ${-geometry.rightPylonY}`;
    
    return d;
  }, [solverResult, geometry.leftPylonX, geometry.leftPylonY, geometry.rightPylonX, geometry.rightPylonY]);

  // Handle mouse move for tooltips and dragging
  const svgToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { wx: 0, wy: 0 };
      const rect = svg.getBoundingClientRect();
      const sx = (clientX - rect.left) / rect.width;
      const sy = (clientY - rect.top) / rect.height;
      return {
        wx: viewBox.x + sx * viewBox.w,
        wy: -(viewBox.y + sy * viewBox.h), // flip Y
      };
    },
    [viewBox]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const { wx } = svgToWorld(e.clientX, e.clientY);

      if (dragging) {
        movePointLoad(dragging, wx);
        return;
      }

      // Find nearest cable point for tooltip
      if (solverResult && solverResult.points.length > 0) {
        let nearest = solverResult.points[0];
        let minDist = Infinity;
        for (const pt of solverResult.points) {
          const dist = Math.abs(pt.x - wx);
          if (dist < minDist) {
            minDist = dist;
            nearest = pt;
          }
        }
        if (minDist < span * 0.05) {
          setTooltip({
            x: nearest.x,
            y: nearest.y,
            tension: nearest.T,
            H: nearest.H,
            V: nearest.V,
            slope: Math.atan(nearest.slope) * (180 / Math.PI),
            screenX: e.clientX,
            screenY: e.clientY,
          });
        } else {
          setTooltip(null);
        }
      }
    },
    [dragging, movePointLoad, solverResult, svgToWorld, span]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  return (
    <div className="relative h-full bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-2 left-2 z-10 flex gap-1 flex-wrap">
        {(['showGrid', 'showLabels', 'showForceArrows', 'showDimensions', 'showTension'] as const).map(
          (opt) => (
            <button
              key={opt}
              onClick={() => toggleDiagramOption(opt)}
              className={`px-2 py-0.5 text-[10px] rounded transition ${
                diagramOptions[opt]
                  ? 'bg-cyan-100 text-cyan-700 border border-cyan-300'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}
            >
              {opt.replace('show', '')}
            </button>
          )
        )}
      </div>

      {/* SVG */}
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setTooltip(null); setDragging(null); }}
      >
        {/* Grid */}
        {diagramOptions.showGrid && (
          <g opacity={0.15}>
            {Array.from({ length: Math.ceil(viewBox.w / 10) + 1 }, (_, i) => {
              const x = Math.floor(viewBox.x / 10) * 10 + i * 10;
              return (
                <line key={`gx${i}`} x1={x} y1={viewBox.y} x2={x} y2={viewBox.y + viewBox.h} stroke="#94a3b8" strokeWidth={0.2} />
              );
            })}
            {Array.from({ length: Math.ceil(viewBox.h / 10) + 1 }, (_, i) => {
              const y = Math.floor(viewBox.y / 10) * 10 + i * 10;
              return (
                <line key={`gy${i}`} x1={viewBox.x} y1={y} x2={viewBox.x + viewBox.w} y2={y} stroke="#94a3b8" strokeWidth={0.2} />
              );
            })}
          </g>
        )}

        {/* Ground line */}
        <line
          x1={viewBox.x}
          y1={0}
          x2={viewBox.x + viewBox.w}
          y2={0}
          stroke="#64748b"
          strokeWidth={0.3}
          strokeDasharray="2 1"
        />

        {/* Left side: Pylon or Direct Anchor */}
        {geometry.leftAnchorType === 'pylon' ? (
          <g>
            {/* Pylon structure */}
            <rect
              x={geometry.leftPylonX - 1.5}
              y={-geometry.leftPylonY}
              width={3}
              height={geometry.leftPylonY}
              fill="#475569"
              stroke="#1e293b"
              strokeWidth={0.3}
              rx={0.3}
            />
            <line x1={geometry.leftPylonX - 3} y1={0} x2={geometry.leftPylonX + 3} y2={0} stroke="#1e293b" strokeWidth={0.5} />
            {/* Pulley circle */}
            <circle
              cx={geometry.leftPylonX}
              cy={-geometry.leftPylonY}
              r={1.5}
              fill="#f1f5f9"
              stroke="#0891b2"
              strokeWidth={0.4}
            />
            {diagramOptions.showLabels && (
              <text x={geometry.leftPylonX} y={3} textAnchor="middle" fontSize={2.5} fill="#475569" fontWeight="bold">
                PYLON A
              </text>
            )}
          </g>
        ) : (
          <g>
            {/* Direct anchor: cable fixed point indicator */}
            <circle
              cx={geometry.leftPylonX}
              cy={-geometry.leftPylonY}
              r={2}
              fill="#92400e"
              stroke="#78350f"
              strokeWidth={0.4}
            />
            <line
              x1={geometry.leftPylonX - 2}
              y1={-geometry.leftPylonY}
              x2={geometry.leftPylonX + 2}
              y2={-geometry.leftPylonY}
              stroke="#78350f"
              strokeWidth={0.5}
            />
            <line
              x1={geometry.leftPylonX}
              y1={-geometry.leftPylonY - 2}
              x2={geometry.leftPylonX}
              y2={-geometry.leftPylonY + 2}
              stroke="#78350f"
              strokeWidth={0.5}
            />
            {diagramOptions.showLabels && (
              <text x={geometry.leftPylonX} y={-geometry.leftPylonY + 5} textAnchor="middle" fontSize={2} fill="#92400e" fontWeight="bold">
                ANCHOR A (DIRECT)
              </text>
            )}
          </g>
        )}

        {/* Right side: Pylon or Direct Anchor */}
        {geometry.rightAnchorType === 'pylon' ? (
          <g>
            {/* Pylon structure */}
            <rect
              x={geometry.rightPylonX - 1.5}
              y={-geometry.rightPylonY}
              width={3}
              height={geometry.rightPylonY}
              fill="#475569"
              stroke="#1e293b"
              strokeWidth={0.3}
              rx={0.3}
            />
            <line x1={geometry.rightPylonX - 3} y1={0} x2={geometry.rightPylonX + 3} y2={0} stroke="#1e293b" strokeWidth={0.5} />
            {/* Pulley circle */}
            <circle
              cx={geometry.rightPylonX}
              cy={-geometry.rightPylonY}
              r={1.5}
              fill="#f1f5f9"
              stroke="#0891b2"
              strokeWidth={0.4}
            />
            {diagramOptions.showLabels && (
              <text x={geometry.rightPylonX} y={3} textAnchor="middle" fontSize={2.5} fill="#475569" fontWeight="bold">
                PYLON B
              </text>
            )}
          </g>
        ) : (
          <g>
            {/* Direct anchor: cable fixed point indicator */}
            <circle
              cx={geometry.rightPylonX}
              cy={-geometry.rightPylonY}
              r={2}
              fill="#92400e"
              stroke="#78350f"
              strokeWidth={0.4}
            />
            <line
              x1={geometry.rightPylonX - 2}
              y1={-geometry.rightPylonY}
              x2={geometry.rightPylonX + 2}
              y2={-geometry.rightPylonY}
              stroke="#78350f"
              strokeWidth={0.5}
            />
            <line
              x1={geometry.rightPylonX}
              y1={-geometry.rightPylonY - 2}
              x2={geometry.rightPylonX}
              y2={-geometry.rightPylonY + 2}
              stroke="#78350f"
              strokeWidth={0.5}
            />
            {diagramOptions.showLabels && (
              <text x={geometry.rightPylonX} y={-geometry.rightPylonY + 5} textAnchor="middle" fontSize={2} fill="#92400e" fontWeight="bold">
                ANCHOR B (DIRECT)
              </text>
            )}
          </g>
        )}

        {/* Cable */}
        {cablePath && (
          <path
            d={cablePath}
            fill="none"
            stroke="#0891b2"
            strokeWidth={0.8}
            strokeLinejoin="round"
          />
        )}

        {/* Left backstay: from pylon A top down to dead block A (only if pylon mode) */}
        {geometry.leftAnchorType === 'pylon' && (
          <line
            x1={geometry.leftPylonX}
            y1={-geometry.leftPylonY}
            x2={project.deadBlockA.x}
            y2={-project.deadBlockA.y}
            stroke="#0891b2"
            strokeWidth={0.6}
            strokeDasharray="1.5 0.8"
          />
        )}

        {/* Right backstay: from pylon B top down to dead block B (only if pylon mode) */}
        {geometry.rightAnchorType === 'pylon' && (
          <line
            x1={geometry.rightPylonX}
            y1={-geometry.rightPylonY}
            x2={project.deadBlock.x}
            y2={-project.deadBlock.y}
            stroke="#0891b2"
            strokeWidth={0.6}
            strokeDasharray="1.5 0.8"
          />
        )}

        {/* Dead Block A (left anchor) — only show if pylon mode (backstay goes to block) */}
        {geometry.leftAnchorType === 'pylon' && (
          <g>
            <rect
              x={project.deadBlockA.x - project.deadBlockA.width / 2}
              y={-project.deadBlockA.y - project.deadBlockA.height}
              width={project.deadBlockA.width}
              height={project.deadBlockA.height}
              fill="#92400e"
              stroke="#78350f"
              strokeWidth={0.3}
              rx={0.2}
            />
            <line
              x1={project.deadBlockA.x - project.deadBlockA.width / 2}
              y1={-project.deadBlockA.y}
              x2={project.deadBlockA.x + project.deadBlockA.width / 2}
              y2={-project.deadBlockA.y - project.deadBlockA.height}
              stroke="#78350f"
              strokeWidth={0.15}
              opacity={0.5}
            />
            {diagramOptions.showLabels && (
              <text
                x={project.deadBlockA.x}
                y={-project.deadBlockA.y + 3}
                textAnchor="middle"
                fontSize={2}
                fill="#92400e"
                fontWeight="bold"
              >
                DEAD BLOCK A
              </text>
            )}
          </g>
        )}

        {/* Dead Block B (right anchor) — only show if pylon mode (backstay goes to block) */}
        {geometry.rightAnchorType === 'pylon' && (
          <g>
            <rect
              x={project.deadBlock.x - project.deadBlock.width / 2}
              y={-project.deadBlock.y - project.deadBlock.height}
              width={project.deadBlock.width}
              height={project.deadBlock.height}
              fill="#92400e"
              stroke="#78350f"
              strokeWidth={0.3}
              rx={0.2}
            />
            {/* Cross hatch pattern on dead block */}
            <line
              x1={project.deadBlock.x - project.deadBlock.width / 2}
              y1={-project.deadBlock.y}
              x2={project.deadBlock.x + project.deadBlock.width / 2}
              y2={-project.deadBlock.y - project.deadBlock.height}
              stroke="#78350f"
              strokeWidth={0.15}
              opacity={0.5}
            />
            {diagramOptions.showLabels && (
              <text
                x={project.deadBlock.x}
                y={-project.deadBlock.y + 3}
                textAnchor="middle"
                fontSize={2}
                fill="#92400e"
                fontWeight="bold"
              >
                DEAD BLOCK B
              </text>
            )}
          </g>
        )}

        {/* Point Loads */}
        {activeLC?.pointLoads.map((pl) => {
          // Find cable y at load position
          let loadY = 0;
          if (solverResult) {
            const pts = solverResult.points;
            for (let i = 0; i < pts.length - 1; i++) {
              if (pts[i].x <= pl.x && pts[i + 1].x >= pl.x) {
                const t = (pl.x - pts[i].x) / (pts[i + 1].x - pts[i].x);
                loadY = pts[i].y + t * (pts[i + 1].y - pts[i].y);
                break;
              }
            }
          }

          return (
            <g
              key={pl.id}
              className="cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => {
                e.preventDefault();
                setDragging(pl.id);
              }}
            >
              {/* Load arrow */}
              {diagramOptions.showForceArrows && (
                <>
                  <line
                    x1={pl.x}
                    y1={-loadY - 12}
                    x2={pl.x}
                    y2={-loadY}
                    stroke="#dc2626"
                    strokeWidth={0.6}
                    markerEnd="url(#arrowRed)"
                  />
                  <polygon
                    points={`${pl.x},${-loadY} ${pl.x - 1},${-loadY - 2.5} ${pl.x + 1},${-loadY - 2.5}`}
                    fill="#dc2626"
                  />
                </>
              )}
              {/* Load label */}
              {diagramOptions.showLabels && (
                <text
                  x={pl.x}
                  y={-loadY - 13}
                  textAnchor="middle"
                  fontSize={2.5}
                  fill="#dc2626"
                  fontWeight="bold"
                >
                  {pl.magnitude} kN
                </text>
              )}
              {/* Draggable node */}
              <circle cx={pl.x} cy={-loadY} r={1.2} fill="#dc2626" stroke="#991b1b" strokeWidth={0.3} />
            </g>
          );
        })}

        {/* Dimension lines */}
        {diagramOptions.showDimensions && solverResult && (
          <g>
            {/* Span dimension */}
            <line
              x1={geometry.leftPylonX}
              y1={6}
              x2={geometry.rightPylonX}
              y2={6}
              stroke="#64748b"
              strokeWidth={0.2}
            />
            <line x1={geometry.leftPylonX} y1={5} x2={geometry.leftPylonX} y2={7} stroke="#64748b" strokeWidth={0.2} />
            <line x1={geometry.rightPylonX} y1={5} x2={geometry.rightPylonX} y2={7} stroke="#64748b" strokeWidth={0.2} />
            <text x={span / 2 + geometry.leftPylonX} y={9} textAnchor="middle" fontSize={2.2} fill="#64748b">
              L = {span.toFixed(1)} m
            </text>

            {/* Sag dimension */}
            {(() => {
              const midX = geometry.leftPylonX + span / 2;
              const chordY = (geometry.leftPylonY + geometry.rightPylonY) / 2;
              const sagY = chordY - geometry.sag;
              return (
                <>
                  <line
                    x1={midX + 2}
                    y1={-chordY}
                    x2={midX + 2}
                    y2={-sagY}
                    stroke="#0891b2"
                    strokeWidth={0.2}
                    strokeDasharray="0.5 0.3"
                  />
                  <text x={midX + 4} y={(-chordY - sagY) / 2 + 0.8} fontSize={2} fill="#0891b2">
                    f = {geometry.sag.toFixed(2)} m
                  </text>
                </>
              );
            })()}
          </g>
        )}

        {/* Tension labels on cable */}
        {diagramOptions.showTension && solverResult && (
          <g>
            {[0, Math.floor(solverResult.points.length / 4), Math.floor(solverResult.points.length / 2), Math.floor(3 * solverResult.points.length / 4), solverResult.points.length - 1].map(
              (idx) => {
                const pt = solverResult.points[idx];
                if (!pt) return null;
                return (
                  <text
                    key={idx}
                    x={pt.x}
                    y={-pt.y - 2.5}
                    textAnchor="middle"
                    fontSize={1.8}
                    fill="#059669"
                    fontWeight="bold"
                  >
                    {pt.T.toFixed(0)} kN
                  </text>
                );
              }
            )}
          </g>
        )}

        {/* Self-weight arrows */}
        {project.settings.includeSelfWeight && cable.unitWeight > 0 && diagramOptions.showForceArrows && (
          <g opacity={0.3}>
            {Array.from({ length: 10 }, (_, i) => {
              const x = geometry.leftPylonX + ((i + 0.5) * span) / 10;
              let y = 0;
              if (solverResult) {
                for (const pt of solverResult.points) {
                  if (Math.abs(pt.x - x) < span / 20) {
                    y = pt.y;
                    break;
                  }
                }
              }
              return (
                <line
                  key={i}
                  x1={x}
                  y1={-y}
                  x2={x}
                  y2={-y + 3}
                  stroke="#f59e0b"
                  strokeWidth={0.3}
                />
              );
            })}
          </g>
        )}

        {/* Reaction arrows at supports */}
        {diagramOptions.showForceArrows && solverResult && (
          <g>
            {/* Left vertical reaction (Pylon A) */}
            <line
              x1={geometry.leftPylonX - 3}
              y1={-geometry.leftPylonY}
              x2={geometry.leftPylonX - 3}
              y2={-geometry.leftPylonY - 6}
              stroke="#16a34a"
              strokeWidth={0.5}
            />
            <polygon
              points={`${geometry.leftPylonX - 3},${-geometry.leftPylonY - 6} ${geometry.leftPylonX - 3.8},${-geometry.leftPylonY - 4} ${geometry.leftPylonX - 2.2},${-geometry.leftPylonY - 4}`}
              fill="#16a34a"
            />
            {diagramOptions.showLabels && (
              <text
                x={geometry.leftPylonX - 5}
                y={-geometry.leftPylonY - 3}
                fontSize={1.8}
                fill="#16a34a"
                textAnchor="end"
              >
                V_A={solverResult.leftReaction.V.toFixed(0)} kN
              </text>
            )}

            {/* Right vertical reaction (Pylon B) */}
            <line
              x1={geometry.rightPylonX + 3}
              y1={-geometry.rightPylonY}
              x2={geometry.rightPylonX + 3}
              y2={-geometry.rightPylonY - 6}
              stroke="#16a34a"
              strokeWidth={0.5}
            />
            <polygon
              points={`${geometry.rightPylonX + 3},${-geometry.rightPylonY - 6} ${geometry.rightPylonX + 2.2},${-geometry.rightPylonY - 4} ${geometry.rightPylonX + 3.8},${-geometry.rightPylonY - 4}`}
              fill="#16a34a"
            />
            {diagramOptions.showLabels && (
              <text
                x={geometry.rightPylonX + 5}
                y={-geometry.rightPylonY - 3}
                fontSize={1.8}
                fill="#16a34a"
                textAnchor="start"
              >
                V_B={solverResult.rightReaction.V.toFixed(0)} kN
              </text>
            )}

            {/* Horizontal reaction arrows (H is constant) */}
            {/* Left H arrow */}
            <line
              x1={geometry.leftPylonX}
              y1={-geometry.leftPylonY + 3}
              x2={geometry.leftPylonX + 5}
              y2={-geometry.leftPylonY + 3}
              stroke="#0891b2"
              strokeWidth={0.4}
            />
            <polygon
              points={`${geometry.leftPylonX + 5},${-geometry.leftPylonY + 3} ${geometry.leftPylonX + 3.5},${-geometry.leftPylonY + 2.3} ${geometry.leftPylonX + 3.5},${-geometry.leftPylonY + 3.7}`}
              fill="#0891b2"
            />
            {diagramOptions.showLabels && (
              <text
                x={geometry.leftPylonX + 6}
                y={-geometry.leftPylonY + 3.5}
                fontSize={1.6}
                fill="#0891b2"
                textAnchor="start"
              >
                H={solverResult.horizontalTension.toFixed(0)} kN
              </text>
            )}

            {/* Right H arrow */}
            <line
              x1={geometry.rightPylonX}
              y1={-geometry.rightPylonY + 3}
              x2={geometry.rightPylonX - 5}
              y2={-geometry.rightPylonY + 3}
              stroke="#0891b2"
              strokeWidth={0.4}
            />
            <polygon
              points={`${geometry.rightPylonX - 5},${-geometry.rightPylonY + 3} ${geometry.rightPylonX - 3.5},${-geometry.rightPylonY + 2.3} ${geometry.rightPylonX - 3.5},${-geometry.rightPylonY + 3.7}`}
              fill="#0891b2"
            />
          </g>
        )}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute bg-slate-800 text-white text-[11px] rounded-lg shadow-xl px-3 py-2 pointer-events-none z-20 min-w-[160px]"
          style={{
            left: Math.min(tooltip.screenX - (svgRef.current?.getBoundingClientRect().left ?? 0) + 15, (svgRef.current?.getBoundingClientRect().width ?? 300) - 180),
            top: tooltip.screenY - (svgRef.current?.getBoundingClientRect().top ?? 0) - 20,
          }}
        >
          <div className="font-bold text-cyan-300 mb-1">Cable Point</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            <span className="text-slate-400">X:</span>
            <span className="font-mono">{tooltip.x.toFixed(2)} m</span>
            <span className="text-slate-400">Y:</span>
            <span className="font-mono">{tooltip.y.toFixed(2)} m</span>
            <span className="text-slate-400">Tension:</span>
            <span className="font-mono text-yellow-300">{tooltip.tension.toFixed(1)} kN</span>
            <span className="text-slate-400">H:</span>
            <span className="font-mono">{tooltip.H.toFixed(1)} kN</span>
            <span className="text-slate-400">V:</span>
            <span className="font-mono">{tooltip.V.toFixed(1)} kN</span>
            <span className="text-slate-400">Slope:</span>
            <span className="font-mono">{tooltip.slope.toFixed(1)}°</span>
          </div>
        </div>
      )}
    </div>
  );
};
