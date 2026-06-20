import { getSessionUser } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function Home() {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in")
  if (user.role === "petshop") redirect("/dashboard/petshop")
  redirect("/dashboard/pets")
}
