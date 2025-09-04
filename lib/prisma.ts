import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // In Cloudflare Workers, we'll use D1 adapter
  if (process.env.NODE_ENV === 'production' && typeof globalThis.process === 'undefined') {
    // This will be updated to use actual D1 binding in Workers context
    return new PrismaClient()
  }
  
  // For development/local, use regular SQLite
  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Function to create Prisma client with D1 adapter for Workers
export function createPrismaClientWithD1(d1Database: any) {
  const adapter = new PrismaD1(d1Database)
  return new PrismaClient({ adapter })
}