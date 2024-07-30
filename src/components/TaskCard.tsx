import { Task } from "@/store";
import React from "react";
import { Draggable } from "react-beautiful-dnd";

interface TaskCardProps {
  task: Task;
  index: number;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, index }) => {
  return (
    <Draggable draggableId={task.id.toString()} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="task-card"
        >
          <h3>{task.title}</h3>
          <p>{task.description}</p>
          <p>Priority: {task.priority}</p>
          <p>Deadline: {task.deadline?.toString()}</p>
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;
