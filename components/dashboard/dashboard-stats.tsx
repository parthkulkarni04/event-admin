"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Radio } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { useEffect, useState } from "react"

interface ChartDataItem {
  name: string;
  value: number;
}

interface DashboardData {
  liveEventsCount: number;
  completedTasksCount: number;
  taskChartData: ChartDataItem[];
}

export function DashboardStats() {
  const [data, setData] = useState<DashboardData>({
    liveEventsCount: 0,
    completedTasksCount: 0,
    taskChartData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [
          tasksCount, 
          completedTasksCount, 
          liveEventsCount,
          unassignedTasksCount,
          assignedTasksCount,
          inProgressTasksCount
        ] = await Promise.all([
          supabase.from("tasks").select("task_id", { count: "exact", head: true }),
          supabase.from("tasks").select("task_id", { count: "exact", head: true }).eq("task_status", "complete"),
          supabase
            .from("events")
            .select("id", { count: "exact", head: true })
            .filter("start_date", "lte", new Date().toISOString())
            .filter("end_date", "gte", new Date().toISOString()),
          supabase.from("tasks").select("task_id", { count: "exact", head: true }).eq("task_status", "unassigned"),
          supabase.from("tasks").select("task_id", { count: "exact", head: true }).eq("task_status", "assigned"),
          supabase.from("tasks").select("task_id", { count: "exact", head: true }).eq("task_status", "inprogress")
        ]);
        
        // Prepare task status data for pie chart
        const taskChartData: ChartDataItem[] = [
          { name: "unassigned", value: unassignedTasksCount.count || 0 },
          { name: "assigned", value: assignedTasksCount.count || 0 },
          { name: "inprogress", value: inProgressTasksCount.count || 0 },
          { name: "complete", value: completedTasksCount.count || 0 }
        ];

        setData({
          liveEventsCount: liveEventsCount.count || 0,
          completedTasksCount: completedTasksCount.count || 0,
          taskChartData
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Colors for task status
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']
  const statusLabels: Record<string, string> = {
    "unassigned": "Unassigned",
    "assigned": "Assigned",
    "inprogress": "In Progress",
    "complete": "Complete"
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Events</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.liveEventsCount}</div>
            <p className="text-xs text-muted-foreground">Currently ongoing events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.completedTasksCount}</div>
            <p className="text-xs text-muted-foreground">Tasks marked as completed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {!loading && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.taskChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name }) => statusLabels[name] || name}
                  >
                    {data.taskChartData.map((entry: ChartDataItem, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, statusLabels[name] || name]} />
                  <Legend formatter={(value) => statusLabels[value] || value} />
                </PieChart>
              </ResponsiveContainer>
            )}
            {loading && (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Loading chart data...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

