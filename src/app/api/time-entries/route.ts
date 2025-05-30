import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const timeEntries = await prisma.timeEntry.findMany({
            where: {
                user: {
                    email: session.user.email,
                },
            },
            include: {
                project: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(timeEntries);
    } catch (error) {
        console.error('Error fetching time entries:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { date, projectId, hours, description } = body;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Calculate endTime based on hours (assuming hours is the duration)
        const startTime = new Date(date);
        const endTime = new Date(startTime.getTime() + (parseFloat(hours) * 60 * 60 * 1000));

        const timeEntry = await prisma.timeEntry.create({
            data: {
                startTime: startTime,
                endTime: endTime,
                description,
                userId: user.id,
                projectId,
            },
            include: {
                project: true,
            },
        });

        return NextResponse.json(timeEntry);
    } catch (error) {
        console.error('Error creating time entry:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 