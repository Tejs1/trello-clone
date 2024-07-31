import BoardExample from "@/components/Board";
import JiraLikeApp from "@/components/BoardComponent";

import { getTasks } from "@/server/actions"; // Assuming the Task type is exported from the server actions file
import { Task } from "@/store";
import TaskBoard from "./getTask";
type getTaskType = Task[] | { error: string };
export default async function DashBoardPage() {
  const tasks: getTaskType = await getTasks();

  if (Array.isArray(tasks)) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <JiraLikeApp />
        <BoardExample />
      </main>
    );
  } else {
    console.log(tasks.error);
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <h1>{tasks.error}</h1>
      </main>
    );
  }
}
