import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasPermission, UserRole } from '@/lib/permissions';

// Haal alle gebruikers op met hun klokstatus
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage clock status
    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true, company: true },
    });

    if (!currentUser || !hasPermission(currentUser.role as UserRole, 'canManageClockStatus')) {
        return NextResponse.json({ error: 'Access denied - Admin or Manager only' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
        where: {
            company: currentUser.company,
            role: {
                in: ['EMPLOYEE', 'FREELANCER'],
            },
        },
        select: {
            id: true,
            name: true,
            email: true,
            status: true,
            lastClockIn: true,
            lastClockOut: true,
        },
    });

    return NextResponse.json(users);
}

// Update de klokstatus van een gebruiker
export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage clock status
    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true, company: true },
    });

    if (!currentUser || !hasPermission(currentUser.role as UserRole, 'canManageClockStatus')) {
        return NextResponse.json({ error: 'Access denied - Admin or Manager only' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, clockIn, clockOut } = body;

    if (!userId || (clockIn === undefined && clockOut === undefined)) {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Verify the user belongs to the same company
    const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { company: true },
    });

    if (!targetUser || targetUser.company !== currentUser.company) {
        return NextResponse.json({ error: 'User not found or access denied' }, { status: 404 });
    }

    const updateData: any = {};
    if (clockIn !== undefined) {
        updateData.lastClockIn = clockIn;
        updateData.status = 'WORKING';
    }
    if (clockOut !== undefined) {
        updateData.lastClockOut = clockOut;
        updateData.status = 'AVAILABLE';
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
    });

    // Note: Notification creation removed as the model doesn't support messages
    // In the future, this could be implemented with a separate message system

    return NextResponse.json(updatedUser);
} 