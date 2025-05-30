import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";

const prisma = new PrismaClient();

declare module "next-auth" {
    interface User {
        id: string;
        role: string;
    }

    interface Session {
        user: {
            id: string;
            role: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
        }
    }
}

export default NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                console.log('Authorize called with:', { email: credentials?.email });

                if (!credentials?.email || !credentials?.password) {
                    console.log('Missing credentials');
                    return null;
                }

                try {
                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email },
                    });

                    console.log('Found user:', user ? 'Yes' : 'No');

                    if (!user) {
                        console.log('User not found');
                        return null;
                    }

                    const isValid = await compare(credentials.password, user.password);
                    console.log('Password valid:', isValid);

                    if (!isValid) {
                        console.log('Invalid password');
                        return null;
                    }

                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                    };
                } catch (error) {
                    console.error('Error in authorize:', error);
                    return null;
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/",
    },
    debug: true,
}); 