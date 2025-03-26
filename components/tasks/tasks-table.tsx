import Link from "next/link"
import { format } from "date-fns"
import { Calendar, CheckCircle2, Circle, Clock, Edit, Eye, MoreHorizontal, Trash2, HelpCircle, Activity } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase"
import type { Task } from "@/lib/supabase"

export async function TasksTable() {
  // Fetch tasks from Supabase
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select(`
      *,
      events(title)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching tasks:", error)
    return <div>Error loading tasks</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Tasks</CardTitle>
        <CardDescription>Manage your tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks && tasks.length > 0 ? (
            tasks.map((task) => <TaskRow key={task.task_id} task={task} />)
          ) : (
            <p>No tasks found</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function TaskRow({ task }: { task: Task & { events: { title: string } } }) {
  const statusIcons = {
    unassigned: HelpCircle,
    assigned: Clock,
    inprogress: Activity,
    complete: CheckCircle2
  }

  const StatusIcon = statusIcons[task.task_status]

  const statusColors = {
    unassigned: "bg-gray-100 text-gray-800",
    assigned: "bg-amber-100 text-amber-800",
    inprogress: "bg-blue-100 text-blue-800",
    complete: "bg-green-100 text-green-800"

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
          <Link href={`/dashboard/tasks/${task.task_id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href={`/dashboard/tasks/${task.task_id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Assign Volunteer</DropdownMenuItem>
            <DropdownMenuItem>Change Status</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

