'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState(false)
  const router = useRouter()

  const handleMicrosoftSignIn = async () => {
    setIsOAuthLoading(true)
    setError('')
    
    try {
      const result = await signIn('microsoft', {
        callbackUrl: '/dashboard',
        redirect: false
      })
      
      if (result?.error) {
        setError('Microsoft sign-in failed. Please try again.')
      } else if (result?.url) {
        window.location.href = result.url
      }
    } catch (error) {
      setError('Something went wrong with Microsoft sign-in.')
    } finally {
      setIsOAuthLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Call our working login endpoint
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        })
      })

      const result = await response.json()

      if (result.success) {
        // Successful login - redirect based on user role
        if (result.user.isAdmin) {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      } else {
        setError(result.error || 'Login failed')
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Microsoft OAuth Sign In */}
          <Button
            type="button"
            variant="outline"
            onClick={handleMicrosoftSignIn}
            disabled={isOAuthLoading || isLoading}
            className="w-full"
          >
            {isOAuthLoading ? (
              'Signing in with Microsoft...'
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                  <rect x="12" y="1" width="9" height="9" fill="#00a4ef"/>
                  <rect x="1" y="12" width="9" height="9" fill="#00dd67"/>
                  <rect x="12" y="12" width="9" height="9" fill="#ffb900"/>
                </svg>
                Continue with Microsoft
              </>
            )}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>
        </div>

        <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-destructive text-sm text-center">{error}</div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link 
              href="/signup" 
              className="text-primary hover:underline"
            >
              Sign up
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}