"use server"

import { db } from "@/lib/db"
import { petshops, services } from "@/lib/db/schema"
import { requireUser } from "@/lib/session"
import { eq, sql, and } from "drizzle-orm"

export type NearbyPetshop = {
  id: number
  name: string
  description: string | null
  address: string
  city: string | null
  phone: string | null
  lat: number
  lng: number
  ownerUserId: string
  distanceKm: number | null
}

// Returns all pet shops, ordered by distance from the given coordinates
// when provided (Haversine formula computed in SQL).
export async function getNearbyPetshops(lat?: number, lng?: number): Promise<NearbyPetshop[]> {
  await requireUser()

  if (lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    const rows = await db
      .select({
        id: petshops.id,
        name: petshops.name,
        description: petshops.description,
        address: petshops.address,
        city: petshops.city,
        phone: petshops.phone,
        lat: petshops.lat,
        lng: petshops.lng,
        ownerUserId: petshops.userId,
        distanceKm: sql<number>`
          6371 * acos(
            least(1, greatest(-1,
              cos(radians(${lat})) * cos(radians(${petshops.lat})) *
              cos(radians(${petshops.lng}) - radians(${lng})) +
              sin(radians(${lat})) * sin(radians(${petshops.lat}))
            ))
          )
        `.as("distance_km"),
      })
      .from(petshops)
      .orderBy(sql`distance_km asc`)
    return rows.map((r) => ({ ...r, distanceKm: r.distanceKm == null ? null : Number(r.distanceKm) }))
  }

  const rows = await db
    .select({
      id: petshops.id,
      name: petshops.name,
      description: petshops.description,
      address: petshops.address,
      city: petshops.city,
      phone: petshops.phone,
      lat: petshops.lat,
      lng: petshops.lng,
      ownerUserId: petshops.userId,
    })
    .from(petshops)
  return rows.map((r) => ({ ...r, distanceKm: null }))
}

export async function getPetshopServices(petshopId: number) {
  await requireUser()
  return db
    .select()
    .from(services)
    .where(and(eq(services.petshopId, petshopId), eq(services.active, true)))
}
