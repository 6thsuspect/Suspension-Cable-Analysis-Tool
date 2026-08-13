import React from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { NumberInput } from './NumberInput';
import type { PointLoad } from '../../models/types';

export const LoadInput: React.FC = () => {
  const { project, addPointLoad, updatePointLoad, removePointLoad } = useProjectStore();
  const activeLC = project.loadCases.find((l) => l.id === project.activeLoadCaseId);
  const span = project.geometry.rightPylonX - project.geometry.leftPylonX;

  const handleAddLoad = () => {
    const newPL: PointLoad = {
      id: `pl-${Date.now()}`,
      x: span / 2,
      magnitude: 100,
      direction: 'vertical',
      loadCaseId: project.activeLoadCaseId,
      description: `Point Load ${(activeLC?.pointLoads.length ?? 0) + 1}`,
    };
    addPointLoad(newPL);
  };

  return (
    <div>
      <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1">
        ⬇️ Loading
      </h3>

      {/* Point Loads */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Point Loads</h4>
          <button
            onClick={handleAddLoad}
            className="text-xs px-2 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-500 transition"
          >
            + Add
          </button>
        </div>

        {activeLC?.pointLoads.map((pl, index) => (
          <div key={pl.id} className="bg-white rounded-lg border border-slate-200 p-3 mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600">Load {index + 1}</span>
              <button
                onClick={() => removePointLoad(pl.id)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                ✕ Remove
              </button>
            </div>
            <input
              type="text"
              value={pl.description}
              onChange={(e) => updatePointLoad(pl.id, { description: e.target.value })}
              className="w-full px-2 py-1 text-xs border border-slate-200 rounded mb-2"
              placeholder="Description"
            />
            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                label="Position X"
                value={pl.x}
                onChange={(v) => updatePointLoad(pl.id, { x: v })}
                unit="m"
                min={0.1}
                max={span - 0.1}
                step={0.5}
              />
              <NumberInput
                label="Magnitude P"
                value={pl.magnitude}
                onChange={(v) => updatePointLoad(pl.id, { magnitude: v })}
                unit="kN"
                min={0}
                step={10}
              />
            </div>
            {/* Position slider */}
            <div className="mt-1">
              <label className="text-xs text-slate-400">Drag position:</label>
              <input
                type="range"
                min={0.1}
                max={span - 0.1}
                step={0.1}
                value={pl.x}
                onChange={(e) => updatePointLoad(pl.id, { x: parseFloat(e.target.value) })}
                className="w-full h-1.5 accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0 m</span>
                <span>{pl.x.toFixed(1)} m</span>
                <span>{span.toFixed(0)} m</span>
              </div>
            </div>
          </div>
        ))}

        {(!activeLC || activeLC.pointLoads.length === 0) && (
          <div className="text-xs text-slate-400 text-center py-4 bg-white rounded border border-dashed border-slate-300">
            No point loads defined
          </div>
        )}
      </div>

      {/* Self-weight toggle */}
      <div className="bg-white rounded-lg border border-slate-200 p-3">
        <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Self Weight</h4>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={project.settings.includeSelfWeight}
            onChange={(e) =>
              useProjectStore.getState().updateSettings({ includeSelfWeight: e.target.checked })
            }
            className="accent-cyan-500"
          />
          <span className="text-xs text-slate-600">
            Include cable self-weight ({project.cable.unitWeight} kN/m)
          </span>
        </label>
      </div>
    </div>
  );
};
