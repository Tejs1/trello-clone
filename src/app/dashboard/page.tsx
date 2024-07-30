import Dashboard from "@/components/Dashboard";
import { getTasks } from "@/server/actions"; // Assuming the Task type is exported from the server actions file
import { Task } from "@/store";
type getTaskType = Task[] | { error: string };
export default async function DashBoardPage() {
  const tasks: getTaskType = await getTasks();
  if (Array.isArray(tasks)) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <Dashboard tasks={tasks} />
      </main>
    );
  } else {
    console.log(tasks.error);
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <h1>{tasks.error}</h1>
      </main>
    );
  }
}
