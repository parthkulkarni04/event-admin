"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { ArrowLeft, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import type { Task, Skill } from "@/lib/supabase"

// Define the form schema with Zod
const taskFormSchema = z.object({
  task_description: z.string().min(2, {
    message: "Description must be at least 2 characters.",
  }),
  skills: z.array(z.number()).min(1, {
    message: "Please select at least one skill.",
  }),
  assign_volunteer: z.boolean().default(false),
  volunteer_id: z.string().optional(),
}).refine((data) => {
  if (data.assign_volunteer && !data.volunteer_id) {
    return false
  }
  return true
}, {
  message: "Please select a volunteer to assign this task",
  path: ["volunteer_id"],
})

type TaskFormValues = z.infer<typeof taskFormSchema>

export default function TaskForm({ params }: { params: { action: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [skills, setSkills] = useState<Skill[]>([])
  const [volunteers, setVolunteers] = useState<{ id: string; email: string; full_name: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [task, setTask] = useState<Task | null>(null)
  const [eventId, setEventId] = useState<number | null>(null)

  useEffect(() => {
    // Get eventId and taskId from URL params or search params
    const searchParams = new URLSearchParams(window.location.search)
    const eventIdParam = searchParams.get("eventId")
    const taskIdParam = searchParams.get("taskId")
    
    if (eventIdParam) {
      setEventId(parseInt(eventIdParam))
    }
    
    if (taskIdParam && params.action === "edit") {
      fetchTask(parseInt(taskIdParam))
    }
    
    fetchSkills()
  }, [params.action])

  async function fetchTask(taskId: number) {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("task_id", taskId)
        .single()

      if (error) throw error
      setTask(data)
      setEventId(data.event_id)
      fetchTaskSkills(taskId)
    } catch (error) {
      console.error("Error fetching task:", error)
      toast({
        title: "Error",
        description: "Failed to load task details.",
        variant: "destructive",
      })
    }
  }

  async function fetchSkills() {
    try {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .order("skill", { ascending: true })

      if (error) throw error
      setSkills(data || [])
    } catch (error) {
      console.error("Error fetching skills:", error)
      toast({
        title: "Error",
        description: "Failed to load skills.",
        variant: "destructive",
      })
    }
  }

  async function fetchTaskSkills(taskId: number) {
    try {
      const { data, error } = await supabase
        .from("task_skills")
        .select("skill_id")
        .eq("task_id", taskId)

      if (error) throw error
      form.setValue("skills", data.map(ts => ts.skill_id))
    } catch (error) {
      console.error("Error fetching task skills:", error)
      toast({
        title: "Error",
        description: "Failed to load task skills.",
        variant: "destructive",
      })
    }
  }

  async function fetchVolunteers() {
    if (!eventId) {
      console.log("No eventId available")
      return
    }

    try {
      console.log("Fetching volunteers for event:", eventId)
      
      // First get volunteer IDs from volunteer_event table who are registered for this event
      const { data: eventVolunteers, error: eventError } = await supabase
        .from("volunteer_event")
        .select("volunteer_id, created_at")
        .eq("event_id", eventId)
        .eq("status", "registered")

      if (eventError) {
        console.error("Error fetching event volunteers:", eventError)
        throw eventError
      }

      console.log("Event volunteers found:", eventVolunteers?.length || 0)

      if (!eventVolunteers?.length) {
        console.log("No registered volunteers found for this event")
        setVolunteers([])
        return
      }

      const volunteerIds = eventVolunteers
        .map((v) => v.volunteer_id)
        .filter(Boolean) as string[]

      console.log("Filtered volunteer IDs:", volunteerIds)

      if (volunteerIds.length === 0) {
        setVolunteers([])
        return
      }

      // Get volunteer details from volunteers_non_auth table
      // The volunteer_id in volunteers_non_auth corresponds to the volunteer_id in volunteer_event
      const { data: volunteerDetails, error: volunteerError } = await supabase
        .from("volunteers_non_auth")
        .select("id, volunteer_id, email, full_name")
        .in("volunteer_id", volunteerIds)

      if (volunteerError) {
        console.error("Error fetching volunteer details:", volunteerError)
        throw volunteerError
      }

      console.log("Volunteer details found:", volunteerDetails?.length || 0)

      // Filter out any volunteers with missing email or name
      const validVolunteers = volunteerDetails
        ?.filter((v) => v.email !== null && v.full_name !== null)
        .map(v => ({
          id: v.id,
          email: v.email as string,
          full_name: v.full_name as string
        })) || []

      console.log("Valid volunteers after filtering:", validVolunteers)

      setVolunteers(validVolunteers)
    } catch (error) {
      console.error("Error fetching volunteers:", error)
      toast({
        title: "Error",
        description: "Failed to load volunteers.",
        variant: "destructive",
      })
    }
  }

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      task_description: task?.task_description || "",
      skills: [],
      assign_volunteer: task?.volunteer_id ? true : false,
      volunteer_id: task?.volunteer_id || undefined,
    },
  })

  const watchAssignVolunteer = form.watch("assign_volunteer")

  useEffect(() => {
    if (watchAssignVolunteer && eventId) {
      fetchVolunteers()
    }
  }, [watchAssignVolunteer, eventId])

  async function onSubmit(data: TaskFormValues) {
    if (!eventId) return

    setIsLoading(true)
    try {
      if (task) {
        // Update existing task
        const { error: taskError } = await supabase
          .from("tasks")
          .update({
            task_description: data.task_description,
            task_status: data.assign_volunteer ? "assigned" : "unassigned",
            volunteer_id: data.assign_volunteer ? data.volunteer_id : null,
            volunteer_email: data.assign_volunteer
              ? volunteers.find((v) => v.id === data.volunteer_id)?.email || null
              : null,
          })
          .eq("task_id", task.task_id)

        if (taskError) throw taskError

        // Update task skills
        const { error: deleteError } = await supabase
          .from("task_skills")
          .delete()
          .eq("task_id", task.task_id)

        if (deleteError) throw deleteError

        const taskSkills = data.skills.map((skillId) => ({
          task_id: task.task_id,
          skill_id: skillId,
        }))

        const { error: skillsError } = await supabase.from("task_skills").insert(taskSkills)

        if (skillsError) throw skillsError

        toast({
          title: "Task updated",
          description: "The task has been updated successfully.",
        })
      } else {
        // Create new task
        const { data: newTask, error: taskError } = await supabase
          .from("tasks")
          .insert({
            event_id: eventId,
            task_description: data.task_description,
            task_status: data.assign_volunteer ? "assigned" : "unassigned",
            volunteer_id: data.assign_volunteer ? data.volunteer_id : null,
            volunteer_email: data.assign_volunteer
              ? volunteers.find((v) => v.id === data.volunteer_id)?.email || null
              : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (taskError) throw taskError

        // Create task skills
        const taskSkills = data.skills.map((skillId) => ({
          task_id: newTask.task_id,
          skill_id: skillId,
        }))

        const { error: skillsError } = await supabase.from("task_skills").insert(taskSkills)

        if (skillsError) throw skillsError

        toast({
          title: "Task created",
          description: "The task has been created successfully.",
        })
      }

      router.push(`/dashboard/events/${eventId}`)
      router.refresh()
    } catch (error) {
      console.error("Error saving task:", error)
      toast({
        title: "Error",
        description: "There was an error saving the task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {params.action === "edit" ? "Edit Task" : "Create New Task"}
        </h1>
        <p className="text-muted-foreground">
          {params.action === "edit" ? "Update task details" : "Add a new task to this event"}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="task_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe what needs to be done" 
                    className="min-h-[100px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="skills"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Required Skills</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    {skills.map((skill) => (
                      <div
                        key={skill.skill_id}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border p-3 transition-colors",
                          field.value.includes(skill.skill_id) && "border-primary bg-primary/5"
                        )}
                      >
                        <Checkbox
                          checked={field.value.includes(skill.skill_id)}
                          onCheckedChange={(checked) => {
                            const newValue = checked
                              ? [...field.value, skill.skill_id]
                              : field.value.filter((id) => id !== skill.skill_id)
                            field.onChange(newValue)
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{skill.skill_icon}</span>
                          <span>{skill.skill}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </FormControl>
                <FormDescription>Select all skills required for this task</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assign_volunteer"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Assign Volunteer</FormLabel>
                  <FormDescription>Assign this task to a volunteer now</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {watchAssignVolunteer && (
            <FormField
              control={form.control}
              name="volunteer_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Select Volunteer</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                        >
                          {field.value
                            ? volunteers.find((volunteer) => volunteer.id === field.value)?.full_name
                            : "Select volunteer"}
                          <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Search volunteers by name or email..." />
                        <CommandEmpty>No volunteers found for this event.</CommandEmpty>
                        <CommandGroup heading="Registered Volunteers">
                          {volunteers.length === 0 ? (
                            <div className="px-2 py-3 text-sm text-muted-foreground">
                              No volunteers have registered for this event yet.
                            </div>
                          ) : (
                            volunteers.map((volunteer) => (
                              <CommandItem
                                key={volunteer.id}
                                value={volunteer.full_name + " " + volunteer.email}
                                onSelect={() => {
                                  form.setValue("volunteer_id", volunteer.id)
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{volunteer.full_name}</span>
                                  <span className="text-sm text-muted-foreground">{volunteer.email}</span>
                                </div>
                                <div className="ml-auto h-4 w-4">
                                  {field.value === volunteer.id && (
                                    <svg
                                      width="15"
                                      height="15"
                                      viewBox="0 0 15 15"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z"
                                        fill="currentColor"
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                      ></path>
                                    </svg>
                                  )}
                                </div>
                              </CommandItem>
                            ))
                          )}
                        </CommandGroup>
                        <div className="border-t border-border px-2 py-2 text-xs text-muted-foreground">
                          Only volunteers registered for this event are shown.
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Assign this task to a volunteer who has registered for this event.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current" />}
              {params.action === "edit" ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
} 