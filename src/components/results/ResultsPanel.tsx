import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import type { PulleyResult, DeadBlockResult } from '../../models/types';

type ResultTab = 'cable' | 'pylon' | 'deadblock' | 'checks' | 'assumptions';

export const ResultsPanel: React.FC = () => {
  const [tab, setTab] = useState<ResultTab>('cable');

  const resultTabs: { id: ResultTab; label: string; icon: string }[] = [
    { id: 'cable', label: 'Cable', icon: '🔗' },
    { id: 'pylon', label: 'Pylon', icon: '🏗️' },
    { id: 'deadblock', label: 'Anchor', icon: '🧱' },
    { id: 'checks', label: 'Checks', icon: '✓' },
    { id: 'assumptions', label: 'Assume', icon: '📋' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 border-l border-slate-200">
      {/* Tab nav */}
      <div className="flex border-b border-slate-200 bg-white">
        {resultTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-1 py-2 text-[10px] font-medium transition-colors ${
              tab === t.id
                ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="block text-sm">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'cable' && <CableResults />}
        {tab === 'pylon' && <PylonResults />}
        {tab === 'deadblock' && <DeadBlockResults />}
        {tab === 'checks' && <ChecksPanel />}
        {tab === 'assumptions' && <AssumptionsPanel />}
      </div>
    </div>
  );
};

// --- Cable Results ---
const CableResults: React.FC = () => {
  const { solverResult, stressResult, elongationResult } = useProjectStore();

  if (!solverResult) {
    return <div className="text-xs text-slate-400 text-center py-8">Run analysis to see results</div>;
  }

  return (
    <div className="space-y-3">
      <ResultCard title="Cable Forces" icon="⚡">
        <ResultRow label="Horizontal Tension H" value={solverResult.horizontalTension} unit="kN" highlight />
        <ResultRow label="Maximum Tension" value={solverResult.maxTension} unit="kN" highlight />
        <ResultRow label="Minimum Tension" value={solverResult.minTension} unit="kN" />
        <ResultRow label="Left Reaction V_A" value={solverResult.leftReaction.V} unit="kN" />
        <ResultRow label="Right Reaction V_B" value={solverResult.rightReaction.V} unit="kN" />
      </ResultCard>

      <ResultCard title="Cable Geometry" icon="📏">
        <ResultRow label="Cable Length" value={solverResult.cableLength} unit="m" />
        <ResultRow label="Span" value={solverResult.points.length > 0 ? solverResult.points[solverResult.points.length - 1].x - solverResult.points[0].x : 0} unit="m" />
      </ResultCard>

      {/* Cable Angles at Key Points */}
      {solverResult.keyPoints && solverResult.keyPoints.length > 0 && (
        <ResultCard title="Cable Angles" icon="📐">
          {solverResult.keyPoints.map((kp) => {
            const label = kp.type === 'support-left' 
              ? 'Left Support' 
              : kp.type === 'support-right' 
                ? 'Right Support' 
                : `Load @ X=${kp.x.toFixed(0)}m`;
            const angle = kp.type === 'support-left' 
              ? kp.angleRight 
              : kp.type === 'support-right' 
                ? kp.angleLeft 
                : `${kp.angleLeft.toFixed(1)}° / ${kp.angleRight.toFixed(1)}°`;
            return (
              <div key={kp.id} className="flex justify-between items-center py-0.5">
                <span className="text-[11px] text-slate-500">{label}</span>
                <span className="font-mono text-[11px] text-purple-600">
                  {typeof angle === 'number' ? `${angle.toFixed(1)}°` : angle}
                </span>
              </div>
            );
          })}
        </ResultCard>
      )}

      {stressResult && (
        <ResultCard title="Cable Stress" icon="🔧">
          <ResultRow label="Max Stress" value={stressResult.maxStress} unit="MPa" />
          <ResultRow label="Allowable Stress" value={stressResult.allowableStress} unit="MPa" />
          <ResultRow label="Utilization" value={stressResult.utilization * 100} unit="%" />
          <div className="mt-1">
            <StatusBadge status={stressResult.status} />
          </div>
        </ResultCard>
      )}

      {elongationResult && (
        <ResultCard title="Cable Elongation" icon="📐">
          <ResultRow label="Original Length" value={elongationResult.originalLength} unit="m" />
          <ResultRow label="Elastic Elongation" value={elongationResult.elasticElongation} unit="mm" />
          <ResultRow label="Total Deformation" value={elongationResult.totalDeformation} unit="mm" />
          <ResultRow label="Final Length" value={elongationResult.finalLength} unit="m" />
        </ResultCard>
      )}

      <ResultCard title="Solver Status" icon="🔄">
        <ResultRow label="Converged" value={solverResult.converged ? 1 : 0} unit={solverResult.converged ? 'Yes' : 'No'} />
        <ResultRow label="Iterations" value={solverResult.iterations} unit="" />
        <ResultRow label="Residual" value={solverResult.error} unit="" />
        <ResultRow label="ΣFx" value={solverResult.equilibriumResidual.Fx} unit="kN" />
        <ResultRow label="ΣFy" value={solverResult.equilibriumResidual.Fy} unit="kN" />
      </ResultCard>
    </div>
  );
};

// --- Pylon Results ---
const PylonCard: React.FC<{ title: string; result: PulleyResult | null }> = ({ title, result }) => {
  if (!result) return null;
  return (
    <ResultCard title={title} icon="🏗️">
      <ResultRow label="Horizontal Rx" value={result.Rx} unit="kN" highlight />
      <ResultRow label="Vertical Ry" value={result.Ry} unit="kN" highlight />
      <ResultRow label="Resultant R" value={result.R} unit="kN" highlight />
      <ResultRow label="Direction" value={result.direction} unit="°" />
      <div className="mt-1 border-t border-slate-100 pt-1">
        <div className="text-[10px] text-slate-400 mb-1">Cable Tensions at Pulley</div>
        <ResultRow label="T₁ (main span)" value={result.T1} unit="kN" />
        <ResultRow label="T₂ (backstay)" value={result.T2} unit="kN" />
        <ResultRow label="Angle between" value={result.angleBetween} unit="°" />
      </div>
    </ResultCard>
  );
};

const PylonResults: React.FC = () => {
  const { pulleyResultA, pulleyResult, project } = useProjectStore();
  const { geometry } = project;

  const leftIsPylon = geometry.leftAnchorType === 'pylon';
  const rightIsPylon = geometry.rightAnchorType === 'pylon';

  if (!leftIsPylon && !rightIsPylon) {
    return (
      <div className="text-xs text-slate-400 text-center py-8">
        Both anchors are in <strong>Direct</strong> mode — no pylon/pulley forces.
        <br />
        Cable tension is applied directly to the anchor blocks.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {leftIsPylon && <PylonCard title="Pylon A (Left)" result={pulleyResultA} />}
      {!leftIsPylon && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700">
          Anchor A: Direct anchor — no pylon
        </div>
      )}
      {rightIsPylon && <PylonCard title="Pylon B (Right)" result={pulleyResult} />}
      {!rightIsPylon && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700">
          Anchor B: Direct anchor — no pylon
        </div>
      )}
    </div>
  );
};

// --- Dead Block Results ---
const AnchorCard: React.FC<{ title: string; result: DeadBlockResult | null }> = ({ title, result }) => {
  if (!result) return null;
  return (
    <ResultCard title={title} icon="🧱">
      <ResultRow label="Horizontal H_D" value={result.Hd} unit="kN" highlight />
      <ResultRow label="Vertical V_D" value={result.Vd} unit="kN" highlight />
      <ResultRow label="Resultant R_D" value={result.Rd} unit="kN" highlight />
      <ResultRow label="Cable Angle" value={result.cableAngle} unit="°" />
      <ResultRow label="Block Weight" value={result.blockWeight} unit="kN" />
      <div className="mt-1 border-t border-slate-100 pt-1">
        <div className="text-[10px] text-slate-400 mb-1">Stability Checks</div>
        {result.slidingFS !== null && (
          <>
            <ResultRow label="Sliding FS" value={result.slidingFS} unit="" />
            <StatusBadge status={result.slidingFS >= 1.5 ? 'PASS' : 'FAIL'} />
          </>
        )}
        {result.overturningFS !== null && (
          <>
            <ResultRow label="Overturning FS" value={result.overturningFS} unit="" />
            <StatusBadge status={result.overturningFS >= 2.0 ? 'PASS' : 'FAIL'} />
          </>
        )}
        {result.bearingPressureMax !== null && (
          <ResultRow label="Max Bearing Pressure" value={result.bearingPressureMax} unit="kPa" />
        )}
      </div>
    </ResultCard>
  );
};

const DeadBlockResults: React.FC = () => {
  const { deadBlockResultA, deadBlockResult, project } = useProjectStore();
  const { geometry } = project;

  const leftIsPylon = geometry.leftAnchorType === 'pylon';
  const rightIsPylon = geometry.rightAnchorType === 'pylon';

  if (!deadBlockResultA && !deadBlockResult) {
    return <div className="text-xs text-slate-400 text-center py-8">No anchor results</div>;
  }

  return (
    <div className="space-y-3">
      <AnchorCard
        title={leftIsPylon ? 'Backstay Block A (Left)' : 'Direct Anchor A (Left)'}
        result={deadBlockResultA}
      />
      <AnchorCard
        title={rightIsPylon ? 'Backstay Block B (Right)' : 'Direct Anchor B (Right)'}
        result={deadBlockResult}
      />
    </div>
  );
};

// --- Checks Panel ---
const ChecksPanel: React.FC = () => {
  const { engineeringChecks } = useProjectStore();

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold text-slate-700 mb-2">Engineering Checks</h3>
      {engineeringChecks.map((check) => (
        <div
          key={check.id}
          className={`rounded-lg border p-2.5 ${
            check.passed
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`text-sm ${check.passed ? 'text-emerald-600' : 'text-red-600'}`}>
              {check.passed ? '✓' : '✗'}
            </span>
            <span className="text-xs font-medium text-slate-700">{check.name}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 ml-5">{check.value}</div>
          <div className="text-[10px] text-slate-400 mt-0.5 ml-5">{check.details}</div>
        </div>
      ))}
    </div>
  );
};

// --- Assumptions Panel ---
const AssumptionsPanel: React.FC = () => {
  const { project } = useProjectStore();
  const { geometry } = project;
  const leftIsPylon = geometry.leftAnchorType === 'pylon';
  const rightIsPylon = geometry.rightAnchorType === 'pylon';

  const assumptions = [
    { text: 'Cable treated as perfectly flexible', active: true },
    { text: 'Cable carries tension only', active: true },
    { text: 'Pulley assumed frictionless', active: (leftIsPylon || rightIsPylon) && project.pulley.frictionless },
    { text: 'Loads assumed vertical', active: true },
    {
      text: `Self-weight per ${project.cable.weightBasis === 'horizontal' ? 'horizontal projection' : 'arc length'}`,
      active: project.settings.includeSelfWeight,
    },
    { text: 'Small-strain elastic behavior', active: true },
    { text: 'No cable bending stiffness', active: true },
    { text: 'Self-weight included', active: project.settings.includeSelfWeight },
    { text: 'Elastic deformation included', active: project.settings.includeElasticity },
    { text: 'Temperature effects included', active: project.settings.includeTemperature },
    { text: 'Left anchor: Pylon + Pulley + Backstay', active: leftIsPylon },
    { text: 'Left anchor: Direct to anchor block', active: !leftIsPylon },
    { text: 'Right anchor: Pylon + Pulley + Backstay', active: rightIsPylon },
    { text: 'Right anchor: Direct to anchor block', active: !rightIsPylon },
  ];

  return (
    <div>
      <h3 className="text-xs font-bold text-slate-700 mb-3">Analysis Assumptions</h3>
      <div className="space-y-1.5">
        {assumptions.map((a, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className={a.active ? 'text-emerald-500' : 'text-slate-300'}>
              {a.active ? '✓' : '○'}
            </span>
            <span className={a.active ? 'text-slate-700' : 'text-slate-400'}>{a.text}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 p-2 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-700">
        ⚠ These assumptions affect calculated results. Review carefully before using for design.
        Dead-block stability requires project-specific geotechnical parameters.
      </div>
    </div>
  );
};

// --- Reusable Components ---
const ResultCard: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({
  title,
  icon,
  children,
}) => (
  <div className="bg-white rounded-lg border border-slate-200 p-3">
    <h4 className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
      <span>{icon}</span> {title}
    </h4>
    {children}
  </div>
);

const ResultRow: React.FC<{
  label: string;
  value: number;
  unit: string;
  highlight?: boolean;
}> = ({ label, value, unit, highlight }) => {
  const formatted = Math.abs(value) < 0.001 && value !== 0
    ? value.toExponential(3)
    : Math.abs(value) >= 1000
    ? value.toLocaleString(undefined, { maximumFractionDigits: 1 })
    : value.toFixed(Math.abs(value) < 1 ? 4 : 2);

  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span
        className={`font-mono text-[11px] ${
          highlight ? 'font-bold text-cyan-700' : 'text-slate-700'
        }`}
      >
        {formatted} <span className="text-slate-400">{unit}</span>
      </span>
    </div>
  );
};

const StatusBadge: React.FC<{ status: 'PASS' | 'WARNING' | 'FAIL' }> = ({ status }) => {
  const colors = {
    PASS: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    WARNING: 'bg-amber-100 text-amber-700 border-amber-300',
    FAIL: 'bg-red-100 text-red-700 border-red-300',
  };

  return (
    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded border ${colors[status]}`}>
      {status}
    </span>
  );
};
