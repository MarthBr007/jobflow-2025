import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasPermission, UserRole } from '@/lib/permissions';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view all time entries
    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true, company: true },
    });

    if (!currentUser || !hasPermission(currentUser.role as UserRole, 'canViewAllTimeEntries')) {
        return NextResponse.json({ error: 'Access denied - Admin or Manager only' }, { status: 403 });
    }

    if (!currentUser.company) {
        return NextResponse.json({ error: 'User company not found' }, { status: 404 });
    }

    const timeEntries = await prisma.timeEntry.findMany({
        where: {
            user: {
                company: currentUser.company,
            },
        },
        include: {
            user: true,
            project: true,
        },
        orderBy: {
            startTime: 'desc',
        },
    });

    return NextResponse.json(timeEntries);
}

export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to approve time entries
    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true, company: true },
    });

    if (!currentUser || !hasPermission(currentUser.role as UserRole, 'canApproveTimeEntries')) {
        return NextResponse.json({ error: 'Access denied - Admin or Manager only' }, { status: 403 });
    }

    if (!currentUser.company) {
        return NextResponse.json({ error: 'User company not found' }, { status: 404 });
    }

    const body = await request.json();
    const { id, approved } = body;

    if (typeof id !== 'string' || typeof approved !== 'boolean') {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const timeEntry = await prisma.timeEntry.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    company: true,
                }
            }
        },
    });

    if (!timeEntry) {
        return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });
    }

    // Check if time entry belongs to same company
    if (timeEntry.user.company !== currentUser.company) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedTimeEntry = await prisma.timeEntry.update({
        where: { id },
        data: { approved },
    });

    // Note: Notification creation removed as the model doesn't support messages
    // In the future, this could be implemented with a separate message system

    return NextResponse.json(updatedTimeEntry);
} 