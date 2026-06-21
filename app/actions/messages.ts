"use server"

import { db } from "@/lib/db"
import { messages, appointments } from "@/lib/db/schema"
import { requireUser } from "@/lib/session"
import { and, asc, eq, isNull, ne } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { createNotification } from "@/app/actions/notifications"

export type Message = {
  id: number
  appointmentId: number
  senderId: string
  senderRole: string
  content: string
  createdAt: Date
  readAt: Date | null
}

// Verifica que o usuário autenticado é tutor ou petshop do agendamento.
async function assertAccess(appointmentId: number, userId: string) {
  const apt = await db
    .select({ tutorId: appointments.tutorId, petshopUserId: appointments.petshopUserId })
    .from(appointments)
    .where(eq(appointments.id, appointmentId))
    .limit(1)

  if (!apt[0]) throw new Error("Agendamento não encontrado")
  const { tutorId, petshopUserId } = apt[0]
  if (userId !== tutorId && userId !== petshopUserId) throw new Error("Acesso negado")
  return apt[0]
}

// Envia uma mensagem vinculada a um agendamento.
export async function sendMessage(appointmentId: number, content: string): Promise<void> {
  const me = await requireUser()
  const trimmed = content.trim()
  if (!trimmed) throw new Error("Mensagem não pode ser vazia")

  const apt = await assertAccess(appointmentId, me.id)

  await db.insert(messages).values({
    appointmentId,
    senderId: me.id,
    senderRole: me.role,
    content: trimmed,
  })

  // Notifica o outro lado sobre a nova mensagem
  const recipientId = me.id === apt.tutorId ? apt.petshopUserId : apt.tutorId
  await createNotification(
    recipientId,
    "new_message",
    `Nova mensagem de ${me.role === "tutor" ? "tutor" : "pet shop"}`,
    appointmentId
  ).catch(() => {})

  revalidatePath("/dashboard/appointments")
}

// Retorna o histórico de mensagens de um agendamento em ordem cronológica.
export async function getMessages(appointmentId: number): Promise<Message[]> {
  const me = await requireUser()
  await assertAccess(appointmentId, me.id)

  return db
    .select()
    .from(messages)
    .where(eq(messages.appointmentId, appointmentId))
    .orderBy(asc(messages.createdAt))
}

// Marca como lidas todas as mensagens enviadas pelo outro lado que ainda não foram lidas.
export async function markMessagesAsRead(appointmentId: number): Promise<void> {
  const me = await requireUser()
  await assertAccess(appointmentId, me.id)

  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(messages.appointmentId, appointmentId),
        ne(messages.senderId, me.id), // só mensagens do OUTRO lado
        isNull(messages.readAt)        // que ainda não foram lidas
      )
    )

  revalidatePath("/dashboard/appointments")
}

// Retorna a contagem de mensagens não lidas enviadas pelo outro lado.
export async function getUnreadCount(appointmentId: number): Promise<number> {
  const me = await requireUser()
  await assertAccess(appointmentId, me.id)

  const rows = await db
    .select({ id: messages.id })
    .from(messages)
    .where(
      and(
        eq(messages.appointmentId, appointmentId),
        ne(messages.senderId, me.id),
        isNull(messages.readAt)
      )
    )

  return rows.length
}

// Retorna um mapa { appointmentId: unreadCount } para todos os agendamentos do usuário.
// Usado na página de appointments para mostrar badges sem N queries.
export async function getUnreadCountsForUser(): Promise<Record<number, number>> {
  const me = await requireUser()

  // Busca todas as mensagens não lidas onde o sender é outro usuário
  // e o agendamento pertence ao usuário autenticado
  const rows = await db
    .select({
      appointmentId: messages.appointmentId,
      id: messages.id,
    })
    .from(messages)
    .innerJoin(
      appointments,
      eq(messages.appointmentId, appointments.id)
    )
    .where(
      and(
        ne(messages.senderId, me.id),
        isNull(messages.readAt),
        // filtra apenas agendamentos do usuário autenticado
        me.role === "tutor"
          ? eq(appointments.tutorId, me.id)
          : eq(appointments.petshopUserId, me.id)
      )
    )

  // Agrupa por appointmentId
  const counts: Record<number, number> = {}
  for (const row of rows) {
    counts[row.appointmentId] = (counts[row.appointmentId] ?? 0) + 1
  }
  return counts
}
