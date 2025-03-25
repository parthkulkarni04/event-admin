import Link from "next/link"
import { format } from "date-fns"
import { ArrowRight, Calendar, MapPin } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import type { Event } from "@/lib/supabase"

export async function RecentEvents() {
  // Fetch recent events from Supabase
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("start_date", { ascending: true })
    .limit(5)

  if (error) {
    console.error("Error fetching events:", error)
    return <div>Error loading events</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Events</CardTitle>
        <CardDescription>Overview of your upcoming and recent events</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {events && events.length > 0 ? (
          events.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <p>No events found</p>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href="/dashboard/events">
            <span>View All Events</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function EventCard({ event }: { event: Event }) {
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
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/dashboard/events/${event.id}`}>View</Link>
        </Button>
        <Button asChild size="sm" variant="default">
          <Link href={`/dashboard/events/${event.id}/edit`}>Edit</Link>
        </Button>
      </div>
    </div>
  )
}

