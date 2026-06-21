"use server"

import { db } from "@/lib/db"
import { appointments, petshops, pets, services, user } from "@/lib/db/schema"
import { requireUser } from "@/lib/session"
import { and, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

// Tutor books an appointment.
export async function createAppointment(formData: FormData) {
  const me = await requireUser()
  if (me.role !== "tutor") throw new Error("Apenas tutores podem agendar")

  const petshopId = Number(formData.get("petshopId"))
  const petId = Number(formData.get("petId"))
  const serviceId = Number(formData.get("serviceId"))
  const scheduledAtRaw = String(formData.get("scheduledAt") ?? "")
  const notes = String(formData.get("notes") ?? "").trim() || null

  if (!petshopId || !petId || !serviceId || !scheduledAtRaw) {
    throw new Error("Preencha todos os campos do agendamento")
  }

  // Verify the pet belongs to the tutor.
  const petRows = await db
    .select()
    .from(pets)
    .where(and(eq(pets.id, petId), eq(pets.userId, me.id)))
    .limit(1)
  if (!petRows[0]) throw new Error("Pet inválido")

  // Resolve petshop owner user id.
  const shopRows = await db.select().from(petshops).where(eq(petshops.id, petshopId)).limit(1)
  const shop = shopRows[0]
  if (!shop) throw new Error("Pet shop não encontrado")

  await db.insert(appointments).values({
    tutorId: me.id,
    petshopUserId: shop.userId,
    petshopId,
    petId,
    serviceId,
    scheduledAt: new Date(scheduledAtRaw),
    notes,
    status: "pending",
  })

  revalidatePath("/dashboard/appointments")
}

// Tutor's appointments (with joined details).
export async function getTutorAppointments() {
  const me = await requireUser()
  return db
    .select({
      id: appointments.id,
      scheduledAt: appointments.scheduledAt,
      status: appointments.status,
      notes: appointments.notes,
      // Retorna a observação inserida pelo pet shop para exibir ao tutor
      petshopNotes: appointments.petshopNotes,
      petName: pets.name,
      serviceName: services.name,
      petshopName: petshops.name,
      petshopAddress: petshops.address,
    })
    .from(appointments)
    .leftJoin(pets, eq(appointments.petId, pets.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(petshops, eq(appointments.petshopId, petshops.id))
    .where(eq(appointments.tutorId, me.id))
    .orderBy(desc(appointments.scheduledAt))
}

// Pet shop's incoming appointments.
export async function getPetshopAppointments() {
  const me = await requireUser()
  return db
    .select({
      id: appointments.id,
      scheduledAt: appointments.scheduledAt,
      status: appointments.status,
      notes: appointments.notes,
      // Retorna a observação inserida pelo próprio pet shop para exibição no painel
      petshopNotes: appointments.petshopNotes,
      petName: pets.name,
      petSpecies: pets.species,
      serviceName: services.name,
      tutorName: user.name,
      tutorPhone: user.phone,
    })
    .from(appointments)
    .leftJoin(pets, eq(appointments.petId, pets.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(user, eq(appointments.tutorId, user.id))
    .where(eq(appointments.petshopUserId, me.id))
    .orderBy(desc(appointments.scheduledAt))
}

// Atualiza o status do agendamento, aceitando opcionalmente uma observação do pet shop
export async function updateAppointmentStatus(
  id: number,
  status: "confirmed" | "cancelled" | "completed",
  petshopNotes?: string
) {
  const me = await requireUser()

  // Prepara o objeto com os campos que serão atualizados no banco de dados
  const updateFields: { status: string; petshopNotes?: string | null } = { status }

  // Se o parâmetro petshopNotes for fornecido, grava o valor tratado (removendo espaços) ou nulo
  if (petshopNotes !== undefined) {
    updateFields.petshopNotes = petshopNotes.trim() || null
  }

  await db
    .update(appointments)
    .set(updateFields)
    .where(and(eq(appointments.id, id), eq(appointments.petshopUserId, me.id)))
  revalidatePath("/dashboard/appointments")
}

// Tutor cancels their own appointment.
export async function cancelMyAppointment(id: number) {
  const me = await requireUser()
  await db
    .update(appointments)
    .set({ status: "cancelled" })
    .where(and(eq(appointments.id, id), eq(appointments.tutorId, me.id)))
  revalidatePath("/dashboard/appointments")
}
