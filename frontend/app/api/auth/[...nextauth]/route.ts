import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import axios from 'axios'


const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        try {
          console.log('Attempting login with:', credentials.email)
          
          const response = await fetch('http://localhost:8000/api/accounts/v1/login/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password
            })
          })

          const data = await response.json()
          console.log('Login response:', data)

          return {
            id: credentials.email,
            email: credentials.email,
            name: credentials.email,
            ...data
          }
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error('Login failed:', error.response?.data || error.message)
            return null
          }
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: true,
})

export { handler as GET, handler as POST }