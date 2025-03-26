"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { CheckCircle2, Circle, Clock, Edit, Plus, Trash2, Users, HelpCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import type { Task as BaseTask } from "@/lib/supabase"

interface TaskSkill {
  skill_id: number
  skills: {
    skill: string
    skill_icon: string
  }
}

interface Task extends BaseTask {
  task_skills?: TaskSkill[]
}

export function EventTasks({ eventId }: { eventId: number }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false)

  const statusIcons: Record<string, React.ElementType> = {
    unassigned: Circle,
    assigned: Clock,
    inprogress: Clock,
    complete: CheckCircle2,
  }

  const statusColors = {
    unassigned: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    assigned: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    inprogress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    complete: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          task_skills(
            skill_id,
            skills(skill, skill_icon)
          )
        `)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setTasks(data as Task[])
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDeleteTask(taskId: number) {
    try {
      const { error } = await supabase.from("tasks").delete().eq("task_id", taskId)
      if (error) throw error

      toast({
        title: "Task deleted",
        description: "The task has been deleted successfully.",
      })

      setIsTaskDetailsOpen(false)
      fetchTasks()
    } catch (error) {
      console.error("Error deleting task:", error)
      toast({
        title: "Error",
        description: "There was an error deleting the task. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <Button onClick={() => router.push(`/dashboard/tasks/new?eventId=${eventId}`)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : tasks.length > 0 ? (
          <div className="space-y-4">
            {tasks.map((task) => (
              <TaskCard key={task.task_id} task={task} onClick={() => {
                setSelectedTask(task)
                setIsTaskDetailsOpen(true)
              }} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="mb-4 text-muted-foreground">No tasks have been created for this event yet.</p>
            <Button onClick={() => router.push(`/dashboard/tasks/new?eventId=${eventId}`)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Task
            </Button>
          </div>
        )}
      </div>

      {selectedTask && (
        <Dialog open={isTaskDetailsOpen} onOpenChange={setIsTaskDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Task Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium">{selectedTask.task_description}</h3>
                <Badge variant="outline" className={statusColors[selectedTask.task_status]}>
                  {React.createElement(statusIcons[selectedTask.task_status] || HelpCircle, { className: "mr-1 h-3 w-3" })}
                  {selectedTask.task_status}
                </Badge>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Created: {format(new Date(selectedTask.created_at), "MMMM d, yyyy")}</span>
                </div>
                {selectedTask.volunteer_email && (
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>Assigned to: {selectedTask.volunteer_email}</span>
                  </div>
                )}
                {selectedTask.task_skills && selectedTask.task_skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="font-medium">Required Skills:</span>
                    {selectedTask.task_skills.map((ts) => (
                      <div key={ts.skill_id} className="flex items-center gap-1">
                        <span className="text-xl">{ts.skills.skill_icon}</span>
                        <span>{ts.skills.skill}</span>
                      </div>
                    ))}
                  </div>
                )}
                {selectedTask.task_feedback && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium text-base">Notes</h4>
                    <div className="rounded-lg bg-muted p-3">
                      <p>{selectedTask.task_feedback}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="destructive"
                onClick={() => handleDeleteTask(selectedTask.task_id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Task
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setIsTaskDetailsOpen(false)
                  router.push(`/dashboard/tasks/edit?taskId=${selectedTask.task_id}`)
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const statusIcons: Record<string, React.ElementType> = {
    unassigned: Circle,
    assigned: Clock,
    inprogress: Clock,
    complete: CheckCircle2,
  }

  const StatusIcon = statusIcons[task.task_status] || HelpCircle

  const statusColors = {
    unassigned: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    assigned: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    inprogress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    complete: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  }

  return (
    <div
      className="flex flex-col space-y-2 rounded-md border p-4 transition-colors hover:bg-muted/50 cursor-pointer md:flex-row md:items-center md:justify-between md:space-y-0"
      onClick={onClick}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{task.task_description}</h3>
          <Badge variant="outline" className={statusColors[task.task_status]}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {task.task_status}
          </Badge>
        </div>
        <div className="flex flex-col gap-1 text-sm text-muted-foreground md:flex-row md:gap-2">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>Created: {format(new Date(task.created_at), "MMM d, yyyy")}</span>
          </div>
          {task.volunteer_email && (
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>Assigned to: {task.volunteer_email}</span>
            </div>
          )}
          {task.task_skills && task.task_skills.length > 0 && (
            <div className="flex items-center gap-2">
              {task.task_skills.map((ts) => (
                <span key={ts.skill_id} className="text-lg" title={ts.skills.skill}>
                  {ts.skills.skill_icon}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

