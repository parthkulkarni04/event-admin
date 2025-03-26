"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Save, Send, Clock, MapPin, Users, Image as ImageIcon, Archive, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import type { Event } from "@/lib/supabase"
import { useAccessibility } from "@/components/accessibility-provider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Define the form schema with Zod
const eventFormSchema = z
  .object({
    title: z.string().min(2, {
      message: "Title must be at least 2 characters.",
    }),
    location: z.string().min(2, {
      message: "Location must be at least 2 characters.",
    }),
    location_type: z.enum(["virtual", "physical"], {
      required_error: "Please select a location type.",
    }),
    description: z.string().optional(),
    thumbnail_image: z.string().url().optional().or(z.literal("")),
    event_category: z.enum(["A", "B", "C", "D", "E"], {
      required_error: "Please select an event category.",
    }),
    start_date: z.date({
      required_error: "Start date is required.",
    }),
    start_time: z.string({
      required_error: "Start time is required.",
    }),
    end_date: z.date({
      required_error: "End date is required.",
    }),
    end_time: z.string({
      required_error: "End time is required.",
    }),
    registration_deadline: z.date().optional(),
    max_volunteers: z.number().int().positive().default(25),
  })
  .refine((data) => {
    const startDateTime = new Date(data.start_date)
    const [startHours, startMinutes] = data.start_time.split(":")
    startDateTime.setHours(parseInt(startHours), parseInt(startMinutes))

    const endDateTime = new Date(data.end_date)
    const [endHours, endMinutes] = data.end_time.split(":")
    endDateTime.setHours(parseInt(endHours), parseInt(endMinutes))

    return endDateTime >= startDateTime
  }, {
    message: "End date and time must be after start date and time",
    path: ["end_date"],
  })

type EventFormValues = z.infer<typeof eventFormSchema>

export function EventForm({ event }: { event?: Event }) {
  const router = useRouter()
  const { toast } = useToast()
  const { speakText } = useAccessibility()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)

  // Default values for the form
  const defaultValues: Partial<EventFormValues> = {
    title: event?.title || "",
    location: event?.location || "",
    location_type: event?.location_type || "physical",
    description: event?.description || "",
    thumbnail_image: event?.thumbnail_image || "",
    event_category: event?.event_category || "A",
    start_date: event?.start_date ? new Date(event.start_date) : new Date(),
    start_time: event?.start_date ? format(new Date(event.start_date), "HH:mm") : "09:00",
    end_date: event?.end_date ? new Date(event.end_date) : new Date(),
    end_time: event?.end_date ? format(new Date(event.end_date), "HH:mm") : "17:00",
    registration_deadline: event?.registration_deadline ? new Date(event.registration_deadline) : undefined,
    max_volunteers: event?.max_volunteers || 25,
  }

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues,
  })

  async function onSubmit(data: EventFormValues, status: "draft" | "published" | "archived" = "draft") {
    setIsSubmitting(true)

    try {
      // Combine date and time for start and end dates
      const startDateTime = new Date(data.start_date)
      const [startHours, startMinutes] = data.start_time.split(":")
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes))

      const endDateTime = new Date(data.end_date)
      const [endHours, endMinutes] = data.end_time.split(":")
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes))

      if (event) {
        // Update existing event
        const { error } = await supabase
          .from("events")
          .update({
            title: data.title,
            location: data.location,
            location_type: data.location_type,
            description: data.description,
            thumbnail_image: data.thumbnail_image || null,
            event_category: data.event_category,
            start_date: startDateTime.toISOString(),
            end_date: endDateTime.toISOString(),
            registration_deadline: data.registration_deadline?.toISOString() || null,
            max_volunteers: data.max_volunteers,
            status,
          })
          .eq("id", event.id)

        if (error) throw error

        toast({
          title: "Event updated",
          description: status === "archived" 
            ? "The event has been archived successfully."
            : `The event has been ${status === "published" ? "published" : "updated"} successfully.`,
        })

        speakText(status === "archived" 
          ? "Event archived successfully"
          : `Event ${status === "published" ? "published" : "updated"} successfully`)
        router.push(`/dashboard/events/${event.id}`)
      } else {
        // Create new event
        const { data: newEvent, error } = await supabase
          .from("events")
          .insert({
            title: data.title,
            location: data.location,
            location_type: data.location_type,
            description: data.description,
            thumbnail_image: data.thumbnail_image || null,
            event_category: data.event_category,
            start_date: startDateTime.toISOString(),
            end_date: endDateTime.toISOString(),
            registration_deadline: data.registration_deadline?.toISOString() || null,
            max_volunteers: data.max_volunteers,
            status,
          })
          .select()

        if (error) throw error

        toast({
          title: "Event created",
          description: `The event has been ${status === "published" ? "published" : "created"} successfully.`,
        })

        speakText(`Event ${status === "published" ? "published" : "created"} successfully`)
        router.push(`/dashboard/events/${newEvent[0].id}`)
      }
    } catch (error) {
      console.error("Error saving event:", error)
      toast({
        title: "Error",
        description: "There was an error saving the event. Please try again.",
        variant: "destructive",
      })
      speakText("Error saving event")
    } finally {
      setIsSubmitting(false)
      setShowPublishDialog(false)
      setShowArchiveDialog(false)
    }
  }

  async function handleDeleteEvent() {
    if (!event) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", event.id)

      if (error) throw error

      toast({
        title: "Event deleted",
        description: "The event has been deleted successfully.",
      })

      speakText("Event deleted successfully")
      router.push("/dashboard/events")
    } catch (error) {
      console.error("Error deleting event:", error)
      toast({
        title: "Error",
        description: "There was an error deleting the event. Please try again.",
        variant: "destructive",
      })
      speakText("Error deleting event")
    } finally {
      setIsSubmitting(false)
      setShowDeleteDialog(false)
      setShowDeleteConfirmDialog(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => onSubmit(data, "draft"))} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Event title" {...field} />
              </FormControl>
              <FormDescription>The name of your event.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Event location" className="pl-9" {...field} />
                  </div>
                </FormControl>
                <FormDescription>Where the event will take place.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="physical">Physical</SelectItem>
                    <SelectItem value="virtual">Virtual</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Whether the event is in-person or online.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the event" className="min-h-[120px]" {...field} />
              </FormControl>
              <FormDescription>Provide details about the event.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="thumbnail_image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thumbnail Image URL</FormLabel>
              <FormControl>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="https://example.com/image.jpg" className="pl-9" {...field} />
                </div>
              </FormControl>
              <FormDescription>URL for the event thumbnail image (optional).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="event_category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="A">Category A</SelectItem>
                    <SelectItem value="B">Category B</SelectItem>
                    <SelectItem value="C">Category C</SelectItem>
                    <SelectItem value="D">Category D</SelectItem>
                    <SelectItem value="E">Category E</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>The category of the event.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_volunteers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Volunteers</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min={1}
                      className="pl-9"
                      {...field}
                      onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                    />
                  </div>
                </FormControl>
                <FormDescription>Maximum number of volunteers needed.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="time" className="pl-9" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="time" className="pl-9" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="registration_deadline"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Registration Deadline (Optional)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                </PopoverContent>
              </Popover>
              <FormDescription>Last day for volunteers to register.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (event) {
                router.push(`/dashboard/events/${event.id}`)
              } else {
                router.push("/dashboard/events")
              }
            }}
          >
            Cancel
          </Button>
          {event && ( // Only show Delete and Archive buttons for existing events
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isSubmitting}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Event
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowArchiveDialog(true)}
                disabled={isSubmitting}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive Event
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPublishDialog(true)}
            disabled={isSubmitting}
          >
            <Send className="mr-2 h-4 w-4" />
            Publish Event
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save as Draft
          </Button>
        </div>
      </form>

      <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to publish this event? When you publish the event, all registered volunteers will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => form.handleSubmit((data) => onSubmit(data, "published"))()}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publish Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this event? This will hide the event from the main list and mark it as archived.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => form.handleSubmit((data) => onSubmit(data, "archived"))()}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Archive Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* First Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDeleteDialog(false)
                setShowDeleteConfirmDialog(true)
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Second Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the event and all associated data. Are you absolutely sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  )
}

