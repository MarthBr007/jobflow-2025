import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notificationManager } from '@/lib/notification-system';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user as any;
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const unreadOnly = searchParams.get('unreadOnly') === 'true';

        if (unreadOnly) {
            const notifications = await notificationManager.getUnreadNotifications(user.id, limit);
            return NextResponse.json(notifications);
        }

        // Get all notifications with stats
        const [notifications, stats] = await Promise.all([
            notificationManager.getUnreadNotifications(user.id, limit),
            notificationManager.getNotificationStats(user.id)
        ]);

        return NextResponse.json({
            notifications,
            stats
        });

    } catch (error) {
        console.error('Notifications API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action, notificationIds } = body;
        const user = session.user as any;

        switch (action) {
            case 'markRead':
                if (notificationIds && Array.isArray(notificationIds)) {
                    const result = await notificationManager.markAsRead(notificationIds, user.id);
                    return NextResponse.json({ success: true, count: result.count });
                }
                break;

            case 'markAllRead':
                const result = await notificationManager.markAllAsRead(user.id);
                return NextResponse.json({ success: true, count: result.count });

            case 'send':
                // For sending custom notifications (admin only)
                const notification = await notificationManager.sendNotification({
                    userId: body.userId || user.id,
                    type: body.type || 'SYSTEM_ALERT',
                    title: body.title,
                    message: body.message,
                    priority: body.priority || 'NORMAL'
                });
                return NextResponse.json({ success: true, notification });

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        console.error('Notifications POST API error:', error);
        return NextResponse.json(
            { error: 'Failed to process notification action' },
            { status: 500 }
        );
    }
} 