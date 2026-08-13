import React from 'react';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  tooltip?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  onChange,
  unit,
  min,
  max,
  step = 0.1,
  tooltip,
}) => {
  return (
    <div className="mb-2" title={tooltip}>
      <label className="block text-xs font-medium text-slate-600 mb-0.5">
        {label} {unit && <span className="text-slate-400">({unit})</span>}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) {
            if (min !== undefined && v < min) return;
            if (max !== undefined && v > max) return;
            onChange(v);
          }
        }}
        step={step}
        min={min}
        max={max}
        className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 bg-white"
      />
    </div>
  );
};
