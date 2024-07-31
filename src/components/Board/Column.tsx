import React, { useContext, useEffect, useRef } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { TaskCard } from "./Card";
import { Status, Task } from "@/store";
import { BoardContext } from "./board-context";

interface ColumnProps {
  status: Status;
  tasks: Task[];
  index: number;
  reorderTask: (source: any, destination: any) => void;
}

export const Column: React.FC<ColumnProps> = ({
  status,
  tasks,
  index,
  reorderTask,
}) => {
  const { registerColumn, instanceId } = useContext(BoardContext);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const unregister = registerColumn({
        columnId: status,
        entry: { element: ref.current },
      });

      const cleanup = combine(
        draggable({
          element: ref.current,
          dragHandle: ref.current.querySelector("h2")!,
          getInitialData: () => ({
            type: "column",
            columnId: status,
            instanceId,
            index,
          }),
        }),
        dropTargetForElements({
          element: ref.current,
          getIsSticky: () => true,
          getData: () => ({
            type: "column",
            columnId: status,
            instanceId,
            index,
          }),
        }),
      );

      return () => {
        unregister();
        cleanup();
      };
    }
  }, [status, registerColumn, instanceId, index, reorderTask]);

  return (
    <div ref={ref} className="w-64 rounded-lg bg-gray-100 p-4">
      <h2 className="mb-4 font-bold">{status.replace("_", " ")}</h2>
      {tasks.map((task, taskIndex) => (
        <TaskCard
          key={task.id}
          task={task}
          index={taskIndex}
          columnId={status}
        />
      ))}
    </div>
  );
};
