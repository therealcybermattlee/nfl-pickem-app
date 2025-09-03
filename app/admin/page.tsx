'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Settings, BarChart3, Shield } from 'lucide-react'

export default function Admin() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push('/signin')
      return
    }

    if (!session.user.isAdmin) {
      router.push('/dashboard')
      return
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

  if (!session || !session.user.isAdmin) {
    return null
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">
                Manage users, pools, and system settings
              </p>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <CardTitle>User Management</CardTitle>
                </div>
                <CardDescription>
                  Manage user accounts and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    View, edit, and manage user accounts.
                  </p>
                  <Button disabled size="sm">Manage Users</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <CardTitle>Pool Management</CardTitle>
                </div>
                <CardDescription>
                  Create and oversee competition pools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Create pools, manage members, and configure settings.
                  </p>
                  <Button disabled size="sm">Manage Pools</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <CardTitle>System Analytics</CardTitle>
                </div>
                <CardDescription>
                  View system statistics and reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Monitor system performance and user activity.
                  </p>
                  <Button disabled size="sm">View Analytics</Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Game Management</CardTitle>
                <CardDescription>
                  Override scores and manage game data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Manually update game scores and results when needed.
                  </p>
                  <div className="flex space-x-2">
                    <Button disabled size="sm">Update Scores</Button>
                    <Button disabled variant="outline" size="sm">Sync Games</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure application settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Manage global settings, notifications, and configurations.
                  </p>
                  <div className="flex space-x-2">
                    <Button disabled size="sm">Settings</Button>
                    <Button disabled variant="outline" size="sm">Logs</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex space-x-3">
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}