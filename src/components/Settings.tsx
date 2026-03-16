import React, { useState } from 'react';
import { usePackages } from '../store/PackageContext';
import { Plus, Settings2, Trash2 } from 'lucide-react';

export const Settings = () => {
  const { statuses, addStatus } = usePackages();
  const [newStatus, setNewStatus] = useState('');

  const handleAddStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStatus.trim() && !statuses.includes(newStatus.trim())) {
      addStatus(newStatus.trim());
      setNewStatus('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-zinc-100 text-zinc-600 rounded-lg">
            <Settings2 size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Custom Statuses</h2>
            <p className="text-sm text-zinc-500">Manage the list of available statuses for packages.</p>
          </div>
        </div>

        <form onSubmit={handleAddStatus} className="flex gap-3 mb-6">
          <input
            type="text"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            placeholder="Enter new status name..."
            className="flex-1 px-4 py-2 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <button
            type="submit"
            disabled={!newStatus.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
          >
            <Plus size={18} />
            Add Status
          </button>
        </form>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-zinc-700 mb-3">Current Statuses</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {statuses.map((status, index) => (
              <div 
                key={index}
                className="flex items-center justify-between px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg"
              >
                <span className="text-sm font-medium text-zinc-800">{status}</span>
                {/* We don't allow deleting default statuses for data integrity, but could add it later */}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
