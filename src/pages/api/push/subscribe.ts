import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Simple user ID validation from request headers or body
        const userId = req.headers['x-user-id'] as string;

        if (!userId) {
            return res.status(401).json({ error: 'User ID required' });
        }

        const { subscription, userAgent } = req.body;

        if (!subscription) {
            return res.status(400).json({ error: 'Subscription data required' });
        }

        // Check if subscription already exists
        const existingSubscription = await prisma.pushSubscription.findFirst({
            where: {
                userId: userId,
                subscription: JSON.stringify(subscription),
            },
        });

        if (existingSubscription) {
            // Update existing subscription
            await prisma.pushSubscription.update({
                where: { id: existingSubscription.id },
                data: {
                    isActive: true,
                    userAgent: userAgent || null,
                    updatedAt: new Date(),
                },
            });
        } else {
            // Create new subscription
            await prisma.pushSubscription.create({
                data: {
                    userId: userId,
                    subscription: JSON.stringify(subscription),
                    userAgent: userAgent || null,
                    isActive: true,
                },
            });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error saving push subscription:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
} 