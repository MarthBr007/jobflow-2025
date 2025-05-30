import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const workLocation = await prisma.workLocation.findUnique({
            where: { id: params.id },
            include: {
                creator: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        ScheduleShift: true,
                    },
                },
            },
        });

        if (!workLocation) {
            return NextResponse.json(
                { error: 'Work location not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ workLocation });
    } catch (error) {
        console.error('Error fetching work location:', error);
        return NextResponse.json(
            { error: 'Failed to fetch work location' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin or manager
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });

        if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const {
            name,
            description,
            address,
            city,
            postalCode,
            country,
            latitude,
            longitude,
            company,
            contactInfo,
            isActive
        } = body;

        // Check if another work location with this name exists (excluding current one)
        if (name) {
            const existingLocation = await prisma.workLocation.findFirst({
                where: {
                    name,
                    id: { not: params.id },
                },
            });

            if (existingLocation) {
                return NextResponse.json(
                    { error: 'Een andere werklocatie met deze naam bestaat al' },
                    { status: 400 }
                );
            }
        }

        const workLocation = await prisma.workLocation.update({
            where: { id: params.id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(address && { address }),
                ...(city && { city }),
                ...(postalCode && { postalCode }),
                ...(country && { country }),
                ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
                ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
                ...(company && { company }),
                ...(contactInfo !== undefined && { contactInfo }),
                ...(isActive !== undefined && { isActive }),
            },
            include: {
                creator: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({ workLocation });
    } catch (error) {
        console.error('Error updating work location:', error);
        return NextResponse.json(
            { error: 'Failed to update work location' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin or manager
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });

        if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        // Check if work location is being used in any shifts
        const shiftsCount = await prisma.scheduleShift.count({
            where: { workLocationId: params.id },
        });

        if (shiftsCount > 0) {
            return NextResponse.json(
                {
                    error: `Kan werklocatie niet verwijderen. Deze wordt gebruikt in ${shiftsCount} dienst(en).`,
                    usage: { shifts: shiftsCount }
                },
                { status: 400 }
            );
        }

        await prisma.workLocation.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: 'Work location deleted successfully' });
    } catch (error) {
        console.error('Error deleting work location:', error);
        return NextResponse.json(
            { error: 'Failed to delete work location' },
            { status: 500 }
        );
    }
} 