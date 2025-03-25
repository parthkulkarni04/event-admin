"use client"

import { useState } from "react"
import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Calendar, ClipboardList, Home, LogOut, Menu, Users, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAccessibility } from "@/components/accessibility-provider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { speakText } = useAccessibility()
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
    speakText(isCollapsed ? "Expanded sidebar" : "Collapsed sidebar")
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <div 
        className={cn(
          "fixed left-0 top-0 z-30 h-screen border-r bg-background transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[70px]" : "w-[240px]"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2 font-bold text-primary transition-opacity",
              isCollapsed ? "opacity-0" : "opacity-100"
            )}
            onClick={() => speakText("Navigating to Dashboard")}
          >
            <Calendar className="h-6 w-6" />
            <span className={cn(isCollapsed ? "hidden" : "block")}>Event Admin</span>
          </Link>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={toggleSidebar}
                  aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <nav className="flex flex-col gap-1 p-2">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent",
                route.active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
              onClick={() => speakText(`Navigating to ${route.label}`)}
            >
              <route.icon className="h-5 w-5" />
              <span className={cn(isCollapsed ? "hidden" : "block")}>{route.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile Sidebar */}
      <header className="sticky top-0 z-40 border-b bg-background md:hidden">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open menu"
                  onClick={() => speakText("Menu opened")}
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                <nav className="flex flex-col gap-4 mt-8">
                  {routes.map((route) => (
                    <Link
                      key={route.href}
                      href={route.href}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 text-lg font-medium rounded-md hover:bg-accent",
                        route.active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                      )}
                      onClick={() => speakText(`Navigating to ${route.label}`)}
                    >
                      <route.icon className="h-5 w-5" />
                      {route.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-bold text-xl text-primary"
              onClick={() => speakText("Navigating to Dashboard")}
            >
              <Calendar className="h-6 w-6" />
              <span>Event Admin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div 
        className={cn(
          "flex flex-1 flex-col transition-all duration-300 ease-in-out", 
          isCollapsed ? "md:ml-[70px]" : "md:ml-[240px]"
        )}
      >
        <div className="container flex-1 py-8">{children}</div>
      </div>
    </div>
  )
}

