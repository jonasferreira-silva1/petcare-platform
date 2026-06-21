"use client"

import { useTransition } from "react"
import { cancelMyAppointment } from "@/app/actions/appointments"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, MapPin, PawPrint, Scissors, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { statusLabel, statusVariant } from "@/lib/appointment-status"

export type TutorAppointment = {
  id: number
  scheduledAt: Date
  status: string
  notes: string | null
  // Observação inserida pelo pet shop ao confirmar/concluir o agendamento
  petshopNotes: string | null
  petName: string | null
  serviceName: string | null
  petshopName: string | null
  petshopAddress: string | null
}

export function TutorAppointments({ appointments }: { appointments: TutorAppointment[] }) {
  const [isPending, startTransition] = useTransition()

  const handleCancel = (id: number) => {
    startTransition(async () => {
      try {
        await cancelMyAppointment(id)
        toast.success("Agendamento cancelado")
      } catch {
        toast.error("Erro ao cancelar")
      }
    })
  }

  if (appointments.length === 0) {
    return (
      <Card className="py-16 text-center">
        <p className="text-sm text-muted-foreground">Você ainda não tem agendamentos. Busque um pet shop para começar.</p>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {appointments.map((a) => (
        <Card key={a.id} className="flex flex-col gap-3 p-5">
          {/* Cabeçalho do Card: Informações básicas do agendamento e botão de ação */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground">{a.petshopName}</h3>
                <Badge variant={statusVariant(a.status)}>{statusLabel(a.status)}</Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(a.scheduledAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </span>
                <span className="flex items-center gap-1.5">
                  <PawPrint className="h-3.5 w-3.5" />
                  {a.petName}
                </span>
                <span className="flex items-center gap-1.5">
                  <Scissors className="h-3.5 w-3.5" />
                  {a.serviceName}
                </span>
                {a.petshopAddress && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {a.petshopAddress}
                  </span>
                )}
              </div>
            </div>
            {a.status !== "cancelled" && a.status !== "completed" && (
              <Button variant="outline" size="sm" onClick={() => handleCancel(a.id)} disabled={isPending}>
                Cancelar
              </Button>
            )}
          </div>

          {/* Exibe a observação que o tutor enviou ao agendar, se houver */}
          {a.notes && (
            <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
              <span className="font-medium text-foreground">Sua observação:</span> {a.notes}
            </div>
          )}

          {/* Exibe a observação do pet shop de forma destacada (fundo colorido, ícone e borda sutil) */}
          {a.petshopNotes && (
            <div className="flex items-start gap-2 rounded-lg border border-primary/10 bg-primary/5 p-3 text-sm text-foreground">
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <span className="font-semibold text-primary">Observação do pet shop:</span>{" "}
                <span className="text-muted-foreground">{a.petshopNotes}</span>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
