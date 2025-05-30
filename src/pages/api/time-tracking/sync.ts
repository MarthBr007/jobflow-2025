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

        const { entries } = req.body;

        if (!entries || !Array.isArray(entries)) {
            return res.status(400).json({ error: 'Entries array required' });
        }

        const results = [];

        for (const entry of entries) {
            try {
                const { action, projectId, timestamp, description } = entry;

                if (action === 'START') {
                    // Create new time entry
                    const timeEntry = await prisma.timeEntry.create({
                        data: {
                            userId,
                            projectId: projectId || null,
                            startTime: new Date(timestamp),
                            description: description || 'Offline entry',
                            approved: false,
                        },
                    });

                    // Update user status
                    await prisma.user.update({
                        where: { id: userId },
                        data: {
                            status: 'WORKING',
                            lastClockIn: new Date(timestamp),
                        },
                    });

                    results.push({
                        success: true,
                        entryId: entry.id,
                        timeEntryId: timeEntry.id,
                        action: 'START',
                    });

                } else if (action === 'END') {
                    // Find the most recent unfinished time entry
                    const openTimeEntry = await prisma.timeEntry.findFirst({
                        where: {
                            userId,
                            endTime: null,
                        },
                        orderBy: {
                            startTime: 'desc',
                        },
                    });

                    if (openTimeEntry) {
                        await prisma.timeEntry.update({
                            where: { id: openTimeEntry.id },
                            data: {
                                endTime: new Date(timestamp),
                            },
                        });

                        // Update user status
                        await prisma.user.update({
                            where: { id: userId },
                            data: {
                                status: 'AVAILABLE',
                                lastClockOut: new Date(timestamp),
                            },
                        });

                        results.push({
                            success: true,
                            entryId: entry.id,
                            timeEntryId: openTimeEntry.id,
                            action: 'END',
                        });
                    } else {
                        results.push({
                            success: false,
                            entryId: entry.id,
                            error: 'No open time entry found',
                        });
                    }
                }

            } catch (error) {
                console.error('Error syncing entry:', entry, error);
                results.push({
                    success: false,
                    entryId: entry.id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        res.status(200).json({
            success: true,
            synced: successful,
            failed: failed,
            results: results,
        });

    } catch (error) {
        console.error('Error syncing time entries:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
} 