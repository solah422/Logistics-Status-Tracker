import React, { useMemo, useState, useRef } from "react";
import { usePackages } from "../store/PackageContext";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  differenceInDays,
  parseISO,
  subDays,
  isAfter,
  startOfMonth,
} from "date-fns";
import { Download, Filter } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const COLORS = [
  "#4f46e5",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#64748b",
];

type DateRange = "all" | "7days" | "30days" | "month";

export const Reports = () => {
  const { activePackages } = usePackages();
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const filteredPackages = useMemo(() => {
    const now = new Date();
    return activePackages.filter((pkg) => {
      if (dateRange === "all") return true;

      const pkgDate = pkg.dateSubmitted
        ? parseISO(pkg.dateSubmitted)
        : parseISO(pkg.createdAt);

      if (dateRange === "7days") return isAfter(pkgDate, subDays(now, 7));
      if (dateRange === "30days") return isAfter(pkgDate, subDays(now, 30));
      if (dateRange === "month") return isAfter(pkgDate, startOfMonth(now));

      return true;
    });
  }, [activePackages, dateRange]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredPackages.forEach((pkg) => {
      counts[pkg.status] = (counts[pkg.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredPackages]);

  const timelineData = useMemo(() => {
    const completedPackages = filteredPackages.filter(
      (p) => p.dateSubmitted && p.dateReleased,
    );

    // Group by processing time (days)
    const timeDistribution: Record<string, number> = {
      "0-2 Days": 0,
      "3-5 Days": 0,
      "6-10 Days": 0,
      "11+ Days": 0,
    };

    completedPackages.forEach((pkg) => {
      const days = differenceInDays(
        parseISO(pkg.dateReleased!),
        parseISO(pkg.dateSubmitted!),
      );
      if (days <= 2) timeDistribution["0-2 Days"]++;
      else if (days <= 5) timeDistribution["3-5 Days"]++;
      else if (days <= 10) timeDistribution["6-10 Days"]++;
      else timeDistribution["11+ Days"]++;
    });

    return Object.entries(timeDistribution).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredPackages]);

  const summaryStats = useMemo(() => {
    const completed = filteredPackages.filter(
      (p) => p.dateSubmitted && p.dateReleased,
    );
    const avgDays =
      completed.length > 0
        ? completed.reduce(
            (acc, pkg) =>
              acc +
              differenceInDays(
                parseISO(pkg.dateReleased!),
                parseISO(pkg.dateSubmitted!),
              ),
            0,
          ) / completed.length
        : 0;

    return {
      total: filteredPackages.length,
      completed: completed.length,
      avgProcessingTime: avgDays.toFixed(1),
    };
  }, [filteredPackages]);

  const generatePDF = async () => {
    try {
      setIsGeneratingPdf(true);

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Title
      doc.setFontSize(24);
      doc.setTextColor(30, 41, 59); // zinc-800
      doc.text("Logistics Report", 14, yPos);
      
      // Date Range
      yPos += 8;
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139); // zinc-500
      const dateRangeText = 
        dateRange === "all" ? "All Time" :
        dateRange === "7days" ? "Last 7 Days" :
        dateRange === "30days" ? "Last 30 Days" : "This Month";
      doc.text(`Date Range: ${dateRangeText} | Generated: ${new Date().toLocaleDateString()}`, 14, yPos);

      // Summary Stats
      yPos += 15;
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text("Summary", 14, yPos);
      
      yPos += 8;
      autoTable(doc, {
        startY: yPos,
        head: [["Total Packages", "Completed Packages", "Avg. Processing Time"]],
        body: [[
          summaryStats.total.toString(),
          summaryStats.completed.toString(),
          `${summaryStats.avgProcessingTime} days`
        ]],
        theme: "grid",
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
        styles: { fontSize: 12, halign: "center" },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Status Distribution Table
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text("Status Distribution", 14, yPos);
      
      yPos += 8;
      autoTable(doc, {
        startY: yPos,
        head: [["Status", "Count"]],
        body: statusData.map(d => [d.name, d.count.toString()]),
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Processing Time Table
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text("Processing Time (Submitted to Released)", 14, yPos);
      
      yPos += 8;
      autoTable(doc, {
        startY: yPos,
        head: [["Duration", "Count"]],
        body: timelineData.map(d => [d.name, d.value.toString()]),
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Package Details
      doc.addPage();
      yPos = 20;
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text("Package Details", 14, yPos);

      yPos += 8;
      const tableData = filteredPackages.map(pkg => [
        pkg.trackingNumber || "N/A",
        pkg.status,
        pkg.priority || "Medium",
        pkg.dateSubmitted ? new Date(pkg.dateSubmitted).toLocaleDateString() : "N/A",
        pkg.dateReleased ? new Date(pkg.dateReleased).toLocaleDateString() : "N/A"
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Tracking Number", "Status", "Priority", "Submitted", "Released"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
        styles: { fontSize: 9 },
      });

      doc.save(`logistics-report-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(
        `Failed to generate PDF report: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Filter size={20} />
          </div>
          <div>
            <label
              htmlFor="dateRange"
              className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1"
            >
              Date Range
            </label>
            <select
              id="dateRange"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-1.5 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option
                value="all"
                className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                All Time
              </option>
              <option
                value="7days"
                className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                Last 7 Days
              </option>
              <option
                value="30days"
                className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                Last 30 Days
              </option>
              <option
                value="month"
                className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                This Month
              </option>
            </select>
          </div>
        </div>

        <button
          onClick={generatePDF}
          disabled={isGeneratingPdf || filteredPackages.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
        >
          <Download size={16} />
          {isGeneratingPdf ? "Generating..." : "Export PDF"}
        </button>
      </div>

      {/* Report Content (Target for PDF) */}
      <div ref={reportRef} className="flex flex-col gap-6 p-1 bg-transparent">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Total Packages
            </h3>
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
              {summaryStats.total}
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Completed Packages
            </h3>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
              {summaryStats.completed}
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Avg. Processing Time
            </h3>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
              {summaryStats.avgProcessingTime}{" "}
              <span className="text-base font-normal text-zinc-500">days</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
              Status Distribution
            </h2>
            <div className="h-80 w-full" style={{ minHeight: 320 }}>
              {filteredPackages.length > 0 ? (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={0}
                  minHeight={320}
                >
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
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-400">
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* Processing Time */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
              Processing Time (Submitted to Released)
            </h2>
            <div className="h-80 w-full" style={{ minHeight: 320 }}>
              {filteredPackages.filter((p) => p.dateSubmitted && p.dateReleased)
                .length > 0 ? (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={0}
                  minHeight={320}
                >
                  <BarChart
                    data={timelineData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e4e4e7"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#71717a" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#71717a" }}
                    />
                    <Tooltip
                      cursor={{ fill: "#f4f4f5" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="#4f46e5"
                      radius={[4, 4, 0, 0]}
                    />
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

        {/* Recent Packages Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Recent Packages
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Tracking Number
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Date Submitted
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredPackages.slice(0, 10).map((pkg) => (
                  <tr
                    key={pkg.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {pkg.trackingNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                        {pkg.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        {pkg.dateSubmitted
                          ? new Date(pkg.dateSubmitted).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredPackages.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400"
                    >
                      No packages found in the selected date range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
