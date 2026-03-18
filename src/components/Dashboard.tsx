import React, { useMemo, useState, useEffect } from "react";
import { usePackages } from "../store/PackageContext";
import { FINAL_STATUSES } from "../types";
import {
  PackageSearch,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  Settings2,
  Filter,
  X
} from "lucide-react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardConfig {
  showStats: boolean;
  showStatusChart: boolean;
  showPriorityChart: boolean;
  showNotes: boolean;
  showActivity: boolean;
  showSavedFilters: boolean;
}

const DEFAULT_CONFIG: DashboardConfig = {
  showStats: true,
  showStatusChart: true,
  showPriorityChart: true,
  showNotes: true,
  showActivity: true,
  showSavedFilters: true,
};

export const Dashboard = () => {
  const { activePackages, statuses, statusColors, savedFilters } = usePackages();
  const [notes, setNotes] = useState(
    () => localStorage.getItem("dashboardNotes") || "",
  );
  
  const [config, setConfig] = useState<DashboardConfig>(() => {
    const saved = localStorage.getItem("dashboardConfig");
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });
  
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("dashboardConfig", JSON.stringify(config));
  }, [config]);

  const toggleConfig = (key: keyof DashboardConfig) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Stats
  const total = activePackages.length;
  const completed = activePackages.filter((p) =>
    FINAL_STATUSES.includes(p.status),
  ).length;
  const pending = activePackages.filter((p) => p.status === "Pending").length;
  const actionRequired = activePackages.filter(
    (p) =>
      p.status === "Clarification Required" || p.status === "Customs Processed",
  ).length;

  // Charts Data
  const priorityData = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, urgent: 0 };
    activePackages.forEach((p) => {
      if (p.priority) counts[p.priority as keyof typeof counts]++;
    });
    return [
      { name: "Low", value: counts.low, color: "#d4d4d8" },
      { name: "Medium", value: counts.medium, color: "#60a5fa" },
      { name: "High", value: counts.high, color: "#f59e0b" },
      { name: "Urgent", value: counts.urgent, color: "#f43f5e" },
    ].filter((d) => d.value > 0);
  }, [activePackages]);

  const statusData = useMemo(() => {
    return statuses.map((status) => ({
      name: status,
      count: activePackages.filter((p) => p.status === status).length,
    }));
  }, [activePackages, statuses]);

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Dashboard
            </h1>
            <div className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-1">
              <Clock size={16} />
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm transition-colors"
            title="Customize Dashboard"
          >
            <Settings2 size={20} />
          </button>
        </div>

        {isConfigOpen && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Customize Dashboard</h3>
              <button onClick={() => setIsConfigOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={config.showStats} onChange={() => toggleConfig('showStats')} className="rounded text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Top Stats Row</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={config.showStatusChart} onChange={() => toggleConfig('showStatusChart')} className="rounded text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Status Chart</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={config.showPriorityChart} onChange={() => toggleConfig('showPriorityChart')} className="rounded text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Priority Chart</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={config.showNotes} onChange={() => toggleConfig('showNotes')} className="rounded text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Quick Notes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={config.showActivity} onChange={() => toggleConfig('showActivity')} className="rounded text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Recent Activity</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={config.showSavedFilters} onChange={() => toggleConfig('showSavedFilters')} className="rounded text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Saved Filters</span>
              </label>
            </div>
          </div>
        )}

      {/* Top Stats Row */}
      {config.showStats && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <PackageSearch size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Packages</p>
            <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{total}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Completed</p>
            <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{completed}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Pending</p>
            <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{pending}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Action Required</p>
            <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{actionRequired}</p>
          </div>
        </div>
      </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Charts */}
        <div className="lg:col-span-2 space-y-6">
          {config.showStatusChart && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Packages by Status</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <RechartsBarChart
                  data={statusData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#71717a' }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a' }} />
                  <Tooltip
                    cursor={{ fill: "rgba(161, 161, 170, 0.1)" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {statusData.map((entry, index) => {
                      const colorClass = statusColors[entry.name] || "";
                      let fill = "#94a3b8"; // default
                      if (colorClass.includes("emerald")) fill = "#10b981";
                      else if (colorClass.includes("blue")) fill = "#3b82f6";
                      else if (colorClass.includes("amber")) fill = "#f59e0b";
                      else if (colorClass.includes("rose")) fill = "#f43f5e";
                      else if (colorClass.includes("purple")) fill = "#a855f7";
                      else if (colorClass.includes("indigo")) fill = "#6366f1";
                      else if (colorClass.includes("teal")) fill = "#14b8a6";
                      else if (colorClass.includes("orange")) fill = "#f97316";
                      else if (colorClass.includes("red")) fill = "#ef4444";
                      return <Cell key={`cell-${index}`} fill={fill} />;
                    })}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {config.showPriorityChart && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Priority Breakdown</h3>
              <div className="h-[200px] w-full">
                {priorityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <RechartsPieChart>
                      <Pie
                        data={priorityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-zinc-500">
                    No priority data
                  </div>
                )}
              </div>
            </div>
            )}

            {config.showNotes && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Quick Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  localStorage.setItem("dashboardNotes", e.target.value);
                }}
                className="w-full h-[200px] resize-none bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-700 dark:text-zinc-300 placeholder-zinc-400"
                placeholder="Type quick notes here..."
              />
            </div>
            )}
          </div>
        </div>

        {/* Right Column: Activity & Info */}
        <div className="space-y-6">
          {config.showSavedFilters && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Filter size={18} className="text-indigo-500" />
                  Pinned Filters
                </h3>
              </div>
              <div className="p-4">
                {savedFilters.length > 0 ? (
                  <div className="space-y-2">
                    {savedFilters.map((filter) => (
                      <div
                        key={filter.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50"
                      >
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {filter.name}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {Object.keys(filter.criteria).length} criteria
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 text-center py-4">
                    No saved filters
                  </p>
                )}
              </div>
            </div>
          )}

          {config.showActivity && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Activity size={18} className="text-indigo-500" />
                Recent Activity
              </h3>
            </div>
            <div className="p-4">
              {activePackages.length > 0 ? (
                <div className="space-y-4">
                  {activePackages
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.updatedAt).getTime() -
                        new Date(a.updatedAt).getTime(),
                    )
                    .slice(0, 10)
                    .map((pkg) => (
                      <div
                        key={pkg.id}
                        className="flex items-start gap-3 text-sm"
                      >
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-indigo-500 shrink-0" />
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {pkg.trackingNumber}
                          </p>
                          <p className="text-zinc-500 dark:text-zinc-400">
                            Status updated to {pkg.status}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 text-center py-4">
                  No recent activity
                </p>
              )}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};
