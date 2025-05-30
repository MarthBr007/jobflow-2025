import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
        }

        const availabilityId = params.id;

        // Check if the availability belongs to the current user
        const availability = await prisma.availability.findUnique({
            where: { id: availabilityId },
            select: { userId: true }
        });

        if (!availability) {
            return NextResponse.json({ error: 'Beschikbaarheid niet gevonden' }, { status: 404 });
        }

        if (availability.userId !== session.user.id) {
            return NextResponse.json({ error: 'Geen toegang tot deze beschikbaarheid' }, { status: 403 });
        }

        // Delete the availability
        await prisma.availability.delete({
            where: { id: availabilityId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting availability:', error);
        return NextResponse.json(
            { error: 'Er is iets misgegaan bij het verwijderen' },
            { status: 500 }
        );
    }
} 