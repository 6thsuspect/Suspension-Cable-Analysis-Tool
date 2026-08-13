import React from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { NumberInput } from './NumberInput';

export const CableInput: React.FC = () => {
  const { project, updateCable } = useProjectStore();
  const { cable } = project;

  return (
    <div>
      <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1">
        🔗 Cable Properties
      </h3>

      <div className="bg-white rounded-lg border border-slate-200 p-3 mb-3">
        <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Cross Section</h4>
        <NumberInput
          label="Diameter"
          value={cable.diameter}
          onChange={(v) => updateCable({ diameter: v })}
          unit="mm"
          min={1}
          step={1}
        />
        <NumberInput
          label="Area"
          value={cable.area}
          onChange={(v) => updateCable({ area: v })}
          unit="mm²"
          min={1}
          step={100}
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-3 mb-3">
        <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Material</h4>
        <NumberInput
          label="Young's Modulus E"
          value={cable.youngsModulus}
          onChange={(v) => updateCable({ youngsModulus: v })}
          unit="MPa"
          min={1}
          step={1000}
        />
        <NumberInput
          label="Allowable Stress"
          value={cable.allowableStress}
          onChange={(v) => updateCable({ allowableStress: v })}
          unit="MPa"
          min={1}
          step={10}
        />
        <NumberInput
          label="Ultimate Strength"
          value={cable.ultimateStrength}
          onChange={(v) => updateCable({ ultimateStrength: v })}
          unit="MPa"
          min={1}
          step={10}
        />
        <NumberInput
          label="Thermal Coefficient α"
          value={cable.thermalCoeff * 1e6}
          onChange={(v) => updateCable({ thermalCoeff: v * 1e-6 })}
          unit="×10⁻⁶/°C"
          min={0}
          step={1}
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-3">
        <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Self Weight</h4>
        <NumberInput
          label="Unit Weight"
          value={cable.unitWeight}
          onChange={(v) => updateCable({ unitWeight: v })}
          unit="kN/m"
          min={0}
          step={0.01}
        />
        <div className="mt-2">
          <label className="text-xs text-slate-500 block mb-1">Weight Basis:</label>
          <select
            value={cable.weightBasis}
            onChange={(e) => updateCable({ weightBasis: e.target.value as 'horizontal' | 'arc' })}
            className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-cyan-500"
          >
            <option value="horizontal">Per horizontal projection</option>
            <option value="arc">Per actual cable length</option>
          </select>
        </div>
      </div>
    </div>
  );
};
