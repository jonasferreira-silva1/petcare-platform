"use server"

import { db } from "@/lib/db"
import { reviews, appointments } from "@/lib/db/schema"
import { requireUser } from "@/lib/session"
import { and, avg, count, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type Review = {
  id: number
  appointmentId: number
  tutorId: string
  petshopId: number
  rating: number
  comment: string | null
  createdAt: Date
}

export async function createReview(appointmentId: number, rating: number, comment: string) {
  const me = await requireUser()
  if (me.role !== "tutor") throw new Error("Apenas tutores podem avaliar")
  if (rating < 1 || rating > 5) throw new Error("Nota deve ser entre 1 e 5")

  // Verifica que o agendamento pertence ao tutor e está concluído
  const apt = await db
    .select({ petshopId: appointments.petshopId, status: appointments.status })
    .from(appointments)
    .where(and(eq(appointments.id, appointmentId), eq(appointments.tutorId, me.id)))
    .limit(1)

  if (!apt[0]) throw new Error("Agendamento não encontrado")
  if (apt[0].status !== "completed") throw new Error("Só é possível avaliar agendamentos concluídos")

  // unique() no banco já garante, mas damos mensagem amigável
  const existing = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(eq(reviews.appointmentId, appointmentId))
    .limit(1)

  if (existing[0]) throw new Error("Você já avaliou este atendimento")

  await db.insert(reviews).values({
    appointmentId,
    tutorId: me.id,
    petshopId: apt[0].petshopId,
    rating,
    comment: comment.trim() || null,
  })

  revalidatePath("/dashboard/appointments")
}

export async function getMyReviewForAppointment(appointmentId: number): Promise<Review | null> {
  const me = await requireUser()
  const rows = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.appointmentId, appointmentId), eq(reviews.tutorId, me.id)))
    .limit(1)
  return rows[0] ?? null
}

// Retorna lista de reviews de um pet shop com a média calculada.
export async function getPetshopReviewSummary(petshopId: number): Promise<{
  average: number
  total: number
  reviews: Review[]
}> {
  const rows = await db
    .select()
    .from(reviews)
    .where(eq(reviews.petshopId, petshopId))
    .orderBy(desc(reviews.createdAt))

  const total = rows.length
  const average = total > 0 ? rows.reduce((sum, r) => sum + r.rating, 0) / total : 0

  return { average, total, reviews: rows }
}

// Retorna só a média e total — leve, usado na listagem de pet shops.
export async function getPetshopRatings(
  petshopIds: number[]
): Promise<Record<number, { average: number; total: number }>> {
  if (petshopIds.length === 0) return {}

  const rows = await db
    .select({
      petshopId: reviews.petshopId,
      average: avg(reviews.rating),
      total: count(reviews.id),
    })
    .from(reviews)
    .where(
      petshopIds.length === 1
        ? eq(reviews.petshopId, petshopIds[0])
        : reviews.petshopId.in(petshopIds)
    )
    .groupBy(reviews.petshopId)

  const result: Record<number, { average: number; total: number }> = {}
  for (const r of rows) {
    result[r.petshopId] = {
      average: r.average ? Number(Number(r.average).toFixed(1)) : 0,
      total: Number(r.total),
    }
  }
  return result
}
