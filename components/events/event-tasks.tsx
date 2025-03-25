import Link from "next/link"
import { format } from "date-fns"
import { CheckCircle2, Circle, Clock, Edit, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import type { Task } from "@/lib/supabase"

export async function EventTasks({ eventId }: { eventId: number }) {
  // Fetch tasks for this event from Supabase
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching tasks:", error)
    return <div>Error loading tasks</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Event Tasks</CardTitle>
          <CardDescription>Manage tasks for this event</CardDescription>
        </div>
        <Button asChild size="sm">
          <Link href={`/dashboard/events/${eventId}/tasks/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {tasks && tasks.length > 0 ? (
          <div className="space-y-4">
            {tasks.map((task) => (
              <TaskCard key={task.task_id} task={task} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="mb-4 text-muted-foreground">No tasks have been created for this event yet.</p>
            <Button asChild>
              <Link href={`/dashboard/events/${eventId}/tasks/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Task
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TaskCard({ task }: { task: Task }) {
  const statusIcons = {
    unassigned: Circle,
    "to do": Clock,
    doing: Clock,
    done: CheckCircle2,
  }

  const StatusIcon = statusIcons[task.task_status]

  const statusColors = {
    unassigned: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    "to do": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    doing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    done: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
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
            <Clock className="h-3.5 w-3.5" />
            <span>Created: {format(new Date(task.created_at), "MMM d, yyyy")}</span>
          </div>
          {task.volunteer_email && (
            <div className="flex items-center gap-1">
              <span>Assigned to: {task.volunteer_email}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/dashboard/tasks/${task.task_id}`}>View</Link>
        </Button>
        <Button asChild size="sm">
          <Link href={`/dashboard/tasks/${task.task_id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>
    </div>
  )
}

