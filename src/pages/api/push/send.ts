import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import * as webpush from 'web-push';

const prisma = new PrismaClient();

// Configure VAPID keys for web push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:admin@jobflow.nl',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const senderId = req.headers['x-user-id'] as string;

        if (!senderId) {
            return res.status(401).json({ error: 'User ID required' });
        }

        const { userIds, title, body, data, priority = 'normal' } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: 'User IDs array required' });
        }

        if (!title || !body) {
            return res.status(400).json({ error: 'Title and body required' });
        }

        // Get push subscriptions for target users
        const subscriptions = await prisma.pushSubscription.findMany({
            where: {
                userId: { in: userIds },
                isActive: true,
            },
            include: {
                user: {
                    select: { id: true, name: true },
                },
            },
        });

        if (subscriptions.length === 0) {
            return res.status(404).json({ error: 'No active subscriptions found' });
        }

        // Create notification payload
        const payload = {
            title,
            body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge.png',
            data: {
                ...data,
                timestamp: new Date().toISOString(),
            },
            actions: [
                {
                    action: 'open',
                    title: 'Open JobFlow',
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss',
                },
            ],
        };

        // Send push notifications
        const notifications = subscriptions.map(async (subscription: any) => {
            try {
                const pushSubscription = JSON.parse(subscription.subscription);

                await webpush.sendNotification(
                    pushSubscription,
                    JSON.stringify(payload)
                );

                console.log(`SUCCESS: Push notification sent to ${subscription.user.name}`);
                return { success: true, userId: subscription.userId };
            } catch (error: any) {
                console.error(`ERROR: Failed to send push notification to ${subscription.user.name}:`, error);

                // If subscription is invalid, deactivate it
                if (error?.statusCode === 410 || error?.statusCode === 404) {
                    await prisma.pushSubscription.update({
                        where: { id: subscription.id },
                        data: { isActive: false },
                    });
                }

                return { success: false, userId: subscription.userId, error: error?.message || 'Unknown error' };
            }
        });

        const results = await Promise.all(notifications);
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        // Store notification in database
        const notificationPromises = userIds.map((userId: string) =>
            prisma.systemNotification.create({
                data: {
                    userId,
                    senderId,
                    type: data?.type?.toUpperCase() || 'SYSTEM_ALERT',
                    title,
                    message: body,
                    priority: priority.toUpperCase(),
                    data: JSON.stringify(data || {}),
                    read: false,
                },
            })
        );

        await Promise.all(notificationPromises);

        res.status(200).json({
            success: true,
            sent: successful,
            failed: failed,
            results: results,
        });
    } catch (error) {
        console.error('Error sending push notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
} 