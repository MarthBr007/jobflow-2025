import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { type, data } = await request.json();

        // Handle different types of real-time updates
        switch (type) {
            case 'CHAT_MESSAGE':
                // Chat messages are handled by the chat API
                return NextResponse.json({ success: true, message: 'Chat message handled by chat API' });

            case 'TIME_UPDATE':
                // Time updates are handled by the time tracking API
                return NextResponse.json({ success: true, message: 'Time update handled by time tracking API' });

            case 'USER_STATUS':
                // Update user status - just acknowledge the request
                return NextResponse.json({ success: true, message: 'User status updated' });

            case 'NOTIFICATION':
                // Create a new notification
                await prisma.systemNotification.create({
                    data: {
                        userId: data.userId || session.user.id,
                        type: data.notificationType || 'GENERAL',
                        title: data.title,
                        message: data.message,
                        priority: data.priority || 'NORMAL',
                        data: data.additionalData ? JSON.stringify(data.additionalData) : null,
                    }
                });
                return NextResponse.json({ success: true, message: 'Notification created' });

            default:
                return NextResponse.json({ error: 'Unknown message type' }, { status: 400 });
        }

    } catch (error) {
        console.error('Send API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 