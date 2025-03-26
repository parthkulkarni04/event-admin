"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import type { Task } from "@/lib/supabase"

// Define the form schema with Zod
const taskFormSchema = z.object({
  task_description: z.string().min(3, {
    message: "Task description must be at least 3 characters."
  }),
  assign_volunteer: z.boolean().default(false),
  volunteer_id: z.string().optional(),
  volunteer_email: z.string().email().optional(),
  task_status: z.enum(["unassigned", "assigned", "inprogress", "complete"], {
    required_error: "Please select a task status."
  }),
})

type TaskFormValues = z.infer<typeof taskFormSchema>

export function TaskForm({ task, eventId }: { task?: Task; eventId?: number }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Default values for the form
  const defaultValues: Partial<TaskFormValues> = {
    task_description: task?.task_description || "",
    task_status: task?.task_status || "unassigned",
    volunteer_email: task?.volunteer_email || "",
  }

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues,
  })

  async function onSubmit(data: TaskFormValues) {
    setIsSubmitting(true)

    try {
      // Look up volunteer ID if email is provided
      let volunteerId = null
      if (data.volunteer_email) {
        const { data: volunteerData } = await supabase
          .from("volunteers_non_auth")
          .select("id")
          .eq("email", data.volunteer_email)
          .maybeSingle()
        
        volunteerId = volunteerData?.id || null
      }

      if (task) {
        // Update existing task
        const { error } = await supabase
          .from("tasks")
          .update({
            task_description: data.task_description,
            task_status: data.task_status,
            volunteer_email: data.volunteer_email || null,
            volunteer_id: volunteerId,
          })
          .eq("task_id", task.task_id)

        if (error) throw error

        toast({
          title: "Task updated",
          description: "The task has been updated successfully.",
        })

        router.push(`/dashboard/tasks/${task.task_id}`)
      } else if (eventId) {
        // Create new task
        const { data: newTask, error } = await supabase
          .from("tasks")
          .insert({
            event_id: eventId,
            task_description: data.task_description,
            task_status: data.task_status,
            volunteer_email: data.volunteer_email || null,
            volunteer_id: volunteerId,
          })
          .select()

        if (error) throw error

        toast({
          title: "Task created",
          description: "The task has been created successfully.",
        })

        router.push(`/dashboard/events/${eventId}`)
      }
    } catch (error) {
      console.error("Error saving task:", error)
      toast({
        title: "Error",
        description: "There was an error saving the task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="task_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the task" className="min-h-[120px]" {...field} />
              </FormControl>
              <FormDescription>Provide details about what needs to be done.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="task_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="inprogress">In Progress</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>The current status of the task.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="volunteer_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Volunteer Email (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="volunteer@example.com" {...field} value={field.value || ""} />
                </FormControl>
                <FormDescription>Email of the volunteer assigned to this task.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (task) {
                router.push(`/dashboard/tasks/${task.task_id}`)
              } else if (eventId) {
                router.push(`/dashboard/events/${eventId}`)
              } else {
                router.push("/dashboard/tasks")
              }
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {task ? "Update Task" : "Create Task"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

