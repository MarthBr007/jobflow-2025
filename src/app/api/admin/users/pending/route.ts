import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        // Only admins can view pending users
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all pending users
        const pendingUsers = await prisma.user.findMany({
            where: {
                accountStatus: 'PENDING'
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                phone: true,
                address: true,
                availableDays: true,
                kvkNumber: true,
                btwNumber: true,
                iban: true,
                accountStatus: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'asc' // Oldest first
            }
        });

        return NextResponse.json({
            users: pendingUsers,
            count: pendingUsers.length
        });

    } catch (error) {
        console.error('Error fetching pending users:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 