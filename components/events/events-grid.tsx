import Link from "next/link"
import { format } from "date-fns"
import { Calendar, MapPin, Users } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import type { Event } from "@/lib/supabase"

export async function EventsGrid() {
  // Fetch events from Supabase
  const { data: events, error } = await supabase.from("events").select("*").order("start_date", { ascending: true })

  if (error) {
    console.error("Error fetching events:", error)
    return <div>Error loading events</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events && events.length > 0 ? (
        events.map((event) => <EventCard key={event.id} event={event} />)
      ) : (
        <p className="col-span-full">No events found</p>
      )}
    </div>
  )
}

function EventCard({ event }: { event: Event }) {
  const statusColors = {
    draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    archived: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={statusColors[event.status]}>
            {event.status}
          </Badge>
          <Badge variant="outline">{event.event_category}</Badge>
        </div>
        <CardTitle className="line-clamp-1">{event.title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="aspect-video w-full bg-muted mb-4 rounded-md overflow-hidden">
          {event.thumbnail_image ? (
            <img
              src={event.thumbnail_image || "/placeholder.svg"}
              alt={event.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(new Date(event.start_date), "MMM d, yyyy")} - {format(new Date(event.end_date), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>
              {event.location} ({event.location_type})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>Max {event.max_volunteers} volunteers</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 pt-2">
        <Button asChild variant="outline" className="w-full">
          <Link href={`/dashboard/events/${event.id}`}>View Details</Link>
        </Button>
        <Button asChild className="w-full">
          <Link href={`/dashboard/events/${event.id}/edit`}>Edit</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

