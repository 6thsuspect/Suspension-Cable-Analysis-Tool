import React, { useRef } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';

export const Header: React.FC = () => {
  const { project, exportProject, importProject, newProject } = useProjectStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = () => {
    const json = exportProject();
    const blob = new Blob([json], { type: 'application/json' });
    saveAs(blob, `${project.name.replace(/\s+/g, '-')}.json`);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        importProject(ev.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const handleExportPDF = () => {
    const store = useProjectStore.getState();
    const {
      solverResult,
      stressResult,
      pulleyResult,
      pulleyResultA,
      deadBlockResult,
      deadBlockResultA,
      engineeringChecks,
    } = store;
    const doc = new jsPDF();

    // Cover
    doc.setFontSize(24);
    doc.text('Suspension Cable Analysis', 20, 30);
    doc.setFontSize(14);
    doc.text('Engineering Calculation Report', 20, 42);
    doc.setFontSize(10);
    doc.text(`Project: ${project.name}`, 20, 60);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 68);
    doc.text(`Version: ${project.version}`, 20, 76);

    // Geometry
    doc.addPage();
    doc.setFontSize(16);
    doc.text('1. Geometry', 20, 20);
    doc.setFontSize(10);
    const geo = project.geometry;
    const span = geo.rightPylonX - geo.leftPylonX;
    doc.text(`Span: ${span.toFixed(1)} m`, 20, 35);
    doc.text(`Left Pylon: (${geo.leftPylonX}, ${geo.leftPylonY}) m`, 20, 43);
    doc.text(`Right Pylon: (${geo.rightPylonX}, ${geo.rightPylonY}) m`, 20, 51);
    doc.text(`Sag: ${geo.sag.toFixed(2)} m`, 20, 59);

    // Cable Properties
    doc.setFontSize(16);
    doc.text('2. Cable Properties', 20, 75);
    doc.setFontSize(10);
    const c = project.cable;
    doc.text(`Area: ${c.area} mm²`, 20, 90);
    doc.text(`Diameter: ${c.diameter} mm`, 20, 98);
    doc.text(`E: ${c.youngsModulus} MPa`, 20, 106);
    doc.text(`Unit Weight: ${c.unitWeight} kN/m`, 20, 114);
    doc.text(`Allowable Stress: ${c.allowableStress} MPa`, 20, 122);

    // Results
    if (solverResult) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text('3. Cable Analysis Results', 20, 20);
      doc.setFontSize(10);
      doc.text(`Horizontal Tension H: ${solverResult.horizontalTension.toFixed(2)} kN`, 20, 35);
      doc.text(`Maximum Tension: ${solverResult.maxTension.toFixed(2)} kN`, 20, 43);
      doc.text(`Minimum Tension: ${solverResult.minTension.toFixed(2)} kN`, 20, 51);
      doc.text(`Cable Length: ${solverResult.cableLength.toFixed(3)} m`, 20, 59);
      doc.text(`Converged: ${solverResult.converged ? 'Yes' : 'No'}`, 20, 67);
      doc.text(`Iterations: ${solverResult.iterations}`, 20, 75);
      doc.text(`Residual Error: ${solverResult.error.toExponential(3)}`, 20, 83);

      if (stressResult) {
        doc.text(`Max Stress: ${stressResult.maxStress.toFixed(1)} MPa`, 20, 99);
        doc.text(`Utilization: ${(stressResult.utilization * 100).toFixed(1)}%`, 20, 107);
        doc.text(`Status: ${stressResult.status}`, 20, 115);
      }

      if (pulleyResult || pulleyResultA) {
        doc.setFontSize(16);
        doc.text('4. Pylon / Pulley Forces', 20, 135);
        doc.setFontSize(10);
        let yy = 150;
        if (pulleyResultA) {
          doc.text('Pylon A (Left):', 20, yy);
          doc.text(`Rx: ${pulleyResultA.Rx.toFixed(2)} kN, Ry: ${pulleyResultA.Ry.toFixed(2)} kN, R: ${pulleyResultA.R.toFixed(2)} kN`, 25, yy + 8);
          yy += 16;
        }
        if (pulleyResult) {
          doc.text('Pylon B (Right):', 20, yy);
          doc.text(`Rx: ${pulleyResult.Rx.toFixed(2)} kN, Ry: ${pulleyResult.Ry.toFixed(2)} kN, R: ${pulleyResult.R.toFixed(2)} kN`, 25, yy + 8);
          yy += 16;
        }
        doc.setFontSize(16);
        doc.text('5. Dead Block / Anchor Forces', 20, yy + 6);
        doc.setFontSize(10);
        yy += 21;
        if (deadBlockResultA) {
          doc.text('Anchor A (Left):', 20, yy);
          doc.text(`H: ${deadBlockResultA.Hd.toFixed(2)} kN, V: ${deadBlockResultA.Vd.toFixed(2)} kN, R: ${deadBlockResultA.Rd.toFixed(2)} kN`, 25, yy + 8);
          if (deadBlockResultA.slidingFS !== null) {
            doc.text(`Sliding FS: ${deadBlockResultA.slidingFS.toFixed(2)}, Overturning FS: ${deadBlockResultA.overturningFS !== null ? deadBlockResultA.overturningFS.toFixed(2) : 'n/a'}`, 25, yy + 16);
          }
          yy += 24;
        }
        if (deadBlockResult) {
          doc.text('Anchor B (Right):', 20, yy);
          doc.text(`H: ${deadBlockResult.Hd.toFixed(2)} kN, V: ${deadBlockResult.Vd.toFixed(2)} kN, R: ${deadBlockResult.Rd.toFixed(2)} kN`, 25, yy + 8);
          if (deadBlockResult.slidingFS !== null) {
            doc.text(`Sliding FS: ${deadBlockResult.slidingFS.toFixed(2)}, Overturning FS: ${deadBlockResult.overturningFS !== null ? deadBlockResult.overturningFS.toFixed(2) : 'n/a'}`, 25, yy + 16);
          }
        }
      }
    }

    // Engineering Checks
    if (engineeringChecks.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text('6. Engineering Checks', 20, 20);
      doc.setFontSize(10);
      let yy = 35;
      for (const check of engineeringChecks) {
        const icon = check.passed ? '✓' : '✗';
        doc.text(`${icon} ${check.name}: ${check.value}`, 20, yy);
        yy += 10;
      }
    }

    // Assumptions
    doc.addPage();
    doc.setFontSize(16);
    doc.text('7. Analysis Assumptions', 20, 20);
    doc.setFontSize(10);
    const assumptions = [
      'Cable treated as perfectly flexible',
      'Cable carries tension only',
      'Pulley assumed frictionless',
      'Loads assumed vertical',
      `Self-weight applied per ${project.cable.weightBasis === 'horizontal' ? 'horizontal projection' : 'arc length'}`,
      'Small-strain elastic behavior',
      'No cable bending stiffness',
    ];
    assumptions.forEach((a, i) => {
      doc.text(`• ${a}`, 20, 35 + i * 10);
    });

    doc.save(`${project.name.replace(/\s+/g, '-')}-Report.pdf`);
  };

  return (
    <header className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 16 Q12 4 22 16" />
            <line x1="2" y1="16" x2="2" y2="20" />
            <line x1="22" y1="16" x2="22" y2="20" />
            <line x1="12" y1="10" x2="12" y2="15" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
          <h1 className="text-lg font-bold tracking-tight">Suspension Cable Analyzer</h1>
        </div>
        <span className="text-xs text-slate-400 ml-2">v{project.version}</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={newProject}
          className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded transition"
        >
          New
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded transition"
        >
          Open
        </button>
        <button
          onClick={handleExportJSON}
          className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded transition"
        >
          Save JSON
        </button>
        <button
          onClick={handleExportPDF}
          className="px-3 py-1.5 text-xs bg-cyan-700 hover:bg-cyan-600 rounded transition"
        >
          PDF Report
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportJSON}
          className="hidden"
        />
      </div>
    </header>
  );
};
