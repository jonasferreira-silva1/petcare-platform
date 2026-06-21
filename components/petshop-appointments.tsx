"use client"

import { useState, useTransition } from "react"
import { updateAppointmentStatus } from "@/app/actions/appointments"
import { getMessages, type Message } from "@/app/actions/messages"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CalendarDays, PawPrint, Scissors, Phone, Check, X, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { statusLabel, statusVariant } from "@/lib/appointment-status"
import { AppointmentChat } from "@/components/appointment-chat"

export type ShopAppointment = {
  id: number
  scheduledAt: Date
  status: string
  notes: string | null
  petshopNotes: string | null
  petName: string | null
  petSpecies: string | null
  serviceName: string | null
  tutorName: string | null
  tutorPhone: string | null
}

export function PetshopAppointments({
  appointments,
  currentUserId,
  unreadCounts = {},
}: {
  appointments: ShopAppointment[]
  currentUserId: string
  unreadCounts?: Record<number, number>
}) {
  const [isPending, startTransition] = useTransition()

  // Confirmação/conclusão com nota
  const [actionConfig, setActionConfig] = useState<{
    id: number
    status: "confirmed" | "completed"
    title: string
    description: string
  } | null>(null)
  const [noteText, setNoteText] = useState("")

  // Chat state
  const [chatAppointmentId, setChatAppointmentId] = useState<number | null>(null)
  const [chatMessages, setChatMessages] = useState<Message[]>([])
  const [loadingChat, setLoadingChat] = useState(false)

  const update = (
    id: number,
    status: "confirmed" | "cancelled" | "completed",
    petshopNotes?: string
  ) => {
    startTransition(async () => {
      try {
        await updateAppointmentStatus(id, status, petshopNotes)
        toast.success("Agendamento atualizado")
      } catch {
        toast.error("Erro ao atualizar")
      }
    })
  }

  const openChat = async (appointmentId: number) => {
    setLoadingChat(true)
    try {
      const msgs = await getMessages(appointmentId)
      setChatMessages(msgs)
      setChatAppointmentId(appointmentId)
    } catch {
      toast.error("Erro ao carregar mensagens")
    } finally {
      setLoadingChat(false)
    }
  }

  if (appointments.length === 0) {
    return (
      <Card className="py-16 text-center">
        <p className="text-sm text-muted-foreground">Nenhum agendamento recebido ainda.</p>
      </Card>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {appointments.map((a) => (
          <Card key={a.id} className="flex flex-col gap-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground">{a.tutorName}</h3>
                <Badge variant={statusVariant(a.status)}>{statusLabel(a.status)}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openChat(a.id)}
                  disabled={loadingChat}
                  className="relative"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="ml-1.5">Mensagens</span>
                  {(unreadCounts[a.id] ?? 0) > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white leading-none">
                      {unreadCounts[a.id]}
                    </span>
                  )}
                </Button>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(a.scheduledAt).toLocaleString("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </div>
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

            {a.notes && (
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <span className="font-semibold text-foreground">Observação do tutor:</span>{" "}
                <span className="text-muted-foreground">{a.notes}</span>
              </div>
            )}

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
                      description: "Adicione uma instrução para o tutor antes de confirmar (opcional).",
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
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setNoteText(a.petshopNotes ?? "")
                  setActionConfig({
                    id: a.id,
                    status: "completed",
                    title: "Concluir Agendamento",
                    description: "Adicione uma observação final sobre o atendimento (opcional).",
                  })
                }}
                disabled={isPending}
              >
                Marcar como concluído
              </Button>
            )}
          </Card>
        ))}
      </div>

      {/* Dialog confirmação/conclusão com nota */}
      <Dialog open={actionConfig !== null} onOpenChange={(o) => !o && setActionConfig(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionConfig?.title}</DialogTitle>
            <DialogDescription>{actionConfig?.description}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Label htmlFor="petshop-notes" className="font-medium">
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
            <Button variant="outline" onClick={() => { setActionConfig(null); setNoteText("") }} disabled={isPending}>
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

      {/* Dialog de chat */}
      <Dialog
        open={chatAppointmentId !== null}
        onOpenChange={(o) => !o && setChatAppointmentId(null)}
      >
        <DialogContent className="p-0 gap-0 max-w-lg">
          <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
            <DialogTitle>Mensagens</DialogTitle>
          </DialogHeader>
          {chatAppointmentId !== null && (
            <AppointmentChat
              appointmentId={chatAppointmentId}
              currentUserId={currentUserId}
              currentRole="petshop"
              initialMessages={chatMessages}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
