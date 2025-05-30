import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasPermission, UserRole } from '@/lib/permissions';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin or manager
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user || !hasPermission(user.role as UserRole, 'canManageEmailSettings')) {
            return NextResponse.json({ error: 'Access denied - Admin only' }, { status: 403 });
        }

        const settings = await prisma.emailSettings.findFirst({
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching email settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin or manager
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user || !hasPermission(user.role as UserRole, 'canManageEmailSettings')) {
            return NextResponse.json({ error: 'Access denied - Admin only' }, { status: 403 });
        }

        const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, isEnabled } = await request.json();

        // Disable all existing settings first
        await prisma.emailSettings.updateMany({
            data: { isEnabled: false }
        });

        // Create new settings
        const settings = await prisma.emailSettings.create({
            data: {
                smtpHost,
                smtpPort: parseInt(smtpPort),
                smtpUser,
                smtpPass,
                smtpFrom,
                isEnabled: isEnabled !== false, // Default to true
                updatedBy: user.id,
            }
        });

        return NextResponse.json({
            ...settings,
            smtpPass: '***hidden***' // Don't return password in response
        });
    } catch (error) {
        console.error('Error creating email settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin or manager
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user || !hasPermission(user.role as UserRole, 'canManageEmailSettings')) {
            return NextResponse.json({ error: 'Access denied - Admin only' }, { status: 403 });
        }

        const { id, smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, isEnabled } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Settings ID is required' }, { status: 400 });
        }

        const updateData: any = {
            smtpHost,
            smtpPort: parseInt(smtpPort),
            smtpUser,
            smtpFrom,
            isEnabled,
            updatedBy: user.id,
        };

        // Only update password if provided
        if (smtpPass && smtpPass !== '***hidden***') {
            updateData.smtpPass = smtpPass;
        }

        const settings = await prisma.emailSettings.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({
            ...settings,
            smtpPass: '***hidden***' // Don't return password in response
        });
    } catch (error) {
        console.error('Error updating email settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 