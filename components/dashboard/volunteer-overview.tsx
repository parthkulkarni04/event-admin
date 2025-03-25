import Link from "next/link"
import { format } from "date-fns"
import { ArrowRight, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import type { VolunteerNonAuth } from "@/lib/supabase"

export async function VolunteerOverview() {
  // Fetch volunteers from Supabase
  const { data: volunteers, error } = await supabase
    .from("volunteers_non_auth")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  if (error) {
    console.error("Error fetching volunteers:", error)
    return <div>Error loading volunteers</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Volunteers</CardTitle>
        <CardDescription>Recently registered volunteers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {volunteers && volunteers.length > 0 ? (
          volunteers.map((volunteer) => <VolunteerCard key={volunteer.id} volunteer={volunteer} />)
        ) : (
          <p>No volunteers found</p>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href="/dashboard/volunteers">
            <span>View All Volunteers</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
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
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>Joined: {format(new Date(volunteer.created_at || ''), "MMM d, yyyy")}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/dashboard/volunteers/${volunteer.id}`}>View</Link>
        </Button>
        <Button asChild size="sm" variant="default">
          <Link href={`/dashboard/volunteers/${volunteer.id}/edit`}>Edit</Link>
        </Button>
      </div>
    </div>
  )
}

