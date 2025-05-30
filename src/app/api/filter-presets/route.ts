import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
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

        // Fetch filter presets for the user
        const presets = await prisma.filterPreset.findMany({
            where: {
                userId: user.id,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(presets);
    } catch (error) {
        console.error('Error fetching filter presets:', error);
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

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await request.json();
        const { name, filters } = body;

        if (!name || !filters) {
            return NextResponse.json(
                { error: 'Name and filters are required' },
                { status: 400 }
            );
        }

        // Create new filter preset
        const preset = await prisma.filterPreset.create({
            data: {
                name,
                filters: JSON.stringify(filters),
                userId: user.id,
                isDefault: false,
            },
        });

        return NextResponse.json({
            id: preset.id,
            name: preset.name,
            filters: JSON.parse(preset.filters),
            isDefault: preset.isDefault,
            createdAt: preset.createdAt,
        });
    } catch (error) {
        console.error('Error creating filter preset:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 