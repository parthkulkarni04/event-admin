import { Suspense } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, ClipboardList, Users } from "lucide-react"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentEvents } from "@/components/dashboard/recent-events"
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks"
import { VolunteerOverview } from "@/components/dashboard/volunteer-overview"
import { LiveEvents } from "@/components/dashboard/live-events"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

        <Suspense fallback={<StatsCardSkeleton />}>
          <DashboardStats />
        </Suspense>

        <div className="grid gap-6">
          <Suspense fallback={<CardSkeleton />}>
            <LiveEvents />
          </Suspense>

          {/* <Tabs defaultValue="events" className="space-y-4">
            <TabsList aria-label="Dashboard sections">
              <TabsTrigger value="events" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Events</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                <span>Tasks</span>
              </TabsTrigger>
              <TabsTrigger value="volunteers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Volunteers</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="space-y-4">
              <Suspense fallback={<CardSkeleton />}>
                <RecentEvents />
              </Suspense>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <Suspense fallback={<CardSkeleton />}>
                <UpcomingTasks />
              </Suspense>
            </TabsContent>

            <TabsContent value="volunteers" className="space-y-4">
              <Suspense fallback={<CardSkeleton />}>
                <VolunteerOverview />
              </Suspense>
            </TabsContent>
          </Tabs> */}
        </div>
      </div>
    </DashboardLayout>
  )
}

function StatsCardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <Skeleton className="h-4 w-24" />
            </CardTitle>
            <Skeleton className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-[60px] mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full max-w-[250px]" />
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-md" />
        ))}
      </CardContent>
    </Card>
  )
}

