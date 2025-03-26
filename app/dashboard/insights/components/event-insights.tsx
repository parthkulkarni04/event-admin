"use client"

import { useEventInsightsData } from "../hooks/use-insights-data"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { 
  Bar,
  BarChart,
  Line,
  LineChart,
  Tooltip, 
  ResponsiveContainer,
  XAxis,
  YAxis,
  Legend,
  Cell
} from "recharts"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

// Define color palette for event types - using high contrast colors for accessibility
const COLOR_PALETTE = [
  "#2563EB", // blue
  "#D97706", // amber
  "#059669", // green
  "#9333EA", // purple
  "#E11D48", // rose
  "#0891B2", // cyan
  "#CA8A04", // yellow
  "#4F46E5", // indigo
  "#7C3AED", // violet
  "#475569", // slate
  "#65A30D", // lime
  "#0284C7", // sky
  "#F97316", // orange
  "#06B6D4", // teal
  "#EC4899", // pink
  "#8B5CF6", // violet-500
  "#10B981", // emerald
  "#3B82F6", // blue-500
  "#EF4444", // red
  "#14B8A6", // teal-500
];

export default function EventInsights() {
  const { data, loading, error } = useEventInsightsData()
  
  if (loading) {
    return <EventInsightsSkeleton />
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading event insights</AlertTitle>
          <AlertDescription>
            {error.message || "An unexpected error occurred"}
          </AlertDescription>
        </Alert>
        <Button 
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
        <p className="text-muted-foreground">No event data available</p>
      </div>
    )
  }

  // Custom renderer for more accessible legend labels
  const renderColorfulLegendText = (value: string, entry: any) => {
    const { color } = entry;
    return (
      <span className="text-sm px-2" style={{ color }}>
        {value}
      </span>
    );
  };
  
  return (
    <div className="grid gap-4 md:grid-cols-2 m-3">
      {/* Top Performing Events Card */}
      <Card className="col-span-1">
        <CardHeader className="pb-2 pt-5 px-6">
          <CardDescription className="text-sm mb-1">Most Engaging Events</CardDescription>
          <CardTitle className="text-xl">Where Volunteers Contribute the Most</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-5">
          {data.topEvents.length > 0 ? (
            <div className="space-y-4">
              {data.topEvents.map((event) => (
                <div key={event.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate max-w-[180px]" title={event.title}>
                      {event.title}
                    </p>
                    <span className="text-xs text-muted-foreground ml-2">
                      {event.volunteerCount}/{event.maxVolunteers}
                    </span>
                  </div>
                  <Progress 
                    value={event.engagementRate} 
                    className="h-2"
                    aria-label={`${event.title} has ${event.engagementRate.toFixed(0)}% engagement rate`}
                  />
                  <p className="text-xs text-muted-foreground">
                    {event.engagementRate.toFixed(0)}% Engagement Rate
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-muted-foreground">No top events data available</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Event Satisfaction Rate Card */}
      <Card className="col-span-1">
        <CardHeader className="pb-2 pt-5 px-6">
          <CardDescription className="text-sm mb-1">Event Experience</CardDescription>
          <CardTitle className="text-xl">Volunteer Satisfaction Rate</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-5">
          {data.satisfactionRates && data.satisfactionRates.length > 0 ? (
            <div className="space-y-4">
              {data.satisfactionRates.map((event, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate max-w-[200px]" title={event.title}>
                      {event.title}
                    </p>
                    <span className="text-xs font-medium text-muted-foreground ml-2">
                      {event.satisfactionRate.toFixed(1)}/5.0
                    </span>
                  </div>
                  <Progress 
                    value={(event.satisfactionRate / 5) * 100} 
                    className="h-2"
                    aria-label={`${event.title} has ${event.satisfactionRate.toFixed(1)} out of 5 satisfaction rating`}
                  />
                  <p className="text-xs text-muted-foreground">
                    Based on {event.feedbackCount} ratings
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-muted-foreground">No satisfaction data available</p>
            </div>
          )}
          <VisuallyHidden>
            Top event satisfaction ratings: 
            {data.satisfactionRates && data.satisfactionRates.map(event => 
              `${event.title} has ${event.satisfactionRate.toFixed(1)} out of 5 satisfaction rating based on ${event.feedbackCount} feedback submissions.`
            ).join(' ')}
          </VisuallyHidden>
        </CardContent>
      </Card>

      {/* Conducted Events Over Time Card */}
      <Card className="col-span-2">
        <CardHeader className="pb-2 pt-5 px-6">
          <CardDescription className="text-sm mb-1">Event Completion Trends</CardDescription>
          <CardTitle className="text-xl">Conducted Events Over Time</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-5">
          {data.eventCompletionOverTime && data.eventCompletionOverTime.length > 0 ? (
            <div className="aspect-[3/1]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.eventCompletionOverTime}
                  margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                >
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 'auto']} />
                  <Tooltip />
                  <Legend formatter={renderColorfulLegendText} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name="Completed Events"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    dot={{ stroke: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    activeDot={{ stroke: "hsl(var(--primary))", strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-muted-foreground">No event completion data available</p>
            </div>
          )}
          <VisuallyHidden>
            Event completion over time chart showing the number of conducted events each month.
            {data.eventCompletionOverTime && data.eventCompletionOverTime.map(item => 
              `${item.name}: ${item.value} events completed.`
            ).join(' ')}
          </VisuallyHidden>
        </CardContent>
      </Card>

      {/* Event Type Preference Card */}
      <Card className="col-span-2">
        <CardHeader className="pb-2 pt-5 px-6">
          <CardDescription className="text-sm mb-1">Volunteer Preferences</CardDescription>
          <CardTitle className="text-xl">Event Type Distribution</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-5">
          {data.eventTypePreferences && data.eventTypePreferences.length > 0 ? (
            <div className="relative">
              <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
                <div style={{ 
                  minWidth: Math.max(600, data.eventTypePreferences.length * 100),
                  height: '400px',
                  position: 'relative'
                }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.eventTypePreferences}
                      margin={{ top: 20, right: 30, left: 60, bottom: 60 }}
                      layout="vertical"
                    >
                      <XAxis type="number" />
                      <YAxis 
                        type="category" 
                        dataKey="type" 
                        tick={{ fontSize: 12 }}
                        width={120} 
                        style={{ fontWeight: 500 }}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value} Events`, 'Count']} 
                        cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                      />
                      <Legend formatter={renderColorfulLegendText} />
                      <Bar 
                        dataKey="count" 
                        name="Event Count" 
                        barSize={30} 
                        radius={[0, 4, 4, 0]}
                      >
                        {data.eventTypePreferences.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {data.eventTypePreferences.length > 6 && (
                <div className="text-xs text-center text-muted-foreground mt-4">
                  Scroll horizontally to see all event types
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-muted-foreground">No event type preference data available</p>
            </div>
          )}
          <VisuallyHidden>
            Event type distribution chart showing count by event type.
            {data.eventTypePreferences && data.eventTypePreferences.map(item => 
              `${item.type}: ${item.count} events.`
            ).join(' ')}
          </VisuallyHidden>
        </CardContent>
      </Card>
    </div>
  )
}

function EventInsightsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2 pt-5 px-6">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-6 px-6 pb-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-[60px]" />
              </div>
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-[100px]" />
            </div>
          ))}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2 pt-5 px-6">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent className="space-y-8 px-6 pb-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-[60px]" />
              </div>
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader className="pb-2 pt-5 px-6">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent className="px-6 pb-5">
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader className="pb-2 pt-5 px-6">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent className="px-6 pb-5">
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
} 