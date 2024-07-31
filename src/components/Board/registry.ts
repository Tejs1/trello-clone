import invariant from "tiny-invariant";
import type { CleanupFn } from "@atlaskit/pragmatic-drag-and-drop/types";

export type CardEntry = {
  element: HTMLElement;
  actionMenuTrigger: HTMLElement;
};

export type ColumnEntry = {
  element: HTMLElement;
};

export const createRegistry = () => {
  const tasks = new Map<
    string,
    { element: HTMLElement; actionMenuTrigger: HTMLElement }
  >();
  const columns = new Map<string, { element: HTMLElement }>();

  return {
    registerTask: ({
      taskId,
      entry,
    }: {
      taskId: string;
      entry: { element: HTMLElement; actionMenuTrigger: HTMLElement };
    }) => {
      tasks.set(taskId, entry);
      return () => tasks.delete(taskId);
    },
    registerColumn: ({
      columnId,
      entry,
    }: {
      columnId: string;
      entry: { element: HTMLElement };
    }) => {
      columns.set(columnId, entry);
      return () => columns.delete(columnId);
    },
    getTask: (taskId: string) => {
      const entry = tasks.get(taskId);
      invariant(entry);
      return entry;
    },
    getColumn: (columnId: string) => {
      const entry = columns.get(columnId);
      invariant(entry);
      return entry;
    },
  };
};
