import { getSessionUser } from "@/lib/session"
import { redirect } from "next/navigation"
import { getTutorAppointments, getPetshopAppointments } from "@/app/actions/appointments"
import { getUnreadCountsForUser } from "@/app/actions/messages"
import { markAllNotificationsAsRead } from "@/app/actions/notifications"
import { TutorAppointments } from "@/components/tutor-appointments"
import { PetshopAppointments } from "@/components/petshop-appointments"

export default async function AppointmentsPage() {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in")

  // Marca todas as notificações como lidas ao abrir a página de agendamentos
  await markAllNotificationsAsRead().catch(() => {})

  if (user.role === "petshop") {
    const [appointments, unreadCounts] = await Promise.all([
      getPetshopAppointments(),
      getUnreadCountsForUser(),
    ])
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Agenda</h1>
          <p className="text-sm text-muted-foreground">Agendamentos recebidos dos tutores</p>
        </div>
        <PetshopAppointments
          appointments={appointments}
          currentUserId={user.id}
          unreadCounts={unreadCounts}
        />
      </div>
    )
  }

  const [appointments, unreadCounts] = await Promise.all([
    getTutorAppointments(),
    getUnreadCountsForUser(),
  ])
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Meus Agendamentos</h1>
        <p className="text-sm text-muted-foreground">Acompanhe os serviços agendados para seus pets</p>
      </div>
      <TutorAppointments
        appointments={appointments}
        currentUserId={user.id}
        unreadCounts={unreadCounts}
      />
    </div>
  )
}
