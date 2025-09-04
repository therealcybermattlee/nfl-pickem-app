import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import AzureADProvider from 'next-auth/providers/azure-ad'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    AzureADProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID!,
      authorization: {
        params: {
          scope: 'openid profile email User.Read',
        },
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          image: user.image,
          isAdmin: user.isAdmin
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup'
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.username = user.username
        token.isAdmin = user.isAdmin
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.username = token.username as string
        session.user.isAdmin = token.isAdmin as boolean
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // For OAuth providers, ensure user has required fields
      if (account?.provider === 'azure-ad') {
        // Generate username from email if not provided
        if (!user.username && user.email) {
          const emailUsername = user.email.split('@')[0]
          user.username = emailUsername
        }
        return true
      }
      return true
    }
  }
}