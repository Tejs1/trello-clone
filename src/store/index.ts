import { create } from "zustand";
export type Status = "TODO" | "IN_PROGRESS" | "UNDER_REVIEW" | "COMPLETED";

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: Status;
  priority?: "LOW" | "MEDIUM" | "URGENT" | null;
  deadline?: Date | null;
}

interface StoreState {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (updatedTask: Task) => void;
  deleteTask: (taskId: string) => void;
  setTasks: (tasks: Task[]) => void;
}

const useStore = create<StoreState>((set) => ({
  tasks: [],
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (updatedTask) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === updatedTask.id ? updatedTask : task,
      ),
    })),
  deleteTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
    })),
  setTasks: (tasks) => set({ tasks }),
}));

export default useStore;
