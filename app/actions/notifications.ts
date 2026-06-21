"use server"

import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { requireUser } from "@/lib/session"
import { and, count, desc, eq, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type Notification = {
  id: number
  userId: string
  type: string
  referenceId: number | null
  message: string
  readAt: Date | null
  createdAt: Date
}

// Cria uma notificação para um usuário (chamado internamente pelas outras actions).
export async function createNotification(
  userId: string,
  type: "new_appointment" | "status_changed" | "new_message",
  message: string,
  referenceId?: number
) {
  await db.insert(notifications).values({ userId, type, message, referenceId: referenceId ?? null })
}

// Retorna as últimas 20 notificações do usuário autenticado.
export async function getNotifications(): Promise<Notification[]> {
  const me = await requireUser()
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, me.id))
    .orderBy(desc(notifications.createdAt))
    .limit(20)
}

// Retorna a contagem de notificações não lidas.
export async function getUnreadNotificationCount(): Promise<number> {
  const me = await requireUser()
  const rows = await db
    .select({ total: count(notifications.id) })
    .from(notifications)
    .where(and(eq(notifications.userId, me.id), isNull(notifications.readAt)))
  return Number(rows[0]?.total ?? 0)
}

// Marca todas as notificações do usuário como lidas.
export async function markAllNotificationsAsRead(): Promise<void> {
  const me = await requireUser()
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, me.id), isNull(notifications.readAt)))
  revalidatePath("/dashboard")
}
