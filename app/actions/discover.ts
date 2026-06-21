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
  ownerUserId: string | null  // null = pet shop do OSM, não cadastrado no PetCare
  distanceKm: number | null
  source: "petcare" | "osm"   // origem do dado
}

// Calcula distância em km entre dois pontos (Haversine client-side)
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Busca pet shops cadastrados no PetCare, ordenados por distância via Haversine no SQL.
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
    return rows.map((r) => ({
      ...r,
      distanceKm: r.distanceKm == null ? null : Number(r.distanceKm),
      source: "petcare" as const,
    }))
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
  return rows.map((r) => ({ ...r, distanceKm: null, source: "petcare" as const }))
}

// Busca pet shops reais do OpenStreetMap via Overpass API num raio de 5km.
// Em caso de erro (timeout, rate limit), retorna array vazio silenciosamente.
export async function getRealPetshops(lat: number, lng: number): Promise<NearbyPetshop[]> {
  await requireUser()

  const radius = 5000 // 5km
  const query = `[out:json][timeout:10];(node["shop"="pet"](around:${radius},${lat},${lng});node["amenity"="veterinary"](around:${radius},${lat},${lng}););out;`

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
      headers: { "Content-Type": "text/plain" },
      // timeout de 12s para não bloquear o carregamento
      signal: AbortSignal.timeout(12000),
    })

    if (!res.ok) return []

    const data = await res.json()
    const elements: Array<{
      id: number
      lat: number
      lon: number
      tags?: { name?: string; "addr:street"?: string; "addr:city"?: string; phone?: string }
    }> = data.elements ?? []

    return elements
      .filter((el) => el.tags?.name) // ignora sem nome
      .map((el, idx) => ({
        id: -(el.id),            // ID negativo para não colidir com IDs do PetCare
        name: el.tags!.name!,
        description: null,
        address: el.tags?.["addr:street"] ?? "Endereço não disponível",
        city: el.tags?.["addr:city"] ?? null,
        phone: el.tags?.phone ?? null,
        lat: el.lat,
        lng: el.lon,
        ownerUserId: null,         // não cadastrado no PetCare
        distanceKm: haversineKm(lat, lng, el.lat, el.lon),
        source: "osm" as const,
      }))
  } catch {
    // Falha silenciosa — Overpass pode ter timeout ou rate limit
    return []
  }
}

// Mescla pet shops do PetCare e do OSM, removendo duplicatas por proximidade.
// Se um do OSM está a menos de 80m de um do PetCare, mantém só o do PetCare.
export async function getMergedPetshops(lat?: number, lng?: number): Promise<NearbyPetshop[]> {
  const petcareShops = await getNearbyPetshops(lat, lng)

  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return petcareShops
  }

  const osmShops = await getRealPetshops(lat, lng)

  // Remove do OSM qualquer shop que esteja a menos de 80m de um do PetCare
  const deduped = osmShops.filter((osm) =>
    petcareShops.every((pc) => haversineKm(osm.lat, osm.lng, pc.lat, pc.lng) * 1000 > 80)
  )

  // Mescla e ordena por distância
  const all = [...petcareShops, ...deduped]
  all.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
  return all
}

export async function getPetshopServices(petshopId: number) {
  await requireUser()
  return db
    .select()
    .from(services)
    .where(and(eq(services.petshopId, petshopId), eq(services.active, true)))
}
