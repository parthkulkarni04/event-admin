"use client"

import { useEffect, useState } from "react"
import { Mail } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface TaskStats {
  completed: number
  ongoing: number
  unassigned: number
}

interface VolunteerStats {
  registered: number
  maxVolunteers: number
}

interface RecommendedVolunteer {
  id: string
  full_name: string
  age: number
  organization: string
  email: string
}

const COLORS = ["#22c55e", "#f59e0b", "#ef4444"]

export function EventStats({ eventId }: { eventId: number }) {
  const [taskStats, setTaskStats] = useState<TaskStats>({ completed: 0, ongoing: 0, unassigned: 0 })
  const [volunteerStats, setVolunteerStats] = useState<VolunteerStats>({ registered: 0, maxVolunteers: 0 })
  const [recommendedVolunteers, setRecommendedVolunteers] = useState<RecommendedVolunteer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [eventId])

  async function fetchStats() {
    try {
      // Fetch task stats
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("task_status")
        .eq("event_id", eventId)

      if (tasksError) throw tasksError

      const stats = {
        completed: tasks.filter(t => t.task_status === "done").length,
        ongoing: tasks.filter(t => t.task_status === "doing").length,
        unassigned: tasks.filter(t => t.task_status === "unassigned").length,
      }
      setTaskStats(stats)

      // Fetch volunteer stats
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("max_volunteers")
        .eq("id", eventId)
        .single()

      if (eventError) throw eventError

      const { count: registeredCount, error: countError } = await supabase
        .from("volunteer_event")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("status", "registered")

      if (countError) throw countError

      setVolunteerStats({
        registered: registeredCount || 0,
        maxVolunteers: event.max_volunteers || 0,
      })

      // Fetch recommended volunteers
      const { data: registeredVolunteers, error: registeredError } = await supabase
        .from("volunteer_event")
        .select("volunteer_id")
        .eq("event_id", eventId)
        .eq("status", "registered")

      if (registeredError) throw registeredError

      const registeredIds = registeredVolunteers.map(v => v.volunteer_id)

      const { data: recommended, error: recommendedError } = await supabase
        .from("volunteers_non_auth")
        .select("id, full_name, age, organization, email")
        .not("id", "in", registeredIds)
        .limit(3)

      if (recommendedError) throw recommendedError

      setRecommendedVolunteers(recommended || [])
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const taskData = [
    { name: "Completed", value: taskStats.completed },
    { name: "Ongoing", value: taskStats.ongoing },
    { name: "Unassigned", value: taskStats.unassigned },
  ]

  const volunteerData = [
    { name: "Registered", value: volunteerStats.registered },
    { name: "Available", value: volunteerStats.maxVolunteers - volunteerStats.registered },
  ]

  if (loading) {
    return (
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Task Statistics</CardTitle>
              <CardDescription>Loading...</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Volunteer Statistics</CardTitle>
              <CardDescription>Loading...</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Task Statistics</CardTitle>
            <CardDescription>Overview of task status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {taskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{taskStats.completed}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">{taskStats.ongoing}</div>
                <div className="text-sm text-muted-foreground">Ongoing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{taskStats.unassigned}</div>
                <div className="text-sm text-muted-foreground">Unassigned</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volunteer Statistics</CardTitle>
            <CardDescription>Volunteer registration status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={volunteerData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {volunteerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#22c55e" : "#e5e7eb"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              <div className="text-2xl font-bold">
                {volunteerStats.registered}/{volunteerStats.maxVolunteers}
              </div>
              <div className="text-sm text-muted-foreground">Registered Volunteers</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recommended Volunteers</CardTitle>
          <CardDescription>Volunteers who might be interested in this event</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead className="text-right">Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recommendedVolunteers.map((volunteer) => (
                <TableRow key={volunteer.id}>
                  <TableCell className="font-medium">{volunteer.full_name}</TableCell>
                  <TableCell>{volunteer.age}</TableCell>
                  <TableCell>{volunteer.organization}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `mailto:${volunteer.email}`}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Contact
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {recommendedVolunteers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No recommended volunteers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 