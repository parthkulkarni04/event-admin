import Link from "next/link"
import { Edit, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import type { VolunteerNonAuth } from "@/lib/supabase"

export async function EventVolunteers({ eventId }: { eventId: number }) {
  // Get registered volunteers for this event directly from volunteers_non_auth table via email matching
  // First, get volunteer emails from the volunteer_event table
  const { data: volunteerEvents, error: eventsError } = await supabase
    .from("volunteer_event")
    .select("volunteer_id")
    .eq("event_id", eventId)
    .eq("status", "registered")

  if (eventsError) {
    console.error("Error fetching volunteer events:", eventsError)
    return <div>Error loading volunteers</div>
  }

  // If no volunteers are registered, return early
  if (!volunteerEvents || volunteerEvents.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Event Volunteers</CardTitle>
            <CardDescription>Volunteers registered for this event</CardDescription>
          </div>
          <Button asChild size="sm">
            <Link href={`/dashboard/events/${eventId}/volunteers/add`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Volunteer
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="mb-4 text-muted-foreground">No volunteers have registered for this event yet.</p>
            <Button asChild>
              <Link href={`/dashboard/events/${eventId}/volunteers/add`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Volunteer
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get volunteer details from volunteers_non_auth
  const { data: volunteers, error: volunteersError } = await supabase
    .from("volunteers_non_auth")
    .select("*")
    .in("id", volunteerEvents.map(ve => ve.volunteer_id))

  if (volunteersError) {
    console.error("Error fetching volunteers:", volunteersError)
    return <div>Error loading volunteers</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Event Volunteers</CardTitle>
          <CardDescription>Volunteers registered for this event</CardDescription>
        </div>
        <Button asChild size="sm">
          <Link href={`/dashboard/events/${eventId}/volunteers/add`}>
            <Plus className="mr-2 h-4 w-4" />
            Add Volunteer
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {volunteers && volunteers.length > 0 ? (
          <div className="space-y-4">
            {volunteers.map((volunteer) => (
              <VolunteerCard key={volunteer.id} volunteer={volunteer} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="mb-4 text-muted-foreground">No volunteers have registered for this event yet.</p>
            <Button asChild>
              <Link href={`/dashboard/events/${eventId}/volunteers/add`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Volunteer
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function VolunteerCard({ volunteer }: { volunteer: VolunteerNonAuth }) {
  const initials = volunteer.full_name
    ? volunteer.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U"

  return (
    <div className="flex flex-col space-y-2 rounded-md border p-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div className="flex items-center space-x-4">
        <Avatar>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h3 className="font-medium">{volunteer.full_name || "Unnamed Volunteer"}</h3>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground md:flex-row md:gap-2">
            <span>{volunteer.email || "No email"}</span>
            {volunteer.mobile_number && <span>{volunteer.mobile_number}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/dashboard/volunteers/${volunteer.id}`}>View</Link>
        </Button>
        <Button asChild size="sm">
          <Link href={`/dashboard/volunteers/${volunteer.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>
    </div>
  )
}

