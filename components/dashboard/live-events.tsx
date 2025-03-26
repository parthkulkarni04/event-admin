import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { Calendar, MapPin } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Event } from "@/lib/supabase"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export async function LiveEvents() {
  // Fetch live events from Supabase using the provided SQL logic
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .filter("start_date", "lte", new Date().toISOString())
    .filter("end_date", "gte", new Date().toISOString())

  if (error) {
    console.error("Error fetching live events:", error)
    return <div>Error loading live events</div>
  }

  // Type assertion to ensure the data matches our Event type
  const typedEvents = events as Event[]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Events</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {typedEvents && typedEvents.length > 0 ? (
          typedEvents.map((event) => <LiveEventCard key={event.id} event={event} />)
        ) : (
          <p className="text-muted-foreground">No live events at the moment</p>
        )}
      </CardContent>
    </Card>
  )
}

function LiveEventCard({ event }: { event: Event }) {
  return (
    <div className="flex flex-col space-y-2 rounded-md border p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{event.title}</h3>
            <span className="animate-pulse rounded bg-red-500 px-2 py-1 text-xs font-bold text-white">
              LIVE
            </span>
          </div>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground md:flex-row md:gap-2">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {format(new Date(event.start_date), "MMM d, yyyy")} -{" "}
                {format(new Date(event.end_date), "MMM d, yyyy")}
              </span>
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
    </div>
  )
}