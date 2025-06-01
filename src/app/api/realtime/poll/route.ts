import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const lastPoll = request.nextUrl.searchParams.get('lastPoll');
        const since = lastPoll ? new Date(lastPoll) : new Date(Date.now() - 30000); // Last 30 seconds

        // Get new notifications
        const notifications = await prisma.systemNotification.findMany({
            where: {
                userId,
                createdAt: { gt: since },
                read: false,
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        // Get recent time tracking updates for current user
        const timeUpdates = await prisma.timeEntry.findMany({
            where: {
                userId,
                updatedAt: { gt: since },
            },
            orderBy: { updatedAt: 'desc' },
            take: 10,
        });

        return NextResponse.json({
            messages: [], // Chat messages will be handled separately
            notifications: notifications.map(notif => ({
                id: notif.id,
                title: notif.title,
                message: notif.message,
                type: notif.type,
                priority: notif.priority,
                createdAt: notif.createdAt,
                data: notif.data ? JSON.parse(notif.data) : null,
            })),
            timeUpdates: timeUpdates.map(entry => ({
                id: entry.id,
                userId: entry.userId,
                projectId: entry.projectId,
                startTime: entry.startTime,
                endTime: entry.endTime,
                updatedAt: entry.updatedAt,
                type: 'TIME_UPDATE'
            })),
            activeUsers: [], // Active users will be handled separately
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Polling API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 