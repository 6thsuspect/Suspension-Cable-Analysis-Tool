import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import { useProjectStore } from '../../store/useProjectStore';



type ChartType = 'profile' | 'tension' | 'stress' | 'sensitivity';

export const ChartsPanel: React.FC = () => {
  const [chartType, setChartType] = useState<ChartType>('profile');

  const chartTabs: { id: ChartType; label: string }[] = [
    { id: 'profile', label: '📈 Cable Profile' },
    { id: 'tension', label: '⚡ Tension' },
    { id: 'stress', label: '🔧 Stress' },
    { id: 'sensitivity', label: '📊 Sensitivity' },
  ];

  return (
    <div className="bg-white border-t border-slate-200 flex flex-col h-full">
      <div className="flex items-center border-b border-slate-100 bg-slate-50 px-2">
        {chartTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setChartType(t.id)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              chartType === t.id
                ? 'text-cyan-700 border-b-2 border-cyan-500 bg-white'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 p-2">
        {chartType === 'profile' && <ProfileChart />}
        {chartType === 'tension' && <TensionChart />}
        {chartType === 'stress' && <StressChart />}
        {chartType === 'sensitivity' && <SensitivityChart />}
      </div>
    </div>
  );
};

const ProfileChart: React.FC = () => {
  const { solverResult, project } = useProjectStore();
  const activeLC = project.loadCases.find((l) => l.id === project.activeLoadCaseId);

  const data = useMemo(() => {
    if (!solverResult) return [];
    return solverResult.points.filter((_, i) => i % 2 === 0 || i === solverResult.points.length - 1).map((pt) => ({
      x: Number(pt.x.toFixed(2)),
      y: Number(pt.y.toFixed(3)),
    }));
  }, [solverResult]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="x"
          label={{ value: 'X (m)', position: 'insideBottomRight', offset: -5, fontSize: 11 }}
          tick={{ fontSize: 10 }}
        />
        <YAxis
          label={{ value: 'Y (m)', angle: -90, position: 'insideLeft', fontSize: 11 }}
          tick={{ fontSize: 10 }}
        />
        <Tooltip
          formatter={((value: number) => [`${value.toFixed(3)} m`, 'Elevation']) as never}
          labelFormatter={(label) => `X = ${label} m`}
          contentStyle={{ fontSize: 11 }}
        />
        <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
        {/* Point load positions */}
        {activeLC?.pointLoads.map((pl) => (
          <ReferenceLine
            key={pl.id}
            x={pl.x}
            stroke="#dc2626"
            strokeDasharray="3 3"
            label={{ value: `${pl.magnitude} kN`, fontSize: 10, fill: '#dc2626' }}
          />
        ))}
        <Line
          type="monotone"
          dataKey="y"
          stroke="#0891b2"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#0891b2' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const TensionChart: React.FC = () => {
  const { solverResult } = useProjectStore();

  const data = useMemo(() => {
    if (!solverResult) return [];
    return solverResult.points.filter((_, i) => i % 2 === 0 || i === solverResult.points.length - 1).map((pt) => ({
      x: Number(pt.x.toFixed(2)),
      T: Number(pt.T.toFixed(1)),
      H: Number(pt.H.toFixed(1)),
      V: Number(pt.V.toFixed(1)),
    }));
  }, [solverResult]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="x"
          label={{ value: 'X (m)', position: 'insideBottomRight', offset: -5, fontSize: 11 }}
          tick={{ fontSize: 10 }}
        />
        <YAxis
          label={{ value: 'Force (kN)', angle: -90, position: 'insideLeft', fontSize: 11 }}
          tick={{ fontSize: 10 }}
        />
        <Tooltip
          formatter={((value: number, name: string) => [
            `${value.toFixed(1)} kN`,
            name === 'T' ? 'Total Tension' : name === 'H' ? 'Horizontal' : 'Vertical',
          ]) as never}
          labelFormatter={(label) => `X = ${label} m`}
          contentStyle={{ fontSize: 11 }}
        />
        <Area
          type="monotone"
          dataKey="T"
          stroke="#0891b2"
          fill="#0891b2"
          fillOpacity={0.1}
          strokeWidth={2}
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="H"
          stroke="#16a34a"
          fill="#16a34a"
          fillOpacity={0.05}
          strokeWidth={1.5}
          dot={false}
          strokeDasharray="4 2"
        />
        <Area
          type="monotone"
          dataKey="V"
          stroke="#f59e0b"
          fill="#f59e0b"
          fillOpacity={0.05}
          strokeWidth={1.5}
          dot={false}
          strokeDasharray="2 2"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const StressChart: React.FC = () => {
  const { solverResult, project } = useProjectStore();

  const data = useMemo(() => {
    if (!solverResult) return [];
    return solverResult.points.filter((_, i) => i % 2 === 0 || i === solverResult.points.length - 1).map((pt) => ({
      x: Number(pt.x.toFixed(2)),
      stress: Number(pt.stress.toFixed(1)),
      allowable: project.cable.allowableStress,
    }));
  }, [solverResult, project.cable.allowableStress]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="x"
          label={{ value: 'X (m)', position: 'insideBottomRight', offset: -5, fontSize: 11 }}
          tick={{ fontSize: 10 }}
        />
        <YAxis
          label={{ value: 'Stress (MPa)', angle: -90, position: 'insideLeft', fontSize: 11 }}
          tick={{ fontSize: 10 }}
        />
        <Tooltip
          formatter={((value: number, name: string) => [
            `${value.toFixed(1)} MPa`,
            name === 'stress' ? 'Cable Stress' : 'Allowable',
          ]) as never}
          labelFormatter={(label) => `X = ${label} m`}
          contentStyle={{ fontSize: 11 }}
        />
        <Line type="monotone" dataKey="stress" stroke="#dc2626" strokeWidth={2} dot={false} />
        <Line
          type="monotone"
          dataKey="allowable"
          stroke="#16a34a"
          strokeWidth={1.5}
          dot={false}
          strokeDasharray="5 3"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const SensitivityChart: React.FC = () => {
  const { project } = useProjectStore();
  const span = project.geometry.rightPylonX - project.geometry.leftPylonX;
  const activeLC = project.loadCases.find((l) => l.id === project.activeLoadCaseId);
  const totalP = activeLC?.pointLoads.reduce((s, p) => s + p.magnitude, 0) ?? 0;
  const w = project.settings.includeSelfWeight ? project.cable.unitWeight : 0;

  // Generate sag sensitivity data
  const data = useMemo(() => {
    const points: { sagRatio: number; H: number; Tmax: number }[] = [];
    for (let ratio = 6; ratio <= 25; ratio += 1) {
      const sag = span / ratio;
      // Estimate H
      let H = 0;
      if (w > 0) H += (w * span * span) / (8 * sag);
      if (totalP > 0 && activeLC) {
        for (const pl of activeLC.pointLoads) {
          const a = pl.x;
          const b = span - pl.x;
          H += (pl.magnitude * a * b) / (span * sag);
        }
      }
      const Va = totalP / 2 + (w * span) / 2;
      const Tmax = Math.sqrt(H * H + Va * Va);
      points.push({ sagRatio: ratio, H: Math.round(H), Tmax: Math.round(Tmax) });
    }
    return points;
  }, [span, totalP, w, activeLC]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="sagRatio"
          label={{ value: 'Sag Ratio (L/n)', position: 'insideBottomRight', offset: -5, fontSize: 11 }}
          tick={{ fontSize: 10 }}
        />
        <YAxis
          label={{ value: 'Force (kN)', angle: -90, position: 'insideLeft', fontSize: 11 }}
          tick={{ fontSize: 10 }}
        />
        <Tooltip
          formatter={((value: number, name: string) => [
            `${value.toLocaleString()} kN`,
            name === 'H' ? 'Horizontal Tension' : 'Max Tension',
          ]) as never}
          labelFormatter={(label) => `L/${label}`}
          contentStyle={{ fontSize: 11 }}
        />
        <Line type="monotone" dataKey="H" stroke="#0891b2" strokeWidth={2} dot={{ r: 2 }} name="H" />
        <Line type="monotone" dataKey="Tmax" stroke="#dc2626" strokeWidth={2} dot={{ r: 2 }} name="Tmax" />
      </LineChart>
    </ResponsiveContainer>
  );
};
