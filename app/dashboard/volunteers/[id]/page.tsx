"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Calendar, 
  Clock, 
  CalendarDays,
  GraduationCap,
  Briefcase,
  Users,
  AlarmClock,
  Tag,
  Clock3,
  BadgeCheck,
  CircleAlert,
  CircleX,
  CircleCheck,
  Trash2,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import type { VolunteerNonAuth } from "@/lib/supabase"

interface VolunteerSkill {
  skill_id: number
  skill: string
  skill_icon: string | null
}

export default function VolunteerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [volunteer, setVolunteer] = useState<VolunteerNonAuth | null>(null)
  const [skills, setSkills] = useState<VolunteerSkill[]>([])
  const [registeredEvents, setRegisteredEvents] = useState<any[]>([])
  const [assignedTasks, setAssignedTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    fetchVolunteerDetails()
  }, [params.id])

  async function fetchVolunteerDetails() {
    setIsLoading(true)
    try {
      // Fetch volunteer details
      const { data: volunteerData, error: volunteerError } = await supabase
        .from("volunteers_non_auth")
        .select("*")
        .eq("id", params.id)
        .single()

      if (volunteerError) throw volunteerError
      setVolunteer(volunteerData)

      // Fetch volunteer skills
      const { data: skillsData, error: skillsError } = await supabase
        .from("volunteer_skills")
        .select(`
          skill_id,
          skills (
            skill_id,
            skill,
            skill_icon
          )
        `)
        .eq("volunteer_id", volunteerData.volunteer_id)

      if (!skillsError && skillsData) {
        const formattedSkills = skillsData.map(item => ({
          skill_id: item.skills?.skill_id || 0,
          skill: item.skills?.skill || "Unknown Skill",
          skill_icon: item.skills?.skill_icon || null,
        }))
        setSkills(formattedSkills)
      }

      // Fetch registered events
      const { data: eventsData, error: eventsError } = await supabase
        .from("volunteer_event")
        .select(`
          id,
          created_at,
          status,
          events (
            id,
            title,
            location,
            start_date,
            end_date,
            status
          )
        `)
        .eq("volunteer_id", volunteerData.volunteer_id)
        .eq("status", "registered")
        .order("created_at", { ascending: false })

      if (!eventsError && eventsData) {
        const formattedEvents = eventsData
          .filter(item => item.events !== null)
          .map(item => ({
            id: item.id,
            event_id: item.events?.id,
            title: item.events?.title,
            location: item.events?.location,
            start_date: item.events?.start_date,
            end_date: item.events?.end_date,
            status: item.events?.status,
            registered_at: item.created_at,
          }))
        setRegisteredEvents(formattedEvents)
      }

      // Fetch assigned tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          task_id,
          task_description,
          task_status,
          created_at,
          updated_at,
          event_id,
          events (
            id,
            title
          )
        `)
        .eq("volunteer_id", volunteerData.volunteer_id)
        .order("updated_at", { ascending: false })

      if (!tasksError && tasksData) {
        setAssignedTasks(tasksData)
      }
    } catch (error) {
      console.error("Error fetching volunteer details:", error)
      toast({
        title: "Error",
        description: "Failed to load volunteer details",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function deleteVolunteer() {
    if (!volunteer) return
    
    try {
      const { error } = await supabase
        .from("volunteers_non_auth")
        .delete()
        .eq("id", volunteer.id)
      
      if (error) throw error
      
      toast({
        title: "Volunteer deleted",
        description: "The volunteer has been deleted successfully.",
      })
      
      router.push("/dashboard/volunteers")
    } catch (error) {
      console.error("Error deleting volunteer:", error)
      toast({
        title: "Error",
        description: "Failed to delete volunteer",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Published</Badge>
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Draft</Badge>
      case "archived":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">Archived</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case "unassigned":
        return <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50">Unassigned</Badge>
      case "to do":
        return <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50">To Do</Badge>
      case "doing":
        return <Badge variant="outline" className="text-purple-500 border-purple-200 bg-purple-50">In Progress</Badge>
      case "done":
        return <Badge variant="outline" className="text-green-500 border-green-200 bg-green-50">Completed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/volunteers")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Skeleton className="h-10 w-[200px]" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (!volunteer) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/volunteers")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Volunteer Not Found</h1>
          </div>
          <div className="py-12 text-center">
            <CircleX className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">Volunteer Not Found</h2>
            <p className="mt-2 text-muted-foreground">The volunteer you're looking for doesn't exist or has been deleted.</p>
            <Button 
              className="mt-6" 
              onClick={() => router.push("/dashboard/volunteers")}
            >
              Back to Volunteers
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const initials = volunteer.full_name
    ? volunteer.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "V"

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header with back button and actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push("/dashboard/volunteers")}
              aria-label="Back to volunteers"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">
              {volunteer.full_name || "Unnamed Volunteer"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Volunteer
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left column: Basic Info & Availability */}
          <div className="space-y-6 md:col-span-1">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {initials}
                  </div>
                  <div>Contact Information</div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {volunteer.email && (
                  <div className="flex items-start gap-2">
                    <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Email</p>
                      <p className="break-all">{volunteer.email}</p>
                    </div>
                  </div>
                )}
                
                {volunteer.mobile_number && (
                  <div className="flex items-start gap-2">
                    <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Phone</p>
                      <p>{volunteer.mobile_number}</p>
                    </div>
                  </div>
                )}
                
                {volunteer.organization && (
                  <div className="flex items-start gap-2">
                    <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Organization</p>
                      <p>{volunteer.organization}</p>
                    </div>
                  </div>
                )}
                
                {volunteer.preferred_location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Location</p>
                      <p>{volunteer.preferred_location}</p>
                    </div>
                  </div>
                )}
                
                {volunteer.created_at && (
                  <div className="flex items-start gap-2">
                    <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Joined</p>
                      <p>{format(new Date(volunteer.created_at), "MMMM d, yyyy")}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Availability */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Availability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {volunteer.time_preference && (
                  <div className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Preferred Time</p>
                      <p>{volunteer.time_preference}</p>
                    </div>
                  </div>
                )}
                
                {volunteer.availability_start_date && (
                  <div className="flex items-start gap-2">
                    <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Available From</p>
                      <p>{format(new Date(volunteer.availability_start_date), "MMMM d, yyyy")}</p>
                    </div>
                  </div>
                )}
                
                {volunteer.availability_end_date && (
                  <div className="flex items-start gap-2">
                    <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Available Until</p>
                      <p>{format(new Date(volunteer.availability_end_date), "MMMM d, yyyy")}</p>
                    </div>
                  </div>
                )}
                
                {volunteer.days_available && volunteer.days_available.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">Available Days</p>
                    <div className="flex flex-wrap gap-2">
                      {volunteer.days_available.map((day, index) => (
                        <Badge key={index} variant="outline">
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <Badge key={skill.skill_id} className="flex items-center gap-1">
                        {skill.skill_icon && <span>{skill.skill_icon}</span>}
                        {skill.skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No skills listed</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Columns: Events, Tasks, and Additional Info */}
          <div className="space-y-6 md:col-span-2">
            {/* Registered Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Registered Events
                </CardTitle>
                <CardDescription>
                  Events this volunteer has registered for
                </CardDescription>
              </CardHeader>
              <CardContent>
                {registeredEvents.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Registered On</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {registeredEvents.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell className="font-medium">
                              <Button 
                                variant="link" 
                                className="p-0 h-auto" 
                                onClick={() => router.push(`/dashboard/events/${event.event_id}`)}
                              >
                                {event.title}
                              </Button>
                            </TableCell>
                            <TableCell>
                              {event.start_date && (
                                <span>
                                  {format(new Date(event.start_date), "MMM d, yyyy")}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(event.status)}
                            </TableCell>
                            <TableCell>
                              {event.registered_at && (
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(event.registered_at), "MMM d, yyyy")}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <CircleAlert className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">Not registered for any events yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assigned Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Assigned Tasks
                </CardTitle>
                <CardDescription>
                  Tasks assigned to this volunteer
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assignedTasks.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Task</TableHead>
                          <TableHead>Event</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Updated</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignedTasks.map((task) => (
                          <TableRow key={task.task_id}>
                            <TableCell className="font-medium max-w-[250px] truncate">
                              {task.task_description}
                            </TableCell>
                            <TableCell>
                              {task.events?.title ? (
                                <Button 
                                  variant="link" 
                                  className="p-0 h-auto" 
                                  onClick={() => router.push(`/dashboard/events/${task.event_id}`)}
                                >
                                  {task.events.title}
                                </Button>
                              ) : (
                                <span className="text-muted-foreground">Unknown Event</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {getTaskStatusBadge(task.task_status)}
                            </TableCell>
                            <TableCell>
                              {task.updated_at && (
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(task.updated_at), "MMM d, yyyy")}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <CircleAlert className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">No tasks assigned yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {volunteer.age && (
                  <div className="flex items-start gap-2">
                    <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Age</p>
                      <p>{volunteer.age}</p>
                    </div>
                  </div>
                )}
                
                {volunteer.work_types && volunteer.work_types.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">Preferred Work Types</p>
                    <div className="flex flex-wrap gap-2">
                      {volunteer.work_types.map((type, index) => (
                        <Badge key={index} variant="secondary">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-2">
                  <BadgeCheck className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Onboarding Status</p>
                    <p>
                      {volunteer.onboarding_completed ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CircleCheck className="mr-1 h-3 w-3" />
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          <Clock3 className="mr-1 h-3 w-3" />
                          Step {volunteer.onboarding_step} of 5
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Volunteer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this volunteer? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md bg-muted p-4">
            <div className="font-medium">{volunteer.full_name || "Unnamed Volunteer"}</div>
            {volunteer.email && <div className="text-sm">{volunteer.email}</div>}
            {volunteer.organization && (
              <div className="text-sm text-muted-foreground">{volunteer.organization}</div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteVolunteer}
            >
              Delete Volunteer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
} 