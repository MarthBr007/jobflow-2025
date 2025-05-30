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

        // Get full user profile
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                company: true,
                status: true,
                phone: true,
                address: true,
                hourlyRate: true,
                kvkNumber: true,
                btwNumber: true,
                hasContract: true,
                profileImage: true,
                createdAt: true,
                UserWorkType: {
                    select: {
                        workType: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
        }

        // Transform the data to match the frontend interface
        const transformedUser = {
            ...user,
            workTypes: user.UserWorkType.map((wt: any) => wt.workType.name)
        };

        return NextResponse.json(transformedUser);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
        }

        const body = await request.json();
        const {
            name,
            email,
            phone,
            address,
            workTypes,
            kvkNumber,
            btwNumber,
            hasContract
        } = body;

        // Get current user
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true, email: true }
        });

        if (!currentUser) {
            return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
        }

        // Check if email is being changed and if new email is already in use
        if (email && email !== currentUser.email) {
            const existingUser = await prisma.user.findUnique({
                where: { email: email }
            });

            if (existingUser) {
                return NextResponse.json({ error: 'Dit emailadres is al in gebruik' }, { status: 400 });
            }
        }

        // Update user profile
        const updatedUser = await prisma.user.update({
            where: { id: currentUser.id },
            data: {
                name,
                email,
                phone,
                address,
                ...(currentUser.role === 'FREELANCER' && {
                    kvkNumber,
                    btwNumber,
                    hasContract
                })
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                company: true,
                status: true,
                phone: true,
                address: true,
                hourlyRate: true,
                kvkNumber: true,
                btwNumber: true,
                hasContract: true,
                profileImage: true,
                createdAt: true,
                UserWorkType: {
                    select: {
                        workType: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        // Update work types if provided
        if (workTypes && Array.isArray(workTypes)) {
            // Delete existing work types
            await prisma.userWorkType.deleteMany({
                where: { userId: currentUser.id }
            });

            // Create new work types
            if (workTypes.length > 0) {
                // First, get the WorkType IDs from the names
                const workTypeRecords = await prisma.workType.findMany({
                    where: {
                        name: {
                            in: workTypes
                        }
                    },
                    select: {
                        id: true,
                        name: true
                    }
                });

                // Create UserWorkType records with workTypeId
                if (workTypeRecords.length > 0) {
                    await prisma.userWorkType.createMany({
                        data: workTypeRecords.map((workType) => ({
                            userId: currentUser.id,
                            workTypeId: workType.id
                        }))
                    });
                }
            }
        }

        // Fetch updated user with work types
        const finalUser = await prisma.user.findUnique({
            where: { id: currentUser.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                company: true,
                status: true,
                phone: true,
                address: true,
                hourlyRate: true,
                kvkNumber: true,
                btwNumber: true,
                hasContract: true,
                profileImage: true,
                createdAt: true,
                UserWorkType: {
                    select: {
                        workType: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        // Transform the data
        const transformedUser = {
            ...finalUser,
            workTypes: finalUser?.UserWorkType.map((wt: any) => wt.workType.name) || []
        };

        return NextResponse.json(transformedUser);
    } catch (error) {
        console.error('Error updating user profile:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 