"use client"

import { useState, useTransition } from "react"
import { cancelMyAppointment } from "@/app/actions/appointments"
import { getMessages, type Message } from "@/app/actions/messages"
import { getMyReviewForAppointment } from "@/app/actions/reviews"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CalendarDays, MapPin, PawPrint, Scissors, MessageSquare, Star } from "lucide-react"
import { toast } from "sonner"
import { statusLabel, statusVariant } from "@/lib/appointment-status"
import { AppointmentChat } from "@/components/appointment-chat"
import { ReviewForm } from "@/components/review-form"

export type TutorAppointment = {
  id: number
  scheduledAt: Date
  status: string
  notes: string | null
  petshopNotes: string | null
  petName: string | null
  serviceName: string | null
  petshopName: string | null
  petshopAddress: string | null
}

export function TutorAppointments({
  appointments,
  currentUserId,
  unreadCounts = {},
}: {
  appointments: TutorAppointment[]
  currentUserId: string
  unreadCounts?: Record<number, number>
}) {
  const [isPending, startTransition] = useTransition()

  // Chat state
  const [chatAppointmentId, setChatAppointmentId] = useState<number | null>(null)
  const [chatMessages, setChatMessages] = useState<Message[]>([])
  const [loadingChat, setLoadingChat] = useState(false)

  // Review state
  const [reviewAppointmentId, setReviewAppointmentId] = useState<number | null>(null)
  const [reviewPetshopName, setReviewPetshopName] = useState("")
  const [reviewedIds, setReviewedIds] = useState<Set<number>>(new Set())

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
        <p className="text-sm text-muted-foreground">
          Você ainda não tem agendamentos. Busque um pet shop para começar.
        </p>
      </Card>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {appointments.map((a) => (
          <Card key={a.id} className="flex flex-col gap-3 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground">{a.petshopName}</h3>
                  <Badge variant={statusVariant(a.status)}>{statusLabel(a.status)}</Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(a.scheduledAt).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
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

              {/* Ações */}
              <div className="flex items-center gap-2 shrink-0">
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
                {a.status === "completed" && !reviewedIds.has(a.id) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReviewAppointmentId(a.id)
                      setReviewPetshopName(a.petshopName ?? "Pet Shop")
                    }}
                  >
                    <Star className="h-4 w-4" />
                    <span className="ml-1.5">Avaliar</span>
                  </Button>
                )}
                {a.status !== "cancelled" && a.status !== "completed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancel(a.id)}
                    disabled={isPending}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </div>

            {/* Observação do tutor */}
            {a.notes && (
              <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                <span className="font-medium text-foreground">Sua observação:</span> {a.notes}
              </div>
            )}

            {/* Observação do pet shop em destaque */}
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
              currentRole="tutor"
              initialMessages={chatMessages}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de avaliação */}
      <Dialog
        open={reviewAppointmentId !== null}
        onOpenChange={(o) => !o && setReviewAppointmentId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avaliar atendimento</DialogTitle>
          </DialogHeader>
          {reviewAppointmentId !== null && (
            <ReviewForm
              appointmentId={reviewAppointmentId}
              petshopName={reviewPetshopName}
              onSuccess={() => {
                setReviewedIds((prev) => new Set([...prev, reviewAppointmentId!]))
                setReviewAppointmentId(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
