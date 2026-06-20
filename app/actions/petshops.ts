"use server"

import { db } from "@/lib/db"
import { petshops, services } from "@/lib/db/schema"
import { requireUser } from "@/lib/session"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

// Get the pet shop owned by the current (petshop-role) user, if any.
export async function getMyPetshop() {
  const user = await requireUser()
  const rows = await db.select().from(petshops).where(eq(petshops.userId, user.id)).limit(1)
  return rows[0] ?? null
}

export async function upsertMyPetshop(formData: FormData) {
  const user = await requireUser()
  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim() || null
  const address = String(formData.get("address") ?? "").trim()
  const city = String(formData.get("city") ?? "").trim() || null
  const phone = String(formData.get("phone") ?? "").trim() || null
  const lat = Number(formData.get("lat"))
  const lng = Number(formData.get("lng"))

  if (!name || !address) throw new Error("Nome e endereço são obrigatórios")
  if (Number.isNaN(lat) || Number.isNaN(lng)) throw new Error("Localização inválida")

  const existing = await getMyPetshop()
  if (existing) {
    await db
      .update(petshops)
      .set({ name, description, address, city, phone, lat, lng })
      .where(and(eq(petshops.id, existing.id), eq(petshops.userId, user.id)))
  } else {
    await db.insert(petshops).values({ userId: user.id, name, description, address, city, phone, lat, lng })
  }
  revalidatePath("/dashboard/petshop")
}

// --- Services -------------------------------------------------------------

export async function getMyServices() {
  const user = await requireUser()
  return db.select().from(services).where(eq(services.userId, user.id))
}

export async function createService(formData: FormData) {
  const user = await requireUser()
  const shop = await getMyPetshop()
  if (!shop) throw new Error("Cadastre seu pet shop antes de adicionar serviços")

  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim() || null
  const price = Number(formData.get("price") ?? 0)
  const durationMin = Number(formData.get("durationMin") ?? 30)

  if (!name) throw new Error("Nome do serviço é obrigatório")

  await db.insert(services).values({
    petshopId: shop.id,
    userId: user.id,
    name,
    description,
    priceCents: Math.round((Number.isNaN(price) ? 0 : price) * 100),
    durationMin: Number.isNaN(durationMin) ? 30 : durationMin,
  })
  revalidatePath("/dashboard/petshop")
}

export async function deleteService(id: number) {
  const user = await requireUser()
  await db.delete(services).where(and(eq(services.id, id), eq(services.userId, user.id)))
  revalidatePath("/dashboard/petshop")
}
