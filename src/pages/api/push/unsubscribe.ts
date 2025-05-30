import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = req.headers['x-user-id'] as string;

        if (!userId) {
            return res.status(401).json({ error: 'User ID required' });
        }

        const { subscription } = req.body;

        if (!subscription) {
            return res.status(400).json({ error: 'Subscription data required' });
        }

        // Deactivate the subscription
        await prisma.pushSubscription.updateMany({
            where: {
                userId: userId,
                subscription: JSON.stringify(subscription),
            },
            data: {
                isActive: false,
                updatedAt: new Date(),
            },
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error unsubscribing from push notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
} 