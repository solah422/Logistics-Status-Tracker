import React, { useState, useMemo } from "react";
import { usePackages } from "../store/PackageContext";
import { Package, Status, FINAL_STATUSES } from "../types";
import { PackageForm } from "./PackageForm";
import { KanbanBoard } from "./KanbanBoard";
import { NotesModal } from "./NotesModal";
import {
  Search,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Save,
  Bookmark,
  LayoutGrid,
  List as ListIcon,
  Package as PackageIcon,
  Columns,
} from "lucide-react";

export const PackageList = () => {
  const {
    activePackages,
    statuses,
    deletePackage,
    updatePackage,
    statusColors,
    savedFilters,
    addSavedFilter,
    tableDensity,
    setTableDensity,
    isLoading,
  } = usePackages();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | undefined>();
  const [expandedPackage, setExpandedPackage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards" | "kanban">(
    "table",
  );

  // Advanced filtering
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [hasDocsFilter, setHasDocsFilter] = useState<"all" | "yes" | "no">(
    "all",
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Delete Confirmation Modal
  const [packageToDelete, setPackageToDelete] = useState<string | null>(null);

  // Inline Editing
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineEditField, setInlineEditField] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState<string | boolean>("");

  // Context Menu
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    pkg: Package | null;
  } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, pkg: Package) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, pkg });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Close context menu on click outside
  React.useEffect(() => {
    const handleClick = () => closeContextMenu();
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const filteredPackages = useMemo(() => {
    return activePackages
      .filter((pkg) => {
        const matchesSearch =
          pkg.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pkg.rNumberIdNumber?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
          statusFilter === "all" || pkg.status === statusFilter;

        const matchesDocs =
          hasDocsFilter === "all" ||
          (hasDocsFilter === "yes"
            ? pkg.documentsUploaded
            : !pkg.documentsUploaded);

        let matchesDate = true;
        if (dateRange.start && dateRange.end) {
          const pkgDate = pkg.dateSubmitted
            ? new Date(pkg.dateSubmitted)
            : null;
          if (pkgDate) {
            matchesDate =
              pkgDate >= new Date(dateRange.start) &&
              pkgDate <= new Date(dateRange.end);
          } else {
            matchesDate = false; // Exclude if no date and date filter is active
          }
        }

        return matchesSearch && matchesStatus && matchesDocs && matchesDate;
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }, [activePackages, searchTerm, statusFilter, hasDocsFilter, dateRange]);

  // Pagination logic
  const totalPages = Math.ceil(filteredPackages.length / itemsPerPage);
  const paginatedPackages = filteredPackages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setPackageToDelete(id);
  };

  const confirmDelete = () => {
    if (packageToDelete) {
      deletePackage(packageToDelete);
      setPackageToDelete(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedPackage(expandedPackage === id ? null : id);
  };

  // Notes Modal State
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notesModalData, setNotesModalData] = useState<{ id: string; status: Status } | null>(null);

  const handleStatusChange = (id: string, newStatus: Status) => {
    if (newStatus === 'Info Needed') {
      setNotesModalData({ id, status: newStatus });
      setNotesModalOpen(true);
    } else {
      updatePackage(id, { status: newStatus });
    }
  };

  const handleSaveNotes = (notes: string) => {
    if (notesModalData) {
      updatePackage(notesModalData.id, { status: notesModalData.status, notes });
      setNotesModalData(null);
    }
  };

  const getStatusColor = (status: string) => {
    return (
      statusColors[status] ||
      "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
    );
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "low":
        return "border-l-4 border-l-zinc-300 dark:border-l-zinc-600";
      case "medium":
        return "border-l-4 border-l-blue-400 dark:border-l-blue-500";
      case "high":
        return "border-l-4 border-l-amber-500 dark:border-l-amber-500";
      case "urgent":
        return "border-l-4 border-l-rose-500 dark:border-l-rose-500";
      default:
        return "border-l-4 border-l-transparent";
    }
  };

  const startInlineEdit = (id: string, field: string, value: any) => {
    setInlineEditId(id);
    setInlineEditField(field);
    setInlineEditValue(value || "");
  };

  const saveInlineEdit = () => {
    if (inlineEditId && inlineEditField) {
      updatePackage(inlineEditId, { [inlineEditField]: inlineEditValue });
    }
    setInlineEditId(null);
    setInlineEditField(null);
  };

  const handleInlineEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveInlineEdit();
    } else if (e.key === "Escape") {
      setInlineEditId(null);
      setInlineEditField(null);
    }
  };

  const saveCurrentFilter = () => {
    const name = prompt("Enter a name for this filter view:");
    if (name) {
      addSavedFilter({
        id: crypto.randomUUID(),
        name,
        filters: {
          status: statusFilter !== "all" ? statusFilter : undefined,
          hasDocs:
            hasDocsFilter !== "all" ? hasDocsFilter === "yes" : undefined,
          dateRange: dateRange.start ? dateRange : undefined,
        },
      });
    }
  };

  const applySavedFilter = (filter: any) => {
    setStatusFilter(filter.filters.status || "all");
    setHasDocsFilter(
      filter.filters.hasDocs !== undefined
        ? filter.filters.hasDocs
          ? "yes"
          : "no"
        : "all",
    );
    if (filter.filters.dateRange) {
      setDateRange(filter.filters.dateRange);
    } else {
      setDateRange({ start: "", end: "" });
    }
    setShowFilters(true);
  };

  // Progress Stepper Component
  const ProgressStepper = ({ status }: { status: string }) => {
    const steps = [
      { label: "Pending", icon: Clock },
      { label: "Customs Processed", icon: AlertCircle },
      { label: "Bond & Released", icon: CheckCircle },
    ];

    // Map current status to a step index
    let currentIndex = 0;
    if (status === "Pending" || status === "Clarification Required")
      currentIndex = 0;
    else if (status === "Customs Processed" || status === "Payment Made")
      currentIndex = 1;
    else if (status === "Bond & Released" || status === "Delivered")
      currentIndex = 2;

    return (
      <div className="flex items-center w-full max-w-xs mt-3 relative">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <React.Fragment key={step.label}>
              <div className="flex flex-col items-center relative z-10 group">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCompleted
                      ? "bg-indigo-600 border-indigo-600 text-white dark:bg-indigo-500 dark:border-indigo-500"
                      : isCurrent
                        ? "bg-white border-indigo-600 text-indigo-600 dark:bg-zinc-800 dark:border-indigo-500 dark:text-indigo-400"
                        : "bg-white border-zinc-300 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-500"
                  }`}
                >
                  {isCompleted ? <CheckCircle size={12} /> : <Icon size={12} />}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 transition-colors ${
                    isCompleted
                      ? "bg-indigo-600 dark:bg-indigo-500"
                      : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="h-10 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse"></div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="h-10 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse"></div>
            <div className="h-10 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse"></div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex gap-4">
            <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
            <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
            <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex justify-between items-center">
                <div className="space-y-3 w-1/3">
                  <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
                  <div className="h-3 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
                </div>
                <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse"></div>
                <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 mb-6">
        <div className="relative flex-1 max-w-md w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search tracking or ID number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-zinc-100"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors text-sm font-medium ${
              showFilters ||
              statusFilter !== "all" ||
              hasDocsFilter !== "all" ||
              dateRange.start
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400"
                : "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            <Filter size={18} />
            Filters
          </button>

          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "table" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
              title="Table View"
            >
              <ListIcon size={18} />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "cards" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
              title="Card View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "kanban" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
              title="Kanban Board View"
            >
              <Columns size={18} />
            </button>
          </div>

          <button
            onClick={() => {
              setEditingPackage(undefined);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm ml-auto sm:ml-0"
          >
            <Plus size={18} />
            Add Package
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2 shrink-0 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Advanced Filters
            </h3>
            <div className="flex gap-2">
              {savedFilters.length > 0 && (
                <div className="relative group">
                  <button className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300">
                    <Bookmark size={16} /> Saved Views
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    {savedFilters.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => applySavedFilter(f)}
                        className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={saveCurrentFilter}
                className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-zinc-200"
              >
                <Save size={16} /> Save
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-zinc-200"
              >
                <option
                  value="all"
                  className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                  All Statuses
                </option>
                {statuses.map((s) => (
                  <option
                    key={s}
                    value={s}
                    className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Documents Uploaded
              </label>
              <select
                value={hasDocsFilter}
                onChange={(e) => setHasDocsFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-zinc-200"
              >
                <option
                  value="all"
                  className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                  Any
                </option>
                <option
                  value="yes"
                  className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                  Yes
                </option>
                <option
                  value="no"
                  className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                  No
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Date Submitted Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, start: e.target.value }))
                  }
                  className="w-full px-2 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-zinc-200"
                />
                <span className="text-zinc-400">-</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, end: e.target.value }))
                  }
                  className="w-full px-2 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-zinc-200"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setStatusFilter("all");
                setHasDocsFilter("all");
                setDateRange({ start: "", end: "" });
              }}
              className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Package List */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden flex-1 flex flex-col min-h-0">
        {viewMode === "table" ? (
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
                <tr>
                  <th
                    className={`px-6 font-medium text-zinc-500 dark:text-zinc-400 text-sm ${tableDensity === "compact" ? "py-2" : "py-4"}`}
                  >
                    Tracking / ID
                  </th>
                  <th
                    className={`px-6 font-medium text-zinc-500 dark:text-zinc-400 text-sm ${tableDensity === "compact" ? "py-2" : "py-4"}`}
                  >
                    Dates
                  </th>
                  <th
                    className={`px-6 font-medium text-zinc-500 dark:text-zinc-400 text-sm ${tableDensity === "compact" ? "py-2" : "py-4"}`}
                  >
                    Status
                  </th>
                  <th
                    className={`px-6 font-medium text-zinc-500 dark:text-zinc-400 text-sm ${tableDensity === "compact" ? "py-2" : "py-4"}`}
                  >
                    Docs
                  </th>
                  <th
                    className={`px-6 font-medium text-zinc-500 dark:text-zinc-400 text-sm text-right ${tableDensity === "compact" ? "py-2" : "py-4"}`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {paginatedPackages.map((pkg) => (
                  <React.Fragment key={pkg.id}>
                    <tr
                      className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group cursor-pointer ${getPriorityColor(pkg.priority)}`}
                      onContextMenu={(e) => handleContextMenu(e, pkg)}
                    >
                      <td
                        className={`px-6 ${tableDensity === "compact" ? "py-2" : "py-4"}`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleExpand(pkg.id)}
                            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                          >
                            {expandedPackage === pkg.id ? (
                              <ChevronUp size={18} />
                            ) : (
                              <ChevronDown size={18} />
                            )}
                          </button>
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {pkg.trackingNumber}
                            </p>
                            {pkg.rNumberIdNumber && (
                              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                {pkg.rNumberIdNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td
                        className={`px-6 ${tableDensity === "compact" ? "py-2" : "py-4"}`}
                      >
                        <div className="text-sm flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <span className="text-zinc-500 dark:text-zinc-400 w-8">
                              Sub:
                            </span>
                            {inlineEditId === pkg.id &&
                            inlineEditField === "dateSubmitted" ? (
                              <input
                                autoFocus
                                type="date"
                                value={inlineEditValue as string}
                                onChange={(e) =>
                                  setInlineEditValue(e.target.value)
                                }
                                onBlur={saveInlineEdit}
                                onKeyDown={handleInlineEditKeyDown}
                                className="text-zinc-900 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-indigo-500 rounded px-1 py-0.5 outline-none"
                              />
                            ) : (
                              <span
                                className="text-zinc-900 dark:text-zinc-200 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                                onClick={() =>
                                  startInlineEdit(
                                    pkg.id,
                                    "dateSubmitted",
                                    pkg.dateSubmitted,
                                  )
                                }
                              >
                                {pkg.dateSubmitted || "N/A"}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-zinc-500 dark:text-zinc-400 w-8">
                              Rel:
                            </span>
                            {inlineEditId === pkg.id &&
                            inlineEditField === "dateReleased" ? (
                              <input
                                autoFocus
                                type="date"
                                value={inlineEditValue as string}
                                onChange={(e) =>
                                  setInlineEditValue(e.target.value)
                                }
                                onBlur={saveInlineEdit}
                                onKeyDown={handleInlineEditKeyDown}
                                className="text-zinc-900 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-indigo-500 rounded px-1 py-0.5 outline-none"
                              />
                            ) : (
                              <span
                                className="text-zinc-900 dark:text-zinc-200 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                                onClick={() =>
                                  startInlineEdit(
                                    pkg.id,
                                    "dateReleased",
                                    pkg.dateReleased,
                                  )
                                }
                              >
                                {pkg.dateReleased || "N/A"}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td
                        className={`px-6 ${tableDensity === "compact" ? "py-2" : "py-4"}`}
                      >
                        <div className="flex flex-col items-start gap-1">
                          {/* Inline Edit Status */}
                          <select
                            value={pkg.status}
                            onChange={(e) =>
                              handleStatusChange(
                                pkg.id,
                                e.target.value as Status,
                              )
                            }
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer appearance-none pr-6 bg-no-repeat ${getStatusColor(pkg.status)}`}
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                              backgroundPosition: "right 0.25rem center",
                              backgroundSize: "1.5em 1.5em",
                            }}
                          >
                            {statuses.map((s) => (
                              <option
                                key={s}
                                value={s}
                                className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                              >
                                {s}
                              </option>
                            ))}
                          </select>
                          <ProgressStepper status={pkg.status} />
                        </div>
                      </td>
                      <td
                        className={`px-6 ${tableDensity === "compact" ? "py-2" : "py-4"}`}
                      >
                        <button
                          onClick={() =>
                            updatePackage(pkg.id, {
                              documentsUploaded: !pkg.documentsUploaded,
                            })
                          }
                          className="focus:outline-none hover:scale-110 transition-transform"
                          title="Toggle Documents Uploaded"
                        >
                          {pkg.documentsUploaded ? (
                            <CheckCircle
                              className="text-emerald-500"
                              size={20}
                            />
                          ) : (
                            <AlertCircle className="text-amber-500" size={20} />
                          )}
                        </button>
                      </td>
                      <td
                        className={`px-6 ${tableDensity === "compact" ? "py-2" : "py-4"} text-right`}
                      >
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(pkg)}
                            className="p-2 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(pkg.id)}
                            className="p-2 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Details Row */}
                    {expandedPackage === pkg.id && (
                      <tr className="bg-zinc-50/50 dark:bg-zinc-800/20 border-b border-zinc-100 dark:border-zinc-800">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                <FileText size={16} className="text-zinc-400" />
                                Additional Details
                              </h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-zinc-500 dark:text-zinc-400">
                                    Broker Form Status
                                  </p>
                                  <p className="font-medium text-zinc-900 dark:text-zinc-200">
                                    {pkg.brokerFormStatus || "None"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-zinc-500 dark:text-zinc-400">
                                    Ready System Updated
                                  </p>
                                  <p className="font-medium text-zinc-900 dark:text-zinc-200">
                                    {pkg.readySystemStatusUpdated
                                      ? "Yes"
                                      : "No"}
                                  </p>
                                </div>
                                {pkg.expectedDutyAmount !== undefined && (
                                  <div>
                                    <p className="text-zinc-500 dark:text-zinc-400">
                                      Expected Duty
                                    </p>
                                    <p className="font-medium text-zinc-900 dark:text-zinc-200">
                                      ${pkg.expectedDutyAmount.toFixed(2)}
                                    </p>
                                  </div>
                                )}
                                {pkg.clarificationDetails && (
                                  <div className="col-span-2">
                                    <p className="text-zinc-500 dark:text-zinc-400">
                                      Clarification Details
                                    </p>
                                    <p className="font-medium text-zinc-900 dark:text-zinc-200 mt-1 bg-white dark:bg-zinc-800 p-2 rounded border border-zinc-200 dark:border-zinc-700">
                                      {pkg.clarificationDetails}
                                    </p>
                                  </div>
                                )}
                                {pkg.cancellationReason && (
                                  <div className="col-span-2">
                                    <p className="text-zinc-500 dark:text-zinc-400">
                                      Cancellation Reason
                                    </p>
                                    <p className="font-medium text-rose-600 dark:text-rose-400 mt-1 bg-rose-50 dark:bg-rose-900/20 p-2 rounded border border-rose-100 dark:border-rose-800">
                                      {pkg.cancellationReason}
                                    </p>
                                  </div>
                                )}
                                {pkg.notes && (
                                  <div className="col-span-2">
                                    <p className="text-zinc-500 dark:text-zinc-400">
                                      Notes
                                    </p>
                                    <p className="font-medium text-zinc-900 dark:text-zinc-200 mt-1 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded border border-zinc-200 dark:border-zinc-700 whitespace-pre-wrap">
                                      {pkg.notes}
                                    </p>
                                  </div>
                                )}
                                {/* Render Custom Fields */}
                                {pkg.customFields &&
                                  Object.entries(pkg.customFields).map(
                                    ([key, value]) => (
                                      <div key={key}>
                                        <p className="text-zinc-500 dark:text-zinc-400">
                                          {key}
                                        </p>
                                        <p className="font-medium text-zinc-900 dark:text-zinc-200">
                                          {String(value)}
                                        </p>
                                      </div>
                                    ),
                                  )}
                              </div>
                            </div>

                            {/* Status History */}
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                <Clock size={16} className="text-zinc-400" />
                                Status History
                              </h4>
                              <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                                <ul className="divide-y divide-zinc-100 dark:divide-zinc-700 max-h-40 overflow-y-auto">
                                  {pkg.history
                                    ?.slice()
                                    .reverse()
                                    .map((entry, idx) => (
                                      <li
                                        key={idx}
                                        className="px-3 py-2 flex flex-col gap-1 text-sm"
                                      >
                                        <div className="flex justify-between items-center">
                                          <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(entry.status)}`}
                                          >
                                            {entry.status}
                                          </span>
                                          <span className="text-zinc-500 dark:text-zinc-400 text-xs">
                                            {new Date(
                                              entry.timestamp,
                                            ).toLocaleString()}
                                          </span>
                                        </div>
                                        {entry.notes && (
                                          <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded border border-zinc-100 dark:border-zinc-800">
                                            <span className="font-semibold">Notes:</span> {entry.notes}
                                          </p>
                                        )}
                                      </li>
                                    ))}
                                  {(!pkg.history ||
                                    pkg.history.length === 0) && (
                                    <li className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 text-center">
                                      No history available
                                    </li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}

                {paginatedPackages.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400">
                        <PackageIcon
                          size={48}
                          className="mb-4 text-zinc-300 dark:text-zinc-600"
                        />
                        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-200">
                          No packages found
                        </p>
                        <p className="text-sm mt-1">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : viewMode === "kanban" ? (
          <div className="overflow-auto flex-1">
            <KanbanBoard
              packages={filteredPackages}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onStatusChange={handleStatusChange}
            />
          </div>
        ) : (
          /* Mobile/Card View */
          <div className="overflow-auto flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-zinc-50 dark:bg-zinc-900/50">
              {paginatedPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 shadow-sm flex flex-col"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {pkg.trackingNumber}
                    </h3>
                    {pkg.rNumberIdNumber && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {pkg.rNumberIdNumber}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(pkg)}
                      className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(pkg.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/30"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <select
                    value={pkg.status}
                    onChange={(e) =>
                      handleStatusChange(pkg.id, e.target.value as Status)
                    }
                    className={`w-full px-3 py-1.5 rounded-lg text-sm font-medium border-0 cursor-pointer appearance-none bg-no-repeat ${getStatusColor(pkg.status)}`}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: "right 0.5rem center",
                      backgroundSize: "1.5em 1.5em",
                    }}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2">
                    <ProgressStepper status={pkg.status} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-700">
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                      Submitted
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-200">
                      {pkg.dateSubmitted || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                      Released
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-200">
                      {pkg.dateReleased || "-"}
                    </p>
                  </div>
                  <div className="col-span-2 flex items-center gap-2 mt-2">
                    {pkg.documentsUploaded ? (
                      <CheckCircle className="text-emerald-500" size={16} />
                    ) : (
                      <AlertCircle className="text-amber-500" size={16} />
                    )}
                    <span className="text-zinc-600 dark:text-zinc-300 text-xs">
                      {pkg.documentsUploaded ? "Docs Uploaded" : "Missing Docs"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {paginatedPackages.length === 0 && (
              <div className="col-span-full py-12 text-center">
                <p className="text-zinc-500 dark:text-zinc-400">
                  No packages found
                </p>
              </div>
            )}
          </div>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Showing{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {Math.min(currentPage * itemsPerPage, filteredPackages.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {filteredPackages.length}
              </span>{" "}
              results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {editingPackage ? "Edit Package" : "Add New Package"}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <PackageForm
                initialData={editingPackage}
                onClose={() => setIsFormOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && contextMenu.pkg && (
        <div
          className="fixed bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-lg rounded-lg py-1 z-50 w-48"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-700">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Actions
            </p>
            <p className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
              {contextMenu.pkg.trackingNumber}
            </p>
          </div>
          <button
            className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 flex items-center gap-2"
            onClick={() => {
              handleEdit(contextMenu.pkg!);
              closeContextMenu();
            }}
          >
            <Edit2 size={14} /> Edit Package
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 flex items-center gap-2"
            onClick={() => {
              navigator.clipboard.writeText(contextMenu.pkg!.trackingNumber);
              closeContextMenu();
            }}
          >
            <FileText size={14} /> Copy Tracking #
          </button>
          <div className="border-t border-zinc-100 dark:border-zinc-700 my-1"></div>
          <p className="px-3 py-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Change Status
          </p>
          {statuses.map((status) => (
            <button
              key={status}
              className="w-full text-left px-4 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 flex items-center gap-2"
              onClick={() => {
                handleStatusChange(contextMenu.pkg!.id, status as Status);
                closeContextMenu();
              }}
            >
              <div
                className={`w-2 h-2 rounded-full ${getStatusColor(status).split(" ")[0]}`}
              />
              <span className="capitalize">{status.replace("-", " ")}</span>
            </button>
          ))}
          <div className="border-t border-zinc-100 dark:border-zinc-700 my-1"></div>
          <button
            className="w-full text-left px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2"
            onClick={() => {
              handleDeleteClick(contextMenu.pkg!.id);
              closeContextMenu();
            }}
          >
            <Trash2 size={14} /> Delete Package
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {packageToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Delete Package?
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6">
                This package will be moved to the Deleted tab. It will be
                permanently removed after 7 days.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setPackageToDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-600 border border-transparent rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
                >
                  Yes, Delete It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      <NotesModal
        isOpen={notesModalOpen}
        onClose={() => {
          setNotesModalOpen(false);
          setNotesModalData(null);
        }}
        onSave={handleSaveNotes}
      />
    </div>
  );
};
