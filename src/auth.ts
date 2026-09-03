import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

import { authConfig } from "@/lib/auth.config"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        const user = await prisma.user.findUnique({
          where: { email },
        })

        // Hash dummy para usuário inexistente: iguala o tempo de resposta
        // e evita enumeração de e-mails por timing attack.
        const DUMMY_HASH = "$2b$10$SpEez0xYWXW6vzssA.My8.TCQzYQfLsLKZ3Kc4txcxATreEebZ9Pa"
        const passwordMatches = user
          ? await bcrypt.compare(password, user.password)
          : await bcrypt.compare(password, DUMMY_HASH)

        if (!user || !passwordMatches) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as unknown as Record<string, string>).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
      }
      return session
    },
  },
})
