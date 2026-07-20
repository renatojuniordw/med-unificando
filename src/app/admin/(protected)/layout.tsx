import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/admin/login")
  }

  return (
    <section className="py-12 bg-[var(--color-bg)] min-h-[80vh]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">{children}</div>
    </section>
  )
}
