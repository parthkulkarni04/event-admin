"use client"

import { useState, useEffect } from "react"
import { Search, Mail, Phone, MapPin, Building2, GraduationCap, Briefcase, Users, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

// Define the correct volunteer type based on the database schema
interface Volunteer {
  id: string // volunteers_non_auth.id
  volunteer_id: string // volunteers_non_auth.volunteer_id
  email: string | null
  full_name: string | null
  mobile_number: string | null
  age: number | null
  organization: string | null
  education?: string | null
  occupation?: string | null
  previous_volunteering?: string | null
  location?: string | null
  skills?: string[]
  registration_date: string
  availability_start_date?: string | null
  availability_end_date?: string | null
  days_available?: string[]
  time_preference?: string | null
}

export function EventVolunteers({ eventId }: { eventId: string | number }) {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchVolunteers()
  }, [eventId])

  async function fetchVolunteers() {
    try {
      console.log("Fetching volunteers for event ID:", eventId)
      
      // First, get volunteer IDs from volunteer_event table
      const { data: volunteerEvents, error: eventsError } = await supabase
        .from("volunteer_event")
        .select("volunteer_id, created_at")
        .eq("event_id", eventId)
        .eq("status", "registered")

      if (eventsError) {
        console.error("Error fetching volunteer events:", eventsError)
        throw eventsError
      }

      console.log("Found volunteer events:", volunteerEvents?.length || 0)
      
      if (!volunteerEvents || volunteerEvents.length === 0) {
        setVolunteers([])
        setIsLoading(false)
        return
      }

      // Get volunteer details
      const volunteerIds = volunteerEvents
        .map(ve => ve.volunteer_id)
        .filter(Boolean) as string[]
      
      console.log("Volunteer IDs to query:", volunteerIds)
      
      if (volunteerIds.length === 0) {
        setVolunteers([])
        setIsLoading(false)
        return
      }
      
      // Get volunteer details from volunteers_non_auth table
      const { data: volunteerDetails, error: detailsError } = await supabase
        .from("volunteers_non_auth")
        .select("*")
        .in("volunteer_id", volunteerIds)

      if (detailsError) {
        console.error("Error fetching volunteer details:", detailsError)
        throw detailsError
      }

      console.log("Found volunteer details:", volunteerDetails?.length || 0)

      // For each volunteer, fetch their skills
      const volunteersWithSkills = await Promise.all(
        volunteerDetails.map(async (volunteer) => {
          // Fetch skills for this volunteer from volunteer_skills table
          const { data: skillsData, error: skillsError } = await supabase
            .from("volunteer_skills")
            .select(`
              skill_id,
              skills (
                skill,
                skill_icon
              )
            `)
            .eq("volunteer_id", volunteer.volunteer_id)

          if (skillsError) {
            console.error(`Error fetching skills for volunteer ${volunteer.id}:`, skillsError)
            return {
              ...volunteer,
              skills: [],
              registration_date: volunteerEvents.find(ve => ve.volunteer_id === volunteer.volunteer_id)?.created_at || ""
            }
          }

          // Extract skills information
          const skills = skillsData.map(item => item.skills?.skill || "Unknown Skill")
          
          // Return volunteer with skills and registration date
          return {
            ...volunteer,
            skills,
            registration_date: volunteerEvents.find(ve => ve.volunteer_id === volunteer.volunteer_id)?.created_at || ""
          }
        })
      )

      console.log("Final volunteers with skills:", volunteersWithSkills)
      setVolunteers(volunteersWithSkills)
    } catch (error) {
      console.error("Error in fetchVolunteers:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredVolunteers = volunteers.filter(volunteer =>
    volunteer.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    volunteer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    volunteer.organization?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search volunteers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Registration Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Loading volunteers...
                </TableCell>
              </TableRow>
            ) : filteredVolunteers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  {searchQuery ? "No volunteers found matching your search." : "No volunteers registered for this event."}
                </TableCell>
              </TableRow>
            ) : (
              filteredVolunteers.map((volunteer) => (
                <TableRow key={volunteer.id}>
                  <TableCell className="font-medium">{volunteer.full_name}</TableCell>
                  <TableCell>{volunteer.organization || "N/A"}</TableCell>
                  <TableCell>{volunteer.email}</TableCell>
                  <TableCell>{volunteer.mobile_number || "N/A"}</TableCell>
                  <TableCell>
                    {new Date(volunteer.registration_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedVolunteer(volunteer)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedVolunteer} onOpenChange={() => setSelectedVolunteer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Volunteer Details</DialogTitle>
          </DialogHeader>
          {selectedVolunteer && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-medium">Basic Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                    <p>{selectedVolunteer.email}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>Phone</span>
                    </div>
                    <p>{selectedVolunteer.mobile_number || "N/A"}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Location</span>
                    </div>
                    <p>{selectedVolunteer.location || "N/A"}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>Organization</span>
                    </div>
                    <p>{selectedVolunteer.organization || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Education & Experience */}
              <div className="space-y-4">
                <h3 className="font-medium">Education & Experience</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span>Education</span>
                    </div>
                    <p>{selectedVolunteer.education || "N/A"}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      <span>Occupation</span>
                    </div>
                    <p>{selectedVolunteer.occupation || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Skills & Interests */}
              <div className="space-y-4">
                <h3 className="font-medium">Skills & Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedVolunteer.skills && selectedVolunteer.skills.length > 0 ? (
                    selectedVolunteer.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No skills listed</p>
                  )}
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="font-medium">Additional Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Previous Volunteering</span>
                    </div>
                    <p>{selectedVolunteer.previous_volunteering || "N/A"}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Registration Date</span>
                    </div>
                    <p>{new Date(selectedVolunteer.registration_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Availability Information */}
              <div className="space-y-4">
                <h3 className="font-medium">Availability</h3>
                <div className="rounded-md border p-4 bg-muted/10">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Calendar className="h-4 w-4 text-green-500" />
                        <span>Available From</span>
                      </div>
                      {selectedVolunteer.availability_start_date ? (
                        <div className="flex flex-col">
                          <span className="text-base">
                            {new Date(selectedVolunteer.availability_start_date).toLocaleDateString(undefined, {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(selectedVolunteer.availability_start_date).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Not specified</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Calendar className="h-4 w-4 text-red-500" />
                        <span>Available Until</span>
                      </div>
                      {selectedVolunteer.availability_end_date ? (
                        <div className="flex flex-col">
                          <span className="text-base">
                            {new Date(selectedVolunteer.availability_end_date).toLocaleDateString(undefined, {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(selectedVolunteer.availability_end_date).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Not specified</p>
                      )}
                    </div>
                  </div>
                  
                  {selectedVolunteer.days_available && selectedVolunteer.days_available.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Available Days</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedVolunteer.days_available.map((day, index) => (
                          <Badge key={index} variant="outline">
                            {day}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedVolunteer.time_preference && (
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Preferred Time</div>
                      <p>{selectedVolunteer.time_preference}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

