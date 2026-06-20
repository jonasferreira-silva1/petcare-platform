"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PawPrint, MapPin, CalendarDays, Store, LogOut, Dog, UserRound } from "lucide-react"

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

export function DashboardNav({ role, name }: { role: Role; name: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const links = role === "petshop" ? petshopLinks : tutorLinks

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card">
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
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
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
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="whitespace-nowrap">{link.label}</span>
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
