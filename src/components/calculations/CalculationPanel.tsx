import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import katex from 'katex';

export const CalculationPanel: React.FC = () => {
  const { calculationSteps, project, solverResult, showCalculations, toggleCalculations } =
    useProjectStore();
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (index: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const renderLatex = (latex: string) => {
    try {
      return (
        <span
          dangerouslySetInnerHTML={{
            __html: katex.renderToString(latex, { throwOnError: false, displayMode: false }),
          }}
        />
      );
    } catch {
      return <span className="font-mono text-xs">{latex}</span>;
    }
  };

  const renderLatexBlock = (latex: string) => {
    try {
      return (
        <div
          dangerouslySetInnerHTML={{
            __html: katex.renderToString(latex, { throwOnError: false, displayMode: true }),
          }}
        />
      );
    } catch {
      return <div className="font-mono text-xs">{latex}</div>;
    }
  };

  // Educational explanations
  const getExplanation = (title: string): string | null => {
    if (!project.settings.educationalMode) return null;
    const explanations: Record<string, string> = {
      'Horizontal Cable Force':
        'The horizontal component of cable tension is constant throughout an idealized cable subjected to vertical loads only. A smaller sag makes the cable flatter, requiring greater horizontal tension to balance the vertical load.',
      'Left Vertical Reaction':
        'The left vertical reaction is determined from moment equilibrium about the right support. It depends on the load magnitude and its position along the span.',
      'Right Vertical Reaction':
        'The right vertical reaction is found from vertical equilibrium. Together with the left reaction, they must balance the total applied vertical load.',
      'Left Cable Tension':
        'The cable tension at any point is the vector sum of horizontal and vertical force components. The tension is maximum where the cable slope is steepest.',
      'Maximum Cable Stress':
        'Cable stress is calculated by dividing the maximum tension by the cable cross-sectional area. This must remain below the allowable stress for safe design.',
      'Utilization Ratio':
        'The utilization ratio indicates how much of the cable\'s capacity is being used. A ratio above 1.0 (100%) means the cable is overstressed.',
      'Horizontal Tension (UDL)':
        'For a cable under uniformly distributed load, the horizontal tension depends on the load intensity, span, and sag. This produces a parabolic cable profile.',
      'Free Thermal Expansion':
        'Temperature changes cause the cable to expand or contract. Free expansion occurs when the cable is not restrained. In a suspension system, this changes the sag.',
      'Pulley Resultant Force':
        'The pulley resultant force is the vector sum of cable tensions on both sides. This force is transferred to the pylon structure.',
      'Dead Block Horizontal Force':
        'The horizontal force on the dead block comes from the horizontal component of the cable tension in the backstay.',
    };
    return explanations[title] ?? null;
  };

  return (
    <div className="bg-white border-t border-slate-200 h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-slate-100">
        <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          📝 Calculation Trace
          {project.settings.educationalMode && (
            <span className="bg-blue-100 text-blue-600 text-[9px] px-1.5 py-0.5 rounded-full font-medium">
              Learning Mode
            </span>
          )}
        </h3>
        <button
          onClick={toggleCalculations}
          className="text-[10px] text-slate-500 hover:text-slate-700 underline"
        >
          {showCalculations ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {calculationSteps.length === 0 && (
          <div className="text-xs text-slate-400 text-center py-8">
            Run analysis to see calculation steps
          </div>
        )}

        {calculationSteps.map((step, index) => {
          const isExpanded = showCalculations || expandedSteps.has(index);
          const explanation = getExplanation(step.title);

          return (
            <div
              key={index}
              className="border border-slate-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleStep(index)}
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono w-5">{index + 1}</span>
                  <span className="text-xs font-medium text-slate-700">{step.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-cyan-600 font-bold">
                    {step.result.value < 0.001 && step.result.value !== 0
                      ? step.result.value.toExponential(3)
                      : step.result.value.toFixed(2)}{' '}
                    {step.result.unit}
                  </span>
                  <span className="text-slate-400 text-xs">{isExpanded ? '▼' : '▶'}</span>
                </div>
              </button>

              {isExpanded && (
                <div className="px-3 py-2 bg-white border-t border-slate-100">
                  {/* Equation */}
                  <div className="mb-2 p-2 bg-slate-50 rounded text-center">
                    {renderLatexBlock(step.equation)}
                  </div>

                  {/* Variables */}
                  <div className="mb-2">
                    <table className="w-full text-xs">
                      <tbody>
                        {step.variables.map((v, vi) => (
                          <tr key={vi} className="border-b border-slate-50">
                            <td className="py-0.5 text-slate-500">{v.name}</td>
                            <td className="py-0.5 text-center">{renderLatex(v.symbol)}</td>
                            <td className="py-0.5 text-right font-mono text-slate-700">
                              {typeof v.value === 'number'
                                ? Math.abs(v.value) < 0.001 && v.value !== 0
                                  ? v.value.toExponential(3)
                                  : v.value.toFixed(
                                      Math.abs(v.value) < 1 ? 6 : 2
                                    )
                                : v.value}
                            </td>
                            <td className="py-0.5 text-slate-400 pl-1">{v.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Result */}
                  <div className="p-2 bg-cyan-50 rounded flex justify-between items-center">
                    <span className="text-xs text-cyan-700 font-medium">
                      {renderLatex(step.result.name)} =
                    </span>
                    <span className="text-sm font-bold font-mono text-cyan-800">
                      {step.result.value < 0.001 && step.result.value !== 0
                        ? step.result.value.toExponential(3)
                        : step.result.value.toFixed(2)}{' '}
                      {step.result.unit}
                    </span>
                  </div>

                  {/* Educational explanation */}
                  {explanation && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded">
                      <div className="text-[10px] font-bold text-blue-600 mb-0.5">💡 Why?</div>
                      <div className="text-[11px] text-blue-700 leading-relaxed">{explanation}</div>
                    </div>
                  )}

                  {/* Step explanation from data */}
                  {step.explanation && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded">
                      <div className="text-[11px] text-amber-700">{step.explanation}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Solver convergence info */}
        {solverResult && (
          <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="text-xs font-bold text-slate-600 mb-1">Solver Status</h4>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <span className="text-slate-500">Convergence:</span>
              <span className={`font-mono ${solverResult.converged ? 'text-emerald-600' : 'text-red-600'}`}>
                {solverResult.converged ? '✓ Converged' : '✗ Not converged'}
              </span>
              <span className="text-slate-500">Iterations:</span>
              <span className="font-mono text-slate-700">{solverResult.iterations}</span>
              <span className="text-slate-500">Residual:</span>
              <span className="font-mono text-slate-700">{solverResult.error.toExponential(3)}</span>
              <span className="text-slate-500">ΣFx:</span>
              <span className="font-mono text-slate-700">{solverResult.equilibriumResidual.Fx.toFixed(4)} kN</span>
              <span className="text-slate-500">ΣFy:</span>
              <span className="font-mono text-slate-700">{solverResult.equilibriumResidual.Fy.toFixed(4)} kN</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
