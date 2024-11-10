import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize (credentials) {
        try {
          const response = await fetch(`${process.env.BACKEND_URL}/api/auth/login/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            email: credentials?.email,
            password: credentials?.password 
          })
        })

        const data = await response.json()
        console.log("User data from the server", data)

        if (response.ok && data) {
          return {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            token: data.token,
          }
        }
          return null
        } catch (error) {
          console.error("Error authorizing user", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      //Send the user data to the server
      if (account?.provider === 'google') {
        console.log("Sending user data to the server")
        console.log("Account: ", account)
        console.log("Profile: ", profile)
        console.log("User: ", user)

        try {
          const response = await fetch(`${process.env.BACKEND_URL}/api/auth/google/`, {
            method: 'POST',
            body: JSON.stringify({
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              email: profile?.email,
              name: profile?.name,
              google_id: profile?.sub,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            console.log("User data sent to the server", data)
            return true
          }
          return false

        } catch (error) {
          console.error("Error sending user to the server", error)
        }
      }
      return true
    },
    async jwt({ token, account, profile }) {
      //Add the account and profile data to the token
      console.log("JWT callback")
      console.log("Token: ", token)
      console.log("Account: ", account)
      console.log("Profile: ", profile)
      if (account) {
        token.access_token = account.access_token
        token.refresh_token = account.refresh_token
        token.email = profile?.email
        token.name = profile?.name
      }
      return token
    },
    async session({ session, token }) {
      //Send the token to the client
      console.log("Session callback")
      console.log("Session: ", session)
      console.log("Token: ", token)
      return {
        ...session,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken
      };
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
})

export { handler as GET, handler as POST }

//TODO: On signup using google - check if the user is already in the database. If not, create a new user.
//TODO: On signin using google - check if the user is in the database. If not, redirect to signup.