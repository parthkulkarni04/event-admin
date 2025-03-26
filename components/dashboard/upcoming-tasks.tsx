import Link from "next/link"
import { format } from "date-fns"
import { ArrowRight, Calendar, CheckCircle2, Circle, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import type { Task } from "@/lib/supabase"

export async function UpcomingTasks() {
  // Fetch tasks from Supabase
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select(`
      *,
      events(title)
    `)
    .or("task_status.eq.unassigned,task_status.eq.assigned")
    .order("created_at", { ascending: false })
    .limit(5)

  if (error) {
    console.error("Error fetching tasks:", error)
    return <div>Error loading tasks</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Tasks</CardTitle>
        <CardDescription>Tasks that need attention</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tasks && tasks.length > 0 ? (
          tasks.map((task) => <TaskCard key={task.task_id} task={task} />)
        ) : (
          <p>No pending tasks found</p>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href="/dashboard/tasks">
            <span>View All Tasks</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function TaskCard({ task }: { task: Task & { events: { title: string } } }) {
  const statusIcons = {
    unassigned: Circle,
    assigned: Clock,
    inprogress: Clock,
    complete: CheckCircle2,
  }

  const StatusIcon = statusIcons[task.task_status]

  const statusColors = {
    unassigned: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    assigned: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    inprogress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    complete: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  }

  return (
    <div className="flex flex-col space-y-2 rounded-md border p-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{task.task_description}</h3>
          <Badge variant="outline" className={statusColors[task.task_status]}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {task.task_status}
          </Badge>
        </div>
        <div className="flex flex-col gap-1 text-sm text-muted-foreground md:flex-row md:gap-2">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>Event: {task.events?.title || "Unknown"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>Created: {format(new Date(task.created_at), "MMM d, yyyy")}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/dashboard/tasks/${task.task_id}`}>View</Link>
        </Button>
        <Button asChild size="sm" variant="default">
          <Link href={`/dashboard/tasks/${task.task_id}/edit`}>Edit</Link>
        </Button>
      </div>
    </div>
  )
}

