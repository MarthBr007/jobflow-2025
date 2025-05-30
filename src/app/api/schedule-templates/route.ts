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
        const category = searchParams.get('category');
        const active = searchParams.get('active');

        const whereClause: any = {};

        if (category) {
            whereClause.category = category;
        }

        if (active !== null) {
            whereClause.isActive = active === 'true';
        }

        const templates = await prisma.scheduleTemplate.findMany({
            where: whereClause,
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
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                userAssignments: {
                    where: {
                        isActive: true,
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: [
                { category: 'asc' },
                { name: 'asc' },
            ],
        });

        return NextResponse.json(templates);
    } catch (error) {
        console.error('Error fetching schedule templates:', error);
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
        const { name, description, category, shifts } = data;

        if (!name || !shifts || shifts.length === 0) {
            return NextResponse.json(
                { error: 'Name and shifts are required' },
                { status: 400 }
            );
        }

        const template = await prisma.scheduleTemplate.create({
            data: {
                name,
                description,
                category: category || 'DAILY',
                createdById: session.user.id,
                shifts: {
                    create: shifts.map((shift: any) => ({
                        role: shift.role,
                        startTime: shift.startTime,
                        endTime: shift.endTime,
                        breaks: shift.breaks,
                        totalBreakDuration: shift.totalBreakDuration,
                        minPersons: shift.minPersons || 1,
                        maxPersons: shift.maxPersons,
                        requirements: shift.requirements || [],
                        notes: shift.notes,
                        workLocationId: shift.workLocationId,
                        projectId: shift.projectId,
                    })),
                },
            },
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
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error('Error creating schedule template:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 