import { getMyPets } from "@/app/actions/pets"
import { getSessionUser } from "@/lib/session"
import { redirect } from "next/navigation"
import { PetsManager } from "@/components/pets-manager"

export default async function PetsPage() {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in")
  if (user.role !== "tutor") redirect("/dashboard/petshop")

  const pets = await getMyPets()
  return <PetsManager pets={pets} />
}
