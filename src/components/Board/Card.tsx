// src/components/Board/Card.tsx

import React, { useContext, useEffect, useRef } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BoardContext } from "./board-context";
import { Task } from "@/store";

interface TaskCardProps {
  task: Task;
  index: number;
  columnId: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  index,
  columnId,
}) => {
  const { registerTask, instanceId } = useContext(BoardContext);
  const ref = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (ref.current && actionMenuRef.current) {
      const unregister = registerTask({
        taskId: task.id,
        entry: {
          element: ref.current,
          actionMenuTrigger: actionMenuRef.current,
        },
      });

      const cleanup = combine(
        draggable({
          element: ref.current,
          dragHandle: ref.current,
          getInitialData: () => ({
            type: "task",
            taskId: task.id,
            index,
            columnId,
            instanceId,
          }),
        }),
        dropTargetForElements({
          element: ref.current,
          getIsSticky: () => true,
          getData: () => ({
            type: "task",
            taskId: task.id,
            index,
            columnId,
            instanceId,
          }),
        }),
      );

      return () => {
        unregister();
        cleanup();
      };
    }
  }, [task.id, registerTask, instanceId, index, columnId]);

  return (
    <div ref={ref} className="mb-2">
      <Card>
        <CardHeader>
          <CardTitle>{task.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">{task.description}</p>
          <div className="mt-2 flex items-center justify-between">
            <Badge
              variant={task.priority === "URGENT" ? "destructive" : "default"}
            >
              {task.priority ?? "No priority"}
            </Badge>
            {task.deadline && (
              <span className="text-xs text-gray-500">
                Due: {new Date(task.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
          <Button ref={actionMenuRef} className="mt-2" size="sm">
            Actions
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
