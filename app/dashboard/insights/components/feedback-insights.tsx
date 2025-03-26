"use client"

import { useFeedbackInsightsData } from "../hooks/use-insights-data"
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LabelList
} from "recharts"

export default function FeedbackInsights() {
  const { data, loading, error } = useFeedbackInsightsData()
  
  if (loading) {
    return <FeedbackInsightsSkeleton />
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-destructive">Error loading feedback insights: {error.message}</p>
      </div>
    )
  }
  
  if (!data || data.totalFeedbacks === 0) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">No feedback data available for past events</p>
      </div>
    )
  }
  
  // Star rating component
  const StarRating = ({ rating }: { rating: number }) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
    
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <svg key={`full-${i}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FBBF24" className="w-5 h-5">
            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
          </svg>
        ))}
        
        {hasHalfStar && (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FBBF24" className="w-5 h-5">
            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
          </svg>
        )}
        
        {[...Array(emptyStars)].map((_, i) => (
          <svg key={`empty-${i}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        ))}
      </div>
    )
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Total Feedback Submissions Card */}
      <Card>
        <CardHeader className="pb-2 pt-5 px-6">
          <CardDescription className="text-sm mb-1">How Many Volunteers Shared Their Thoughts?</CardDescription>
          <CardTitle className="text-3xl">{data.totalFeedbacks}</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-5">
          <p className="text-xs text-muted-foreground">Total Feedback Submissions for Past Events</p>
        </CardContent>
      </Card>
      
      {/* Average Volunteer Rating Card */}
      <Card>
        <CardHeader className="pb-2 pt-5 px-6">
          <CardDescription className="text-sm mb-1">Volunteer Experience</CardDescription>
          <CardTitle className="text-2xl">How Are Events Rated?</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 px-6 pb-5">
          <div className="flex flex-col items-center justify-center space-y-2">
            <span className="text-4xl font-bold">{data.avgRating.toFixed(1)}</span>
            <StarRating rating={data.avgRating} />
            <p className="text-sm text-muted-foreground mt-2">
              Average rating across all past events
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Top Rated Events Card */}
      <Card className="row-span-2">
        <CardHeader className="pb-2 pt-5 px-6">
          <CardDescription className="text-sm mb-1">Highest Rated Events</CardDescription>
          <CardTitle className="text-2xl">The Best Experiences</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-5">
          {data.topRatedEvents.length > 0 ? (
            <div className="space-y-6">
              {data.topRatedEvents.map((event) => (
                <div key={event.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate max-w-[160px]" title={event.title}>
                      {event.title}
                    </p>
                    <Badge variant="outline" className="ml-2">
                      {event.feedbackCount} {event.feedbackCount === 1 ? 'review' : 'reviews'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <StarRating rating={event.avgRating} />
                    <span className="text-sm font-medium">{event.avgRating.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-muted-foreground">No top rated events data available</p>
            </div>
          )}
          <VisuallyHidden>
            Top rated events: 
            {data.topRatedEvents.map(event => 
              `${event.title} has an average rating of ${event.avgRating.toFixed(1)} from ${event.feedbackCount} reviews.`
            ).join(' ')}
          </VisuallyHidden>
        </CardContent>
      </Card>
      
      {/* Event Ratings Chart */}
      <Card className="col-span-2">
        <CardHeader className="pb-2 pt-5 px-6">
          <CardDescription className="text-sm mb-1">Rating Distribution</CardDescription>
          <CardTitle className="text-2xl">Event Satisfaction Levels</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] px-6 pb-5">
          {data.topRatedEvents.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.topRatedEvents.slice(0, 5)}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis 
                  type="number" 
                  domain={[0, 5]} 
                  tickCount={6}
                  tickFormatter={(value) => `${value.toFixed(1)}`}
                />
                <YAxis 
                  type="category" 
                  dataKey="title" 
                  width={150}
                  tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 20)}...` : value}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)} Stars`, "Rating"]} 
                  labelFormatter={(label) => `Event: ${label}`}
                />
                <Bar 
                  dataKey="avgRating" 
                  fill="#FBBF24"
                  radius={[0, 4, 4, 0]}
                >
                  <LabelList dataKey="avgRating" position="right" formatter={(value: number) => value.toFixed(1)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No event rating data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function FeedbackInsightsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Total Feedback Submissions Card Skeleton */}
      <Card>
        <CardHeader className="pb-2 pt-5 px-6">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-1/4" />
        </CardHeader>
        <CardContent className="px-6 pb-5">
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
      
      {/* Average Volunteer Rating Card Skeleton */}
      <Card>
        <CardHeader className="pb-2 pt-5 px-6">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent className="pt-4 px-6 pb-5">
          <div className="flex flex-col items-center justify-center space-y-2">
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-44 mt-2" />
          </div>
        </CardContent>
      </Card>
      
      {/* Top Rated Events Card Skeleton */}
      <Card className="row-span-2">
        <CardHeader className="pb-2 pt-5 px-6">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent className="px-6 pb-5">
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-16 ml-2" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-8" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Event Ratings Chart Skeleton */}
      <Card className="col-span-2">
        <CardHeader className="pb-2 pt-5 px-6">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent className="px-6 pb-5">
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
} 