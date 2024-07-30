import React from "react";
import { Droppable } from "react-beautiful-dnd";
import TaskCard from "@/components/TaskCard";
import useStore from "@/store";

interface TaskColumnProps {
  status: string;
}

const TaskColumn: React.FC<TaskColumnProps> = ({ status }) => {
  const tasks = useStore((state) => state.tasks);
  console.log(tasks);

  return (
    <Droppable droppableId={status}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="task-column"
        >
          <h2>{status}</h2>
          {tasks.map((task, index) => (
            <TaskCard key={task.id} task={task} index={index} />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default TaskColumn;
