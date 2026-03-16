import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Package } from "../types";
import { Edit2, Trash2, Clock, AlertCircle, FileText } from "lucide-react";
import { usePackages } from "../store/PackageContext";

interface KanbanCardProps {
  pkg: Package;
  onEdit: (pkg: Package) => void;
  onDelete: (id: string) => void;
  isOverlay?: boolean;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  pkg,
  onEdit,
  onDelete,
  isOverlay,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: pkg.id });
  const { statusColors } = usePackages();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isOverlay ? 999 : 1,
  };

  const priorityColors = {
    low: "border-l-4 border-l-zinc-300 dark:border-l-zinc-600",
    medium: "border-l-4 border-l-blue-400 dark:border-l-blue-500",
    high: "border-l-4 border-l-amber-500 dark:border-l-amber-500",
    urgent: "border-l-4 border-l-rose-500 dark:border-l-rose-500",
  };

  const priorityClass = pkg.priority ? priorityColors[pkg.priority] : "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing flex flex-col gap-3 ${priorityClass}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
            {pkg.trackingNumber}
          </h4>
          {pkg.rNumberIdNumber && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {pkg.rNumberIdNumber}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(pkg);
            }}
            className="p-1 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(pkg.id);
            }}
            className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-900/30"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <Clock size={12} />
          <span>{new Date(pkg.dateSubmitted).toLocaleDateString()}</span>
        </div>
        {pkg.notes && (
          <div className="flex items-start gap-1.5 text-amber-600 dark:text-amber-400">
            <AlertCircle size={12} className="mt-0.5" />
            <span className="line-clamp-2">{pkg.notes}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <FileText size={12} />
          <span
            className={
              pkg.documentsUploaded
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }
          >
            Docs: {pkg.documentsUploaded ? "Yes" : "No"}
          </span>
        </div>
      </div>
    </div>
  );
};
