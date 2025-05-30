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

    // Check if user has permission to view company-wide data
    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true, company: true },
    });

    if (!currentUser || !hasPermission(currentUser.role as UserRole, 'canViewCompanyWideData')) {
        return NextResponse.json({ error: 'Access denied - Admin or Manager only' }, { status: 403 });
    }

    if (!currentUser.company) {
        return NextResponse.json({ error: 'User company not found' }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Gebruikers met een time entry vandaag
    const timeEntries = await prisma.timeEntry.findMany({
        where: {
            startTime: {
                gte: today,
                lt: tomorrow,
            },
            user: {
                company: currentUser.company,
            },
        },
        include: {
            user: true,
        },
    });

    // Gebruikers met beschikbaarheid vandaag (beschikbaar of gedeeltelijk)
    const availability = await prisma.availability.findMany({
        where: {
            date: {
                gte: today,
                lt: tomorrow,
            },
            OR: [
                { status: 'AVAILABLE' },
                { status: 'PARTIAL' },
            ],
            user: {
                company: currentUser.company,
            },
        },
        include: {
            user: true,
        },
    });

    // Combineer unieke gebruikers
    const usersMap: Record<string, { id: string; name: string | null; email: string; status: string }> = {};
    for (const entry of timeEntries) {
        if (entry.user) {
            usersMap[entry.user.id] = {
                id: entry.user.id,
                name: entry.user.name,
                email: entry.user.email,
                status: 'Uren geregistreerd',
            };
        }
    }
    for (const avail of availability) {
        if (avail.user && !usersMap[avail.user.id]) {
            usersMap[avail.user.id] = {
                id: avail.user.id,
                name: avail.user.name,
                email: avail.user.email,
                status: avail.status === 'AVAILABLE' ? 'Beschikbaar' : 'Gedeeltelijk beschikbaar',
            };
        }
    }

    return NextResponse.json(Object.values(usersMap));
} 