import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasPermission, UserRole } from '@/lib/permissions';

interface RouteParams {
    params: {
        id: string;
    };
}

export async function GET(request: Request, { params }: RouteParams) {
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

        const leaveRequest = await prisma.leaveRequest.findUnique({
            where: { id: params.id },
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
        });

        if (!leaveRequest) {
            return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
        }

        // Check if user can view this leave request
        const canViewAllLeaveRequests = hasPermission(user.role as UserRole, 'canViewCompanyWideData');
        const isOwnRequest = leaveRequest.userId === user.id;

        if (!canViewAllLeaveRequests && !isOwnRequest) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(leaveRequest);
    } catch (error) {
        console.error('Error fetching leave request:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request, { params }: RouteParams) {
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
        const { action, reason } = body;

        const leaveRequest = await prisma.leaveRequest.findUnique({
            where: { id: params.id },
            include: {
                user: true,
            },
        });

        if (!leaveRequest) {
            return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
        }

        // Handle different actions
        if (action === 'approve' || action === 'reject') {
            // Only admins and managers can approve/reject requests
            const canApproveLeaveRequests = hasPermission(user.role as UserRole, 'canViewCompanyWideData');

            if (!canApproveLeaveRequests) {
                return NextResponse.json({ error: 'Insufficient permissions to approve/reject leave requests' }, { status: 403 });
            }

            // Cannot approve/reject own requests
            if (leaveRequest.userId === user.id) {
                return NextResponse.json({ error: 'You cannot approve/reject your own leave request' }, { status: 400 });
            }

            // Can only approve/reject pending requests
            if (leaveRequest.status !== 'PENDING') {
                return NextResponse.json({ error: 'Leave request is not pending' }, { status: 400 });
            }

            const updateData = {
                status: action === 'approve' ? ('APPROVED' as const) : ('REJECTED' as const),
                approvedBy: user.id,
                ...(action === 'approve'
                    ? { approvedAt: new Date() }
                    : { rejectedAt: new Date() }
                ),
            };

            const updatedLeaveRequest = await prisma.leaveRequest.update({
                where: { id: params.id },
                data: updateData,
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
            });

            // TODO: Send notification to the employee
            // await sendLeaveRequestStatusNotification(updatedLeaveRequest);

            return NextResponse.json(updatedLeaveRequest);
        }

        else if (action === 'cancel') {
            // Only the owner can cancel their own request
            if (leaveRequest.userId !== user.id) {
                return NextResponse.json({ error: 'You can only cancel your own leave requests' }, { status: 403 });
            }

            // Can only cancel pending requests
            if (leaveRequest.status !== 'PENDING') {
                return NextResponse.json({ error: 'Only pending leave requests can be cancelled' }, { status: 400 });
            }

            const updatedLeaveRequest = await prisma.leaveRequest.update({
                where: { id: params.id },
                data: {
                    status: 'CANCELLED' as const,
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
                    approver: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            return NextResponse.json(updatedLeaveRequest);
        }

        else if (action === 'update') {
            // Only the owner can update their own request
            if (leaveRequest.userId !== user.id) {
                return NextResponse.json({ error: 'You can only update your own leave requests' }, { status: 403 });
            }

            // Can only update pending requests
            if (leaveRequest.status !== 'PENDING') {
                return NextResponse.json({ error: 'Only pending leave requests can be updated' }, { status: 400 });
            }

            const {
                type,
                startDate,
                endDate,
                reason: updateReason,
                description,
                isFullDay = true,
                startTime,
                endTime
            } = body;

            // Calculate new day count if dates changed
            let dayCount = leaveRequest.dayCount;
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                const timeDiff = end.getTime() - start.getTime();
                dayCount = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
            }

            const updatedLeaveRequest = await prisma.leaveRequest.update({
                where: { id: params.id },
                data: {
                    ...(type && { type }),
                    ...(startDate && { startDate: new Date(startDate) }),
                    ...(endDate && { endDate: new Date(endDate) }),
                    ...(updateReason !== undefined && { reason: updateReason }),
                    ...(description !== undefined && { description }),
                    ...(isFullDay !== undefined && { isFullDay }),
                    ...(startTime !== undefined && { startTime: !isFullDay ? startTime : null }),
                    ...(endTime !== undefined && { endTime: !isFullDay ? endTime : null }),
                    dayCount,
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
                    approver: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            return NextResponse.json(updatedLeaveRequest);
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error updating leave request:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request, { params }: RouteParams) {
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

        const leaveRequest = await prisma.leaveRequest.findUnique({
            where: { id: params.id },
        });

        if (!leaveRequest) {
            return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
        }

        // Only the owner or admin can delete a leave request
        const canDeleteLeaveRequests = hasPermission(user.role as UserRole, 'canViewCompanyWideData');
        const isOwnRequest = leaveRequest.userId === user.id;

        if (!canDeleteLeaveRequests && !isOwnRequest) {
            return NextResponse.json({ error: 'Insufficient permissions to delete this leave request' }, { status: 403 });
        }

        // Can only delete pending or cancelled requests
        if (!['PENDING', 'CANCELLED'].includes(leaveRequest.status)) {
            return NextResponse.json({ error: 'Cannot delete approved or rejected leave requests' }, { status: 400 });
        }

        await prisma.leaveRequest.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: 'Leave request deleted successfully' });
    } catch (error) {
        console.error('Error deleting leave request:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 