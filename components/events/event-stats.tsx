"use client"

import { useEffect, useState } from "react"
import { Mail } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip
} from "recharts"

interface TaskStats {
  completed: number
  ongoing: number
  assigned: number
  unassigned: number
}

interface VolunteerStats {
  registered: number
  maxVolunteers: number
}

interface Skill {
  skill_id: number
  skill: string
  skill_icon: string | null
}

interface RecommendedVolunteer {
  id: string
  full_name: string
  organization: string
  email: string
  skills: Skill[]
}

const TASK_COLORS = ["#22c55e", "#f59e0b", "#3b82f6", "#ef4444"]
const VOLUNTEER_COLORS = ["#22c55e", "#e5e7eb"]

export function EventStats({ eventId }: { eventId: number }) {
  const [taskStats, setTaskStats] = useState<TaskStats>({ 
    completed: 0, 
    ongoing: 0, 
    assigned: 0, 
    unassigned: 0 
  })
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

      const taskCounts = {
        total: tasks.length,
        completed: tasks.filter(t => t.task_status === "complete").length,
        ongoing: tasks.filter(t => t.task_status === "inprogress").length,
        assigned: tasks.filter(t => t.task_status === "assigned").length,
        unassigned: tasks.filter(t => t.task_status === "unassigned").length,
      }
      setTaskStats(taskCounts)

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

      // Get already registered volunteers for this event to exclude them
      const { data: registeredVolunteers, error: regVolError } = await supabase
        .from("volunteer_event")
        .select("volunteer_id")
        .eq("event_id", eventId)
        .not("volunteer_id", "is", null)
      
      if (regVolError) throw regVolError
      
      const registeredIds = registeredVolunteers?.map(v => v.volunteer_id) || []
      
      // Get 3 random volunteers who are not already registered
      const { data: volunteers, error: volError } = await supabase
        .from("volunteers_non_auth")
        .select("id, full_name, organization, email")
        .limit(3)
        .order('created_at', { ascending: false })
      
      if (volError) throw volError
      
      if (!volunteers || volunteers.length === 0) {
        setRecommendedVolunteers([])
        return
      }
      
      // For each volunteer, fetch their skills
      const volunteersWithSkills = await Promise.all(
        volunteers.map(async (volunteer) => {
          // Check if volunteer already registered for this event
          if (registeredIds.includes(volunteer.id)) {
            return null
          }
          
          // Get volunteer skills
          const { data: volunteerSkills, error: skillsError } = await supabase
            .from("volunteer_skills")
            .select(`
              skill_id,
              skills (
                skill_id,
                skill,
                skill_icon
              )
            `)
            .eq("volunteer_id", volunteer.id)
          
          const skills = volunteerSkills?.map(item => item.skills as Skill) || []
          
          return {
            ...volunteer,
            skills
          }
        })
      )
      
      // Filter out null values (already registered volunteers)
      const filteredVolunteers = volunteersWithSkills.filter(v => v !== null) as RecommendedVolunteer[]
      setRecommendedVolunteers(filteredVolunteers)
      
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate total tasks for progress bar
  const totalTasks = taskStats.completed + taskStats.ongoing + taskStats.assigned + taskStats.unassigned || 1 // Prevent division by zero

  if (loading) {
    return (
      <div>
        <CardDescription>Loading...</CardDescription>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {/* Task Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Task Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {totalTasks > 0 ? (
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full flex">
                  <div 
                    className="bg-green-500" 
                    style={{ width: `${(taskStats.completed / totalTasks) * 100}%` }}
                  />
                  <div 
                    className="bg-orange-500" 
                    style={{ width: `${(taskStats.ongoing / totalTasks) * 100}%` }}
                  />
                  <div 
                    className="bg-blue-500" 
                    style={{ width: `${(taskStats.assigned / totalTasks) * 100}%` }}
                  />
                  <div 
                    className="bg-red-500" 
                    style={{ width: `${(taskStats.unassigned / totalTasks) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="h-3 bg-muted rounded-full overflow-hidden"></div>
            )}
            <div className="grid grid-cols-4 gap-1 text-center">
              <div>
                <div className="text-base font-medium text-green-500">{taskStats.completed}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-base font-medium text-orange-500">{taskStats.ongoing}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
              <div>
                <div className="text-base font-medium text-blue-500">{taskStats.assigned}</div>
                <div className="text-xs text-muted-foreground">Assigned</div>
              </div>
              <div>
                <div className="text-base font-medium text-red-500">{taskStats.unassigned}</div>
                <div className="text-xs text-muted-foreground">Unassigned</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Volunteer Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Volunteer Registration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[150px] flex items-center justify-center">
            <div className="w-[200px] h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Registered", value: volunteerStats.registered },
                      { name: "Available", value: Math.max(0, volunteerStats.maxVolunteers - volunteerStats.registered) }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    <Cell fill={VOLUNTEER_COLORS[0]} />
                    <Cell fill={VOLUNTEER_COLORS[1]} />
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} volunteers`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-2 text-center">
            <div className="text-base font-medium">
              {volunteerStats.registered}/{volunteerStats.maxVolunteers}
            </div>
            <div className="text-xs text-muted-foreground">Registered Volunteers</div>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Volunteers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recommended Volunteers</CardTitle>
        </CardHeader>
        <CardContent>
          {recommendedVolunteers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead className="text-right">Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recommendedVolunteers.map((volunteer) => (
                  <TableRow key={volunteer.id}>
                    <TableCell className="font-medium">
                      {volunteer.full_name}
                      {volunteer.organization && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {volunteer.organization}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {volunteer.skills && volunteer.skills.length > 0 ? (
                          volunteer.skills.map((skill) => (
                            <Badge key={skill.skill_id} variant="secondary" className="text-xs">
                              {skill.skill_icon && <span className="mr-1">{skill.skill_icon}</span>}
                              {skill.skill}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No skills listed</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <a 
                        href={`mailto:${volunteer.email}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No recommended volunteers available.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 