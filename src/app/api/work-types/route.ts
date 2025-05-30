import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasPermission, UserRole } from '@/lib/permissions';

// GET /api/work-types
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const includeInactive = searchParams.get('includeInactive') === 'true';

        const workTypes = await prisma.workType.findMany({
            where: includeInactive ? {} : { isActive: true },
            include: {
                creator: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(workTypes);
    } catch (error) {
        console.error('Error fetching work types:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// POST /api/work-types
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user has permission to manage work types
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, role: true }
        });

        if (!currentUser || !hasPermission(currentUser.role as UserRole, 'canManageWorkTypes')) {
            return NextResponse.json({ error: 'Access denied - Admin or Manager only' }, { status: 403 });
        }

        const { name, description, emoji } = await request.json();

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // Check if work type already exists
        const existingWorkType = await prisma.workType.findUnique({
            where: { name }
        });

        if (existingWorkType) {
            return NextResponse.json({ error: 'Work type already exists' }, { status: 400 });
        }

        const workType = await prisma.workType.create({
            data: {
                name,
                description,
                emoji,
                createdBy: currentUser.id
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

        return NextResponse.json(workType, { status: 201 });
    } catch (error) {
        console.error('Error creating work type:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 