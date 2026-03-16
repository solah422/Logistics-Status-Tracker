import React from 'react';
import { usePackages } from '../store/PackageContext';
import { FINAL_STATUSES } from '../types';
import { PackageSearch, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export const Dashboard = () => {
  const { activePackages } = usePackages();

  const total = activePackages.length;
  const completed = activePackages.filter(p => FINAL_STATUSES.includes(p.status)).length;
  const pending = activePackages.filter(p => p.status === 'Pending').length;
  const actionRequired = activePackages.filter(p => 
    p.status === 'Clarification Required' || 
    p.status === 'Customs Processed' // Needs payment
  ).length;

  const stats = [
    { label: 'Total Packages', value: total, icon: PackageSearch, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Completed', value: completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Pending', value: pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Action Required', value: actionRequired, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
                <p className="text-2xl font-semibold text-zinc-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {activePackages.slice(0, 5).map(pkg => (
            <div key={pkg.id} className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0">
              <div>
                <p className="font-medium text-zinc-900">{pkg.rNumberIdNumber || pkg.trackingNumber}</p>
                <p className="text-sm text-zinc-500">Status changed to <span className="font-medium text-zinc-700">{pkg.status}</span></p>
              </div>
              <span className="text-sm text-zinc-400">
                {new Date(pkg.updatedAt).toLocaleDateString()}
              </span>
            </div>
          ))}
          {activePackages.length === 0 && (
            <p className="text-zinc-500 text-sm text-center py-4">No packages found. Add one to get started.</p>
          )}
        </div>
      </div>
    </div>
  );
};
