"use server"

import { db } from "@/lib/db"
import { user, appointments } from "@/lib/db/schema"
import { requireUser } from "@/lib/session"
import { eq, and, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function updateMyProfile(formData: FormData) {
  const me = await requireUser()
  const name = String(formData.get("name") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim() || null

  if (!name) throw new Error("Nome é obrigatório")

  await db
    .update(user)
    .set({ name, phone, updatedAt: new Date() })
    .where(eq(user.id, me.id))

  revalidatePath("/dashboard/profile")
}

export async function deleteMyAccount() {
  const me = await requireUser()

  // 1. Cancelar todos os agendamentos ativos do tutor
  await db
    .update(appointments)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(appointments.tutorId, me.id),
        inArray(appointments.status, ["pending", "confirmed"])
      )
    )

  // 2. Encerrar a sessão via better-auth antes de deletar o usuário
  await auth.api.signOut({ headers: await headers() })

  // 3. Deletar o usuário — ON DELETE CASCADE no banco limpa sessions e accounts
  await db.delete(user).where(eq(user.id, me.id))
}
