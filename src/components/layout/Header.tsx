import React, { useRef } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { saveAs } from 'file-saver';
import { generatePDFReport } from '../../services/pdfReport';

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
    generatePDFReport(
      store.project,
      store.solverResult,
      store.stressResult,
      store.elongationResult,
      store.pulleyResult,
      store.pulleyResultA,
      store.deadBlockResult,
      store.deadBlockResultA,
      store.engineeringChecks
    );
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
