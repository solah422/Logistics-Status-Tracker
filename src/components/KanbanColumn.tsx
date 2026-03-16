import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Package, Status } from "../types";
import { KanbanCard } from "./KanbanCard";
import { usePackages } from "../store/PackageContext";

interface KanbanColumnProps {
  status: Status;
  packages: Package[];
  onEdit: (pkg: Package) => void;
  onDelete: (id: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  packages,
  onEdit,
  onDelete,
}) => {
  const { setNodeRef } = useDroppable({
    id: status,
  });
  const { statusColors } = usePackages();

  const colorClass =
    statusColors[status] ||
    "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";
  const headerBg = colorClass.split(" ")[0].replace("bg-", "border-t-");

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 w-80 min-w-[320px] flex-shrink-0`}
    >
      <div
        className={`p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center border-t-4 rounded-t-xl ${headerBg}`}
      >
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
          {status.replace("-", " ")}
        </h3>
        <span className="bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-medium px-2 py-1 rounded-full shadow-sm border border-zinc-200 dark:border-zinc-700">
          {packages.length}
        </span>
      </div>
      <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3 min-h-[150px]">
        <SortableContext
          items={packages.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {packages.map((pkg) => (
            <KanbanCard
              key={pkg.id}
              pkg={pkg}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};
