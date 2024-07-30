"use client";
import type React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import TaskBoard from "@/components/TaskBoard";
import useStore, { Status, Task } from "@/store";

const queryClient = new QueryClient();

const onDragEnd = (result: DropResult) => {
  const { destination, source } = result;
  if (!destination) return;

  const updateTaskStatus = useStore.getState().updateTask;
  if (source.droppableId !== destination.droppableId) {
    const task = useStore
      .getState()
      .tasks.find((task) => task.id === result.draggableId);
    if (task) {
      updateTaskStatus({ ...task, status: destination.droppableId as Status });
    }
  }
};

const Dashboard: React.FC<{ tasks: Task[] }> = ({ tasks }) => (
  <QueryClientProvider client={queryClient}>
    <DragDropContext onDragEnd={onDragEnd}>
      <TaskBoard tasks={tasks} />
    </DragDropContext>
  </QueryClientProvider>
);

export default Dashboard;
