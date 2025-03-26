"use client"

import { useTaskInsightsData } from "../hooks/use-insights-data"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  VisuallyHidden,
} from "@/components/ui/visually-hidden"
import { 
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Legend
} from "recharts"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function TaskInsights() {
  const { data, loading, error } = useTaskInsightsData()
  
  if (loading) {
    return <TaskInsightsSkeleton />
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p className="font-semibold">Error loading task insights</p>
        </div>
        <p className="text-muted-foreground text-center max-w-md">
          {error.message || "An unexpected error occurred"}
        </p>
        <div className="mt-4 text-sm text-muted-foreground">
          <p className="font-medium mb-2">Possible solutions:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Check if the tasks table exists in your database</li>
            <li>Verify that the required fields (task_id, event_id) exist</li>
            <li>Ensure the events table has a location_type column</li>
            <li>Ensure you have proper permissions to access the data</li>
            <li>Try refreshing the page</li>
          </ul>
        </div>
        <Button 
          className="mt-4" 
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    )
  }
  
  if (!data) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">No task data available</p>
      </div>
    )
  }
  
  // Custom legend renderer for better accessibility and readability
  const renderColorfulLegendText = (value: string, entry: any) => {
    const { color } = entry;
    return (
      <span className="text-sm px-2" style={{ color }}>
        {value}
      </span>
    );
  };
  
  return (
    <div className="space-y-4 m-3">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Total Tasks Card */}
        <Card className="col-span-full md:col-span-1">
          <CardHeader className="pb-2 pt-5 px-6">
            <CardDescription className="text-sm mb-1">Total Tasks</CardDescription>
            <CardTitle className="text-3xl">{data.totalTasks}</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            <p className="text-xs text-muted-foreground">Workload at a Glance</p>
          </CardContent>
        </Card>

        {/* Physical vs Virtual Event Tasks Comparison */}
        <Card className="col-span-full">
          <CardHeader className="pb-2 pt-5 px-6">
            <CardDescription className="text-sm mb-1">Event Type Analysis</CardDescription>
            <CardTitle className="text-2xl">Physical vs. Virtual Event Tasks</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            {data.eventTypeTasks && (data.eventTypeTasks.physical > 0 || data.eventTypeTasks.virtual > 0) ? (
              <div className="space-y-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Physical", value: data.eventTypeTasks.physical, fill: "#3B82F6" },
                        { name: "Virtual", value: data.eventTypeTasks.virtual, fill: "#8B5CF6" }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} Tasks`, 'Count']} />
                      <Legend formatter={renderColorfulLegendText} />
                      <Bar 
                        dataKey="value" 
                        name="Number of Tasks" 
                        radius={[4, 4, 0, 0]} 
                        barSize={60}
                      >
                        <Cell fill="#3B82F6" />
                        <Cell fill="#8B5CF6" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center pt-2">
                  {data.comparisonText && (
                    <p className="text-sm font-medium">{data.comparisonText}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No comparison data available</p>
              </div>
            )}
            <VisuallyHidden>
              Comparison of tasks between physical and virtual events: 
              Physical events have {data.eventTypeTasks?.physical || 0} tasks. 
              Virtual events have {data.eventTypeTasks?.virtual || 0} tasks.
              {data.comparisonText}
            </VisuallyHidden>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TaskInsightsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Total Tasks Card Skeleton */}
      <Card className="col-span-full md:col-span-1">
        <CardHeader className="pb-2 pt-5 px-6">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-1/4" />
        </CardHeader>
        <CardContent className="px-6 pb-5">
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
      
      {/* Physical vs Virtual Event Tasks Comparison Skeleton */}
      <Card className="col-span-full">
        <CardHeader className="pb-2 pt-5 px-6">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent className="px-6 pb-5">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-4 w-1/2 mx-auto mt-4" />
        </CardContent>
      </Card>
    </div>
  )
} 