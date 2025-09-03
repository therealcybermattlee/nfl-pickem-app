'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (session) {
      if (session.user.isAdmin) {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
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

  if (session) {
    return null // Redirecting
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold mb-4">
              NFL Pick&apos;em
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Make your weekly NFL picks and compete with friends and family!
            </p>
          </div>
          
          <div className="flex gap-4">
            <Button asChild size="lg">
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mt-16">
            <Card>
              <CardHeader>
                <CardTitle>Make Picks</CardTitle>
                <CardDescription>
                  Choose winners for each week's NFL games before kickoff
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Compete</CardTitle>
                <CardDescription>
                  Join pools with friends and family to see who knows football best
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Track Progress</CardTitle>
                <CardDescription>
                  Follow real-time scoring and season-long leaderboards
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}