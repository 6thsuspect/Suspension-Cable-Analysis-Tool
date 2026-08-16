import React, { useEffect, useState } from 'react';
import { Header } from './components/layout/Header';
import { InputPanel } from './components/inputs/InputPanel';
import { CableDiagram } from './components/diagrams/CableDiagram';
import { ResultsPanel } from './components/results/ResultsPanel';
import { ChartsPanel } from './components/charts/ChartsPanel';
import { CalculationPanel } from './components/calculations/CalculationPanel';
import { FreeBodyDiagram } from './components/diagrams/FreeBodyDiagram';
import { useProjectStore } from './store/useProjectStore';

type BottomTab = 'charts' | 'calculations' | 'fbd';

const App: React.FC = () => {
  const { loadFromLocalStorage } = useProjectStore();
  const [bottomTab, setBottomTab] = useState<BottomTab>('charts');

  useEffect(() => {
    loadFromLocalStorage();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-slate-100 text-slate-800 overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Input Panel */}
        <div className="w-64 min-w-[240px] flex-shrink-0 overflow-hidden">
          <InputPanel />
        </div>

        {/* Center: Diagram + Bottom Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top: Interactive Cable Diagram */}
          <div className="flex-1 min-h-0 p-2">
            <CableDiagram />
          </div>

          {/* Bottom tab nav */}
          <div className="flex items-center bg-white border-t border-slate-200 px-2">
            <button
              onClick={() => setBottomTab('charts')}
              className={`px-4 py-1.5 text-xs font-medium border-b-2 transition ${
                bottomTab === 'charts'
                  ? 'border-cyan-500 text-cyan-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              📈 Charts & Graphs
            </button>
            <button
              onClick={() => setBottomTab('fbd')}
              className={`px-4 py-1.5 text-xs font-medium border-b-2 transition ${
                bottomTab === 'fbd'
                  ? 'border-cyan-500 text-cyan-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              ⚖️ Free Body Diagrams
            </button>
            <button
              onClick={() => setBottomTab('calculations')}
              className={`px-4 py-1.5 text-xs font-medium border-b-2 transition ${
                bottomTab === 'calculations'
                  ? 'border-cyan-500 text-cyan-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              📝 Calculations
            </button>
          </div>

          {/* Bottom: Charts, FBD, or Calculations */}
          <div className="h-64 min-h-[200px] overflow-hidden">
            {bottomTab === 'charts' && <ChartsPanel />}
            {bottomTab === 'fbd' && <FreeBodyDiagram />}
            {bottomTab === 'calculations' && <CalculationPanel />}
          </div>
        </div>

        {/* Right: Results Panel */}
        <div className="w-64 min-w-[220px] flex-shrink-0 overflow-hidden">
          <ResultsPanel />
        </div>
      </div>
    </div>
  );
};

export default App;
