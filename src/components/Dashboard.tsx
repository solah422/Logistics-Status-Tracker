import React, { useState, useMemo } from "react";
import { usePackages } from "../store/PackageContext";
import { FINAL_STATUSES } from "../types";
import {
  PackageSearch,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
  GripHorizontal,
  Cloud,
  Calendar,
  FileText,
  TrendingUp,
  PieChart,
  BarChart,
  Zap,
  Globe,
  Activity,
  Plus,
  X,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

// Widget Types
type WidgetType =
  | "total"
  | "completed"
  | "pending"
  | "actionRequired"
  | "recentActivity"
  | "timeDate"
  | "weather"
  | "notes"
  | "news"
  | "priorityChart"
  | "statusChart"
  | "avgTime"
  | "deadlines"
  | "quickAdd"
  | "systemStatus"
  | "exchangeRates";

interface Widget {
  id: WidgetType;
  title: string;
  size: "small" | "medium" | "large";
}

const AVAILABLE_WIDGETS: Widget[] = [
  { id: "total", title: "Total Packages", size: "small" },
  { id: "completed", title: "Completed", size: "small" },
  { id: "pending", title: "Pending", size: "small" },
  { id: "actionRequired", title: "Action Required", size: "small" },
  { id: "recentActivity", title: "Recent Activity", size: "medium" },
  { id: "timeDate", title: "Time & Date", size: "small" },
  { id: "weather", title: "Weather", size: "small" },
  { id: "notes", title: "Quick Notes", size: "medium" },
  { id: "news", title: "Logistics News", size: "medium" },
  { id: "priorityChart", title: "Priority Breakdown", size: "medium" },
  { id: "statusChart", title: "Packages by Status", size: "large" },
  { id: "avgTime", title: "Avg Processing Time", size: "small" },
  { id: "deadlines", title: "Upcoming Deadlines", size: "medium" },
  { id: "quickAdd", title: "Quick Add", size: "medium" },
  { id: "systemStatus", title: "System Status", size: "small" },
  { id: "exchangeRates", title: "Exchange Rates", size: "small" },
];

const DEFAULT_LAYOUT: WidgetType[] = [
  "total",
  "completed",
  "pending",
  "actionRequired",
  "recentActivity",
  "statusChart",
  "priorityChart",
  "notes",
];

interface SortableWidgetProps {
  key?: string | number;
  widget: Widget;
  size: "small" | "medium" | "large";
  onRemove: (id: WidgetType) => void;
  onResize: (id: WidgetType) => void;
  children: React.ReactNode;
}

const SortableWidget = ({
  widget,
  size,
  onRemove,
  onResize,
  children,
}: SortableWidgetProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const colSpan =
    size === "small"
      ? "col-span-1"
      : size === "medium"
        ? "col-span-1 md:col-span-2"
        : "col-span-1 md:col-span-2 lg:col-span-3";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col ${colSpan}`}
    >
      <div className="flex justify-between items-center p-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 rounded-t-xl group">
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <GripHorizontal size={16} />
          </div>
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {widget.title}
          </h3>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onResize(widget.id)}
            className="text-zinc-400 hover:text-indigo-500 text-xs font-medium px-1"
          >
            {size === "small" ? "M" : size === "medium" ? "L" : "S"}
          </button>
          <button
            onClick={() => onRemove(widget.id)}
            className="text-zinc-400 hover:text-rose-500"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="p-4 flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

export const Dashboard = () => {
  const { activePackages, statuses, statusColors } = usePackages();
  const [layout, setLayout] = useState<WidgetType[]>(() => {
    const saved = localStorage.getItem("dashboardLayout");
    return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
  });
  const [widgetSizes, setWidgetSizes] = useState<
    Record<string, "small" | "medium" | "large">
  >(() => {
    const saved = localStorage.getItem("dashboardWidgetSizes");
    return saved ? JSON.parse(saved) : {};
  });
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(
    () => localStorage.getItem("dashboardNotes") || "",
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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
      if (p.priority) counts[p.priority]++;
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setLayout((items) => {
        const oldIndex = items.indexOf(active.id as WidgetType);
        const newIndex = items.indexOf(over!.id as WidgetType);
        const newLayout = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem("dashboardLayout", JSON.stringify(newLayout));
        return newLayout;
      });
    }
  };

  const addWidget = (id: WidgetType) => {
    if (!layout.includes(id)) {
      const newLayout = [...layout, id];
      setLayout(newLayout);
      localStorage.setItem("dashboardLayout", JSON.stringify(newLayout));
    }
  };

  const removeWidget = (id: WidgetType) => {
    const newLayout = layout.filter((w) => w !== id);
    setLayout(newLayout);
    localStorage.setItem("dashboardLayout", JSON.stringify(newLayout));
  };

  const resizeWidget = (id: WidgetType) => {
    setWidgetSizes((prev) => {
      const currentSize =
        prev[id] || AVAILABLE_WIDGETS.find((w) => w.id === id)?.size || "small";
      const newSize =
        currentSize === "small"
          ? "medium"
          : currentSize === "medium"
            ? "large"
            : "small";
      const newSizes = { ...prev, [id]: newSize };
      localStorage.setItem("dashboardWidgetSizes", JSON.stringify(newSizes));
      return newSizes;
    });
  };

  const renderWidgetContent = (id: WidgetType) => {
    switch (id) {
      case "total":
        return (
          <div className="flex items-center gap-4 h-full">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <PackageSearch size={24} />
            </div>
            <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
              {total}
            </p>
          </div>
        );
      case "completed":
        return (
          <div className="flex items-center gap-4 h-full">
            <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
              {completed}
            </p>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center gap-4 h-full">
            <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
              <Clock size={24} />
            </div>
            <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
              {pending}
            </p>
          </div>
        );
      case "actionRequired":
        return (
          <div className="flex items-center gap-4 h-full">
            <div className="p-3 rounded-lg bg-rose-100 text-rose-600">
              <AlertCircle size={24} />
            </div>
            <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
              {actionRequired}
            </p>
          </div>
        );
      case "recentActivity":
        return (
          <div className="space-y-3 overflow-y-auto h-full pr-2">
            {activePackages.slice(0, 5).map((pkg) => (
              <div
                key={pkg.id}
                className="flex justify-between items-center text-sm border-b border-zinc-100 dark:border-zinc-800 pb-2 last:border-0"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {pkg.trackingNumber}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {pkg.status}
                </span>
              </div>
            ))}
            {activePackages.length === 0 && (
              <p className="text-zinc-500 text-sm">No recent activity</p>
            )}
          </div>
        );
      case "timeDate":
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        );
      case "weather":
        return (
          <div className="flex items-center justify-center gap-4 h-full text-zinc-700 dark:text-zinc-300">
            <Cloud size={32} className="text-blue-400" />
            <div>
              <p className="text-2xl font-bold">24°C</p>
              <p className="text-sm">Partly Cloudy</p>
            </div>
          </div>
        );
      case "notes":
        return (
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              localStorage.setItem("dashboardNotes", e.target.value);
            }}
            className="w-full h-full min-h-[100px] resize-none bg-transparent border-none focus:ring-0 text-sm text-zinc-700 dark:text-zinc-300 placeholder-zinc-400"
            placeholder="Type quick notes here..."
          />
        );
      case "news":
        return (
          <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
            <li className="flex gap-2">
              <Globe size={16} className="text-indigo-500 shrink-0 mt-0.5" />
              <span>Global shipping rates stabilize after Q1 surge.</span>
            </li>
            <li className="flex gap-2">
              <Globe size={16} className="text-indigo-500 shrink-0 mt-0.5" />
              <span>
                New customs regulations for EU imports starting next month.
              </span>
            </li>
            <li className="flex gap-2">
              <Globe size={16} className="text-indigo-500 shrink-0 mt-0.5" />
              <span>Port congestion eases in major Asian hubs.</span>
            </li>
          </ul>
        );
      case "priorityChart":
        return (
          <div className="h-full min-h-[150px]">
            {priorityData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={0}
              >
                <RechartsPieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-zinc-500 text-center mt-8">
                No priority data
              </p>
            )}
          </div>
        );
      case "statusChart":
        return (
          <div className="h-full min-h-[200px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
            >
              <RechartsBarChart
                data={statusData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        );
      case "avgTime":
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              3.2
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Days Average
            </p>
          </div>
        );
      case "deadlines":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
              <span className="flex-1 truncate">
                Customs Clearance - PKG-892
              </span>
              <span className="text-zinc-500">Today</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="flex-1 truncate">Payment Due - PKG-104</span>
              <span className="text-zinc-500">Tomorrow</span>
            </div>
          </div>
        );
      case "quickAdd":
        return (
          <div className="flex items-center justify-center h-full">
            <button className="flex flex-col items-center gap-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
                <Plus size={24} />
              </div>
              <span className="text-sm font-medium">New Package</span>
            </button>
          </div>
        );
      case "systemStatus":
        return (
          <div className="flex items-center justify-center gap-3 h-full">
            <div className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
            </div>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              All Systems Operational
            </span>
          </div>
        );
      case "exchangeRates":
        return (
          <div className="grid grid-cols-2 gap-2 text-sm h-full content-center">
            <div className="bg-zinc-50 dark:bg-zinc-800 p-2 rounded text-center">
              <p className="text-zinc-500 text-xs">USD/EUR</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                0.92
              </p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800 p-2 rounded text-center">
              <p className="text-zinc-500 text-xs">USD/GBP</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                0.79
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Dashboard
        </h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isEditing ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"}`}
        >
          <Settings size={16} />
          {isEditing ? "Done Editing" : "Customize"}
        </button>
      </div>

      {isEditing && (
        <div className="bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-900/50 rounded-xl p-4 shadow-sm animate-in slide-in-from-top-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            Available Widgets
          </h3>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_WIDGETS.filter((w) => !layout.includes(w.id)).map(
              (widget) => (
                <button
                  key={widget.id}
                  onClick={() => addWidget(widget.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm transition-colors border border-zinc-200 dark:border-zinc-700"
                >
                  <Plus size={14} /> {widget.title}
                </button>
              ),
            )}
            {AVAILABLE_WIDGETS.filter((w) => !layout.includes(w.id)).length ===
              0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">
                All widgets are currently on the dashboard.
              </p>
            )}
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={layout} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[120px]">
            {layout.map((id) => {
              const widget = AVAILABLE_WIDGETS.find((w) => w.id === id);
              if (!widget) return null;
              const size = widgetSizes[id] || widget.size;
              return (
                <SortableWidget
                  key={id}
                  widget={widget}
                  size={size}
                  onRemove={removeWidget}
                  onResize={resizeWidget}
                >
                  {renderWidgetContent(id)}
                </SortableWidget>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
