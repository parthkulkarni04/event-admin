import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, CheckCircle, Users } from "lucide-react"
import { supabase } from "@/lib/supabase"

export async function DashboardStats() {
  // Fetch stats from Supabase
  const [eventsCount, tasksCount, volunteersCount, completedTasksCount] = await Promise.all([
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase.from("tasks").select("task_id", { count: "exact", head: true }),
    supabase.from("volunteers_non_auth").select("id", { count: "exact", head: true }),
    supabase.from("tasks").select("task_id", { count: "exact", head: true }).eq("task_status", "complete"),
  ])

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Conducted Events</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{eventsCount.count || 0}</div>
          <p className="text-xs text-muted-foreground">Events organized and completed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{tasksCount.count || 0}</div>
          <p className="text-xs text-muted-foreground">Tasks marked as completed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Volunteers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{volunteersCount.count || 0}</div>
          <p className="text-xs text-muted-foreground">Registered volunteers</p>
        </CardContent>
      </Card>
    </div>
  )
}

