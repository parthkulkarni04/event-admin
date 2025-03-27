"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Save, Send, Clock, MapPin, Users, Image as ImageIcon, Archive, Trash2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import type { Event } from "@/lib/supabase"
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
    thumbnail_source: z.enum(["url", "upload"]).default("url"),
    event_category: z.enum(["Education", "Blog", "Culture", "Rehabilitation", "Environment", "Audio Recording", "Field Work", "Sports", "Employment & Entrepreneurship"], {
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

// Email template for new event notifications
const createEmailTemplate = (event: Event, registerUrl: string) => {
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .email-container { padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
          .header { background-color: #4f46e5; color: white; padding: 15px; border-radius: 5px 5px 0 0; text-align: center; }
          .content { padding: 20px; }
          .event-image { width: 100%; height: auto; border-radius: 5px; margin-bottom: 20px; }
          .event-detail { margin-bottom: 10px; }
          .detail-label { font-weight: bold; }
          .register-button { display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>New Volunteer Event</h1>
          </div>
          <div class="content">
            <h2>${event.title}</h2>
            ${event.thumbnail_image ? `<img src="${event.thumbnail_image}" alt="${event.title}" class="event-image"/>` : ''}
            
            <div class="event-detail">
              <p>${event.description || 'No description provided.'}</p>
            </div>
            
            <div class="event-detail">
              <span class="detail-label">📍 Location:</span> ${event.location} (${event.location_type === 'physical' ? 'In-person' : 'Virtual'})
            </div>
            
            <div class="event-detail">
              <span class="detail-label">📅 Date:</span> ${format(new Date(event.start_date), "PPP")} to ${format(new Date(event.end_date), "PPP")}
            </div>
            
            <div class="event-detail">
              <span class="detail-label">⏰ Time:</span> ${format(new Date(event.start_date), "h:mm a")} to ${format(new Date(event.end_date), "h:mm a")}
            </div>
            
            <div class="event-detail">
              <span class="detail-label">👥 Volunteers Needed:</span> ${event.max_volunteers}
            </div>
            
            ${event.registration_deadline ? 
              `<div class="event-detail">
                <span class="detail-label">⏳ Registration Deadline:</span> ${format(new Date(event.registration_deadline), "PPP")}
              </div>` : ''}
            
            <a href="${registerUrl}" class="register-button">Register Now</a>
            
            <div class="footer">
              <p>You're receiving this email because you're registered as a volunteer. If you no longer wish to receive these notifications, please update your preferences.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

export function EventForm({ event }: { event?: Event }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [imageTab, setImageTab] = useState<"url" | "upload">(
    event?.thumbnail_image ? "url" : "upload"
  )

  // Default values for the form
  const defaultValues: Partial<EventFormValues> = {
    title: event?.title || "",
    location: event?.location || "",
    location_type: event?.location_type || "physical",
    description: event?.description || "",
    thumbnail_image: event?.thumbnail_image || "",
    thumbnail_source: event?.thumbnail_image ? "url" : "upload",
    event_category: event?.event_category || "Education",
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

  // Handle image file selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      })
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB.",
        variant: "destructive",
      })
      return
    }

    setImageFile(file)
    
    // Create a preview URL
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    
    return () => URL.revokeObjectURL(objectUrl)
  }, [toast])

  // Reset image selection
  const handleResetImage = () => {
    setImageFile(null)
    setPreviewUrl("")
  }

  // Upload image to Supabase Storage
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true)
      setUploadProgress(0)
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `event-thumbnails/${fileName}`
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('event-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) throw error
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(data.path)
      
      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading the image.",
        variant: "destructive"
      })
      return null
    } finally {
      setUploading(false)
      setUploadProgress(100)
    }
  }

  // Send emails to all volunteers
  const sendEventEmails = async (eventData: Event) => {
    try {
      // 1. Fetch all volunteer emails from volunteers_non_auth table
      const { data: volunteers, error: fetchError } = await supabase
        .from('volunteers_non_auth')
        .select('email')
      
      if (fetchError) throw fetchError
      
      if (!volunteers || volunteers.length === 0) {
        console.log("No volunteers found to email")
        return
      }
      
      // Create the register URL (adjust based on your application's routing)
      const baseUrl = window.location.origin
      const registerUrl = `${baseUrl}/events/${eventData.id}/register`
      
      // 2. Create email template with event details
      const emailTemplate = createEmailTemplate(eventData, registerUrl)
      
      // 3. Send emails to all volunteers
      // Note: We're using server action to handle the email sending
      const response = await fetch('/api/send-event-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          volunteers: volunteers,
          subject: `New Volunteer Event: ${eventData.title}`,
          htmlContent: emailTemplate,
          eventId: eventData.id
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to send emails')
      }
      
      // 4. Update the event to mark email_sent as true
      const { error: updateError } = await supabase
        .from('events')
        .update({ email_sent: true })
        .eq('id', eventData.id)
      
      if (updateError) throw updateError
      
      return true
    } catch (error) {
      console.error('Error sending volunteer emails:', error)
      toast({
        title: "Email Notification Error",
        description: "There was an error sending notification emails to volunteers.",
        variant: "destructive"
      })
      return false
    }
  }

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

      // Handle image upload if there's a file
      let thumbnailUrl = data.thumbnail_image
      if (data.thumbnail_source === 'upload' && imageFile) {
        const uploadedUrl = await uploadImage(imageFile)
        thumbnailUrl = uploadedUrl || undefined // Fix for type error
      }

      if (event) {
        // Update existing event
        const { data: updatedEvent, error } = await supabase
          .from("events")
          .update({
            title: data.title,
            location: data.location,
            location_type: data.location_type,
            description: data.description,
            thumbnail_image: thumbnailUrl || null,
            event_category: data.event_category,
            start_date: startDateTime.toISOString(),
            end_date: endDateTime.toISOString(),
            registration_deadline: data.registration_deadline?.toISOString() || null,
            max_volunteers: data.max_volunteers,
            status,
          })
          .eq("id", event.id)
          .select()

        if (error) throw error
        
        // If publishing event, send emails to volunteers
        if (status === "published") {
          // Create a proper Event object with all required fields
          const eventToEmail: Event = {
            id: event.id,
            title: data.title,
            location: data.location,
            location_type: data.location_type,
            description: data.description || null,
            thumbnail_image: thumbnailUrl || null,
            event_category: data.event_category,
            start_date: startDateTime.toISOString(),
            end_date: endDateTime.toISOString(),
            registration_deadline: data.registration_deadline?.toISOString() || null,
            max_volunteers: data.max_volunteers,
            status: status,
            email_sent: false,
            created_at: event.created_at
          };
          await sendEventEmails(eventToEmail);
        }

        toast({
          title: "Event updated",
          description: status === "archived" 
            ? "The event has been archived successfully."
            : `The event has been ${status === "published" ? "published" : "updated"} successfully.`,
        })

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
            thumbnail_image: thumbnailUrl || null,
            event_category: data.event_category,
            start_date: startDateTime.toISOString(),
            end_date: endDateTime.toISOString(),
            registration_deadline: data.registration_deadline?.toISOString() || null,
            max_volunteers: data.max_volunteers,
            status,
            email_sent: false, // Initialize as false
          })
          .select()

        if (error) throw error
        
        // If publishing a new event, send emails to volunteers
        if (status === "published" && newEvent && newEvent.length > 0) {
          await sendEventEmails(newEvent[0] as Event)
        }

        toast({
          title: "Event created",
          description: `The event has been ${status === "published" ? "published" : "created"} successfully.`,
        })

        router.push(`/dashboard/events/${newEvent[0].id}`)
      }
    } catch (error) {
      console.error("Error saving event:", error)
      toast({
        title: "Error",
        description: "There was an error saving the event. Please try again.",
        variant: "destructive",
      })
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

      router.push("/dashboard/events")
    } catch (error) {
      console.error("Error deleting event:", error)
      toast({
        title: "Error",
        description: "There was an error deleting the event. Please try again.",
        variant: "destructive",
      })
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
              <FormLabel>Thumbnail Image</FormLabel>
              <FormControl>
                <Tabs 
                  defaultValue={imageTab} 
                  onValueChange={(value) => {
                    setImageTab(value as "url" | "upload")
                    form.setValue("thumbnail_source", value as "url" | "upload")
                  }}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="url">URL</TabsTrigger>
                    <TabsTrigger value="upload">Upload</TabsTrigger>
                  </TabsList>
                  <TabsContent value="url" className="mt-2">
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="https://placehold.co/600x400?text=Event+Image" 
                        className="pl-9" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e)
                          form.setValue("thumbnail_source", "url")
                        }}
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="upload" className="mt-2 space-y-4">
                    <div className="grid w-full items-center gap-1.5">
                      <div className="flex flex-col items-center justify-center w-full">
                        {previewUrl ? (
                          <div className="relative w-full max-w-md mx-auto mb-4">
                            <div className="relative aspect-video rounded-lg overflow-hidden border">
                              <Image
                                src={previewUrl}
                                alt="Image preview"
                                fill
                                className="object-cover"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                              onClick={handleResetImage}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <label 
                            htmlFor="image-upload"
                            className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                              <p className="mb-2 text-sm text-muted-foreground">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-muted-foreground">PNG, JPG or WebP (MAX. 5MB)</p>
                            </div>
                            <input
                              id="image-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileChange}
                              onClick={(e) => {
                                // Reset the value to allow selecting the same file again
                                (e.target as HTMLInputElement).value = ''
                                form.setValue("thumbnail_source", "upload")
                              }}
                            />
                          </label>
                        )}
                      </div>
                      {uploading && (
                        <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                          <div 
                            className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </FormControl>
              <FormDescription>
                {imageTab === "url" 
                  ? "URL for the event thumbnail image (optional)." 
                  : "Upload an image for the event thumbnail (optional)."}
              </FormDescription>
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
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Blog">Blog</SelectItem>
                    <SelectItem value="Culture">Culture</SelectItem>
                    <SelectItem value="Rehabilitation">Rehabilitation</SelectItem>
                    <SelectItem value="Environment">Environment</SelectItem>
                    <SelectItem value="Audio Recording">Audio Recording</SelectItem>
                    <SelectItem value="Field Work">Field Work</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Employment & Entrepreneurship">Employment & Entrepreneurship</SelectItem>
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
              Are you sure you want to publish this event? When you publish the event, all volunteers will be notified.
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

