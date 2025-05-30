import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasPermission, UserRole } from '@/lib/permissions';

export async function GET(request: Request) {
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

        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Default to single day if no range provided
        let whereClause: any = {};

        if (date) {
            // Single day query
            const targetDate = new Date(date);
            whereClause = {
                startDate: { lte: targetDate },
                endDate: { gte: targetDate },
                status: 'APPROVED'
            };
        } else if (startDate && endDate) {
            // Date range query  
            whereClause = {
                OR: [
                    {
                        AND: [
                            { startDate: { lte: new Date(endDate) } },
                            { endDate: { gte: new Date(startDate) } },
                        ],
                    },
                ],
                status: 'APPROVED'
            };
        } else {
            return NextResponse.json({ error: 'Date or date range required' }, { status: 400 });
        }

        // Permission check - admins/managers see all, employees see only their company
        const canViewAllLeaveRequests = hasPermission(user.role as UserRole, 'canViewCompanyWideData');

        if (canViewAllLeaveRequests) {
            whereClause.user = { company: user.company || '' };
        } else {
            // Employees can see approved leave of their colleagues for planning
            whereClause.user = { company: user.company || '' };
        }

        const leaveRequests = await prisma.leaveRequest.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        employeeType: true,
                    },
                },
            },
            orderBy: {
                startDate: 'asc',
            },
        });

        // Transform the data for schedule integration
        const leaveInfo = leaveRequests.map(leave => ({
            id: leave.id,
            userId: leave.userId,
            userName: leave.user.name,
            userEmail: leave.user.email,
            userRole: leave.user.role,
            employeeType: leave.user.employeeType,
            type: leave.type,
            startDate: leave.startDate,
            endDate: leave.endDate,
            isFullDay: leave.isFullDay,
            startTime: leave.startTime,
            endTime: leave.endTime,
            reason: leave.reason,
            description: leave.description,
            dayCount: leave.dayCount,
        }));

        return NextResponse.json(leaveInfo);
    } catch (error) {
        console.error('Error fetching leave info for schedule:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 