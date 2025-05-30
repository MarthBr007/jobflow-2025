import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasPermission, UserRole } from '@/lib/permissions';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const template = await prisma.scheduleTemplate.findUnique({
            where: { id: params.id },
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
                userAssignments: {
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
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        return NextResponse.json(template);
    } catch (error) {
        console.error('Error fetching schedule template:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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
        const { name, description, category, isActive, shifts } = data;

        if (!name || !category) {
            return NextResponse.json(
                { error: 'Name and category are required' },
                { status: 400 }
            );
        }

        // Check if template exists
        const existingTemplate = await prisma.scheduleTemplate.findUnique({
            where: { id: params.id },
            include: { shifts: true },
        });

        if (!existingTemplate) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        // Update template in a transaction
        const updatedTemplate = await prisma.$transaction(async (tx) => {
            // Update template
            const template = await tx.scheduleTemplate.update({
                where: { id: params.id },
                data: {
                    name,
                    description,
                    category,
                    isActive,
                },
            });

            // Delete existing shifts
            await tx.scheduleTemplateShift.deleteMany({
                where: { templateId: params.id },
            });

            // Create new shifts
            if (shifts && shifts.length > 0) {
                const newShifts = shifts.map((shift: any) => ({
                    templateId: template.id,
                    role: shift.role,
                    startTime: shift.startTime,
                    endTime: shift.endTime,
                    breaks: shift.breaks || [],
                    totalBreakDuration: shift.totalBreakDuration || 0,
                    minPersons: shift.minPersons || 1,
                    maxPersons: shift.maxPersons,
                    requirements: shift.requirements || [],
                    notes: shift.notes,
                }));

                await tx.scheduleTemplateShift.createMany({
                    data: newShifts,
                });
            }

            // Return updated template with shifts
            return await tx.scheduleTemplate.findUnique({
                where: { id: template.id },
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
                    userAssignments: {
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
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });
        });

        return NextResponse.json(updatedTemplate);
    } catch (error) {
        console.error('Error updating schedule template:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check permissions
        if (!hasPermission(session.user.role as UserRole, 'canManageShifts')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        // Check if template exists and get usage count
        const template = await prisma.scheduleTemplate.findUnique({
            where: { id: params.id },
            include: {
                userAssignments: true,
                _count: {
                    select: {
                        userAssignments: true,
                    },
                },
            },
        });

        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        // Check if template is in use
        if (template._count.userAssignments > 0) {
            return NextResponse.json(
                {
                    error: 'Cannot delete template that is currently assigned to users',
                    activeAssignments: template._count.userAssignments
                },
                { status: 409 }
            );
        }

        // Delete template and related data in transaction
        await prisma.$transaction(async (tx) => {
            // Delete shifts first
            await tx.scheduleTemplateShift.deleteMany({
                where: { templateId: params.id },
            });

            // Delete template
            await tx.scheduleTemplate.delete({
                where: { id: params.id },
            });
        });

        return NextResponse.json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Error deleting schedule template:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 