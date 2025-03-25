import { Suspense } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Search } from "lucide-react"
import { TasksTable } from "@/components/tasks/tasks-table"

export default function TasksPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <Button asChild>
            <Link href="/dashboard/tasks/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex w-full items-center space-x-2 md:w-1/3">
            <Input placeholder="Search tasks..." className="h-9" aria-label="Search tasks" />
            <Button variant="outline" size="sm" className="h-9 px-4 shrink-0">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </div>
        </div>

        <Suspense fallback={<TasksTableSkeleton />}>
          <TasksTable />
        </Suspense>
      </div>
    </DashboardLayout>
  )
}

function TasksTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Tasks</CardTitle>
        <CardDescription>Manage your tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

