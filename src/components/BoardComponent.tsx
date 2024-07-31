"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import invariant from "tiny-invariant";

import { triggerPostMoveFlash } from "@atlaskit/pragmatic-drag-and-drop-flourish/trigger-post-move-flash";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { getReorderDestinationIndex } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index";
import * as liveRegion from "@atlaskit/pragmatic-drag-and-drop-live-region";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";
import { autoScrollWindowForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";

import useStore, { Task, Status } from "@/store";
import { Column } from "./MyBoard/column";
import { BoardContext } from "./MyBoard/board-context";
import { Board } from "./MyBoard/Board";
import { createRegistry } from "./MyBoard/registry";
type getTaskType = Task[] | { error: string };

const statusColumns: Status[] = [
  "TODO",
  "IN_PROGRESS",
  "UNDER_REVIEW",
  "COMPLETED",
];

type Outcome =
  | {
      type: "column-reorder";
      columnId: string;
      startIndex: number;
      finishIndex: number;
    }
  | {
      type: "task-reorder";
      columnId: string;
      startIndex: number;
      finishIndex: number;
    }
  | {
      type: "task-move";
      finishColumnId: string;
      itemIndexInStartColumn: number;
      itemIndexInFinishColumn: number;
    };

type Trigger = "pointer" | "keyboard";

type Operation = {
  trigger: Trigger;
  outcome: Outcome;
};

type BoardState = {
  tasks: Task[];
  orderedColumnIds: Status[];
  lastOperation: Operation | null;
};
import { getTasks } from "@/server/actions";
export default function JiraLikeApp() {
  const { tasks, addTask, updateTask } = useStore();
  const setTasks = useStore((state) => state.setTasks);

  const [boardState, setBoardState] = useState<BoardState>(() => ({
    tasks,
    orderedColumnIds: statusColumns,
    lastOperation: null,
  }));
  console.log(tasks, "tasks");
  console.log(boardState.tasks, "boardState");
  const [registry] = useState(createRegistry);
  const [instanceId] = useState(() => Symbol("instance-id"));

  const stableBoardState = useRef(boardState);
  useEffect(() => {
    const updateTasks = async () => {
      const updatedTasks = await getTasks();
      if (Array.isArray(updatedTasks)) {
        setTasks(updatedTasks);
        setBoardState((state) => ({
          ...state,
          tasks: updatedTasks,
        }));
      }
    };

    updateTasks();
  }, []);
  useEffect(() => {
    stableBoardState.current = boardState;
  }, [boardState]);

  const reorderColumn = useCallback(
    ({
      startIndex,
      finishIndex,
      trigger = "keyboard",
    }: {
      startIndex: number;
      finishIndex: number;
      trigger?: Trigger;
    }) => {
      setBoardState((state) => ({
        ...state,
        orderedColumnIds: reorder({
          list: state.orderedColumnIds,
          startIndex,
          finishIndex,
        }),
        lastOperation: {
          outcome: {
            type: "column-reorder",
            columnId: state.orderedColumnIds[startIndex] as string,
            startIndex,
            finishIndex,
          },
          trigger,
        },
      }));
    },
    [],
  );

  const reorderTask = useCallback(
    ({
      columnId,
      startIndex,
      finishIndex,
      trigger = "keyboard",
    }: {
      columnId: string;
      startIndex: number;
      finishIndex: number;
      trigger?: Trigger;
    }) => {
      setBoardState((state) => {
        const columnTasks = state.tasks.filter(
          (task) => task.status === columnId,
        );
        const updatedTasks = reorder({
          list: columnTasks,
          startIndex,
          finishIndex,
        });

        const updatedTaskMap = new Map(
          state.tasks.map((task) => [task.id, task]),
        );
        updatedTasks.forEach((task) => {
          updatedTaskMap.set(task.id, task);
        });

        const updatedTaskList = Array.from(updatedTaskMap.values());

        return {
          ...state,
          tasks: updatedTaskList,
          lastOperation: {
            outcome: {
              type: "task-reorder",
              columnId,
              startIndex,
              finishIndex,
            },
            trigger,
          },
        };
      });
    },
    [],
  );

  const moveTask = useCallback(
    ({
      startColumnId,
      finishColumnId,
      itemIndexInStartColumn,
      itemIndexInFinishColumn,
      trigger = "keyboard",
    }: {
      startColumnId: string;
      finishColumnId: string;
      itemIndexInStartColumn: number;
      itemIndexInFinishColumn?: number;
      trigger?: Trigger;
    }) => {
      if (startColumnId === finishColumnId) return;

      setBoardState((state) => {
        const task = state.tasks.filter((t) => t.status === startColumnId)[
          itemIndexInStartColumn
        ];
        if (task === undefined) return state;
        const updatedTask = {
          ...task,
          id: task.id,
          status: finishColumnId as Status,
        };

        const updatedTasks = state.tasks.filter((t) => t.id !== task?.id);
        const insertIndex =
          itemIndexInFinishColumn ??
          updatedTasks.filter((t) => t.status === finishColumnId).length;
        updatedTasks.splice(
          updatedTasks.findIndex((t) => t.status === finishColumnId) +
            insertIndex,
          0,
          updatedTask,
        );

        return {
          ...state,
          tasks: updatedTasks,
          lastOperation: {
            outcome: {
              type: "task-move",
              finishColumnId,
              itemIndexInStartColumn,
              itemIndexInFinishColumn: insertIndex,
            },
            trigger,
          },
        };
      });
    },
    [],
  );

  useEffect(() => {
    const { lastOperation } = boardState;
    if (lastOperation === null) return;

    const { outcome, trigger } = lastOperation;

    if (outcome.type === "column-reorder") {
      const { startIndex, finishIndex } = outcome;
      const sourceColumn = boardState.orderedColumnIds[finishIndex];
      const entry = registry.getColumn(sourceColumn!);
      triggerPostMoveFlash(entry.element);

      if (trigger === "keyboard") {
        liveRegion.announce(
          `You've moved ${sourceColumn} from position ${startIndex + 1} to position ${
            finishIndex + 1
          } of ${boardState.orderedColumnIds.length}.`,
        );
      }
    } else if (outcome.type === "task-reorder") {
      const { columnId, startIndex, finishIndex } = outcome;
      const task = boardState.tasks.filter((task) => task.status === columnId)[
        finishIndex
      ];
      if (!task) return;
      const entry = registry.getTask(task.id);
      triggerPostMoveFlash(entry.element);

      if (trigger === "keyboard") {
        liveRegion.announce(
          `You've moved ${task.title} from position ${startIndex + 1} to position ${
            finishIndex + 1
          } in the ${columnId} column.`,
        );
        entry.actionMenuTrigger.focus();
      }
    } else if (outcome.type === "task-move") {
      const {
        finishColumnId,
        itemIndexInStartColumn,
        itemIndexInFinishColumn,
      } = outcome;
      const destinationColumn = boardState.orderedColumnIds.find(
        (id) => id === finishColumnId,
      );
      const task = boardState.tasks.filter(
        (task) => task.status === destinationColumn,
      )[itemIndexInFinishColumn];
      if (!task) return;

      const entry = registry.getTask(task.id);
      triggerPostMoveFlash(entry.element);

      if (trigger === "keyboard") {
        liveRegion.announce(
          `You've moved ${task.title} to position ${itemIndexInFinishColumn + 1} in the ${
            finishColumnId
          } column.`,
        );
        entry.actionMenuTrigger.focus();
      }
    }
  }, [boardState.lastOperation, registry]);

  useEffect(() => {
    return liveRegion.cleanup();
  }, []);

  useEffect(() => {
    return combine(
      monitorForElements({
        canMonitor: ({ source }) => source.data.instanceId === instanceId,
        onDrop: (args) => {
          const { location, source } = args;
          if (!location.current.dropTargets.length) return;

          if (source.data.type === "column") {
            const startIndex = boardState.orderedColumnIds.findIndex(
              (columnId) => columnId === source.data.columnId,
            );
            const target = location.current.dropTargets[0];
            const indexOfTarget = boardState.orderedColumnIds.findIndex(
              (id) => id === target?.data.columnId,
            );
            const closestEdgeOfTarget = extractClosestEdge(target?.data!);

            const finishIndex = getReorderDestinationIndex({
              startIndex,
              indexOfTarget,
              closestEdgeOfTarget,
              axis: "horizontal",
            });

            reorderColumn({ startIndex, finishIndex, trigger: "pointer" });
          } else if (source.data.type === "task") {
            const taskId = source.data.taskId;
            const [, startColumnRecord] = location.initial.dropTargets;
            const sourceId = startColumnRecord?.data.columnId;
            const sourceColumn = boardState.orderedColumnIds.find(
              (id) => id === sourceId,
            )!;
            const itemIndex = boardState.tasks
              .filter((t) => t.status === sourceColumn)
              .findIndex((t) => t.id === taskId);

            if (location.current.dropTargets.length === 1) {
              const [destinationColumnRecord] = location.current.dropTargets;
              const destinationId = destinationColumnRecord?.data.columnId;
              const destinationColumn = boardState.orderedColumnIds.find(
                (id) => id === destinationId,
              )!;

              if (sourceColumn === destinationColumn) {
                const destinationIndex = getReorderDestinationIndex({
                  startIndex: itemIndex,
                  indexOfTarget:
                    boardState.tasks.filter((t) => t.status === sourceColumn)
                      .length - 1,
                  closestEdgeOfTarget: null,
                  axis: "vertical",
                });
                reorderTask({
                  columnId: sourceColumn,
                  startIndex: itemIndex,
                  finishIndex: destinationIndex,
                  trigger: "pointer",
                });
              } else {
                moveTask({
                  itemIndexInStartColumn: itemIndex,
                  startColumnId: sourceColumn,
                  finishColumnId: destinationColumn,
                  trigger: "pointer",
                });
              }
            } else if (location.current.dropTargets.length === 2) {
              const [destinationTaskRecord, destinationColumnRecord] =
                location.current.dropTargets;
              const destinationColumnId =
                destinationColumnRecord?.data.columnId;
              const destinationColumn = boardState.orderedColumnIds.find(
                (id) => id === destinationColumnId,
              )!;

              const indexOfTarget = boardState.tasks
                .filter((t) => t.status === destinationColumn)
                .findIndex((t) => t.id === destinationTaskRecord?.data.taskId);
              const closestEdgeOfTarget = extractClosestEdge(
                destinationTaskRecord?.data!,
              );

              if (sourceColumn === destinationColumn) {
                const destinationIndex = getReorderDestinationIndex({
                  startIndex: itemIndex,
                  indexOfTarget,
                  closestEdgeOfTarget,
                  axis: "vertical",
                });
                reorderTask({
                  columnId: sourceColumn,
                  startIndex: itemIndex,
                  finishIndex: destinationIndex,
                  trigger: "pointer",
                });
              } else {
                const destinationIndex =
                  closestEdgeOfTarget === "bottom"
                    ? indexOfTarget + 1
                    : indexOfTarget;
                moveTask({
                  itemIndexInStartColumn: itemIndex,
                  startColumnId: sourceColumn,
                  finishColumnId: destinationColumn,
                  itemIndexInFinishColumn: destinationIndex,
                  trigger: "pointer",
                });
              }
            }
          }
        },
      }),
    );
  }, [boardState, instanceId, moveTask, reorderTask, reorderColumn]);

  const contextValue = useMemo(
    () => ({
      ...registry,
      instanceId,
    }),
    [registry, instanceId],
  );

  const handleAddTask = () => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: `New Task ${boardState.tasks.length + 1}`,
      description: "Description for the new task",
      status: "TODO",
      priority: "MEDIUM",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    };
    addTask(newTask);
    setBoardState((state) => ({
      ...state,
      tasks: [...state.tasks, newTask],
    }));
  };

  return (
    <BoardContext.Provider value={contextValue}>
      <div className="container mx-auto p-4">
        <h1 className="mb-4 text-2xl font-bold">Jira-like Task Board</h1>
        <Button onClick={handleAddTask} className="mb-4">
          Add New Task
        </Button>
        <Board>
          {boardState.orderedColumnIds.map((columnId) => (
            <Column
              key={columnId}
              status={columnId}
              tasks={boardState.tasks.filter(
                (task) => task.status === columnId,
              )}
            />
          ))}
        </Board>
      </div>
    </BoardContext.Provider>
  );
}
