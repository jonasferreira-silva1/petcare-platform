import { getMyPets } from "@/app/actions/pets"
import { getSessionUser } from "@/lib/session"
import { redirect } from "next/navigation"
import { DiscoverClient } from "@/components/discover-client"

export default async function DiscoverPage() {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in")
  if (user.role !== "tutor") redirect("/dashboard/petshop")

  const pets = await getMyPets()
  return <DiscoverClient pets={pets.map((p) => ({ id: p.id, name: p.name }))} />
}
