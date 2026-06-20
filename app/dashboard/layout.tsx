import type React from "react"
import { getSessionUser } from "@/lib/session"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in")

  return (
    <div className="min-h-svh bg-background">
      <DashboardNav role={user.role} name={user.name} />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
