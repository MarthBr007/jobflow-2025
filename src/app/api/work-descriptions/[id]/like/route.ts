import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        // Check if user already liked this work description
        const existingLike = await prisma.workDescriptionLike.findUnique({
            where: {
                workDescriptionId_userId: {
                    workDescriptionId: id,
                    userId: session.user.id,
                },
            },
        });

        if (existingLike) {
            // Unlike
            await prisma.workDescriptionLike.delete({
                where: {
                    id: existingLike.id,
                },
            });

            await prisma.workDescription.update({
                where: { id },
                data: {
                    likes: { decrement: 1 },
                },
            });
        } else {
            // Like
            await prisma.workDescriptionLike.create({
                data: {
                    workDescriptionId: id,
                    userId: session.user.id,
                },
            });

            await prisma.workDescription.update({
                where: { id },
                data: {
                    likes: { increment: 1 },
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error toggling like:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 