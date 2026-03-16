import React, { useMemo } from "react";
import { usePackages } from "../store/PackageContext";
import { Package, Status } from "../types";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";

interface KanbanBoardProps {
  packages: Package[];
  onEdit: (pkg: Package) => void;
  onDelete: (id: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  packages,
  onEdit,
  onDelete,
}) => {
  const { statuses, updatePackage } = usePackages();
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const columns = useMemo(() => {
    const cols: Record<string, Package[]> = {};
    statuses.forEach((status) => {
      cols[status] = packages.filter((pkg) => pkg.status === status);
    });
    return cols;
  }, [packages, statuses]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activePkg = packages.find((p) => p.id === activeId);
    if (!activePkg) return;

    // Check if over a column or another card
    const overStatus = statuses.includes(overId)
      ? overId
      : packages.find((p) => p.id === overId)?.status;

    if (overStatus && activePkg.status !== overStatus) {
      updatePackage(activeId, { status: overStatus as Status });
    }
  };

  const activePackage = useMemo(
    () => packages.find((p) => p.id === activeId),
    [activeId, packages],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-4 items-start h-full min-h-[600px]">
        {statuses.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            packages={columns[status] || []}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
      <DragOverlay>
        {activePackage ? (
          <KanbanCard
            pkg={activePackage}
            onEdit={onEdit}
            onDelete={onDelete}
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
