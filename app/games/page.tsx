'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { GamesList } from '@/components/games/games-list'

export default function GamesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/signin')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <MainLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      </MainLayout>
    )
  }

  if (!session) {
    return null
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">NFL Games</h1>
            <p className="text-muted-foreground">
              View current week's games and scores
            </p>
          </div>
          
          <GamesList showPicks={true} />
        </div>
      </div>
    </MainLayout>
  )
}