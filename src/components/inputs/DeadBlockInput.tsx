import React from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { NumberInput } from './NumberInput';
import type { DeadBlockDefinition } from '../../models/types';

// Effective backstay cable angle (below horizontal), derived from block position
function effectiveAngle(pylonX: number, pylonY: number, block: DeadBlockDefinition): number {
  const drop = pylonY - block.y;
  const reach = Math.abs(block.x - pylonX);
  return (Math.atan2(drop, reach) * 180) / Math.PI;
}

interface BlockEditorProps {
  title: string;
  block: DeadBlockDefinition;
  pylonX: number;
  pylonY: number;
  onChange: (updates: Partial<DeadBlockDefinition>) => void;
}

const BlockEditor: React.FC<BlockEditorProps> = ({ title, block, pylonX, pylonY, onChange }) => (
  <div className="bg-white rounded-lg border border-slate-200 p-3 mb-3">
    <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">{title}</h4>

    <div className="grid grid-cols-2 gap-2">
      <NumberInput
        label="X Position"
        value={block.x}
        onChange={(v) => onChange({ x: v })}
        unit="m"
        step={1}
      />
      <NumberInput
        label="Y Position"
        value={block.y}
        onChange={(v) => onChange({ y: v })}
        unit="m"
        step={1}
      />
    </div>

    <div className="mt-1 mb-2 text-[11px] text-slate-600 bg-cyan-50 border border-cyan-100 rounded px-2 py-1">
      Effective cable angle:{' '}
      <span className="font-mono font-bold text-cyan-700">
        {effectiveAngle(pylonX, pylonY, block).toFixed(1)}°
      </span>{' '}
      below horizontal
    </div>

    <div className="grid grid-cols-3 gap-2">
      <NumberInput
        label="Width"
        value={block.width}
        onChange={(v) => onChange({ width: v })}
        unit="m"
        min={0.1}
        step={0.1}
      />
      <NumberInput
        label="Height"
        value={block.height}
        onChange={(v) => onChange({ height: v })}
        unit="m"
        min={0.1}
        step={0.1}
      />
      <NumberInput
        label="Depth"
        value={block.depth}
        onChange={(v) => onChange({ depth: v })}
        unit="m"
        min={0.1}
        step={0.1}
      />
    </div>

    <div className="grid grid-cols-2 gap-2">
      <NumberInput
        label="Concrete Density"
        value={block.concreteDensity}
        onChange={(v) => onChange({ concreteDensity: v })}
        unit="kN/m³"
        min={0.1}
        step={0.5}
      />
      <NumberInput
        label="Friction μ"
        value={block.frictionCoeff}
        onChange={(v) => onChange({ frictionCoeff: v })}
        unit=""
        min={0}
        max={1}
        step={0.05}
      />
    </div>
  </div>
);

export const DeadBlockInput: React.FC = () => {
  const { project, updateDeadBlockA, updateDeadBlock } = useProjectStore();
  const { geometry } = project;

  const leftIsPylon = geometry.leftAnchorType === 'pylon';
  const rightIsPylon = geometry.rightAnchorType === 'pylon';

  return (
    <div>
      <h3 className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-1">
        🧱 Dead Blocks / Anchors
      </h3>

      {leftIsPylon || rightIsPylon ? (
        <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
          Backstay cables pass over pulleys at the pylon tops and terminate in
          concrete dead blocks. The cable force on each block is derived from
          the backstay tension and its inclination.
        </p>
      ) : (
        <p className="text-[11px] text-amber-600 mb-3 leading-relaxed">
          Both anchors are set to <strong>Direct</strong> mode — the cable is
          fixed directly to the anchor points. Dead block parameters below are
          used for stability checks at the direct anchor.
        </p>
      )}

      {/* Left anchor */}
      {leftIsPylon ? (
        <BlockEditor
          title="Backstay Block at Pylon A (Left)"
          block={project.deadBlockA}
          pylonX={geometry.leftPylonX}
          pylonY={geometry.leftPylonY}
          onChange={updateDeadBlockA}
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 p-3 mb-3">
          <h4 className="text-xs font-semibold text-amber-600 mb-1 uppercase tracking-wider">
            Direct Anchor A (Left)
          </h4>
          <p className="text-[10px] text-slate-500 mb-2">
            Cable tension applied directly at anchor point (X = {geometry.leftPylonX} m, Y = {geometry.leftPylonY} m).
            Enter block properties for stability check:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <NumberInput
              label="Width"
              value={project.deadBlockA.width}
              onChange={(v) => updateDeadBlockA({ width: v })}
              unit="m"
              min={0.1}
              step={0.1}
            />
            <NumberInput
              label="Height"
              value={project.deadBlockA.height}
              onChange={(v) => updateDeadBlockA({ height: v })}
              unit="m"
              min={0.1}
              step={0.1}
            />
            <NumberInput
              label="Depth"
              value={project.deadBlockA.depth}
              onChange={(v) => updateDeadBlockA({ depth: v })}
              unit="m"
              min={0.1}
              step={0.1}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <NumberInput
              label="Concrete ρ"
              value={project.deadBlockA.concreteDensity}
              onChange={(v) => updateDeadBlockA({ concreteDensity: v })}
              unit="kN/m³"
              min={0.1}
              step={0.5}
            />
            <NumberInput
              label="Friction μ"
              value={project.deadBlockA.frictionCoeff}
              onChange={(v) => updateDeadBlockA({ frictionCoeff: v })}
              unit=""
              min={0}
              max={1}
              step={0.05}
            />
          </div>
        </div>
      )}

      {/* Right anchor */}
      {rightIsPylon ? (
        <BlockEditor
          title="Backstay Block at Pylon B (Right)"
          block={project.deadBlock}
          pylonX={geometry.rightPylonX}
          pylonY={geometry.rightPylonY}
          onChange={updateDeadBlock}
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 p-3 mb-3">
          <h4 className="text-xs font-semibold text-amber-600 mb-1 uppercase tracking-wider">
            Direct Anchor B (Right)
          </h4>
          <p className="text-[10px] text-slate-500 mb-2">
            Cable tension applied directly at anchor point (X = {geometry.rightPylonX} m, Y = {geometry.rightPylonY} m).
            Enter block properties for stability check:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <NumberInput
              label="Width"
              value={project.deadBlock.width}
              onChange={(v) => updateDeadBlock({ width: v })}
              unit="m"
              min={0.1}
              step={0.1}
            />
            <NumberInput
              label="Height"
              value={project.deadBlock.height}
              onChange={(v) => updateDeadBlock({ height: v })}
              unit="m"
              min={0.1}
              step={0.1}
            />
            <NumberInput
              label="Depth"
              value={project.deadBlock.depth}
              onChange={(v) => updateDeadBlock({ depth: v })}
              unit="m"
              min={0.1}
              step={0.1}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <NumberInput
              label="Concrete ρ"
              value={project.deadBlock.concreteDensity}
              onChange={(v) => updateDeadBlock({ concreteDensity: v })}
              unit="kN/m³"
              min={0.1}
              step={0.5}
            />
            <NumberInput
              label="Friction μ"
              value={project.deadBlock.frictionCoeff}
              onChange={(v) => updateDeadBlock({ frictionCoeff: v })}
              unit=""
              min={0}
              max={1}
              step={0.05}
            />
          </div>
        </div>
      )}

      <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-700 leading-relaxed">
        ⚠ Sliding / overturning / bearing checks are preliminary engineering
        checks. Final design requires project-specific geotechnical parameters.
      </div>
    </div>
  );
};
