'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function VerifyEmail() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')


    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token')
            if (!token) {
                setStatus('error')
                setMessage('No verification token found.')
                return
            }

            try {
                const backendUrl = process.env.NEXT_PUBLIC_API_URL

                const response = await fetch(
                    `${backendUrl}/api/accounts/v1/verify-email`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ token })
                    }
                )

                const data = await response.json()

                if (response.ok) {
                    setStatus('success')
                    setMessage(data.message || 'Email verification successful!')
                    // Redirect to login after 3 seconds
                    setTimeout(() => {
                        router.push('/auth/signin')
                    }, 5000)
                } else {
                    setStatus('error')
                    setMessage(data.error || 'Verification failed')
                }
            } catch (error) {
                console.log("error", error);
                setStatus('error')
                setMessage('An error occurred during verification.')
            }
        }

        verifyEmail()
    }, [searchParams, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Email Verification
                    </h2>
                    <div className="mt-4">
                        {status === 'loading' && (
                            <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            </div>
                        )}
                        {status === 'success' && (
                            <div className="text-green-600">
                                <p>{message}</p>
                                <p className="mt-2 text-sm">Redirecting to login page...</p>
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="text-red-600">
                                <p>{message}</p>
                                <button
                                    onClick={() => router.push('/auth/signin')}
                                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800"
                                >
                                    Go to Login
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
} 