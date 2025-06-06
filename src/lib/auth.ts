import { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import prisma from './prisma';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials): Promise<User | null> {
                console.log('NextAuth authorize called with:', { email: credentials?.email });

                if (!credentials?.email || !credentials?.password) {
                    console.log('Missing credentials');
                    return null;
                }

                try {
                    const user = await prisma.user.findUnique({
                        where: {
                            email: credentials.email,
                        },
                    });

                    console.log('Found user:', user ? 'Yes' : 'No');

                    if (!user) {
                        console.log('User not found for email:', credentials.email);
                        return null;
                    }

                    // Check if user account is approved
                    // TODO: Re-enable after database migration
                    /*
                    if (user.accountStatus !== 'APPROVED') {
                        console.log('User account not approved:', user.accountStatus);
                        // Return a specific error for account status
                        throw new Error('ACCOUNT_NOT_APPROVED');
                    }
                    */

                    const isPasswordValid = await compare(credentials.password, user.password);
                    console.log('Password valid:', isPasswordValid);

                    if (!isPasswordValid) {
                        console.log('Invalid password for user:', credentials.email);
                        return null;
                    }

                    console.log('Authentication successful for user:', user.email);
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role as "ADMIN" | "MANAGER" | "EMPLOYEE" | "FREELANCER",
                        company: user.company || '',
                    } as User;
                } catch (error) {
                    console.error('Error in authorize:', error);
                    return null;
                }
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/auth/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.company = (user as any).company;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                (session.user as any).id = token.id as string;
                (session.user as any).role = token.role as string;
                (session.user as any).company = token.company as string;
            }
            return session;
        },
    },
    debug: process.env.NODE_ENV === 'development',
}; 