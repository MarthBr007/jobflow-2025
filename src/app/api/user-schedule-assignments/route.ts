import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasPermission, UserRole } from '@/lib/permissions';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const dayOfWeek = searchParams.get('dayOfWeek');

        const whereClause: any = {
            isActive: true,
        };

        if (userId) {
            whereClause.userId = userId;
        }

        if (dayOfWeek) {
            whereClause.dayOfWeek = parseInt(dayOfWeek);
        }

        const assignments = await prisma.userScheduleAssignment.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                template: {
                    include: {
                        shifts: {
                            include: {
                                workLocation: {
                                    select: {
                                        id: true,
                                        name: true,
                                        city: true,
                                    },
                                },
                                project: {
                                    select: {
                                        id: true,
                                        name: true,
                                        company: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { user: { name: 'asc' } },
            ],
        });

        return NextResponse.json(assignments);
    } catch (error) {
        console.error('Error fetching user schedule assignments:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check permissions
        if (!hasPermission(session.user.role as UserRole, 'canManageShifts')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const data = await request.json();
        const {
            userId,
            templateId,
            dayOfWeek,
            customStartTime,
            customEndTime,
            customBreaks,
            notes,
            validFrom,
            validUntil,
        } = data;

        if (!userId || !templateId || dayOfWeek === undefined) {
            return NextResponse.json(
                { error: 'userId, templateId and dayOfWeek are required' },
                { status: 400 }
            );
        }

        // Check if assignment already exists
        const existingAssignment = await prisma.userScheduleAssignment.findUnique({
            where: {
                userId_templateId_dayOfWeek: {
                    userId,
                    templateId,
                    dayOfWeek,
                },
            },
        });

        if (existingAssignment) {
            return NextResponse.json(
                { error: 'Assignment already exists for this user, template and day' },
                { status: 409 }
            );
        }

        const assignment = await prisma.userScheduleAssignment.create({
            data: {
                userId,
                templateId,
                dayOfWeek,
                customStartTime,
                customEndTime,
                customBreaks,
                notes,
                validFrom: validFrom ? new Date(validFrom) : new Date(),
                validUntil: validUntil ? new Date(validUntil) : null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                template: {
                    include: {
                        shifts: {
                            include: {
                                workLocation: {
                                    select: {
                                        id: true,
                                        name: true,
                                        city: true,
                                    },
                                },
                                project: {
                                    select: {
                                        id: true,
                                        name: true,
                                        company: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json(assignment);
    } catch (error) {
        console.error('Error creating user schedule assignment:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check permissions
        if (!hasPermission(session.user.role as UserRole, 'canManageShifts')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const assignmentId = searchParams.get('id');

        if (!assignmentId) {
            return NextResponse.json(
                { error: 'Assignment ID is required' },
                { status: 400 }
            );
        }

        // Check if assignment exists
        const existingAssignment = await prisma.userScheduleAssignment.findUnique({
            where: { id: assignmentId },
        });

        if (!existingAssignment) {
            return NextResponse.json(
                { error: 'Assignment not found' },
                { status: 404 }
            );
        }

        // Delete the assignment
        await prisma.userScheduleAssignment.delete({
            where: { id: assignmentId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting user schedule assignment:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check permissions
        if (!hasPermission(session.user.role as UserRole, 'canManageShifts')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const data = await request.json();
        const {
            id,
            dayOfWeek,
            customStartTime,
            customEndTime,
            customBreaks,
            notes,
            isActive,
        } = data;

        if (!id) {
            return NextResponse.json(
                { error: 'Assignment ID is required' },
                { status: 400 }
            );
        }

        // Check if assignment exists
        const existingAssignment = await prisma.userScheduleAssignment.findUnique({
            where: { id },
        });

        if (!existingAssignment) {
            return NextResponse.json(
                { error: 'Assignment not found' },
                { status: 404 }
            );
        }

        // Update the assignment
        const updatedAssignment = await prisma.userScheduleAssignment.update({
            where: { id },
            data: {
                dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : existingAssignment.dayOfWeek,
                customStartTime: customStartTime !== undefined ? customStartTime : existingAssignment.customStartTime,
                customEndTime: customEndTime !== undefined ? customEndTime : existingAssignment.customEndTime,
                customBreaks: customBreaks !== undefined ? customBreaks : existingAssignment.customBreaks,
                notes: notes !== undefined ? notes : existingAssignment.notes,
                isActive: isActive !== undefined ? isActive : existingAssignment.isActive,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                template: {
                    include: {
                        shifts: {
                            include: {
                                workLocation: {
                                    select: {
                                        id: true,
                                        name: true,
                                        city: true,
                                    },
                                },
                                project: {
                                    select: {
                                        id: true,
                                        name: true,
                                        company: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json(updatedAssignment);
    } catch (error) {
        console.error('Error updating user schedule assignment:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 