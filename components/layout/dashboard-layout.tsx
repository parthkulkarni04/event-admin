"use client"

import { useState } from "react"
import type React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart3, Calendar, ClipboardList, Home, LogOut, Menu, Users, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: Home,
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/events",
      label: "Events",
      icon: Calendar,
      active: pathname === "/dashboard/events" || pathname?.startsWith("/dashboard/events/"),
    },
    {
      href: "/dashboard/tasks",
      label: "Tasks",
      icon: ClipboardList,
      active: pathname === "/dashboard/tasks" || pathname?.startsWith("/dashboard/tasks/"),
    },
    {
      href: "/dashboard/volunteers",
      label: "Volunteers",
      icon: Users,
      active: pathname === "/dashboard/volunteers" || pathname?.startsWith("/dashboard/volunteers/"),
    },
    {
      href: "/dashboard/analytics",
      label: "Analytics",
      icon: BarChart3,
      active: pathname === "/dashboard/analytics",
    },
  ]

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const handleLogout = () => {
    router.push("/")
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar for larger screens */}
      <div className={cn(
        "hidden md:flex flex-col border-r bg-background transition-all duration-300",
        isCollapsed ? "w-[70px]" : "w-64"
      )}>
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <div className={cn("flex items-center gap-2", isCollapsed && "justify-center w-full")}>
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className={cn(
              "font-bold text-lg transition-opacity", 
              isCollapsed ? "opacity-0 w-0" : "opacity-100"
            )}>
              Event Admin
            </h1>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn("transition-opacity", isCollapsed && "rotate-180")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto py-4 flex flex-col justify-between">
          <nav className="grid gap-1 px-2">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                  route.active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <route.icon className="h-5 w-5" />
                <span className={cn("transition-opacity", isCollapsed ? "opacity-0 w-0 h-0 overflow-hidden" : "opacity-100")}>
                  {route.label}
                </span>
              </Link>
            ))}
          </nav>
          
          <div className="mt-auto px-2 pb-4">
            <Separator className="my-4" />
            <Button
              variant="ghost"
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              <LogOut className="h-5 w-5" />
              <span className={cn("transition-opacity", isCollapsed ? "opacity-0 w-0 h-0 overflow-hidden" : "opacity-100")}>
                Logout
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button className="fixed left-4 top-4 z-40 h-10 w-10 rounded-md md:hidden" size="icon" variant="outline">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-16 items-center border-b px-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              <h1 className="font-bold text-lg">Event Admin</h1>
            </div>
          </div>
          <div className="flex flex-col h-[calc(100%-4rem)] justify-between">
            <nav className="grid gap-1 p-4">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                    route.active ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  )}
                >
                  <route.icon className="h-5 w-5" />
                  {route.label}
                </Link>
              ))}
            </nav>
            
            <div className="mt-auto p-4">
              <Separator className="my-2" />
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full flex items-center justify-start gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex flex-1 flex-col bg-muted/20 overflow-auto">
        {children}
      </main>
    </div>
  )
}

