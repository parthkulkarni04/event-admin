"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Search,
  RefreshCw,
  Clock,
  CalendarDays,
  ChevronDown,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

type Event = {
  id: number
  title: string
  location: string
  location_type: "virtual" | "physical"
  description: string | null
  thumbnail_image: string | null
  event_category: "A" | "B" | "C" | "D" | "E"
  start_date: string
  end_date: string
  registration_deadline: string | null
  max_volunteers: number | null
  status: "draft" | "published" | "archived" | "completed"
  created_at: string | null
  email_sent: boolean | null
}

type EventWithVolunteers = Event & {
  registeredVolunteers: number
}

const categoryLabels = {
  A: "Category A",
  B: "Category B",
  C: "Category C",
  D: "Category D",
  E: "Category E",
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventWithVolunteers[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [showArchived, setShowArchived] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    setLoading(true)
    setRefreshing(true)
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false })

      if (eventsError) throw eventsError

      // Fetch registered volunteers count for each event
      const eventsWithVolunteers = await Promise.all(
        (eventsData as Event[]).map(async (event) => {
          const { count } = await supabase
            .from("volunteer_event")
            .select("id", { count: "exact", head: true })
            .eq("event_id", event.id)
            .eq("status", "registered")

          return {
            ...event,
            registeredVolunteers: count || 0,
          } as EventWithVolunteers
        })
      )

      setEvents(eventsWithVolunteers)
    } catch (error) {
      console.error("Failed to fetch events:", error)
      // Set empty array on error to show empty state
      setEvents([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = searchText === "" || 
      event.title.toLowerCase().includes(searchText.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchText.toLowerCase()) ||
      event.location.toLowerCase().includes(searchText.toLowerCase())
    
    const matchesCategory = categoryFilter === "all" || event.event_category === categoryFilter
    const matchesLocation = locationFilter === "all" || event.location_type === locationFilter
    const matchesArchived = showArchived ? true : event.status !== "archived"

    return matchesSearch && matchesCategory && matchesLocation && matchesArchived
  })

  const groupedEvents = {
    draft: filteredEvents.filter(e => e.status === "draft"),
    published: filteredEvents.filter(e => e.status === "published"),
    archived: filteredEvents.filter(e => e.status === "archived"),
  }

  const EventCard = ({ event }: { event: EventWithVolunteers }) => {
    const progress = event.max_volunteers 
      ? (event.registeredVolunteers / event.max_volunteers) * 100 
      : 0

    return (
      <Card className="overflow-hidden transition-all hover:shadow-md">
        <Link href={`/dashboard/events/${event.id}`}>
          <div className="relative h-48 w-full">
            {event.thumbnail_image ? (
              <Image
                src={event.thumbnail_image}
                alt={event.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <Calendar className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <Badge
              className="absolute right-2 top-2"
              variant={
                event.status === "draft"
                  ? "secondary"
                  : event.status === "published"
                  ? "default"
                  : "outline"
              }
            >
              {event.status}
            </Badge>
          </div>
          <CardHeader>
            <CardTitle className="line-clamp-1">{event.title}</CardTitle>
            <CardDescription className="line-clamp-2">{event.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{event.location} ({event.location_type})</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>{format(new Date(event.start_date), "PPP")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{format(new Date(event.start_date), "p")} - {format(new Date(event.end_date), "p")}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Volunteers</span>
                  </div>
                  <span className="text-sm font-medium">
                    {event.registeredVolunteers}/{event.max_volunteers || "∞"}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  {event.max_volunteers ? (
                    <div 
                      className="h-full bg-red-500 transition-all duration-300"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  ) : (
                    <div 
                      className="h-full bg-red-500 transition-all duration-300"
                      style={{ width: "0%" }}
                    />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Badge variant="secondary">{categoryLabels[event.event_category]}</Badge>
          </CardFooter>
        </Link>
      </Card>
    )
  }

  const EventSection = ({ title, events }: { title: string; events: EventWithVolunteers[] }) => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  )

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchEvents}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              <span className="sr-only">Refresh events</span>
            </Button>
            <Button asChild>
              <Link href="/dashboard/events/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex w-full items-center gap-2 md:w-1/3">
            <Input
              placeholder="Search events..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-9"
            />
            <Button variant="outline" size="sm" className="h-9 px-4 shrink-0">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </div>
          <div className="flex flex-1 items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="virtual">Virtual</SelectItem>
                <SelectItem value="physical">Physical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-8">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-48 w-full bg-muted animate-pulse" />
                  <CardHeader>
                    <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-full bg-muted rounded animate-pulse mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-muted rounded animate-pulse" />
                      <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {groupedEvents.published.length > 0 && (
                <EventSection title="Published Events" events={groupedEvents.published} />
              )}
              {groupedEvents.draft.length > 0 && (
                <EventSection title="Draft Events" events={groupedEvents.draft} />
              )}
              {groupedEvents.archived.length > 0 && showArchived && (
                <EventSection title="Archived Events" events={groupedEvents.archived} />
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

