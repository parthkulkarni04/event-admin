import Link from "next/link"
import { format } from "date-fns"
import { Calendar, Edit, Eye, MapPin, MoreHorizontal, Trash2, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase"
import type { Event } from "@/lib/supabase"

export async function EventsList() {
  // Fetch events from Supabase
  const { data: events, error } = await supabase.from("events").select("*").order("start_date", { ascending: true })

  if (error) {
    console.error("Error fetching events:", error)
    return <div>Error loading events</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Events</CardTitle>
        <CardDescription>Manage your events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events && events.length > 0 ? (
            events.map((event) => <EventRow key={event.id} event={event} />)
          ) : (
            <p>No events found</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function EventRow({ event }: { event: Event }) {
  const statusColors = {
    draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    archived: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  }

  return (
    <div className="flex flex-col space-y-2 rounded-md border p-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{event.title}</h3>
          <Badge variant="outline" className={statusColors[event.status]}>
            {event.status}
          </Badge>
          <Badge variant="outline">{event.event_category}</Badge>
        </div>
        <div className="flex flex-col gap-1 text-sm text-muted-foreground md:flex-row md:gap-2">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{format(new Date(event.start_date), "MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>Max {event.max_volunteers} volunteers</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/dashboard/events/${event.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href={`/dashboard/events/${event.id}/edit`}>
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
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/events/${event.id}/tasks`}>Manage Tasks</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/events/${event.id}/volunteers`}>Manage Volunteers</Link>
            </DropdownMenuItem>
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

