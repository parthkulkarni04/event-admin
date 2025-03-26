import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowLeft, Calendar, Edit, MapPin, Users, Plus, UserPlus } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"
import { EventTasks } from "@/components/events/event-tasks"
import { EventStats } from "@/components/events/event-stats"
import { EventVolunteers } from "@/components/events/event-volunteers"

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  // Fetch event details from Supabase
  const { data: event, error } = await supabase.from("events").select("*").eq("id", params.id).single()

  if (error || !event) {
    notFound()
  }

  const eventId = parseInt(params.id, 10) // Convert string ID to number

  const statusColors: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    archived: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  }
  
  const statusColor = statusColors[event.status as keyof typeof statusColors] || statusColors.draft

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Back to events">
              <Link href="/dashboard/events">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{event.title}</h1>
            <Badge variant="outline" className={statusColor}>
              {event.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/events/${event.id}/tasks/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/dashboard/events/${event.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Event
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-5">
          {/* Event Details Card - takes up 2 columns */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>Comprehensive information about this event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video w-full bg-muted rounded-md overflow-hidden">
                {event.thumbnail_image ? (
                  <img
                    src={event.thumbnail_image || "/placeholder.svg"}
                    alt={`${event.title} thumbnail`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <Calendar className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="font-medium">Date: </span>
                    <span>
                      {format(new Date(event.start_date), "MMMM d, yyyy")} -{" "}
                      {format(new Date(event.end_date), "MMMM d, yyyy")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="font-medium">Location: </span>
                    <span>
                      {event.location} ({event.location_type})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="font-medium">Max Volunteers: </span>
                    <span>{event.max_volunteers}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline">{event.event_category}</Badge>
                  <Badge variant="outline">{event.location_type}</Badge>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-muted-foreground">{event.description || "No description provided."}</p>
              </div>

              {event.registration_deadline && (
                <div>
                  <h3 className="font-medium mb-2">Registration Deadline</h3>
                  <p className="text-muted-foreground">
                    {format(new Date(event.registration_deadline), "MMMM d, yyyy")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Statistics Section - takes up 3 columns */}
          <div className="md:col-span-3 flex flex-col gap-6">
            {/* Event Statistics Card */}
            <Card>
              <CardHeader>
                <CardTitle>Event Statistics</CardTitle>
                <CardDescription>Overview of tasks and volunteers</CardDescription>
              </CardHeader>
              <CardContent>
                <EventStats eventId={eventId} />
              </CardContent>
            </Card>
            
            {/* Tasks Card */}
            <Card>
              <CardHeader>
                <CardTitle>Tasks</CardTitle>
                <CardDescription>Manage tasks for this event</CardDescription>
              </CardHeader>
              <CardContent>
                <EventTasks eventId={event.id} />
              </CardContent>
            </Card>
            
            {/* Volunteers Card */}
            <Card>
              <CardHeader>
                <CardTitle>Volunteers</CardTitle>
                <CardDescription>Manage volunteers for this event</CardDescription>
              </CardHeader>
              <CardContent>
                <EventVolunteers eventId={eventId} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

async function EventTaskCount({ eventId }: { eventId: number }) {
  const { count } = await supabase
    .from("tasks")
    .select("task_id", { count: "exact", head: true })
    .eq("event_id", eventId)

  return <>{count || 0}</>
}

async function EventCompletedTaskCount({ eventId }: { eventId: number }) {
  const { count } = await supabase
    .from("tasks")
    .select("task_id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("task_status", "done")

  return <>{count || 0}</>
}

async function EventVolunteerCount({ eventId }: { eventId: number }) {
  const { count } = await supabase
    .from("volunteer_event")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "registered")

  return <>{count || 0}</>
}

async function EventVolunteerCapacity({ eventId, maxVolunteers }: { eventId: number; maxVolunteers: number }) {
  const { count } = await supabase
    .from("volunteer_event")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "registered")

  return (
    <>
      {count || 0}/{maxVolunteers}
    </>
  )
}

