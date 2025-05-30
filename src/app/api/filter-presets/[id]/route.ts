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
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const presetId = params.id;

        // Check if preset exists and belongs to user
        const preset = await prisma.filterPreset.findFirst({
            where: {
                id: presetId,
                userId: user.id,
            },
        });

        if (!preset) {
            return NextResponse.json(
                { error: 'Filter preset not found' },
                { status: 404 }
            );
        }

        // Delete the preset
        await prisma.filterPreset.delete({
            where: { id: presetId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting filter preset:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 