import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import axios from 'axios'

type User = {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please provide both email and password');
        }

        try {
          console.log("Attempting login with:", credentials?.email); // Debug log

          // If backend is running on local docker, use docker backend url, else use process.env.NEXT_PUBLIC_API_URL
          const backendUrl = process.env.DOCKER_BACKEND_LOCAL_URL || process.env.NEXT_PUBLIC_API_URL;
          if (!backendUrl) {
            throw new Error('Backend URL is not configured');
          }
          console.log("Using backend URL:", backendUrl); // Debug log
          const response = await axios.post(`${backendUrl}/api/accounts/v1/login`, {
            email: credentials.email,
            password: credentials.password
          });

          console.log("Login response:", response.data); // Debug log

          if (response.status === 200) {
            // Return user data AND tokens
            const user: User = {
              id: response.data.user.id.toString(),
              email: response.data.user.email,
              accessToken: response.data.token.access_token,
              refreshToken: response.data.token.refresh_token,
            };
            return user;

          }
          return null;

        } catch (error) {
          console.error("Login error:", error);
          throw new Error('Authentication failed');
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user && 'accessToken' in user && 'refreshToken' in user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.email = user.email;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.user = {
        email: token.email,
      };
      return session 
    }
  },
  // Increase session lifetime if needed
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
})

export { handler as GET, handler as POST }