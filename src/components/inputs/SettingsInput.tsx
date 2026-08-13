import React from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { NumberInput } from './NumberInput';

export const SettingsInput: React.FC = () => {
  const { project, updateSettings } = useProjectStore();
  const { settings } = project;

  return (
    <div>
      <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1">
        ⚙️ Analysis Settings
      </h3>

      <div className="bg-white rounded-lg border border-slate-200 p-3 mb-3">
        <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Solver</h4>
        <NumberInput
          label="Cable Segments"
          value={settings.segments}
          onChange={(v) => updateSettings({ segments: Math.round(v) })}
          unit=""
          min={10}
          max={500}
          step={10}
        />
        <NumberInput
          label="Convergence Tolerance"
          value={settings.tolerance}
          onChange={(v) => updateSettings({ tolerance: v })}
          unit=""
          min={1e-10}
          step={1e-7}
        />
        <NumberInput
          label="Max Iterations"
          value={settings.maxIterations}
          onChange={(v) => updateSettings({ maxIterations: Math.round(v) })}
          unit=""
          min={10}
          max={1000}
          step={10}
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-3 mb-3">
        <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Analysis Options</h4>
        
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={settings.includeSelfWeight}
            onChange={(e) => updateSettings({ includeSelfWeight: e.target.checked })}
            className="accent-cyan-500"
          />
          <span className="text-xs text-slate-600">Include self-weight</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={settings.includeElasticity}
            onChange={(e) => updateSettings({ includeElasticity: e.target.checked })}
            className="accent-cyan-500"
          />
          <span className="text-xs text-slate-600">Include elasticity</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={settings.includeTemperature}
            onChange={(e) => updateSettings({ includeTemperature: e.target.checked })}
            className="accent-cyan-500"
          />
          <span className="text-xs text-slate-600">Include temperature effects</span>
        </label>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-3">
        <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Display Mode</h4>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.educationalMode}
            onChange={(e) => updateSettings({ educationalMode: e.target.checked })}
            className="accent-cyan-500"
          />
          <span className="text-xs text-slate-600">Educational Mode (show explanations)</span>
        </label>
      </div>
    </div>
  );
};
