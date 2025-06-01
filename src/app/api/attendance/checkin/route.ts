import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { format, startOfDay } from 'date-fns';
import { TimeEntryType } from '@prisma/client';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { userId, type, status, location, notes } = body;

        if (!userId || !type || !status) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const today = new Date();
        const todayStart = startOfDay(today);

        if (type === 'in') {
            // Check if already checked in today
            const existingRecord = await prisma.timeEntry.findFirst({
                where: {
                    userId: userId,
                    startTime: {
                        gte: todayStart
                    },
                    endTime: null
                }
            });

            if (existingRecord) {
                return NextResponse.json(
                    { error: 'User already checked in today' },
                    { status: 400 }
                );
            }

            // Create new time entry for check-in
            const timeEntry = await prisma.timeEntry.create({
                data: {
                    userId: userId,
                    startTime: today,
                    description: `Checked in via Kiosk - Status: ${status}`,
                    location: location || 'Kiosk Dashboard',
                    notes: notes || `Status: ${status}`
                }
            });

            return NextResponse.json({
                success: true,
                message: 'Successfully checked in',
                timeEntry: {
                    id: timeEntry.id,
                    userId: timeEntry.userId,
                    startTime: timeEntry.startTime,
                    status: status,
                    type: 'check_in'
                }
            });

        } else if (type === 'out') {
            // Find today's check-in record
            const todayRecord = await prisma.timeEntry.findFirst({
                where: {
                    userId: userId,
                    startTime: {
                        gte: todayStart
                    },
                    endTime: null
                },
                orderBy: {
                    startTime: 'desc'
                }
            });

            if (!todayRecord) {
                return NextResponse.json(
                    { error: 'No check-in record found for today' },
                    { status: 400 }
                );
            }

            // Update time entry with check-out time
            const updatedTimeEntry = await prisma.timeEntry.update({
                where: {
                    id: todayRecord.id
                },
                data: {
                    endTime: today,
                    notes: `${todayRecord.notes || ''} | Checked out via Kiosk`,
                }
            });

            return NextResponse.json({
                success: true,
                message: 'Successfully checked out',
                timeEntry: {
                    id: updatedTimeEntry.id,
                    userId: updatedTimeEntry.userId,
                    startTime: updatedTimeEntry.startTime,
                    endTime: updatedTimeEntry.endTime,
                    status: status,
                    type: 'check_out'
                }
            });
        }

        return NextResponse.json(
            { error: 'Invalid check-in type' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Error processing check-in/out:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 