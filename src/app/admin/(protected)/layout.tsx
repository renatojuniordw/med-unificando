import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/auth-guard"

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user || !isAdmin(session)) {
    redirect("/admin/login")
  }

  return (
    <section className="py-12 bg-[var(--color-bg)] min-h-[80vh]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">{children}</div>
    </section>
  )
}
