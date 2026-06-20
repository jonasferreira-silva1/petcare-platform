"use client"

import { useTransition } from "react"
import { updateAppointmentStatus } from "@/app/actions/appointments"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, PawPrint, Scissors, Phone, Check, X } from "lucide-react"
import { toast } from "sonner"
import { statusLabel, statusVariant } from "@/lib/appointment-status"

export type ShopAppointment = {
  id: number
  scheduledAt: Date
  status: string
  notes: string | null
  petName: string | null
  petSpecies: string | null
  serviceName: string | null
  tutorName: string | null
  tutorPhone: string | null
}

export function PetshopAppointments({ appointments }: { appointments: ShopAppointment[] }) {
  const [isPending, startTransition] = useTransition()

  const update = (id: number, status: "confirmed" | "cancelled" | "completed") => {
    startTransition(async () => {
      try {
        await updateAppointmentStatus(id, status)
        toast.success("Agendamento atualizado")
      } catch {
        toast.error("Erro ao atualizar")
      }
    })
  }

  if (appointments.length === 0) {
    return (
      <Card className="py-16 text-center">
        <p className="text-sm text-muted-foreground">Nenhum agendamento recebido ainda.</p>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {appointments.map((a) => (
        <Card key={a.id} className="flex flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground">{a.tutorName}</h3>
              <Badge variant={statusVariant(a.status)}>{statusLabel(a.status)}</Badge>
            </div>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              {new Date(a.scheduledAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <PawPrint className="h-3.5 w-3.5" />
              {a.petName} {a.petSpecies ? `(${a.petSpecies})` : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <Scissors className="h-3.5 w-3.5" />
              {a.serviceName}
            </span>
            {a.tutorPhone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {a.tutorPhone}
              </span>
            )}
          </div>

          {a.status === "pending" && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => update(a.id, "confirmed")} disabled={isPending}>
                <Check className="h-4 w-4" />
                <span className="ml-1">Confirmar</span>
              </Button>
              <Button size="sm" variant="outline" onClick={() => update(a.id, "cancelled")} disabled={isPending}>
                <X className="h-4 w-4" />
                <span className="ml-1">Recusar</span>
              </Button>
            </div>
          )}
          {a.status === "confirmed" && (
            <div>
              <Button size="sm" variant="secondary" onClick={() => update(a.id, "completed")} disabled={isPending}>
                Marcar como concluído
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
