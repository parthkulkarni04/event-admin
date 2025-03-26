"use client"

import { useVolunteerInsightsData } from "../hooks/use-insights-data"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

export default function VolunteerInsights() {
  const { data, loading, error } = useVolunteerInsightsData()
  
  if (loading) {
    return <VolunteerInsightsSkeleton />
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-destructive">Error loading volunteer insights: {error.message}</p>
      </div>
    )
  }
  
  if (!data) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">No volunteer data available</p>
      </div>
    )
  }
  
  // Colors for pie chart - using high contrast colors for better accessibility
  const COLORS = ['#0047AB', '#008000', '#B8860B', '#8B0000', '#4B0082', '#006400', '#800000'];
  
  return (
    <div className="grid gap-4 md:grid-cols-2 m-3">
      {/* Total Volunteers Card */}
      <Card>
        <CardHeader className="pb-2 pt-5 px-6">
          <CardDescription className="text-sm mb-1">Volunteer Community Size</CardDescription>
          <CardTitle className="text-3xl">{data.totalVolunteers}</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-5">
          <p className="text-xs text-muted-foreground">Total People Involved</p>
        </CardContent>
      </Card>
      
      {/* New Volunteers This Month Card */}
      <Card>
        <CardHeader className="pb-2 pt-5 px-6">
          <CardDescription className="text-sm mb-1">Fresh Faces</CardDescription>
          <CardTitle className="text-3xl">{data.newVolunteersThisMonth}</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-5">
          <p className="text-xs text-muted-foreground">Recent Joiners in the Community</p>
        </CardContent>
      </Card>
      
      {/* Participation Rate Card */}
      <Card>
        <CardHeader className="pb-2 pt-5 px-6">
          <CardDescription className="text-sm mb-1">Volunteer Participation</CardDescription>
          <CardTitle className="text-3xl">{Math.round(data.participationRate)}%</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-5">
          <p className="text-xs text-muted-foreground">Of volunteers who've joined an event</p>
        </CardContent>
      </Card>
      
      {/* Volunteer Skills Distribution Card */}
      <Card className="row-span-2">
        <CardHeader className="pb-2 pt-5 px-6">
          <CardDescription className="text-sm mb-1">Skills That Power Our Volunteers</CardDescription>
          <CardTitle className="text-2xl">Skill Distribution</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-5">
          {data.skillDistribution.length > 0 ? (
            <div className="flex flex-col">
              {/* Pie Chart */}
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.skillDistribution.slice(0, 7)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="skill"
                      label={false}
                      labelLine={false}
                    >
                      {data.skillDistribution.slice(0, 7).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [`${value} Volunteers`, name]} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Skills List Below Chart */}
              <div className="mt-4 space-y-2">
                {data.skillDistribution.slice(0, 7).map((skill, index) => {
                  const totalCount = data.skillDistribution.reduce((sum, s) => sum + s.count, 0);
                  const percentage = Math.round((skill.count / totalCount) * 100);
                  
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium flex-1 truncate" title={skill.skill}>
                        {skill.skill}
                      </span>
                      <span className="text-sm text-muted-foreground">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No skill distribution data available</p>
            </div>
          )}
          <VisuallyHidden>
            Volunteer skill distribution: 
            {data.skillDistribution.slice(0, 7).map(skill => 
              `${skill.skill}: ${skill.count} volunteers.`
            ).join(' ')}
          </VisuallyHidden>
        </CardContent>
      </Card>
      
      {/* Volunteer Growth Over Time Card */}
      <Card className="col-span-full lg:col-span-2">
        <CardHeader className="pb-2 pt-5 px-6">
          <CardDescription className="text-sm mb-1">New Volunteers Over the Months</CardDescription>
          <CardTitle className="text-2xl">Volunteer Growth</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] px-6 pb-5">
          {data.volunteerGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.volunteerGrowth}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`${value} Volunteers`, "New Sign-ups"]} 
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8884d8"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No volunteer growth data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function VolunteerInsightsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Total Volunteers Card Skeleton */}
      <Card>
        <CardHeader className="pb-2 pt-5 px-6">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-10 w-1/4" />
        </CardHeader>
        <CardContent className="px-6 pb-5">
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
      
      {/* New Volunteers This Month Card Skeleton */}
      <Card>
        <CardHeader className="pb-2 pt-5 px-6">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-10 w-1/4" />
        </CardHeader>
        <CardContent className="px-6 pb-5">
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
      
      {/* Participation Rate Card Skeleton */}
      <Card>
        <CardHeader className="pb-2 pt-5 px-6">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-10 w-1/4" />
        </CardHeader>
        <CardContent className="px-6 pb-5">
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
      
      {/* Volunteer Skills Distribution Card Skeleton */}
      <Card className="row-span-2">
        <CardHeader className="pb-2 pt-5 px-6">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent className="px-6 pb-5">
          <Skeleton className="h-[220px] w-full" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Volunteer Growth Over Time Card Skeleton */}
      <Card className="col-span-full lg:col-span-2">
        <CardHeader className="pb-2 pt-5 px-6">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent className="h-[300px] px-6 pb-5">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    </div>
  )
} 