"use client";

import useStore, { Task } from "@/store";
type getTaskType = Task[] | { error: string };
import JiraLikeApp from "@/components/BoardComponent";
import { getTasks } from "@/server/actions";
import React from "react";
async function getT() {
  return await getTasks();
}

export default function TaskBoard({ tasks }: { tasks: Task[] }) {
  const setTasks = useStore((state) => state.setTasks);

  if (Array.isArray(tasks)) {
    console.log(tasks);
    setTasks(tasks);
  }
  return <JiraLikeApp />;
}
