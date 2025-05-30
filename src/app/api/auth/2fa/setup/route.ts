import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generate2FASecret } from '@/lib/security';

export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const email = session.user.email;

        const { secret, qrCode, manualEntryKey } = await generate2FASecret(userId, email);

        return NextResponse.json({
            qrCode,
            manualEntryKey,
            message: 'Scan the QR code with your authenticator app',
        });
    } catch (error) {
        console.error('Error setting up 2FA:', error);
        return NextResponse.json(
            { error: 'Failed to setup 2FA' },
            { status: 500 }
        );
    }
} 