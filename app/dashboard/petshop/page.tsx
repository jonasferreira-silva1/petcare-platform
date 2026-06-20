import { getMyPetshop, getMyServices } from "@/app/actions/petshops"
import { getSessionUser } from "@/lib/session"
import { redirect } from "next/navigation"
import { PetshopManager } from "@/components/petshop-manager"

export default async function PetshopPage() {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in")
  if (user.role !== "petshop") redirect("/dashboard/pets")

  const [shop, services] = await Promise.all([getMyPetshop(), getMyServices()])
  return <PetshopManager shop={shop} services={services} />
}
