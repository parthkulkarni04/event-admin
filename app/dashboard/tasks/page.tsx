"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar, CheckCircle2, Circle, Clock, Filter, Plus, Search, XCircle, HelpCircle, Activity, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import type { Task as BaseTask, Skill } from "@/lib/supabase"

// Update Task type to match the database schema
interface Task extends Omit<BaseTask, 'task_status' | 'event_id'> {
  task_status: "unassigned" | "assigned" | "inprogress" | "complete";
  event_id: number | null;
}

type TaskWithRelations = Task & {
  events: { title: string } | null;
  volunteer_name: string | null;
  volunteer_email: string | null;
  skills: Skill[];
}

export default function TasksPage() {
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<TaskWithRelations[]>([])
  const [filteredTasks, setFilteredTasks] = useState<TaskWithRelations[]>([])
  const [events, setEvents] = useState<{id: number, title: string}[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const tasksPerPage = 10
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [eventFilter, setEventFilter] = useState<number | null>(null)
  const [selectedSkills, setSelectedSkills] = useState<number[]>([])

  // Calculate pagination
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage)
  const startIndex = (currentPage - 1) * tasksPerPage
  const endIndex = startIndex + tasksPerPage
  const currentTasks = filteredTasks.slice(startIndex, endIndex)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [tasks, searchQuery, statusFilter, eventFilter, selectedSkills])

  async function fetchData() {
    setLoading(true)
    try {
      // Fetch tasks with event details
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          *,
          events:event_id (
            title
          )
        `)
        .order("updated_at", { ascending: false })

      if (tasksError) throw tasksError
      console.log("Tasks data:", tasksData)

      // Fetch all skills
      const { data: skillsData, error: skillsError } = await supabase
        .from("skills")
        .select("*")
        .order("skill", { ascending: true })

      if (skillsError) throw skillsError
      
      // Fetch all events
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("id, title")
        .order("title", { ascending: true })

      if (eventsError) throw eventsError

      // Fetch all volunteers to check structure
      const { data: allVolunteers, error: allVolunteersError } = await supabase
        .from("volunteers_non_auth")
        .select("*")
        .limit(5)
      
      if (!allVolunteersError) {
        console.log("Sample volunteers data:", allVolunteers)
      }

      // Fetch task skills for each task
      const tasksWithSkills = await Promise.all(
        tasksData.map(async (task) => {
          // Get skills for this task
          const { data: taskSkills, error: skillsError } = await supabase
            .from("task_skills")
            .select("skill_id")
            .eq("task_id", task.task_id)

          if (skillsError) throw skillsError

          // Map skill_ids to actual skill objects
          const taskSkillObjects = taskSkills.map(ts => 
            skillsData.find(s => s.skill_id === ts.skill_id)
          ).filter(Boolean) as Skill[]

          // Get volunteer name if assigned
          let volunteerName = null
          let volunteerEmail = null
          
          if (task.volunteer_id) {
            console.log(`Looking up volunteer_id: ${task.volunteer_id} for task: ${task.task_id}`)
            
            // Try different field names
            const { data: volunteer, error: volunteerError } = await supabase
              .from("volunteers_non_auth")
              .select("*")
              .eq("id", task.volunteer_id)
              .single()

            if (volunteerError) {
              console.error(`Error finding volunteer with id ${task.volunteer_id}:`, volunteerError)
              
              // Try alternate field
              const { data: altVolunteer, error: altVolunteerError } = await supabase
                .from("volunteers_non_auth")
                .select("*")
                .eq("volunteer_id", task.volunteer_id)
                .single()
                
              if (!altVolunteerError && altVolunteer) {
                console.log("Found volunteer using volunteer_id field:", altVolunteer)
                volunteerName = altVolunteer.full_name
                volunteerEmail = altVolunteer.email
              }
            } else if (volunteer) {
              console.log("Found volunteer:", volunteer)
              volunteerName = volunteer.full_name
              volunteerEmail = volunteer.email
            }
          }

          return {
            ...task,
            // Ensure task_status is one of the valid statuses
            task_status: (task.task_status as "unassigned" | "assigned" | "inprogress" | "complete") || "unassigned",
            skills: taskSkillObjects,
            volunteer_name: volunteerName,
            volunteer_email: volunteerEmail
          } as TaskWithRelations
        })
      )

      setTasks(tasksWithSkills)
      setFilteredTasks(tasksWithSkills)
      setSkills(skillsData)
      setEvents(eventsData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let filtered = [...tasks]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(task => 
        task.task_description.toLowerCase().includes(query) ||
        task.volunteer_name?.toLowerCase().includes(query) ||
        task.events?.title.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(task => task.task_status === statusFilter)
    }

    // Apply event filter
    if (eventFilter) {
      filtered = filtered.filter(task => task.event_id === eventFilter)
    }

    // Apply skills filter
    if (selectedSkills.length > 0) {
      filtered = filtered.filter(task => 
        task.skills.some(skill => selectedSkills.includes(skill.skill_id))
      )
    }

    setFilteredTasks(filtered)
  }

  // Define task status configurations
  const statusConfig = {
    unassigned: {
      label: "Unassigned",
      icon: HelpCircle,
      color: "bg-gray-100 text-gray-800 hover:bg-gray-200"
    },
    assigned: {
      label: "Assigned",
      icon: Clock,
      color: "bg-amber-100 text-amber-800 hover:bg-amber-200"
    },
    inprogress: {
      label: "In Progress",
      icon: Activity,
      color: "bg-blue-100 text-blue-800 hover:bg-blue-200"
    },
    complete: {
      label: "Completed",
      icon: CheckCircle,
      color: "bg-green-100 text-green-800 hover:bg-green-200"
    }
  }


  // Default status configuration
  const defaultStatus = {
    label: "Unknown",
    icon: Circle,
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    rowColor: "bg-gray-50 dark:bg-gray-900",
  };

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setEventFilter(null)
    setSelectedSkills([])
  }

  const handleCheckboxChange = async (taskId: number, isComplete: boolean) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ 
          task_status: isComplete ? "complete" : "assigned", 
          updated_at: new Date().toISOString() 
        })
        .eq("task_id", taskId)
        
      if (error) throw error
      
      // Refresh the data
      fetchData()
    } catch (error) {
      console.error("Error updating task status:", error)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 m-3">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <Button asChild>
            <Link href="/dashboard/tasks/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex w-full md:w-1/3 items-center space-x-2">
            <Input 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9" 
              aria-label="Search tasks" 
            />
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9"
                onClick={() => setSearchQuery("")}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="inprogress">In Progress</SelectItem>
                <SelectItem value="complete">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={eventFilter?.toString() || "all"} 
              onValueChange={(value) => setEventFilter(value === "all" ? null : parseInt(value))}
            >
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue placeholder="Event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id.toString()}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9">
                  <Filter className="mr-2 h-4 w-4" />
                  Skills
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {skills.map((skill) => (
                  <DropdownMenuCheckboxItem
                    key={skill.skill_id}
                    checked={selectedSkills.includes(skill.skill_id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedSkills([...selectedSkills, skill.skill_id])
                      } else {
                        setSelectedSkills(selectedSkills.filter(id => id !== skill.skill_id))
                      }
                    }}
                  >
                    {skill.skill}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {(searchQuery || statusFilter !== "all" || eventFilter || selectedSkills.length > 0) && (
              <Button 
                variant="ghost" 
                size="sm"
                className="h-9"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox />
                </TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <Spinner className="h-8 w-8" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : currentTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No tasks found.
                  </TableCell>
                </TableRow>
              ) : (
                currentTasks.map((task) => {
                  const status = task.task_status || "unassigned";
                  const statusConfigItem = statusConfig[status as keyof typeof statusConfig] || defaultStatus;
                  const StatusIcon = statusConfigItem.icon;
                  
                  return (
                    <TableRow 
                      key={task.task_id}
                      className="hover:bg-muted/50"
                    >
                      <TableCell>
                        <Checkbox 
                          checked={status === "complete"} 
                          aria-label="Mark as complete"
                        />
                      </TableCell>
                      <TableCell>
                        <Link 
                          href={`/dashboard/tasks/${task.task_id}`}
                          className="hover:underline font-medium"
                        >
                          {task.task_description}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {task.events ? (
                          <Link 
                            href={`/dashboard/events/${task.event_id}`}
                            className="hover:underline flex items-center"
                          >
                            <Calendar className="mr-1 h-3 w-3 text-muted-foreground" />
                            {task.events.title}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground italic">No event</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.volunteer_name ? (
                          <div className="flex flex-col">
                            <span>{task.volunteer_name}</span>
                            {task.volunteer_email && (
                              <span className="text-xs text-muted-foreground">{task.volunteer_email}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={statusConfigItem.color}
                        >
                          <StatusIcon className="mr-1 h-3 w-3 inline" />
                          {statusConfigItem.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {task.skills.length > 0 ? (
                            task.skills.map((skill) => (
                              <Badge key={skill.skill_id} variant="secondary" className="text-xs">
                                {skill.skill_icon && <span className="mr-1">{skill.skill_icon}</span>}
                                {skill.skill}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground italic">No skills</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {task.updated_at ? (
                          format(new Date(task.updated_at), "MMM d, yyyy h:mm a")
                        ) : (
                          format(new Date(task.created_at || ""), "MMM d, yyyy h:mm a")
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 p-0" aria-label="Edit">
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 p-0" aria-label="Delete">
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {filteredTasks.length > tasksPerPage && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredTasks.length)} of {filteredTasks.length} tasks
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

