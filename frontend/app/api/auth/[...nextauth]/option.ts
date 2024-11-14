import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";
export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "example@example.com" },
                password: { label: "Password", type: "password", placeholder: "********" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Please enter email and password");
                }
                try {
                    console.log("Attempting login with:", credentials?.email); // Debug log
                    const { email, password } = credentials as { email: string, password: string };
                    const response = await axios.post(`http://langviz-backend:8000/api/accounts/v1/login`, { 
                        email, 
                        password 
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                        },
                    }
                    );
                    console.log("response", response)
                    
                    // Return the user data if login was successful
                    if (response.data) {
                        return response.data;
                    }
                    throw new Error("Invalid email or password");
                } catch (error) {
                    if (axios.isAxiosError(error)) {
                        throw new Error(error.response?.data?.detail || "Invalid credentials");
                    }
                    throw new Error("An error occurred during sign in");                }
            }
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.user = user;
            }
            return token;
        },
        async session({ session, token }) {
            session.user = token.user as any;
            return session;
        }
    },
    pages: {
        signIn: '/auth/login',
    },
    debug: process.env.NODE_ENV === 'development'
}