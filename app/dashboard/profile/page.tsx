import { getSessionUser } from "@/lib/session"
import { redirect } from "next/navigation"
import { ProfileForm } from "@/components/profile-form"

export default async function ProfilePage() {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in")

  return (
    <ProfileForm
      defaultName={user.name}
      defaultPhone={user.phone ?? ""}
      userEmail={user.email}
    />
  )
}
