import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center border-b px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Image
            src="/samarthanam-logo.jpg"
            alt="Samarthanam Logo"
            width={80}
            height={80}
            className="rounded-full"
          />
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6">
        <div className="max-w-md w-full space-y-4 text-center">
          <div className="flex justify-center mb-8">
            <Image
              src="/samarthanam-logo.jpg"
              alt="Samarthanam Logo"
              width={400}
              height={800}
              className="rounded-lg"
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard for Event Organizers</h1>
          <p className="text-muted-foreground">
            Manage events, tasks, and volunteers with our accessible admin dashboard.
          </p>
          <Button asChild size="lg" className="w-full">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </main>
      <footer className="border-t py-4 px-4 md:px-6">
        <div className="text-center text-sm text-muted-foreground">
          Made with ❤️ by team Samarthanam Saarthi VIT Pune
        </div>
      </footer>
    </div>
  )
}

