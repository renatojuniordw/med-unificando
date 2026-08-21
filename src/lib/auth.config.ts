import type { NextAuthConfig } from "next-auth"

const SESSION_MAX_AGE = 24 * 60 * 60 // 24 hours

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
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE,
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  trustHost: true,
} satisfies NextAuthConfig
