'use client';
import { useState } from 'react'
import { signIn } from "next-auth/react"
import Link from 'next/link'
import { useRouter} from 'next/navigation'
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
import { Icons } from "@/components/ui/icons"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SignUpData {
  email: string
  password: string
}

export default function SignUp() {
  const router = useRouter()
  const [formData, setFormData] = useState<SignUpData>({
    email: '',
    password: ''
  })
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setIsEmailSent(false)
    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:8000/api/accounts/v1/signup", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage("User created successfully. Please check your email for verification." as any)
        setIsEmailSent(true)
        setFormData({ email: '', password: '' })
        await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })
      } else {
        setError(data.detail || Object.values(data).join(', ') as any || "Registration failed")
      }
    } catch (error) {
      console.error('Error signing up:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignin = async () => {
    setIsLoading(true)
    setError(null)
    await signIn('google', { callbackUrl: '/r/chat' })
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Enter your email below to create your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleEmailSignup}>
          <CardContent className="space-y-4">
            {successMessage && (
              <Alert variant="default" className="border-green-500 text-green-500">
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                placeholder="********"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isLoading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create account
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
              disabled={isLoading}
              onClick={handleGoogleSignin}
              className="w-full"
            >
              {isLoading ? (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Icons.google className="mr-2 h-4 w-4" />
              )}
              Google
            </Button>
          </CardFooter>
        </form>
        <div className="text-center text-sm text-muted-foreground mb-6">
          Already have an account?{" "}
          <Button variant="link" asChild className="px-2 text-sm underline-offset-4 hover:underline">
            <Link href="/auth/signin">
              Sign in
            </Link>
          </Button>
        </div>
      </Card>
   
    </div>
  )
}