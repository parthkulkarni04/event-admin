"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Calendar, ClipboardList, Home, LogOut, Menu, Settings, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAccessibility } from "@/components/accessibility-provider"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { speakText } = useAccessibility()

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
    {
      href: "/dashboard/settings",
      label: "Settings",
      icon: Settings,
      active: pathname === "/dashboard/settings",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
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
          <Button variant="ghost" size="icon" aria-label="Log out" onClick={() => speakText("Log out button pressed")}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-64 flex-col border-r bg-background md:flex">
          <nav className="flex flex-col gap-2 p-4">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-outline",
                  route.active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
                onClick={() => speakText(`Navigating to ${route.label}`)}
              >
                <route.icon className="h-5 w-5" />
                {route.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

