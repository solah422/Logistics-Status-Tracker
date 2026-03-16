import React, { useMemo } from 'react';
import { usePackages } from '../store/PackageContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { differenceInDays, parseISO } from 'date-fns';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#64748b'];

export const Reports = () => {
  const { activePackages } = usePackages();

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    activePackages.forEach(pkg => {
      counts[pkg.status] = (counts[pkg.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [activePackages]);

  const timelineData = useMemo(() => {
    const completedPackages = activePackages.filter(p => p.dateSubmitted && p.dateReleased);
    
    // Group by processing time (days)
    const timeDistribution: Record<string, number> = {
      '0-2 Days': 0,
      '3-5 Days': 0,
      '6-10 Days': 0,
      '11+ Days': 0,
    };

    completedPackages.forEach(pkg => {
      const days = differenceInDays(parseISO(pkg.dateReleased!), parseISO(pkg.dateSubmitted!));
      if (days <= 2) timeDistribution['0-2 Days']++;
      else if (days <= 5) timeDistribution['3-5 Days']++;
      else if (days <= 10) timeDistribution['6-10 Days']++;
      else timeDistribution['11+ Days']++;
    });

    return Object.entries(timeDistribution).map(([name, value]) => ({ name, value }));
  }, [activePackages]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900 mb-6">Current Status Distribution</h2>
          <div className="h-80 w-full">
            {activePackages.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-400">No data available</div>
            )}
          </div>
        </div>

        {/* Processing Time */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900 mb-6">Processing Time (Submitted to Released)</h2>
          <div className="h-80 w-full">
            {activePackages.filter(p => p.dateSubmitted && p.dateReleased).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a' }} />
                  <Tooltip
                    cursor={{ fill: '#f4f4f5' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-400">
                Not enough completed packages with dates to show timeline.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
