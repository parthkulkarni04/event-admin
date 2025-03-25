import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { EventForm } from "@/components/events/event-form"

export default async function EditEventPage({ params }: { params: { id: string } }) {
  // Fetch event details from Supabase
  const { data: event, error } = await supabase.from("events").select("*").eq("id", params.id).single()

  if (error || !event) {
    notFound()
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Back to event details">
            <Link href={`/dashboard/events/${event.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Edit Event</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>Update the information for this event</CardDescription>
          </CardHeader>
          <CardContent>
            <EventForm event={event} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

