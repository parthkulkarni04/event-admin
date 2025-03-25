import Link from "next/link"
import { format } from "date-fns"
import { Calendar, Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase"
import type { Volunteer } from "@/lib/supabase"

export async function VolunteersTable() {
  // Fetch volunteers from Supabase
  const { data: volunteers, error } = await supabase
    .from("volunteers")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching volunteers:", error)
    return <div>Error loading volunteers</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Volunteers</CardTitle>
        <CardDescription>Manage your volunteers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {volunteers && volunteers.length > 0 ? (
            volunteers.map((volunteer) => <VolunteerRow key={volunteer.id} volunteer={volunteer} />)
          ) : (
            <p>No volunteers found</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function VolunteerRow({ volunteer }: { volunteer: Volunteer }) {
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
              <span>Joined: {format(new Date(volunteer.created_at), "MMM d, yyyy")}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/dashboard/volunteers/${volunteer.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href={`/dashboard/volunteers/${volunteer.id}/edit`}>
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
              <Link href={`/dashboard/volunteers/${volunteer.id}/events`}>Assigned Events</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/volunteers/${volunteer.id}/tasks`}>Assigned Tasks</Link>
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

