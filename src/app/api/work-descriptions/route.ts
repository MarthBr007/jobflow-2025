import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET /api/work-descriptions
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') as string | null;
        const category = searchParams.get('category') as string | null;
        const search = searchParams.get('search') || '';
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        const where: any = {
            ...(type && { type }),
            ...(category && { category }),
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' as any } },
                    { description: { contains: search, mode: 'insensitive' as any } },
                ],
            }),
            isArchived: false,
        };

        const [descriptions, total] = await Promise.all([
            prisma.workDescription.findMany({
                where,
                include: {
                    createdBy: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                    content: true,
                },
                orderBy: {
                    [sortBy]: sortOrder,
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.workDescription.count({ where }),
        ]);

        return NextResponse.json({
            descriptions,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page,
            },
        });
    } catch (error) {
        console.error('Error fetching work descriptions:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/work-descriptions
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title, type, category, description, content } = await request.json();

        if (!title || !type || !category || !description || !content) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const workDescription = await prisma.workDescription.create({
            data: {
                title,
                type,
                category,
                description,
                createdById: session.user.id,
                content: {
                    create: content.map((item: any, index: number) => ({
                        type: item.type,
                        content: item.content,
                        order: index,
                        videoThumbnail: item.videoThumbnail,
                        videoDuration: item.videoDuration,
                        altText: item.altText,
                    })),
                },
            },
            include: {
                createdBy: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                content: true,
            },
        });

        return NextResponse.json(workDescription);
    } catch (error) {
        console.error('Error creating work description:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT /api/work-descriptions/:id
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title, type, category, description, content } = await request.json();

        if (!title || !type || !category || !description || !content) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Haal huidige versie op
        const currentVersion = await prisma.workDescription.findUnique({
            where: { id: params.id },
            include: { content: true },
        });

        if (!currentVersion) {
            return NextResponse.json(
                { error: 'Work description not found' },
                { status: 404 }
            );
        }

        // Maak nieuwe versie aan
        await prisma.workDescriptionVersion.create({
            data: {
                workDescriptionId: params.id,
                version: currentVersion.version,
                title: currentVersion.title,
                description: currentVersion.description,
                category: currentVersion.category,
                content: JSON.stringify(currentVersion.content),
                createdById: session.user.id,
            },
        });

        // Update de work description
        const updatedDescription = await prisma.workDescription.update({
            where: { id: params.id },
            data: {
                title,
                type,
                category,
                description,
                version: { increment: 1 },
                content: {
                    deleteMany: {},
                    create: content.map((item: any, index: number) => ({
                        type: item.type,
                        content: item.content,
                        order: index,
                        videoThumbnail: item.videoThumbnail,
                        videoDuration: item.videoDuration,
                        altText: item.altText,
                    })),
                },
            },
            include: {
                createdBy: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                content: true,
            },
        });

        return NextResponse.json(updatedDescription);
    } catch (error) {
        console.error('Error updating work description:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/work-descriptions/:id
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Soft delete door isArchived op true te zetten
        await prisma.workDescription.update({
            where: { id: params.id },
            data: { isArchived: true },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting work description:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 