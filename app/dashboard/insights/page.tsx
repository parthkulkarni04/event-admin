"use client"

import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { 
  Bar, 
  BarChart, 
  Line, 
  LineChart, 
  Pie, 
  PieChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis,
  Tooltip
} from "recharts"

import EventInsights from "./components/event-insights"
import VolunteerInsights from "./components/volunteer-insights"
import TaskInsights from "./components/task-insights"

// Import the hooks for data fetching
import { 
  useEventInsightsData, 
  useTaskInsightsData, 
  useVolunteerInsightsData
} from "./hooks/use-insights-data"

// Main metrics component for the overview tab
function InsightsOverview() {
  const { data: eventData, loading: eventLoading } = useEventInsightsData();
  const { data: taskData, loading: taskLoading } = useTaskInsightsData();
  const { data: volunteerData, loading: volunteerLoading } = useVolunteerInsightsData();

  const loading = eventLoading || taskLoading || volunteerLoading;

  if (loading) {
    return <InsightsSkeleton />;
  }

  // Metrics calculations
  const volunteerParticipationRate = volunteerData ? 
    Math.round(volunteerData.participationRate) : 0;
  
  const eventCompletionRate = eventData ? 
    Math.round(eventData.completionRate) : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Volunteer Participation Rate Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volunteer Participation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{volunteerParticipationRate}%</div>
            <p className="text-xs text-muted-foreground">+5.2% from last month</p>
            <div className="h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { name: "1", value: 65 },
                    { name: "2", value: 75 },
                    { name: "3", value: 70 },
                    { name: "4", value: 80 },
                    { name: "5", value: 75 },
                    { name: "6", value: 85 }
                  ]}
                  margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                >
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    dot={false} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Event Completion Rate Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
            <div className="h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { name: "1", value: 70 },
                    { name: "2", value: 80 },
                    { name: "3", value: 75 },
                    { name: "4", value: 85 },
                    { name: "5", value: 80 },
                    { name: "6", value: 90 }
                  ]}
                  margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                >
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    dot={false} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Total Tasks Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskData ? taskData.totalTasks : 0}</div>
            <p className="text-xs text-muted-foreground">Across all past events</p>
            <div className="h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "1", value: 60 },
                    { name: "2", value: 80 },
                    { name: "3", value: 75 },
                    { name: "4", value: 70 },
                    { name: "5", value: 65 },
                    { name: "6", value: 75 }
                  ]}
                  margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                >
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Physical vs Virtual Event Tasks Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Physical vs Virtual Event Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-[4/1]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Physical", value: taskData?.eventTypeTasks?.physical || 0 },
                  { name: "Virtual", value: taskData?.eventTypeTasks?.virtual || 0 }
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} Tasks`, 'Count']} />
                <Bar 
                  dataKey="value" 
                  name="Number of Tasks" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}  
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {taskData?.comparisonText && (
            <p className="text-sm text-center mt-4">{taskData.comparisonText}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function InsightsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 m-3">
        <div className="flex items-center justify-between pb-2">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Past Events Insights Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Track volunteer engagement, event success, and task efficiency for completed events
            </p>
          </div>
        </div>
        
        <Tabs defaultValue="events" className="space-y-4">
          <TabsList>
            <TabsTrigger value="events" aria-label="View Event Insights">Event Insights</TabsTrigger>
            <TabsTrigger value="volunteers" aria-label="View Volunteer Insights">Volunteer Insights</TabsTrigger>
            <TabsTrigger value="tasks" aria-label="View Task Insights">Task Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="events" className="space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Suspense fallback={<InsightsSkeleton />}>
              <EventInsights />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="volunteers" className="space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Suspense fallback={<InsightsSkeleton />}>
              <VolunteerInsights />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="tasks" className="space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Suspense fallback={<InsightsSkeleton />}>
              <TaskInsights />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-1/4 mb-2" />
        <Skeleton className="h-3 w-1/3 mb-4" />
        <Skeleton className="h-[80px] w-full" />
      </CardContent>
    </Card>
  );
}

function InsightsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-1/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
