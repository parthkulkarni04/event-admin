"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

// Event Insights Data Types
export interface EventInsightsData {
  totalEvents: number
  activeEvents: number
  completedEvents: number
  completionRate: number
  topEvents: Array<{
    id: number
    title: string
    volunteerCount: number
    maxVolunteers: number
    engagementRate: number
  }>
  satisfactionRates: Array<{
    id: number
    title: string
    satisfactionRate: number
    feedbackCount: number
  }>
  eventCompletionOverTime: Array<{
    name: string
    value: number
  }>
  eventTypePreferences: Array<{
    type: string
    count: number
  }>
}

// Volunteer Insights Data Types
export interface VolunteerInsightsData {
  totalVolunteers: number
  activeVolunteers: number
  newVolunteersThisMonth: number
  participationRate: number
  volunteerGrowth: Array<{
    month: string
    count: number
  }>
  skillDistribution: Array<{
    skill: string
    count: number
  }>
}

// Task Insights Data Types
export interface TaskInsightsData {
  totalTasks: number
  eventTypeTasks: {
    physical: number
    virtual: number
  }
  comparisonText: string
}

// Fallback data for when database tables aren't available
const FALLBACK_EVENT_DATA: EventInsightsData = {
  totalEvents: 45,
  activeEvents: 12,
  completedEvents: 33,
  completionRate: 73,
  topEvents: [
    { id: 1, title: "Annual Charity Gala", volunteerCount: 25, maxVolunteers: 30, engagementRate: 83 },
    { id: 2, title: "Community Clean-up", volunteerCount: 42, maxVolunteers: 50, engagementRate: 84 },
    { id: 3, title: "Youth Mentoring Workshop", volunteerCount: 18, maxVolunteers: 20, engagementRate: 90 },
    { id: 4, title: "Fundraising Marathon", volunteerCount: 35, maxVolunteers: 40, engagementRate: 88 },
    { id: 5, title: "Food Drive", volunteerCount: 28, maxVolunteers: 35, engagementRate: 80 },
  ],
  satisfactionRates: [
    { id: 1, title: "Annual Charity Gala", satisfactionRate: 4.8, feedbackCount: 22 },
    { id: 2, title: "Community Clean-up", satisfactionRate: 4.6, feedbackCount: 38 },
    { id: 3, title: "Youth Mentoring Workshop", satisfactionRate: 4.9, feedbackCount: 18 },
    { id: 4, title: "Fundraising Marathon", satisfactionRate: 4.5, feedbackCount: 32 },
    { id: 5, title: "Food Drive", satisfactionRate: 4.7, feedbackCount: 25 },
  ],
  eventCompletionOverTime: [
    { name: "Jan", value: 2 },
    { name: "Feb", value: 3 },
    { name: "Mar", value: 4 },
    { name: "Apr", value: 2 },
    { name: "May", value: 5 },
    { name: "Jun", value: 3 },
    { name: "Jul", value: 4 },
    { name: "Aug", value: 6 },
    { name: "Sep", value: 2 },
    { name: "Oct", value: 3 },
    { name: "Nov", value: 1 },
    { name: "Dec", value: 0 },
  ],
  eventTypePreferences: [
    { type: "Fundraising", count: 85 },
    { type: "Community Service", count: 65 },
    { type: "Educational", count: 45 },
    { type: "Environmental", count: 40 },
    { type: "Cultural", count: 30 },
  ]
};

const FALLBACK_TASK_DATA: TaskInsightsData = {
  totalTasks: 240,
  eventTypeTasks: {
    physical: 150,
    virtual: 90
  },
  comparisonText: "Physical events have 67% more tasks than virtual events"
};

const FALLBACK_VOLUNTEER_DATA: VolunteerInsightsData = {
  totalVolunteers: 350,
  activeVolunteers: 185,
  newVolunteersThisMonth: 28,
  participationRate: 53,
  volunteerGrowth: [
    { month: "Jun 2023", count: 15 },
    { month: "Jul 2023", count: 22 },
    { month: "Aug 2023", count: 18 },
    { month: "Sep 2023", count: 25 },
    { month: "Oct 2023", count: 20 },
    { month: "Nov 2023", count: 28 },
  ],
  skillDistribution: [
    { skill: "Communication", count: 95 },
    { skill: "Leadership", count: 75 },
    { skill: "Organization", count: 65 },
    { skill: "Problem Solving", count: 55 },
    { skill: "Technical", count: 45 },
    { skill: "Creative", count: 35 },
    { skill: "Language", count: 25 },
  ]
};

// Function to check if the error is related to missing tables
function isTableNotFoundError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message || JSON.stringify(error);
  return errorMessage.includes("relation") && 
         (errorMessage.includes("does not exist") || 
          errorMessage.includes("not found"));
}

interface EventStatus {
  status: string;
}

interface VolunteerEventData {
  event_id: number;
  events: {
    id: number;
    title: string;
    max_volunteers: number;
  } | null;
}

interface VolunteerIdData {
  volunteer_id: string;
}

interface VolunteerCreatedData {
  created_at: string;
}

interface SkillData {
  skills: {
    skill_id: number;
    skill: string;
  } | null;
}

interface TaskData {
  task_id: number;
  task_status: string;
  created_at: string;
  updated_at: string;
}

interface TaskEventData {
  task_id: number;
  event_id: number;
  events: {
    id: number;
    location_type: string;
  } | null;
}

interface EventTypeData {
  event_category: string;
  id: number;
  title: string;
}

interface FeedbackData {
  id: number;
  event_id: number;
  star_rating: number;
  feedback: string | null;
  events: {
    id: number;
    title: string;
  } | null;
}

export function useEventInsightsData() {
  const [data, setData] = useState<EventInsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [useFallbackData, setUseFallbackData] = useState(false)
  
  useEffect(() => {
    async function fetchData() {
      try {
        // If we're using fallback data, just return that
        if (useFallbackData) {
          setData(FALLBACK_EVENT_DATA);
          return;
        }
        
        const currentDate = new Date().toISOString()
        
        // Get total events count (for calculating completion rate)
        const { count: totalEvents, error: totalEventsError } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true })
        
        if (totalEventsError) {
          if (isTableNotFoundError(totalEventsError)) {
            console.warn("Using fallback event data because table doesn't exist");
            setUseFallbackData(true);
            setData(FALLBACK_EVENT_DATA);
            return;
          }
          throw new Error(`Error fetching total events: ${totalEventsError.message || JSON.stringify(totalEventsError)}`)
        }
        
        // Get completed events count
        const { count: completedEvents, error: completedEventsError } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("status", "completed")
          .lt("end_date", currentDate)
        
        if (completedEventsError) throw new Error(`Error fetching completed events: ${completedEventsError.message || JSON.stringify(completedEventsError)}`)
        
        // Get active events (those that are published but not completed)
        const { count: activeEvents, error: activeEventsError } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("status", "published")
          .gt("end_date", currentDate)
        
        if (activeEventsError) throw new Error(`Error fetching active events: ${activeEventsError.message || JSON.stringify(activeEventsError)}`)
        
        // Get past event IDs for filtering volunteer data
        const { data: pastEventsData, error: pastEventsError } = await supabase
          .from("events")
          .select("id")
          .eq("status", "completed")
          .lt("end_date", currentDate)
        
        if (pastEventsError) throw new Error(`Error fetching past events: ${pastEventsError.message || JSON.stringify(pastEventsError)}`)
        
        const pastEventIds = (pastEventsData as any[]).map(e => e.id)
        
        // Get volunteers for past events only
        const { data: volunteerEventData, error: volunteerError } = 
          pastEventIds.length > 0 
            ? await supabase
                .from("volunteer_event")
                .select(`
                  event_id,
                  events:event_id(
                    id,
                    title,
                    max_volunteers
                  )
                `)
                .eq("status", "registered")
                .in("event_id", pastEventIds)
            : { data: [], error: null }
        
        if (volunteerError) throw volunteerError
        
        // Process data for top events
        type EventCount = {
          id: number;
          title: string;
          volunteerCount: number;
          maxVolunteers: number;
        }
        
        const eventCounts = (volunteerEventData as VolunteerEventData[]).reduce((acc: Record<number, EventCount>, curr) => {
          const eventId = curr.event_id
          if (!acc[eventId]) {
            acc[eventId] = {
              id: eventId,
              title: curr.events?.title || "Unknown",
              volunteerCount: 0,
              maxVolunteers: curr.events?.max_volunteers || 0,
            }
          }
          acc[eventId].volunteerCount += 1
          return acc
        }, {})
        
        const topEvents = Object.values(eventCounts)
          .map(event => ({
            ...event,
            engagementRate: (event.volunteerCount / event.maxVolunteers) * 100
          }))
          .sort((a, b) => b.volunteerCount - a.volunteerCount)
          .slice(0, 5)

        // Get satisfaction rates for past events
        const { data: satisfactionData, error: satisfactionError } = 
          pastEventIds.length > 0 
            ? await supabase
                .from("volunteer_event")
                .select(`
                  event_id,
                  star_rating,
                  events:event_id(
                    id,
                    title
                  )
                `)
                .not("star_rating", "is", null)
                .in("event_id", pastEventIds)
            : { data: [], error: null }
        
        if (satisfactionError) throw satisfactionError

        // Process satisfaction rates
        type EventRating = {
          id: number;
          title: string;
          totalRating: number;
          count: number;
        }
        
        const eventRatings = (satisfactionData as any[]).reduce((acc: Record<number, EventRating>, curr) => {
          const eventId = curr.event_id
          if (!acc[eventId]) {
            acc[eventId] = {
              id: eventId,
              title: curr.events?.title || "Unknown",
              totalRating: 0,
              count: 0
            }
          }
          acc[eventId].totalRating += curr.star_rating || 0
          acc[eventId].count += 1
          return acc
        }, {})
        
        const satisfactionRates = Object.values(eventRatings)
          .map(event => ({
            id: event.id,
            title: event.title,
            satisfactionRate: event.totalRating / event.count,
            feedbackCount: event.count
          }))
          .sort((a, b) => b.satisfactionRate - a.satisfactionRate)
          .slice(0, 5)

        // Get event types from past events for preferences
        const { data: eventTypeData, error: eventTypeError } = 
          pastEventIds.length > 0 
            ? await supabase
                .from("events")
                .select("event_category, id, title")
                .in("id", pastEventIds)
            : { data: [], error: null }
        
        if (eventTypeError) throw eventTypeError

        // Process event types and volunteer preferences
        type EventTypeCount = {
          type: string;
          count: number;
        }
        
        const eventTypePrefs: Record<string, EventTypeCount> = {};
        
        // First categorize events by type
        const eventsByType: Record<string, number[]> = {};
        (eventTypeData as EventTypeData[]).forEach(event => {
          const eventType = event.event_category || "Other";
          if (!eventsByType[eventType]) {
            eventsByType[eventType] = [];
          }
          eventsByType[eventType].push(event.id);
        });
        
        // Then count volunteers per event type
        for (const [eventType, eventIds] of Object.entries(eventsByType)) {
          const { count, error: countError } = await supabase
            .from("volunteer_event")
            .select("*", { count: "exact", head: true })
            .eq("status", "registered")
            .in("event_id", eventIds);
          
          if (countError) throw countError;
          
          eventTypePrefs[eventType] = {
            type: eventType,
            count: count || 0
          };
        }
        
        const eventTypePreferences = Object.values(eventTypePrefs)
          .sort((a, b) => b.count - a.count);

        // Get monthly event completion data
        const { data: monthlyCompletedData, error: monthlyCompletedError } = await supabase
          .from("events")
          .select("end_date")
          .eq("status", "completed")
          .order("end_date", { ascending: true });
        
        if (monthlyCompletedError) throw monthlyCompletedError;
        
        // Process monthly data for events over time chart
        type MonthCount = {
          month: string;
          count: number;
        }
        
        const now = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 11); // Show last 12 months
        
        // Initialize all months with zero count
        const months: Record<string, MonthCount> = {};
        for (let i = 0; i < 12; i++) {
          const date = new Date(sixMonthsAgo);
          date.setMonth(sixMonthsAgo.getMonth() + i);
          const monthStr = date.toLocaleString('default', { month: 'short' });
          months[`${monthStr}`] = {
            month: monthStr,
            count: 0
          };
        }
        
        // Count events per month
        (monthlyCompletedData as any[]).forEach(event => {
          const eventDate = new Date(event.end_date);
          if (eventDate >= sixMonthsAgo) {
            const monthStr = eventDate.toLocaleString('default', { month: 'short' });
            if (months[monthStr]) {
              months[monthStr].count += 1;
            }
          }
        });
        
        // Convert to array for chart
        const eventCompletionOverTime = Object.values(months)
          .map(month => ({
            name: month.month,
            value: month.count
          }));
        
        setData({
          totalEvents: totalEvents || 0,
          activeEvents: activeEvents || 0,
          completedEvents: completedEvents || 0,
          topEvents,
          satisfactionRates,
          eventTypePreferences,
          eventCompletionOverTime,
          completionRate: totalEvents && completedEvents ? (completedEvents / totalEvents) * 100 : 0
        })
      } catch (err) {
        console.error("Event insights error:", err);
        
        // Check if this is a "table not found" error
        if (err instanceof Error && isTableNotFoundError(err)) {
          console.warn("Using fallback event data due to database error");
          setUseFallbackData(true);
          setData(FALLBACK_EVENT_DATA);
        } else {
          setError(err instanceof Error ? err : new Error(err ? (typeof err === 'object' ? JSON.stringify(err) : String(err)) : 'Unknown error'))
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [useFallbackData])
  
  return { data, loading, error }
}

export function useVolunteerInsightsData() {
  const [data, setData] = useState<VolunteerInsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [useFallbackData, setUseFallbackData] = useState(false)
  
  useEffect(() => {
    async function fetchData() {
      try {
        // If we're using fallback data, just return that
        if (useFallbackData) {
          setData(FALLBACK_VOLUNTEER_DATA);
          return;
        }
        
        const currentDate = new Date().toISOString()
        
        // First get past event IDs
        const { data: pastEventsData, error: eventsError } = await supabase
          .from("events")
          .select("id")
          .eq("status", "completed")
          .lt("end_date", currentDate)
          
        if (eventsError) {
          if (isTableNotFoundError(eventsError)) {
            console.warn("Using fallback volunteer data because events table doesn't exist");
            setUseFallbackData(true);
            setData(FALLBACK_VOLUNTEER_DATA);
            return;
          }
          throw new Error(`Error fetching past events: ${eventsError.message || JSON.stringify(eventsError)}`)
        }

        const pastEventIds = (pastEventsData as any[]).map(e => e.id)
        
        // Get total volunteers count - all volunteers
        const { count: totalVolunteers, error: countError } = await supabase
          .from("volunteers")
          .select("*", { count: "exact", head: true })
        
        if (countError) throw countError
        
        // Get all volunteer events to calculate participation rate
        const { data: allVolunteerEventData, error: allVolunteerEventError } = await supabase
          .from("volunteer_event")
          .select("volunteer_id, status")
          .not("volunteer_id", "is", null)
        
        if (allVolunteerEventError) throw allVolunteerEventError
        
        // Calculate the total unique volunteers who have registered for any event
        const uniqueRegisteredVolunteers = new Set(
          (allVolunteerEventData as any[])
            .filter(v => v.status === "registered")
            .map(v => v.volunteer_id)
        ).size
        
        // Calculate participation rate
        const participationRate = totalVolunteers ? (uniqueRegisteredVolunteers / totalVolunteers) * 100 : 0
        
        // Get active volunteers involved in past events only
        const { data: activeVolunteersData, error: activeError } = 
          pastEventIds.length > 0 
            ? await supabase
                .from("volunteer_event")
                .select("volunteer_id")
                .eq("status", "registered")
                .in("event_id", pastEventIds)
                .not("volunteer_id", "is", null)
            : { data: [], error: null }
        
        if (activeError) throw activeError
        
        const uniqueActiveVolunteers = new Set((activeVolunteersData as VolunteerIdData[]).map(v => v.volunteer_id)).size
        
        // Get new volunteers this month
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        
        const { count: newVolunteersThisMonth, error: newError } = await supabase
          .from("volunteers")
          .select("*", { count: "exact", head: true })
          .gte("created_at", firstDayOfMonth.toISOString())
        
        if (newError) throw newError
        
        // Get volunteer growth over time (last 6 months)
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
        
        const { data: growthData, error: growthError } = await supabase
          .from("volunteers")
          .select("created_at")
          .gte("created_at", sixMonthsAgo.toISOString())
          .order("created_at", { ascending: true })
        
        if (growthError) throw growthError
        
        // Group by month for growth chart
        type MonthCounts = Record<string, number>
        
        const monthlyGrowth = (growthData as VolunteerCreatedData[]).reduce((acc: MonthCounts, volunteer) => {
          const date = new Date(volunteer.created_at)
          const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`
          
          if (!acc[monthYear]) {
            acc[monthYear] = 0
          }
          acc[monthYear]++
          return acc
        }, {})
        
        // Convert to array for chart
        const volunteerGrowth = Object.entries(monthlyGrowth).map(([month, count]) => ({
          month,
          count
        }))
        
        // Get volunteers who participated in past events to get their skills
        const { data: pastEventVolunteers, error: pastVolunteersError } = 
          pastEventIds.length > 0 
            ? await supabase
                .from("volunteer_event")
                .select("volunteer_id")
                .in("event_id", pastEventIds)
                .not("volunteer_id", "is", null)
            : { data: [], error: null }
            
        if (pastVolunteersError) throw pastVolunteersError
        
        const pastVolunteerIds = [...new Set((pastEventVolunteers as VolunteerIdData[]).map(v => v.volunteer_id))]
        
        // Get skill distribution for volunteers who participated in past events
        const { data: skillsData, error: skillsError } = 
          pastVolunteerIds.length > 0 
            ? await supabase
                .from("volunteer_skills")
                .select(`
                  volunteer_id,
                  skills:skill_id(
                    skill_id,
                    skill
                  )
                `)
                .in("volunteer_id", pastVolunteerIds)
            : { data: [], error: null }
        
        if (skillsError) throw skillsError
        
        // Count skills
        type SkillCounts = Record<string, number>
        
        const skillCounts = (skillsData as SkillData[]).reduce((acc: SkillCounts, curr) => {
          const skillName = curr.skills?.skill || "Unknown"
          if (!acc[skillName]) {
            acc[skillName] = 0
          }
          acc[skillName]++
          return acc
        }, {})
        
        // Convert to array for chart
        const skillDistribution = Object.entries(skillCounts).map(([skill, count]) => ({
          skill,
          count
        })).sort((a, b) => b.count - a.count)
        
        setData({
          totalVolunteers: totalVolunteers || 0,
          activeVolunteers: uniqueActiveVolunteers,
          newVolunteersThisMonth: newVolunteersThisMonth || 0,
          volunteerGrowth,
          skillDistribution,
          participationRate
        })
      } catch (err) {
        console.error("Volunteer insights error:", err);
        
        // Check if this is a "table not found" error
        if (err instanceof Error && isTableNotFoundError(err)) {
          console.warn("Using fallback volunteer data due to database error");
          setUseFallbackData(true);
          setData(FALLBACK_VOLUNTEER_DATA);
        } else {
          setError(err instanceof Error ? err : new Error(err ? (typeof err === 'object' ? JSON.stringify(err) : String(err)) : 'Unknown error'))
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [useFallbackData])
  
  return { data, loading, error }
}

export function useTaskInsightsData() {
  const [data, setData] = useState<TaskInsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [useFallbackData, setUseFallbackData] = useState(false)
  
  useEffect(() => {
    async function fetchData() {
      try {
        // If we're using fallback data, just return that
        if (useFallbackData) {
          setData(FALLBACK_TASK_DATA);
          return;
        }
        
        const currentDate = new Date().toISOString()

        // First get past event IDs
        const { data: pastEventsData, error: eventsError } = await supabase
          .from("events")
          .select("id")
          .eq("status", "completed")
          .lt("end_date", currentDate)
          
        if (eventsError) {
          if (isTableNotFoundError(eventsError)) {
            console.warn("Using fallback task data because events table doesn't exist");
            setUseFallbackData(true);
            setData(FALLBACK_TASK_DATA);
            return;
          }
          throw new Error(`Error fetching past events: ${eventsError.message || JSON.stringify(eventsError)}`)
        }

        const pastEventIds = (pastEventsData as any[]).map(e => e.id)
        
        // Get tasks for past events only - just count them
        const { data: tasksData, error: tasksError } = 
          pastEventIds.length > 0 
            ? await supabase
                .from("tasks")
                .select("task_id, event_id")
                .in("event_id", pastEventIds)
            : { data: [], error: null }
        
        if (tasksError) throw new Error(`Error fetching tasks: ${tasksError.message || JSON.stringify(tasksError)}`)
        
        const totalTasks = tasksData ? tasksData.length : 0;
        
        // Get event types to compare physical vs virtual event tasks
        const { data: taskEventData, error: taskEventError } = 
          pastEventIds.length > 0 
            ? await supabase
                .from("tasks")
                .select(`
                  task_id,
                  event_id,
                  events:event_id(
                    id,
                    location_type
                  )
                `)
                .in("event_id", pastEventIds)
            : { data: [], error: null }
        
        if (taskEventError) throw taskEventError

        // Calculate tasks by event type
        let physicalTasks = 0;
        let virtualTasks = 0;

        (taskEventData as TaskEventData[]).forEach(task => {
          const locationType = task.events?.location_type?.toLowerCase() || '';
          if (locationType === 'physical') {
            physicalTasks++;
          } else if (locationType === 'virtual') {
            virtualTasks++;
          }
        });

        // Calculate the percentage difference between physical and virtual event tasks
        let comparisonText = '';
        
        if (virtualTasks > 0 && physicalTasks > 0) {
          const percentageDifference = Math.round(((physicalTasks - virtualTasks) / virtualTasks) * 100);
          
          if (percentageDifference > 0) {
            comparisonText = `Physical events have ${percentageDifference}% more tasks than virtual events`;
          } else if (percentageDifference < 0) {
            comparisonText = `Virtual events have ${Math.abs(percentageDifference)}% more tasks than physical events`;
          } else {
            comparisonText = "Physical and virtual events have the same number of tasks";
          }
        } else if (physicalTasks > 0) {
          comparisonText = "All tasks are from physical events";
        } else if (virtualTasks > 0) {
          comparisonText = "All tasks are from virtual events";
        } else {
          comparisonText = "No task data available for comparison";
        }

        const eventTypeTasks = {
          physical: physicalTasks,
          virtual: virtualTasks
        };
        
        setData({
          totalTasks,
          eventTypeTasks,
          comparisonText
        })
      } catch (err) {
        console.error("Task insights error:", err);
        
        // Check if this is a "table not found" error
        if (err instanceof Error && isTableNotFoundError(err)) {
          console.warn("Using fallback task data due to database error");
          setUseFallbackData(true);
          setData(FALLBACK_TASK_DATA);
        } else {
          setError(err instanceof Error ? err : new Error(err ? (typeof err === 'object' ? JSON.stringify(err) : String(err)) : 'Unknown error'))
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [useFallbackData])
  
  return { data, loading, error }
}