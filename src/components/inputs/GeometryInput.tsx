import React from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { NumberInput } from './NumberInput';
import type { AnchorType } from '../../models/types';

export const GeometryInput: React.FC = () => {
  const { project, updateGeometry } = useProjectStore();
  const { geometry } = project;
  const span = geometry.rightPylonX - geometry.leftPylonX;

  const AnchorTypeToggle: React.FC<{
    label: string;
    value: AnchorType;
    onChange: (t: AnchorType) => void;
  }> = ({ label, value, onChange }) => (
    <div className="mb-2">
      <label className="block text-[10px] font-medium text-slate-500 mb-1 uppercase">{label}</label>
      <div className="flex rounded overflow-hidden border border-slate-300 text-[10px]">
        <button
          type="button"
          onClick={() => onChange('pylon')}
          className={`flex-1 px-2 py-1 transition ${
            value === 'pylon'
              ? 'bg-cyan-600 text-white font-bold'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          Pylon + Pulley
        </button>
        <button
          type="button"
          onClick={() => onChange('direct')}
          className={`flex-1 px-2 py-1 transition ${
            value === 'direct'
              ? 'bg-amber-600 text-white font-bold'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          Direct to Anchor
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1">
        📐 Cable Geometry
      </h3>

      {/* Left Side */}
      <div className="bg-white rounded-lg border border-slate-200 p-3 mb-3">
        <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Left Anchor (A)</h4>
        <AnchorTypeToggle
          label="Anchor Type"
          value={geometry.leftAnchorType}
          onChange={(t) => updateGeometry({ leftAnchorType: t })}
        />
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label={geometry.leftAnchorType === 'pylon' ? 'Pylon X' : 'Anchor X'}
            value={geometry.leftPylonX}
            onChange={(v) => updateGeometry({ leftPylonX: v })}
            unit="m"
            step={1}
          />
          <NumberInput
            label={geometry.leftAnchorType === 'pylon' ? 'Anchor Elev. Y' : 'Anchor Elev. Y'}
            value={geometry.leftPylonY}
            onChange={(v) => updateGeometry({ leftPylonY: v })}
            unit="m"
            min={0.5}
            step={0.5}
            tooltip={
              geometry.leftAnchorType === 'pylon'
                ? 'Elevation of the pulley at the top of the left pylon'
                : 'Elevation of the direct anchor point (cable fixed here)'
            }
          />
        </div>
        {geometry.leftAnchorType === 'direct' && (
          <div className="mt-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-100 rounded px-2 py-1">
            Cable fixed directly to anchor block — no pylon or backstay on this side.
          </div>
        )}
      </div>

      {/* Right Side */}
      <div className="bg-white rounded-lg border border-slate-200 p-3 mb-3">
        <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Right Anchor (B)</h4>
        <AnchorTypeToggle
          label="Anchor Type"
          value={geometry.rightAnchorType}
          onChange={(t) => updateGeometry({ rightAnchorType: t })}
        />
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label={geometry.rightAnchorType === 'pylon' ? 'Pylon X' : 'Anchor X'}
            value={geometry.rightPylonX}
            onChange={(v) => updateGeometry({ rightPylonX: v })}
            unit="m"
            min={geometry.leftPylonX + 1}
            step={1}
          />
          <NumberInput
            label={geometry.rightAnchorType === 'pylon' ? 'Anchor Elev. Y' : 'Anchor Elev. Y'}
            value={geometry.rightPylonY}
            onChange={(v) => updateGeometry({ rightPylonY: v })}
            unit="m"
            min={0.5}
            step={0.5}
            tooltip={
              geometry.rightAnchorType === 'pylon'
                ? 'Elevation of the pulley at the top of the right pylon'
                : 'Elevation of the direct anchor point (cable fixed here)'
            }
          />
        </div>
        {geometry.rightAnchorType === 'direct' && (
          <div className="mt-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-100 rounded px-2 py-1">
            Cable fixed directly to anchor block — no pylon or backstay on this side.
          </div>
        )}
      </div>

      {/* Span summary */}
      <div className="text-xs text-slate-500 bg-cyan-50 border border-cyan-100 rounded px-2 py-1.5 mb-3">
        <span className="text-slate-600">Span</span> = <span className="font-mono font-bold text-cyan-700">{span.toFixed(1)} m</span>
        <span className="mx-2 text-slate-300">|</span>
        <span className="text-slate-600">ΔY</span> = <span className="font-mono text-slate-700">{(geometry.rightPylonY - geometry.leftPylonY).toFixed(2)} m</span>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-3">
        <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Cable Sag</h4>
        <NumberInput
          label="Sag"
          value={geometry.sag}
          onChange={(v) => updateGeometry({ sag: v, sagRatio: span / v })}
          unit="m"
          min={0.01}
          step={0.1}
        />
        <div className="flex items-center gap-2 mt-1">
          <label className="text-xs text-slate-500">Sag Ratio (L/n):</label>
          <input
            type="number"
            value={geometry.sagRatio ?? 10}
            onChange={(e) => {
              const ratio = parseFloat(e.target.value);
              if (!isNaN(ratio) && ratio > 0) {
                updateGeometry({ sagRatio: ratio, sag: span / ratio });
              }
            }}
            step={1}
            min={1}
            className="w-20 px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        <div className="mt-2 text-xs text-slate-500 bg-cyan-50 rounded px-2 py-1">
          f = L/{geometry.sagRatio?.toFixed(0) ?? '?'} = <span className="font-mono font-bold text-cyan-700">{geometry.sag.toFixed(2)} m</span>
        </div>
      </div>
    </div>
  );
};
