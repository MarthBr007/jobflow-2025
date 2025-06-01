import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // Count total users
        const totalUsers = await prisma.user.count();

        // Get a sample of users
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                company: true,
                archived: true,
                createdAt: true
            },
            take: 10,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            totalUsers,
            sampleUsers: users,
            message: `Found ${totalUsers} users in database`
        });
    } catch (error) {
        console.error('Debug users error:', error);
        return NextResponse.json(
            { error: 'Database error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 