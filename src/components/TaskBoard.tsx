import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import useStore, { Task } from "@/store";
import TaskColumn from "@/components/TaskColumn";

const TaskBoard: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
  const setTasks = useStore((state) => state.setTasks);

  useEffect(() => {
    if (tasks) setTasks(tasks as Task[]);
  }, [tasks, setTasks]);

  return (
    <div className="task-board">
      {["To-Do", "In Progress", "Under Review", "Completed"].map((status) => (
        <TaskColumn key={status} status={status} />
      ))}
    </div>
  );
};

export default TaskBoard;
