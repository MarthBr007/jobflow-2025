import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        console.log('🔍 Debug: Checking session...');

        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({
                session: null,
                message: 'No session found'
            });
        }

        console.log('🔍 Debug: Session found:', session.user?.email);

        // Get user from database
        let dbUser = null;
        if (session.user?.email) {
            dbUser = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    company: true,
                    archived: true,
                    status: true
                }
            });
        }

        return NextResponse.json({
            session: {
                user: session.user,
                expires: session.expires
            },
            dbUser: dbUser,
            timestamp: new Date().toISOString(),
            message: session.user?.email ? 'Session active' : 'No user in session'
        });

    } catch (error) {
        console.error('🔍 Debug session error:', error);
        return NextResponse.json({
            error: 'Failed to check session',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
} 