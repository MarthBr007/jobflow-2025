import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PUT /api/work-types/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin or manager
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, role: true }
        });

        if (!currentUser || !['ADMIN', 'MANAGER'].includes(currentUser.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { name, description, emoji, isActive } = await request.json();

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // Check if work type exists
        const existingWorkType = await prisma.workType.findUnique({
            where: { id: params.id }
        });

        if (!existingWorkType) {
            return NextResponse.json({ error: 'Work type not found' }, { status: 404 });
        }

        // Check if name is already taken by another work type
        if (name !== existingWorkType.name) {
            const nameConflict = await prisma.workType.findUnique({
                where: { name }
            });

            if (nameConflict) {
                return NextResponse.json({ error: 'Work type name already exists' }, { status: 400 });
            }
        }

        const workType = await prisma.workType.update({
            where: { id: params.id },
            data: {
                name,
                description,
                emoji,
                isActive
            },
            include: {
                creator: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        return NextResponse.json(workType);
    } catch (error) {
        console.error('Error updating work type:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// DELETE /api/work-types/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin or manager
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, role: true }
        });

        if (!currentUser || !['ADMIN', 'MANAGER'].includes(currentUser.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Check if work type exists
        const existingWorkType = await prisma.workType.findUnique({
            where: { id: params.id }
        });

        if (!existingWorkType) {
            return NextResponse.json({ error: 'Work type not found' }, { status: 404 });
        }

        // Check if work type is being used by any users
        const usageCount = await prisma.userWorkType.count({
            where: { workTypeId: params.id }
        });

        if (usageCount > 0) {
            return NextResponse.json({
                error: `Cannot delete work type. It is currently assigned to ${usageCount} user(s). Please remove it from all users first or deactivate it instead.`
            }, { status: 400 });
        }

        await prisma.workType.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ message: 'Work type deleted successfully' });
    } catch (error) {
        console.error('Error deleting work type:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 