import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { startOfWeek, endOfWeek } from 'date-fns';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
        }

        // Haal de eerste dag van de week op (maandag)
        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

        // Haal beschikbaarheid op voor deze week
        const availability = await prisma.availability.findMany({
            where: {
                userId: session.user.id,
                date: {
                    gte: weekStart,
                    lte: weekEnd,
                },
            },
            orderBy: {
                date: 'asc',
            },
        });

        return NextResponse.json(availability);
    } catch (error) {
        console.error('Error fetching availability:', error);
        return NextResponse.json(
            { error: 'Er is iets misgegaan' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
        }

        const { date, status, hours, notes } = await request.json();

        // Update of maak nieuwe beschikbaarheid
        const availability = await prisma.availability.upsert({
            where: {
                userId_date: {
                    userId: session.user.id,
                    date: new Date(date),
                },
            },
            update: {
                status,
                hours: hours || null,
                notes: notes || null,
            },
            create: {
                userId: session.user.id,
                date: new Date(date),
                status,
                hours: hours || null,
                notes: notes || null,
            },
        });

        return NextResponse.json(availability);
    } catch (error) {
        console.error('Error saving availability:', error);
        return NextResponse.json(
            { error: 'Er is iets misgegaan bij het opslaan' },
            { status: 500 }
        );
    }
} 