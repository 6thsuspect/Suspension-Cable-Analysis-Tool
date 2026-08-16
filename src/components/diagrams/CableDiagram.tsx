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

// Viewbox state for pan/zoom
interface ViewState {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const CableDiagram: React.FC = () => {
  const { project, solverResult, diagramOptions, labelStyle, movePointLoad, toggleDiagramOption, updateLabelStyle } = useProjectStore();
  const { geometry, cable } = project;
  const activeLC = project.loadCases.find((l) => l.id === project.activeLoadCaseId);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [draggingLoad, setDraggingLoad] = useState<string | null>(null);
  const [showLabelSettings, setShowLabelSettings] = useState(false);

  // --- Pan / Zoom state ---
  const [view, setView] = useState<ViewState>({ x: -20, y: -30, w: 160, h: 80 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ cx: number; cy: number; vx: number; vy: number }>({ cx: 0, cy: 0, vx: 0, vy: 0 });
  const fitView = useRef<ViewState>({ x: -20, y: -30, w: 160, h: 80 }); // cached auto-fit

  const span = geometry.rightPylonX - geometry.leftPylonX;

  // =====================================================================
  // Calculate the "fit" viewbox from geometry (used for auto-fit / reset)
  // =====================================================================
  const calcFitView = useCallback((): ViewState => {
    const padding = 20;
    const minX = Math.min(
      geometry.leftPylonX,
      geometry.leftAnchorType === 'pylon' ? project.deadBlockA.x : geometry.leftPylonX
    ) - padding;
    const maxX = Math.max(
      geometry.rightPylonX,
      geometry.rightAnchorType === 'pylon' ? project.deadBlock.x : geometry.rightPylonX
    ) + padding;
    const anchorY = Math.max(geometry.leftPylonY, geometry.rightPylonY);
    const lowY = Math.min(
      0,
      Math.min(geometry.leftPylonY, geometry.rightPylonY) - geometry.sag,
      geometry.leftAnchorType === 'pylon' ? project.deadBlockA.y - project.deadBlockA.height : 0,
      geometry.rightAnchorType === 'pylon' ? project.deadBlock.y - project.deadBlock.height : 0
    );
    return {
      x: minX,
      y: -(anchorY + padding + 5),
      w: maxX - minX,
      h: anchorY - lowY + 2 * padding + 10,
    };
  }, [geometry, project.deadBlock, project.deadBlockA]);

  // Auto-fit on geometry change
  useEffect(() => {
    const fv = calcFitView();
    fitView.current = fv;
    setView(fv);
  }, [calcFitView]);

  // =====================================================================
  // Cable profile path
  // =====================================================================
  const cablePath = useMemo(() => {
    if (!solverResult || solverResult.points.length < 2) return '';
    const pts = solverResult.points;
    let d = `M ${geometry.leftPylonX} ${-geometry.leftPylonY}`;
    for (let i = 1; i < pts.length - 1; i++) {
      d += ` L ${pts[i].x} ${-pts[i].y}`;
    }
    d += ` L ${geometry.rightPylonX} ${-geometry.rightPylonY}`;
    return d;
  }, [solverResult, geometry.leftPylonX, geometry.leftPylonY, geometry.rightPylonX, geometry.rightPylonY]);

  // =====================================================================
  // Coordinate helpers
  // =====================================================================
  const svgToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { wx: 0, wy: 0 };
      const rect = svg.getBoundingClientRect();
      const sx = (clientX - rect.left) / rect.width;
      const sy = (clientY - rect.top) / rect.height;
      return {
        wx: view.x + sx * view.w,
        wy: -(view.y + sy * view.h),
      };
    },
    [view]
  );

  // =====================================================================
  // Zoom helpers
  // =====================================================================
  const zoomBy = useCallback(
    (factor: number, centerClientX?: number, centerClientY?: number) => {
      setView((prev) => {
        const newW = prev.w * factor;
        const newH = prev.h * factor;
        // Zoom toward cursor or center
        let anchorX = 0.5;
        let anchorY = 0.5;
        if (centerClientX !== undefined && centerClientY !== undefined && svgRef.current) {
          const rect = svgRef.current.getBoundingClientRect();
          anchorX = (centerClientX - rect.left) / rect.width;
          anchorY = (centerClientY - rect.top) / rect.height;
        }
        return {
          x: prev.x + (prev.w - newW) * anchorX,
          y: prev.y + (prev.h - newH) * anchorY,
          w: newW,
          h: newH,
        };
      });
    },
    []
  );

  const handleFitView = useCallback(() => {
    const fv = calcFitView();
    fitView.current = fv;
    setView(fv);
  }, [calcFitView]);

  // =====================================================================
  // Mouse wheel → zoom
  // =====================================================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.12 : 1 / 1.12;
      zoomBy(factor, e.clientX, e.clientY);
    };
    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [zoomBy]);

  // =====================================================================
  // Mouse events: pan canvas + drag loads + tooltip
  // =====================================================================
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // If a load is being grabbed, don't start panning
      if (draggingLoad) return;
      // Left button only
      if (e.button !== 0) return;
      setIsPanning(true);
      panStart.current = { cx: e.clientX, cy: e.clientY, vx: view.x, vy: view.y };
    },
    [draggingLoad, view.x, view.y]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const { wx } = svgToWorld(e.clientX, e.clientY);

      // --- Dragging a load ---
      if (draggingLoad) {
        movePointLoad(draggingLoad, wx);
        return;
      }

      // --- Panning the canvas ---
      if (isPanning) {
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const dxScreen = e.clientX - panStart.current.cx;
        const dyScreen = e.clientY - panStart.current.cy;
        const dxWorld = (dxScreen / rect.width) * view.w;
        const dyWorld = (dyScreen / rect.height) * view.h;
        setView((prev) => ({
          ...prev,
          x: panStart.current.vx - dxWorld,
          y: panStart.current.vy - dyWorld,
        }));
        setTooltip(null);
        return;
      }

      // --- Tooltip ---
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
    [draggingLoad, isPanning, movePointLoad, solverResult, svgToWorld, span, view.w, view.h]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingLoad(null);
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
    setDraggingLoad(null);
    setIsPanning(false);
  }, []);

  // =====================================================================
  // Render
  // =====================================================================
  return (
    <div ref={containerRef} className="relative h-full bg-white rounded-lg border border-slate-200 overflow-hidden select-none">
      {/* ====== Toolbar ====== */}
      <div className="absolute top-2 left-2 z-10 flex gap-1 flex-wrap">
        {/* Toggle buttons */}
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

      {/* ====== Zoom / Pan buttons (top-right) ====== */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        <button
          onClick={() => zoomBy(1 / 1.3)}
          className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-50 text-slate-600 text-lg font-bold leading-none transition"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => zoomBy(1.3)}
          className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-50 text-slate-600 text-lg font-bold leading-none transition"
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={handleFitView}
          className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-50 text-[9px] text-slate-600 font-bold leading-tight transition"
          title="Fit View"
        >
          FIT
        </button>
        <button
          onClick={() => setShowLabelSettings((v) => !v)}
          className={`w-8 h-8 flex items-center justify-center border rounded shadow-sm text-[9px] font-bold leading-tight transition ${
            showLabelSettings
              ? 'bg-cyan-50 border-cyan-400 text-cyan-700'
              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
          }`}
          title="Label Settings"
        >
          Aa
        </button>
      </div>

      {/* ====== Label Settings Panel ====== */}
      {showLabelSettings && (
        <div className="absolute top-2 right-12 z-20 bg-white border border-slate-300 rounded-lg shadow-lg p-3 w-56" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-700">Label Settings</span>
            <button onClick={() => setShowLabelSettings(false)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
          </div>
          {/* Colors */}
          <div className="space-y-1.5 mb-2">
            <LabelColorRow label="Cable" value={labelStyle.cableColor} onChange={(v) => updateLabelStyle({ cableColor: v })} />
            <LabelColorRow label="Pylon" value={labelStyle.pylonColor} onChange={(v) => updateLabelStyle({ pylonColor: v })} />
            <LabelColorRow label="Load" value={labelStyle.loadColor} onChange={(v) => updateLabelStyle({ loadColor: v })} />
            <LabelColorRow label="Reaction" value={labelStyle.reactionColor} onChange={(v) => updateLabelStyle({ reactionColor: v })} />
            <LabelColorRow label="Angle" value={labelStyle.angleColor} onChange={(v) => updateLabelStyle({ angleColor: v })} />
            <LabelColorRow label="Dimension" value={labelStyle.dimColor} onChange={(v) => updateLabelStyle({ dimColor: v })} />
          </div>
          <div className="border-t border-slate-100 pt-2 space-y-1.5">
            <LabelSliderRow label="Cable Width" value={labelStyle.cableWidth} min={0.2} max={3} step={0.1} onChange={(v) => updateLabelStyle({ cableWidth: v })} />
            <LabelSliderRow label="Pylon Width" value={labelStyle.pylonWidth} min={1} max={8} step={0.5} onChange={(v) => updateLabelStyle({ pylonWidth: v })} />
            <LabelSliderRow label="Font Size" value={labelStyle.fontSize} min={1} max={4} step={0.2} onChange={(v) => updateLabelStyle({ fontSize: v })} />
            <LabelSliderRow label="Label Offset" value={labelStyle.labelOffset} min={1} max={10} step={0.5} onChange={(v) => updateLabelStyle({ labelOffset: v })} />
          </div>
        </div>
      )}

      {/* ====== Pan/Zoom status (bottom-left) ====== */}
      <div className="absolute bottom-1.5 left-2 z-10 text-[9px] text-slate-400 pointer-events-none">
        Scroll to zoom · Drag to pan
      </div>

      {/* ====== SVG ====== */}
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        className={`w-full h-full ${isPanning ? 'cursor-grabbing' : draggingLoad ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Grid */}
        {diagramOptions.showGrid && (
          <g opacity={0.15}>
            {Array.from({ length: Math.ceil(view.w / 10) + 2 }, (_, i) => {
              const x = Math.floor(view.x / 10) * 10 + i * 10;
              return (
                <line key={`gx${i}`} x1={x} y1={view.y} x2={x} y2={view.y + view.h} stroke="#94a3b8" strokeWidth={0.2} />
              );
            })}
            {Array.from({ length: Math.ceil(view.h / 10) + 2 }, (_, i) => {
              const y = Math.floor(view.y / 10) * 10 + i * 10;
              return (
                <line key={`gy${i}`} x1={view.x} y1={y} x2={view.x + view.w} y2={y} stroke="#94a3b8" strokeWidth={0.2} />
              );
            })}
          </g>
        )}

        {/* Ground line */}
        <line
          x1={view.x}
          y1={0}
          x2={view.x + view.w}
          y2={0}
          stroke="#64748b"
          strokeWidth={0.3}
          strokeDasharray="2 1"
        />

        {/* ====== Left side: Pylon or Direct Anchor ====== */}
        {geometry.leftAnchorType === 'pylon' ? (
          <g>
            <rect
              x={geometry.leftPylonX - labelStyle.pylonWidth / 2}
              y={-geometry.leftPylonY}
              width={labelStyle.pylonWidth}
              height={geometry.leftPylonY}
              fill={labelStyle.pylonColor}
              stroke="#1e293b"
              strokeWidth={0.3}
              rx={0.3}
            />
            <line x1={geometry.leftPylonX - 3} y1={0} x2={geometry.leftPylonX + 3} y2={0} stroke="#1e293b" strokeWidth={0.5} />
            <circle cx={geometry.leftPylonX} cy={-geometry.leftPylonY} r={1.5} fill="#f1f5f9" stroke="#0891b2" strokeWidth={0.4} />
            {diagramOptions.showLabels && (
              <text x={geometry.leftPylonX} y={3} textAnchor="middle" fontSize={2.5} fill="#475569" fontWeight="bold">PYLON A</text>
            )}
          </g>
        ) : (
          <g>
            <circle cx={geometry.leftPylonX} cy={-geometry.leftPylonY} r={2} fill="#92400e" stroke="#78350f" strokeWidth={0.4} />
            <line x1={geometry.leftPylonX - 2} y1={-geometry.leftPylonY} x2={geometry.leftPylonX + 2} y2={-geometry.leftPylonY} stroke="#78350f" strokeWidth={0.5} />
            <line x1={geometry.leftPylonX} y1={-geometry.leftPylonY - 2} x2={geometry.leftPylonX} y2={-geometry.leftPylonY + 2} stroke="#78350f" strokeWidth={0.5} />
            {diagramOptions.showLabels && (
              <text x={geometry.leftPylonX} y={-geometry.leftPylonY + 5} textAnchor="middle" fontSize={2} fill="#92400e" fontWeight="bold">ANCHOR A (DIRECT)</text>
            )}
          </g>
        )}

        {/* ====== Right side: Pylon or Direct Anchor ====== */}
        {geometry.rightAnchorType === 'pylon' ? (
          <g>
            <rect
              x={geometry.rightPylonX - labelStyle.pylonWidth / 2}
              y={-geometry.rightPylonY}
              width={labelStyle.pylonWidth}
              height={geometry.rightPylonY}
              fill={labelStyle.pylonColor}
              stroke="#1e293b"
              strokeWidth={0.3}
              rx={0.3}
            />
            <line x1={geometry.rightPylonX - 3} y1={0} x2={geometry.rightPylonX + 3} y2={0} stroke="#1e293b" strokeWidth={0.5} />
            <circle cx={geometry.rightPylonX} cy={-geometry.rightPylonY} r={1.5} fill="#f1f5f9" stroke="#0891b2" strokeWidth={0.4} />
            {diagramOptions.showLabels && (
              <text x={geometry.rightPylonX} y={3} textAnchor="middle" fontSize={2.5} fill="#475569" fontWeight="bold">PYLON B</text>
            )}
          </g>
        ) : (
          <g>
            <circle cx={geometry.rightPylonX} cy={-geometry.rightPylonY} r={2} fill="#92400e" stroke="#78350f" strokeWidth={0.4} />
            <line x1={geometry.rightPylonX - 2} y1={-geometry.rightPylonY} x2={geometry.rightPylonX + 2} y2={-geometry.rightPylonY} stroke="#78350f" strokeWidth={0.5} />
            <line x1={geometry.rightPylonX} y1={-geometry.rightPylonY - 2} x2={geometry.rightPylonX} y2={-geometry.rightPylonY + 2} stroke="#78350f" strokeWidth={0.5} />
            {diagramOptions.showLabels && (
              <text x={geometry.rightPylonX} y={-geometry.rightPylonY + 5} textAnchor="middle" fontSize={2} fill="#92400e" fontWeight="bold">ANCHOR B (DIRECT)</text>
            )}
          </g>
        )}

        {/* ====== Cable ====== */}
        {cablePath && (
          <path d={cablePath} fill="none" stroke={labelStyle.cableColor} strokeWidth={labelStyle.cableWidth} strokeLinejoin="round" />
        )}

        {/* ====== Backstays with angle annotations ====== */}
        {geometry.leftAnchorType === 'pylon' && (() => {
          const dropA = geometry.leftPylonY - project.deadBlockA.y;
          const reachA = Math.abs(project.deadBlockA.x - geometry.leftPylonX);
          const angleDegA = (Math.atan2(dropA, reachA) * 180) / Math.PI;
          const midXa = (geometry.leftPylonX + project.deadBlockA.x) / 2;
          const midYa = (geometry.leftPylonY + project.deadBlockA.y) / 2;
          return (
            <g>
              <line x1={geometry.leftPylonX} y1={-geometry.leftPylonY} x2={project.deadBlockA.x} y2={-project.deadBlockA.y} stroke={labelStyle.cableColor} strokeWidth={0.6} strokeDasharray="1.5 0.8" />
              {diagramOptions.showLabels && (
                <>
                  {/* Horizontal reference at pylon top */}
                  <line x1={geometry.leftPylonX} y1={-geometry.leftPylonY} x2={geometry.leftPylonX - 12} y2={-geometry.leftPylonY} stroke={labelStyle.angleColor} strokeWidth={0.2} strokeDasharray="1 0.6" opacity={0.6} />
                  <text x={midXa} y={-midYa - 2} fontSize={labelStyle.fontSize * 0.8} fill={labelStyle.angleColor} textAnchor="middle" fontWeight="bold">
                    {angleDegA.toFixed(1)}°
                  </text>
                </>
              )}
            </g>
          );
        })()}
        {geometry.rightAnchorType === 'pylon' && (() => {
          const dropB = geometry.rightPylonY - project.deadBlock.y;
          const reachB = Math.abs(project.deadBlock.x - geometry.rightPylonX);
          const angleDegB = (Math.atan2(dropB, reachB) * 180) / Math.PI;
          const midXb = (geometry.rightPylonX + project.deadBlock.x) / 2;
          const midYb = (geometry.rightPylonY + project.deadBlock.y) / 2;
          return (
            <g>
              <line x1={geometry.rightPylonX} y1={-geometry.rightPylonY} x2={project.deadBlock.x} y2={-project.deadBlock.y} stroke={labelStyle.cableColor} strokeWidth={0.6} strokeDasharray="1.5 0.8" />
              {diagramOptions.showLabels && (
                <>
                  {/* Horizontal reference at pylon top */}
                  <line x1={geometry.rightPylonX} y1={-geometry.rightPylonY} x2={geometry.rightPylonX + 12} y2={-geometry.rightPylonY} stroke={labelStyle.angleColor} strokeWidth={0.2} strokeDasharray="1 0.6" opacity={0.6} />
                  <text x={midXb} y={-midYb - 2} fontSize={labelStyle.fontSize * 0.8} fill={labelStyle.angleColor} textAnchor="middle" fontWeight="bold">
                    {angleDegB.toFixed(1)}°
                  </text>
                </>
              )}
            </g>
          );
        })()}

        {/* ====== Dead Blocks ====== */}
        {geometry.leftAnchorType === 'pylon' && (
          <g>
            <rect x={project.deadBlockA.x - project.deadBlockA.width / 2} y={-project.deadBlockA.y - project.deadBlockA.height} width={project.deadBlockA.width} height={project.deadBlockA.height} fill="#92400e" stroke="#78350f" strokeWidth={0.3} rx={0.2} />
            <line x1={project.deadBlockA.x - project.deadBlockA.width / 2} y1={-project.deadBlockA.y} x2={project.deadBlockA.x + project.deadBlockA.width / 2} y2={-project.deadBlockA.y - project.deadBlockA.height} stroke="#78350f" strokeWidth={0.15} opacity={0.5} />
            {diagramOptions.showLabels && (
              <text x={project.deadBlockA.x} y={-project.deadBlockA.y + 3} textAnchor="middle" fontSize={2} fill="#92400e" fontWeight="bold">DEAD BLOCK A</text>
            )}
          </g>
        )}
        {geometry.rightAnchorType === 'pylon' && (
          <g>
            <rect x={project.deadBlock.x - project.deadBlock.width / 2} y={-project.deadBlock.y - project.deadBlock.height} width={project.deadBlock.width} height={project.deadBlock.height} fill="#92400e" stroke="#78350f" strokeWidth={0.3} rx={0.2} />
            <line x1={project.deadBlock.x - project.deadBlock.width / 2} y1={-project.deadBlock.y} x2={project.deadBlock.x + project.deadBlock.width / 2} y2={-project.deadBlock.y - project.deadBlock.height} stroke="#78350f" strokeWidth={0.15} opacity={0.5} />
            {diagramOptions.showLabels && (
              <text x={project.deadBlock.x} y={-project.deadBlock.y + 3} textAnchor="middle" fontSize={2} fill="#92400e" fontWeight="bold">DEAD BLOCK B</text>
            )}
          </g>
        )}

        {/* ====== Point Loads ====== */}
        {activeLC?.pointLoads.map((pl) => {
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
                e.stopPropagation(); // don't start panning
                setDraggingLoad(pl.id);
              }}
            >
              {diagramOptions.showForceArrows && (
                <>
                  <line x1={pl.x} y1={-loadY - 12} x2={pl.x} y2={-loadY} stroke={labelStyle.loadColor} strokeWidth={0.6} />
                  <polygon points={`${pl.x},${-loadY} ${pl.x - 1},${-loadY - 2.5} ${pl.x + 1},${-loadY - 2.5}`} fill={labelStyle.loadColor} />
                </>
              )}
              {diagramOptions.showLabels && (
                <text x={pl.x} y={-loadY - 13} textAnchor="middle" fontSize={labelStyle.fontSize * 1.2} fill={labelStyle.loadColor} fontWeight="bold">
                  {pl.magnitude} kN
                </text>
              )}
              <circle cx={pl.x} cy={-loadY} r={1.2} fill={labelStyle.loadColor} stroke="#991b1b" strokeWidth={0.3} />
            </g>
          );
        })}

        {/* ====== Dimension lines ====== */}
        {diagramOptions.showDimensions && solverResult && (
          <g>
            {/* Span dimension */}
            <line x1={geometry.leftPylonX} y1={6} x2={geometry.rightPylonX} y2={6} stroke={labelStyle.dimColor} strokeWidth={0.2} />
            <line x1={geometry.leftPylonX} y1={5} x2={geometry.leftPylonX} y2={7} stroke={labelStyle.dimColor} strokeWidth={0.2} />
            <line x1={geometry.rightPylonX} y1={5} x2={geometry.rightPylonX} y2={7} stroke={labelStyle.dimColor} strokeWidth={0.2} />
            <text x={span / 2 + geometry.leftPylonX} y={9} textAnchor="middle" fontSize={labelStyle.fontSize * 1.1} fill={labelStyle.dimColor}>
              L = {span.toFixed(1)} m
            </text>

            {/* Sag dimension */}
            {(() => {
              const midX = geometry.leftPylonX + span / 2;
              const chordY = (geometry.leftPylonY + geometry.rightPylonY) / 2;
              const sagY = chordY - geometry.sag;
              return (
                <>
                  <line x1={midX + 2} y1={-chordY} x2={midX + 2} y2={-sagY} stroke="#0891b2" strokeWidth={0.2} strokeDasharray="0.5 0.3" />
                  <text x={midX + 4} y={(-chordY - sagY) / 2 + 0.8} fontSize={2} fill="#0891b2">
                    f = {geometry.sag.toFixed(2)} m
                  </text>
                </>
              );
            })()}

            {/* Left pylon height dimension */}
            {geometry.leftAnchorType === 'pylon' && geometry.leftPylonY > 0 && (
              <>
                <line x1={geometry.leftPylonX - 5} y1={0} x2={geometry.leftPylonX - 5} y2={-geometry.leftPylonY} stroke={labelStyle.dimColor} strokeWidth={0.2} />
                <line x1={geometry.leftPylonX - 6} y1={0} x2={geometry.leftPylonX - 4} y2={0} stroke={labelStyle.dimColor} strokeWidth={0.2} />
                <line x1={geometry.leftPylonX - 6} y1={-geometry.leftPylonY} x2={geometry.leftPylonX - 4} y2={-geometry.leftPylonY} stroke={labelStyle.dimColor} strokeWidth={0.2} />
                <text x={geometry.leftPylonX - 6} y={-geometry.leftPylonY / 2 + 0.6} textAnchor="end" fontSize={labelStyle.fontSize * 0.9} fill={labelStyle.dimColor}>
                  h = {geometry.leftPylonY.toFixed(1)} m
                </text>
              </>
            )}

            {/* Right pylon height dimension */}
            {geometry.rightAnchorType === 'pylon' && geometry.rightPylonY > 0 && (
              <>
                <line x1={geometry.rightPylonX + 5} y1={0} x2={geometry.rightPylonX + 5} y2={-geometry.rightPylonY} stroke={labelStyle.dimColor} strokeWidth={0.2} />
                <line x1={geometry.rightPylonX + 4} y1={0} x2={geometry.rightPylonX + 6} y2={0} stroke={labelStyle.dimColor} strokeWidth={0.2} />
                <line x1={geometry.rightPylonX + 4} y1={-geometry.rightPylonY} x2={geometry.rightPylonX + 6} y2={-geometry.rightPylonY} stroke={labelStyle.dimColor} strokeWidth={0.2} />
                <text x={geometry.rightPylonX + 6} y={-geometry.rightPylonY / 2 + 0.6} textAnchor="start" fontSize={labelStyle.fontSize * 0.9} fill={labelStyle.dimColor}>
                  h = {geometry.rightPylonY.toFixed(1)} m
                </text>
              </>
            )}
          </g>
        )}

        {/* ====== Cable angles at key points with horizontal reference lines ====== */}
        {diagramOptions.showLabels && solverResult && solverResult.keyPoints && (
          <g>
            {solverResult.keyPoints.map((kp) => {
              if (kp.type === 'support-left' && Math.abs(kp.angleRight) < 0.1) return null;
              if (kp.type === 'support-right' && Math.abs(kp.angleLeft) < 0.1) return null;
              const dashLen = 12;
              return (
                <g key={`angle-${kp.id}`}>
                  {/* Dashed horizontal reference line at the node */}
                  <line
                    x1={kp.x - dashLen} y1={-kp.y}
                    x2={kp.x + dashLen} y2={-kp.y}
                    stroke={labelStyle.angleColor} strokeWidth={0.2} strokeDasharray="1 0.6" opacity={0.6}
                  />

                  {kp.type === 'point-load' && (
                    <>
                      <line
                        x1={kp.x} y1={-kp.y}
                        x2={kp.x - dashLen * Math.cos(kp.angleLeft * Math.PI / 180)}
                        y2={-kp.y + dashLen * Math.sin(kp.angleLeft * Math.PI / 180)}
                        stroke={labelStyle.angleColor} strokeWidth={0.25} strokeDasharray="0.8 0.5" opacity={0.5}
                      />
                      <text x={kp.x - 7} y={-kp.y - 1.5} fontSize={labelStyle.fontSize * 0.75} fill={labelStyle.angleColor} textAnchor="end" fontWeight="bold">
                        {Math.abs(kp.angleLeft).toFixed(1)}°
                      </text>
                      <line
                        x1={kp.x} y1={-kp.y}
                        x2={kp.x + dashLen * Math.cos(kp.angleRight * Math.PI / 180)}
                        y2={-kp.y - dashLen * Math.sin(kp.angleRight * Math.PI / 180)}
                        stroke={labelStyle.angleColor} strokeWidth={0.25} strokeDasharray="0.8 0.5" opacity={0.5}
                      />
                      <text x={kp.x + 7} y={-kp.y - 1.5} fontSize={labelStyle.fontSize * 0.75} fill={labelStyle.angleColor} textAnchor="start" fontWeight="bold">
                        {Math.abs(kp.angleRight).toFixed(1)}°
                      </text>
                    </>
                  )}

                  {kp.type === 'support-left' && (
                    <>
                      <line
                        x1={kp.x} y1={-kp.y}
                        x2={kp.x + dashLen * Math.cos(kp.angleRight * Math.PI / 180)}
                        y2={-kp.y - dashLen * Math.sin(kp.angleRight * Math.PI / 180)}
                        stroke={labelStyle.angleColor} strokeWidth={0.25} strokeDasharray="0.8 0.5" opacity={0.5}
                      />
                      <text x={kp.x + 8} y={-kp.y - labelStyle.labelOffset} fontSize={labelStyle.fontSize * 0.8} fill={labelStyle.angleColor} textAnchor="start" fontWeight="bold">
                        θ = {Math.abs(kp.angleRight).toFixed(1)}°
                      </text>
                    </>
                  )}

                  {kp.type === 'support-right' && (
                    <>
                      <line
                        x1={kp.x} y1={-kp.y}
                        x2={kp.x - dashLen * Math.cos(kp.angleLeft * Math.PI / 180)}
                        y2={-kp.y + dashLen * Math.sin(kp.angleLeft * Math.PI / 180)}
                        stroke={labelStyle.angleColor} strokeWidth={0.25} strokeDasharray="0.8 0.5" opacity={0.5}
                      />
                      <text x={kp.x - 8} y={-kp.y - labelStyle.labelOffset} fontSize={labelStyle.fontSize * 0.8} fill={labelStyle.angleColor} textAnchor="end" fontWeight="bold">
                        θ = {Math.abs(kp.angleLeft).toFixed(1)}°
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* ====== Tension labels on cable ====== */}
        {diagramOptions.showTension && solverResult && (
          <g>
            {[0, Math.floor(solverResult.points.length / 4), Math.floor(solverResult.points.length / 2), Math.floor(3 * solverResult.points.length / 4), solverResult.points.length - 1].map(
              (idx) => {
                const pt = solverResult.points[idx];
                if (!pt) return null;
                return (
                  <text key={idx} x={pt.x} y={-pt.y - 2.5} textAnchor="middle" fontSize={1.8} fill="#059669" fontWeight="bold">
                    {pt.T.toFixed(0)} kN
                  </text>
                );
              }
            )}
          </g>
        )}

        {/* ====== Self-weight arrows ====== */}
        {project.settings.includeSelfWeight && cable.unitWeight > 0 && diagramOptions.showForceArrows && (
          <g opacity={0.3}>
            {Array.from({ length: 10 }, (_, i) => {
              const x = geometry.leftPylonX + ((i + 0.5) * span) / 10;
              let y = 0;
              if (solverResult) {
                for (const pt of solverResult.points) {
                  if (Math.abs(pt.x - x) < span / 20) { y = pt.y; break; }
                }
              }
              return <line key={i} x1={x} y1={-y} x2={x} y2={-y + 3} stroke="#f59e0b" strokeWidth={0.3} />;
            })}
          </g>
        )}

        {/* ====== Reaction arrows at supports ====== */}
        {diagramOptions.showForceArrows && solverResult && (
          <g>
            {/* Left V */}
            <line x1={geometry.leftPylonX - labelStyle.labelOffset} y1={-geometry.leftPylonY} x2={geometry.leftPylonX - labelStyle.labelOffset} y2={-geometry.leftPylonY - 6} stroke={labelStyle.reactionColor} strokeWidth={0.5} />
            <polygon points={`${geometry.leftPylonX - labelStyle.labelOffset},${-geometry.leftPylonY - 6} ${geometry.leftPylonX - labelStyle.labelOffset - 0.8},${-geometry.leftPylonY - 4} ${geometry.leftPylonX - labelStyle.labelOffset + 0.8},${-geometry.leftPylonY - 4}`} fill={labelStyle.reactionColor} />
            {diagramOptions.showLabels && (
              <text x={geometry.leftPylonX - labelStyle.labelOffset - 2} y={-geometry.leftPylonY - 3} fontSize={labelStyle.fontSize * 0.9} fill={labelStyle.reactionColor} textAnchor="end">V_A={solverResult.leftReaction.V.toFixed(0)} kN</text>
            )}
            {/* Right V */}
            <line x1={geometry.rightPylonX + labelStyle.labelOffset} y1={-geometry.rightPylonY} x2={geometry.rightPylonX + labelStyle.labelOffset} y2={-geometry.rightPylonY - 6} stroke={labelStyle.reactionColor} strokeWidth={0.5} />
            <polygon points={`${geometry.rightPylonX + labelStyle.labelOffset},${-geometry.rightPylonY - 6} ${geometry.rightPylonX + labelStyle.labelOffset - 0.8},${-geometry.rightPylonY - 4} ${geometry.rightPylonX + labelStyle.labelOffset + 0.8},${-geometry.rightPylonY - 4}`} fill={labelStyle.reactionColor} />
            {diagramOptions.showLabels && (
              <text x={geometry.rightPylonX + labelStyle.labelOffset + 2} y={-geometry.rightPylonY - 3} fontSize={labelStyle.fontSize * 0.9} fill={labelStyle.reactionColor} textAnchor="start">V_B={solverResult.rightReaction.V.toFixed(0)} kN</text>
            )}
            {/* Left H */}
            <line x1={geometry.leftPylonX} y1={-geometry.leftPylonY + 3} x2={geometry.leftPylonX + 5} y2={-geometry.leftPylonY + 3} stroke="#0891b2" strokeWidth={0.4} />
            <polygon points={`${geometry.leftPylonX + 5},${-geometry.leftPylonY + 3} ${geometry.leftPylonX + 3.5},${-geometry.leftPylonY + 2.3} ${geometry.leftPylonX + 3.5},${-geometry.leftPylonY + 3.7}`} fill="#0891b2" />
            {diagramOptions.showLabels && (
              <text x={geometry.leftPylonX + 6} y={-geometry.leftPylonY + 3.5} fontSize={1.6} fill="#0891b2" textAnchor="start">H={solverResult.horizontalTension.toFixed(0)} kN</text>
            )}
            {/* Right H */}
            <line x1={geometry.rightPylonX} y1={-geometry.rightPylonY + 3} x2={geometry.rightPylonX - 5} y2={-geometry.rightPylonY + 3} stroke="#0891b2" strokeWidth={0.4} />
            <polygon points={`${geometry.rightPylonX - 5},${-geometry.rightPylonY + 3} ${geometry.rightPylonX - 3.5},${-geometry.rightPylonY + 2.3} ${geometry.rightPylonX - 3.5},${-geometry.rightPylonY + 3.7}`} fill="#0891b2" />
            {diagramOptions.showLabels && (
              <text x={geometry.rightPylonX - 6} y={-geometry.rightPylonY + 3.5} fontSize={1.6} fill="#0891b2" textAnchor="end">H={solverResult.horizontalTension.toFixed(0)} kN</text>
            )}
          </g>
        )}
      </svg>

      {/* ====== Tooltip ====== */}
      {tooltip && !isPanning && (
        <div
          className="absolute bg-slate-800 text-white text-[11px] rounded-lg shadow-xl px-3 py-2 pointer-events-none z-20 min-w-[160px]"
          style={{
            left: Math.min(
              tooltip.screenX - (containerRef.current?.getBoundingClientRect().left ?? 0) + 15,
              (containerRef.current?.getBoundingClientRect().width ?? 300) - 180
            ),
            top: tooltip.screenY - (containerRef.current?.getBoundingClientRect().top ?? 0) - 20,
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

// ── Label Settings sub-components ────────────────────────────────────

const LabelColorRow: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-[10px] text-slate-600 w-16">{label}</span>
    <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-6 h-5 p-0 border border-slate-300 rounded cursor-pointer" />
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-16 text-[9px] font-mono border border-slate-200 rounded px-1 py-0.5" />
  </div>
);

const LabelSliderRow: React.FC<{ label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }> = ({ label, value, min, max, step, onChange }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-[10px] text-slate-600 w-20">{label}</span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="flex-1 h-1 accent-cyan-500" />
    <span className="text-[9px] font-mono text-slate-500 w-8 text-right">{value.toFixed(1)}</span>
  </div>
);
