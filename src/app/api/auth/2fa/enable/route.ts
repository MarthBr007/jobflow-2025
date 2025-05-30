import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { enable2FA } from '@/lib/security';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { token } = await request.json();

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        const userId = (session.user as any).id;
        const success = await enable2FA(userId, token);

        if (success) {
            return NextResponse.json({
                message: '2FA enabled successfully',
                backupCodes: await getBackupCodes(userId),
            });
        } else {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error enabling 2FA:', error);
        return NextResponse.json(
            { error: 'Failed to enable 2FA' },
            { status: 500 }
        );
    }
}

async function getBackupCodes(userId: string) {
    const prisma = (await import('@/lib/prisma')).default;
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { backupCodes: true },
    });

    return user?.backupCodes ? JSON.parse(user.backupCodes as string) : [];
} 