import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { disable2FA } from '@/lib/security';

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
        const success = await disable2FA(userId, token);

        if (success) {
            return NextResponse.json({
                message: '2FA disabled successfully',
            });
        } else {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error disabling 2FA:', error);
        return NextResponse.json(
            { error: 'Failed to disable 2FA' },
            { status: 500 }
        );
    }
} 