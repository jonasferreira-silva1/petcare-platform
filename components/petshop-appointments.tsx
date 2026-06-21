"use client"

import { useState, useTransition } from "react"
import { updateAppointmentStatus } from "@/app/actions/appointments"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, PawPrint, Scissors, Phone, Check, X } from "lucide-react"
import { toast } from "sonner"
import { statusLabel, statusVariant } from "@/lib/appointment-status"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export type ShopAppointment = {
  id: number
  scheduledAt: Date
  status: string
  notes: string | null
  // Observação inserida pelo próprio pet shop para o tutor
  petshopNotes: string | null
  petName: string | null
  petSpecies: string | null
  serviceName: string | null
  tutorName: string | null
  tutorPhone: string | null
}

export function PetshopAppointments({ appointments }: { appointments: ShopAppointment[] }) {
  const [isPending, startTransition] = useTransition()
  
  // Estado para armazenar qual agendamento está sendo confirmado/concluído e abrir o Dialog correspondente
  const [actionConfig, setActionConfig] = useState<{
    id: number
    status: "confirmed" | "completed"
    title: string
    description: string
  } | null>(null)
  
  // Estado local para a observação que será inserida
  const [noteText, setNoteText] = useState("")

  // Função para chamar a action e atualizar o status do agendamento com a observação (se houver)
  const update = (id: number, status: "confirmed" | "cancelled" | "completed", petshopNotes?: string) => {
    startTransition(async () => {
      try {
        await updateAppointmentStatus(id, status, petshopNotes)
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

          {/* Exibe a observação inserida pelo tutor ao fazer o agendamento */}
          {a.notes && (
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <span className="font-semibold text-foreground">Observação do tutor:</span>{" "}
              <span className="text-muted-foreground">{a.notes}</span>
            </div>
          )}

          {/* Exibe a observação inserida pelo pet shop, se existir */}
          {a.petshopNotes && (
            <div className="rounded-md bg-primary/5 border border-primary/10 p-3 text-sm">
              <span className="font-semibold text-primary">Sua observação:</span>{" "}
              <span className="text-muted-foreground">{a.petshopNotes}</span>
            </div>
          )}

          {a.status === "pending" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setNoteText(a.petshopNotes ?? "")
                  setActionConfig({
                    id: a.id,
                    status: "confirmed",
                    title: "Confirmar Agendamento",
                    description: "Se desejar, adicione alguma instrução ou observação para o tutor antes de confirmar.",
                  })
                }}
                disabled={isPending}
              >
                <Check className="h-4 w-4" />
                <span className="ml-1">Confirmar</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => update(a.id, "cancelled")}
                disabled={isPending}
              >
                <X className="h-4 w-4" />
                <span className="ml-1">Recusar</span>
              </Button>
            </div>
          )}
          {a.status === "confirmed" && (
            <div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setNoteText(a.petshopNotes ?? "")
                  setActionConfig({
                    id: a.id,
                    status: "completed",
                    title: "Concluir Agendamento",
                    description: "Adicione alguma observação final sobre o atendimento realizado (opcional).",
                  })
                }}
                disabled={isPending}
              >
                Marcar como concluído
              </Button>
            </div>
          )}
        </Card>
      ))}

      {/* Dialog para inserção de observação ao Confirmar ou Concluir agendamento */}
      <Dialog open={actionConfig !== null} onOpenChange={(open) => !open && setActionConfig(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionConfig?.title}</DialogTitle>
            <DialogDescription>{actionConfig?.description}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Label htmlFor="petshop-notes" className="text-foreground font-medium">
              Observação para o tutor (opcional)
            </Label>
            <Textarea
              id="petshop-notes"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="ex: traga carteira de vacinação"
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setActionConfig(null)
                setNoteText("")
              }}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (actionConfig) {
                  update(actionConfig.id, actionConfig.status, noteText)
                  setActionConfig(null)
                  setNoteText("")
                }
              }}
              disabled={isPending}
            >
              {isPending ? "Processando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
