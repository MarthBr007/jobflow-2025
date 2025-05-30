import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                notifications: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            profile: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                company: user.company,
            },
            notifications: user.notifications,
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
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
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { profile, notifications, security } = body;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Update profile
        if (profile) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    name: profile.name,
                    phone: profile.phone,
                },
            });
        }

        // Update notifications
        if (notifications) {
            for (const [type, enabled] of Object.entries(notifications)) {
                // Validate that the type is a valid Notification_type
                const validTypes = ['EMAIL', 'PROJECT', 'TIME_TRACKING', 'AVAILABILITY'];
                if (!validTypes.includes(type)) {
                    continue; // Skip invalid notification types
                }

                await prisma.notification.upsert({
                    where: {
                        userId_type: {
                            userId: user.id,
                            type: type as 'EMAIL' | 'PROJECT' | 'TIME_TRACKING' | 'AVAILABILITY',
                        },
                    },
                    update: {
                        enabled: enabled as boolean,
                    },
                    create: {
                        userId: user.id,
                        type: type as 'EMAIL' | 'PROJECT' | 'TIME_TRACKING' | 'AVAILABILITY',
                        enabled: enabled as boolean,
                    },
                });
            }
        }

        // Update password if provided
        if (security?.newPassword) {
            const hashedPassword = await hash(security.newPassword, 12);
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword,
                },
            });
        }

        const updatedUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                notifications: true,
            },
        });

        return NextResponse.json({
            profile: {
                name: updatedUser?.name,
                email: updatedUser?.email,
                phone: updatedUser?.phone,
                role: updatedUser?.role,
                company: updatedUser?.company,
            },
            notifications: updatedUser?.notifications,
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 