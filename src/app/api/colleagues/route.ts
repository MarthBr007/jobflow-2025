import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
        }

        // Fetch all users except the current user
        const colleagues = await prisma.user.findMany({
            where: {
                NOT: {
                    id: session.user.id
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                company: true,
                UserWorkType: {
                    select: {
                        workType: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        // Transform the data to match the expected format
        const formattedColleagues = colleagues.map(colleague => ({
            ...colleague,
            workTypes: colleague.UserWorkType.map(wt => wt.workType)
        }));

        return NextResponse.json(formattedColleagues);
    } catch (error) {
        console.error('Error fetching colleagues:', error);
        return NextResponse.json(
            { error: 'Er is iets misgegaan' },
            { status: 500 }
        );
    }
} 