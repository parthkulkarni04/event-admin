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
  event_category: "Education" | "Blog" | "Culture" | "Rehabilitation" | "Environment" | "Audio Recording" | "Field Work" | "Sports" | "Employment & Entrepreneurship"
  start_date: string
  end_date: string
  registration_deadline: string | null
  max_volunteers: number | null
  status: "draft" | "published" | "archived" | "completed"
  created_at: string | null
  email_sent: boolean | null
}

const categoryLabels = {
  "Education": "Education",
  "Blog": "Blog",
  "Culture": "Culture",
  "Rehabilitation": "Rehabilitation",
  "Environment": "Environment",
  "Audio Recording": "Audio Recording",
  "Field Work": "Field Work",
  "Sports": "Sports",
  "Employment & Entrepreneurship": "Employment & Entrepreneurship"
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
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
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching events:", error)
      } else if (data) {
        setEvents(data as Event[])
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
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

  const EventCard = ({ event }: { event: Event }) => (
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
          <CardDescription className="line-clamp-2 whitespace-pre-line">
            {event.description || "No description provided."}
          </CardDescription>
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
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Max {event.max_volunteers || "∞"} volunteers</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Badge variant="secondary">{categoryLabels[event.event_category]}</Badge>
        </CardFooter>
      </Link>
    </Card>
  )

  const EventSection = ({ title, events }: { title: string; events: Event[] }) => (
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
      <div className="flex flex-col gap-6 m-3">
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
                  <div className="h-48 w-full bg-muted" />
                  <CardHeader>
                    <div className="h-4 w-2/3 bg-muted" />
                    <div className="h-3 w-full bg-muted" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[...Array(4)].map((_, j) => (
                        <div key={j} className="h-4 w-full bg-muted" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {groupedEvents.draft.length > 0 && (
                <EventSection title="Draft Events" events={groupedEvents.draft} />
              )}
              {groupedEvents.published.length > 0 && (
                <EventSection title="Published Events" events={groupedEvents.published} />
              )}
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowArchived(!showArchived)}
                    className="flex items-center gap-2"
                  >
                    <span>
                      {showArchived ? "Hide Archived Events" : "View Archived Events"}
                      {!showArchived && groupedEvents.archived.length > 0 && ` (${groupedEvents.archived.length})`}
                    </span>
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      showArchived && "rotate-180"
                    )} />
                  </Button>
                </div>
                {showArchived && groupedEvents.archived.length > 0 && (
                  <EventSection title="Archived Events" events={groupedEvents.archived} />
                )}
              </div>
              {filteredEvents.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                  <h3 className="font-semibold">No events found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchText || categoryFilter !== "all" || locationFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Create your first event to get started"}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

