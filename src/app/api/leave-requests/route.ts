import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasPermission, UserRole } from '@/lib/permissions';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // If admin or manager, show all leave requests for the company
        // If employee/freelancer, show only their own requests
        const canViewAllLeaveRequests = hasPermission(user.role as UserRole, 'canViewCompanyWideData');

        const whereClause = canViewAllLeaveRequests
            ? { user: { company: user.company || '' } }
            : { userId: user.id };

        const leaveRequests = await prisma.leaveRequest.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        company: true,
                    },
                },
                approver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(leaveRequests);
    } catch (error) {
        console.error('Error fetching leave requests:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await request.json();
        const {
            type,
            startDate,
            endDate,
            reason,
            description,
            isFullDay = true,
            startTime,
            endTime
        } = body;

        // Validate required fields
        if (!type || !startDate || !endDate) {
            return NextResponse.json(
                { error: 'Type, start date, and end date are required' },
                { status: 400 }
            );
        }

        // Calculate number of days
        const start = new Date(startDate);
        const end = new Date(endDate);
        const timeDiff = end.getTime() - start.getTime();
        const dayCount = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end date

        // Validate date range
        if (start > end) {
            return NextResponse.json(
                { error: 'Start date cannot be after end date' },
                { status: 400 }
            );
        }

        // Check for overlapping requests
        const overlappingRequests = await prisma.leaveRequest.findMany({
            where: {
                userId: user.id,
                status: {
                    in: ['PENDING', 'APPROVED'] as const,
                },
                OR: [
                    {
                        AND: [
                            { startDate: { lte: end } },
                            { endDate: { gte: start } },
                        ],
                    },
                ],
            },
        });

        if (overlappingRequests.length > 0) {
            return NextResponse.json(
                { error: 'You already have a leave request for overlapping dates' },
                { status: 400 }
            );
        }

        // Create the leave request
        const leaveRequest = await prisma.leaveRequest.create({
            data: {
                userId: user.id,
                type,
                startDate: start,
                endDate: end,
                reason,
                description,
                isFullDay,
                startTime: !isFullDay ? startTime : null,
                endTime: !isFullDay ? endTime : null,
                dayCount,
                status: 'PENDING' as const,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        company: true,
                    },
                },
            },
        });

        // TODO: Send notification to managers/admins
        // await sendLeaveRequestNotification(leaveRequest);

        return NextResponse.json(leaveRequest, { status: 201 });
    } catch (error) {
        console.error('Error creating leave request:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 