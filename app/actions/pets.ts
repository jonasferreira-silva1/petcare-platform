"use server"

import { db } from "@/lib/db"
import { pets, appointments } from "@/lib/db/schema"
import { requireUser } from "@/lib/session"
import { and, desc, eq, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getMyPets() {
  const user = await requireUser()
  return db.select().from(pets).where(eq(pets.userId, user.id)).orderBy(desc(pets.createdAt))
}

export async function createPet(formData: FormData) {
  const user = await requireUser()
  const name = String(formData.get("name") ?? "").trim()
  const species = String(formData.get("species") ?? "").trim()
  const breed = String(formData.get("breed") ?? "").trim() || null
  const birthdate = String(formData.get("birthdate") ?? "").trim() || null
  const notes = String(formData.get("notes") ?? "").trim() || null

  if (!name || !species) throw new Error("Nome e espécie são obrigatórios")

  await db.insert(pets).values({ userId: user.id, name, species, breed, birthdate, notes })
  revalidatePath("/dashboard/pets")
}

export async function updatePet(id: number, formData: FormData) {
  const user = await requireUser()
  const name = String(formData.get("name") ?? "").trim()
  const species = String(formData.get("species") ?? "").trim()
  const breed = String(formData.get("breed") ?? "").trim() || null
  const birthdate = String(formData.get("birthdate") ?? "").trim() || null
  const notes = String(formData.get("notes") ?? "").trim() || null

  if (!name || !species) throw new Error("Nome e espécie são obrigatórios")

  await db
    .update(pets)
    .set({ name, species, breed, birthdate, notes })
    .where(and(eq(pets.id, id), eq(pets.userId, user.id)))

  revalidatePath("/dashboard/pets")
}

export async function deletePet(id: number) {
  const user = await requireUser()

  // Bloquear delete se houver agendamentos ativos vinculados ao pet
  const active = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.petId, id),
        eq(appointments.tutorId, user.id),
        inArray(appointments.status, ["pending", "confirmed"])
      )
    )
    .limit(1)

  if (active[0]) {
    throw new Error(
      "Este pet tem agendamentos ativos. Cancele-os antes de remover o pet."
    )
  }

  await db.delete(pets).where(and(eq(pets.id, id), eq(pets.userId, user.id)))
  revalidatePath("/dashboard/pets")
}
