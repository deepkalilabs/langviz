// frontend/components/auth-status.tsx
'use client'

import { useSession, signIn, signOut } from "next-auth/react"

export default function AuthStatus() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (status === "unauthenticated") {
    return (
      <button
        onClick={() => signIn('google')}
        className="rounded-md bg-white px-4 py-2 text-black shadow-sm hover:bg-gray-100"
      >
        Sign in
      </button>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <p>Signed in as {session?.user?.email}</p>
      <button
        onClick={() => signOut()}
        className="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600"
      >
        Sign out
      </button>
    </div>
  )
}