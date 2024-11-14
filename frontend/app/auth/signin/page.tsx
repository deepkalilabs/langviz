'use client';
import { useState } from 'react'
import { signIn } from "next-auth/react"
import Link from 'next/link'
import { useRouter} from 'next/navigation'

export default function SignIn() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleEmailSignin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await fetch(
        `http://localhost:8000/api/accounts/v1/login`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password
            })
        }
    )
     

      const data = await result.json()

     if (!result.ok) {
        setError(null) // Reset first
        setError(data.detail || "Invalid email or password")
      } else {
        router.push('/r/chat')
        router.refresh()
      }
    } catch (error) {
      setError("Error signing in" as any) // Type assertion to fix type error
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignin = async () => {
    setLoading(true)
    setError(null)
    await signIn('google', { callbackUrl: '/r/chat' })
  }


  return (
    <div className="flex min-h-screen items-center justify-center p-4">
    <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
      <div>
        <h2 className="text-center text-3xl font-bold">Sign In</h2>
      </div>

      <form onSubmit={handleEmailSignin} className="mt-8 space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div>

      <button
        onClick={handleGoogleSignin}
        type="button"
        className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 shadow-sm hover:bg-gray-50"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
        </svg>
        Continue with Google
      </button>

      <div className="text-center text-sm">
        <Link href="/auth/signup" className="text-blue-600 hover:text-blue-500">
          Don't have an account? Sign up
        </Link>
      </div>
    </div>
  </div>

  )
}