"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PawPrint, MapPin, CalendarDays, Store, LogOut, Dog, UserRound, Bell } from "lucide-react"

type Role = "tutor" | "petshop"

const tutorLinks = [
  { href: "/dashboard/pets", label: "Meus Pets", icon: Dog },
  { href: "/dashboard/discover", label: "Buscar Pet Shops", icon: MapPin },
  { href: "/dashboard/appointments", label: "Agendamentos", icon: CalendarDays },
  { href: "/dashboard/profile", label: "Meu Perfil", icon: UserRound },
]

const petshopLinks = [
  { href: "/dashboard/petshop", label: "Meu Pet Shop", icon: Store },
  { href: "/dashboard/appointments", label: "Agenda", icon: CalendarDays },
  { href: "/dashboard/profile", label: "Meu Perfil", icon: UserRound },
]

export function DashboardNav({
  role,
  name,
  unreadNotifications = 0,
}: {
  role: Role
  name: string
  unreadNotifications?: number
}) {
  const pathname = usePathname()
  const router = useRouter()
  const links = role === "petshop" ? petshopLinks : tutorLinks

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PawPrint className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">PetCare</span>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname === link.href
            const Icon = link.icon
            const isAppointments = link.href === "/dashboard/appointments"
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
                {isAppointments && unreadNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white leading-none">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">Olá, {name.split(" ")[0]}</span>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-2">Sair</span>
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-2 py-2 md:hidden">
        {links.map((link) => {
          const active = pathname === link.href
          const Icon = link.icon
          const isAppointments = link.href === "/dashboard/appointments"
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="whitespace-nowrap">{link.label}</span>
              {isAppointments && unreadNotifications > 0 && (
                <span className="absolute -top-0.5 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white leading-none">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
