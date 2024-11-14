'use client';
import { useState, useEffect } from 'react'
import { signIn } from "next-auth/react"
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from '@/components/ui/icons';

export default function SignIn() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl')

  const handleEmailSignin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {     
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      })

      if (result?.error) {
        setError('Invalid email or password' as any)
      } else {
        router.push('/r/chat')
        router.refresh()
      }
    } catch (error) {
      setError("Error signing in" as any)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (callbackUrl) {
      router.push(callbackUrl)
    }
  }, [callbackUrl])

  const handleGoogleSignin = async () => {
    setLoading(true)
    setError(null)
    await signIn('google', { callbackUrl: '/r/chat' })
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Sign in</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to sign in to your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleEmailSignin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={loading}
              />
            </div>
            {error && (
              <div className="text-sm text-destructive">
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sign in
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              type="button"
              disabled={loading}
              className="w-full"
              onClick={handleGoogleSignin}
            >
              {loading ? (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Icons.google className="mr-2 h-4 w-4" />
              )}
              Google
            </Button>
            <div className="flex flex-col space-y-1">
              <Button variant="link" asChild className="px-0 font-normal">
                <Link href="/auth/signup">
                  Don't have an account? Sign up
                </Link>
              </Button>
              <Button variant="link" asChild className="px-0 font-normal">
                <Link href="/auth/forgot-password">
                  Forgot password? Reset here
                </Link>
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}