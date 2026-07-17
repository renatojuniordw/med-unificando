import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnAdminImport = nextUrl.pathname.startsWith("/admin/import")

      if (isOnAdminImport && !isLoggedIn) {
        return false
      }

      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig
