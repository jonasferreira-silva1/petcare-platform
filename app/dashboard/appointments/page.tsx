import { getSessionUser } from "@/lib/session"
import { redirect } from "next/navigation"
import { getTutorAppointments, getPetshopAppointments } from "@/app/actions/appointments"
import { TutorAppointments } from "@/components/tutor-appointments"
import { PetshopAppointments } from "@/components/petshop-appointments"

export default async function AppointmentsPage() {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in")

  if (user.role === "petshop") {
    const appointments = await getPetshopAppointments()
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Agenda</h1>
          <p className="text-sm text-muted-foreground">Agendamentos recebidos dos tutores</p>
        </div>
        <PetshopAppointments appointments={appointments} />
      </div>
    )
  }

  const appointments = await getTutorAppointments()
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Meus Agendamentos</h1>
        <p className="text-sm text-muted-foreground">Acompanhe os serviços agendados para seus pets</p>
      </div>
      <TutorAppointments appointments={appointments} />
    </div>
  )
}
