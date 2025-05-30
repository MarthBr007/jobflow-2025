import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasPermission, UserRole } from '@/lib/permissions';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const includeInactive = searchParams.get('includeInactive') === 'true';
        const company = searchParams.get('company');

        const workLocations = await prisma.workLocation.findMany({
            where: {
                ...(includeInactive ? {} : { isActive: true }),
                ...(company ? { company } : {}),
            },
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
            orderBy: [
                { isActive: 'desc' },
                { company: 'asc' },
                { name: 'asc' },
            ],
        });

        return NextResponse.json({ workLocations });
    } catch (error) {
        console.error('Error fetching work locations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch work locations' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user has permission to manage work locations
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });

        if (!user || !hasPermission(user.role as UserRole, 'canManageWorkLocations')) {
            return NextResponse.json(
                { error: 'Access denied - Admin or Manager only' },
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
            country = 'Nederland',
            latitude,
            longitude,
            company,
            contactInfo
        } = body;

        // Check if work location with this name already exists
        const existingLocation = await prisma.workLocation.findUnique({
            where: { name },
        });

        if (existingLocation) {
            return NextResponse.json(
                { error: 'Een werklocatie met deze naam bestaat al' },
                { status: 400 }
            );
        }

        const workLocation = await prisma.workLocation.create({
            data: {
                name,
                description,
                address,
                city,
                postalCode,
                country,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                company,
                contactInfo,
                createdBy: session.user.id,
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

        return NextResponse.json({ workLocation }, { status: 201 });
    } catch (error) {
        console.error('Error creating work location:', error);
        return NextResponse.json(
            { error: 'Failed to create work location' },
            { status: 500 }
        );
    }
} 