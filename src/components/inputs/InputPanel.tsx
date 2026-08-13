import React from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { GeometryInput } from './GeometryInput';
import { CableInput } from './CableInput';
import { LoadInput } from './LoadInput';
import { SettingsInput } from './SettingsInput';
import { DeadBlockInput } from './DeadBlockInput';

const tabs = [
  { id: 'geometry', label: 'Geometry', icon: '📐' },
  { id: 'cable', label: 'Cable', icon: '🔗' },
  { id: 'loads', label: 'Loads', icon: '⬇️' },
  { id: 'deadblock', label: 'Dead Block', icon: '🧱' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export const InputPanel: React.FC = () => {
  const { activeTab, setActiveTab } = useProjectStore();

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200">
      {/* Tab navigation */}
      <div className="flex border-b border-slate-200 bg-white">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-cyan-50 text-cyan-700 border-b-2 border-cyan-500'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="block text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'geometry' && <GeometryInput />}
        {activeTab === 'cable' && <CableInput />}
        {activeTab === 'loads' && <LoadInput />}
        {activeTab === 'deadblock' && <DeadBlockInput />}
        {activeTab === 'settings' && <SettingsInput />}
      </div>
    </div>
  );
};
