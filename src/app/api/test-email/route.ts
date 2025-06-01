import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const { to, subject, message } = await request.json();

        if (!to || !subject || !message) {
            return NextResponse.json(
                { error: 'Missing required fields: to, subject, message' },
                { status: 400 }
            );
        }

        // Send test email
        const result = await sendEmail({
            to,
            subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #2563eb;">📧 Test Email</h1>
                    <p><strong>Contract System Test</strong></p>
                    <p>${message}</p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #666; font-size: 14px;">
                        Dit is een test email vanuit het contract management systeem.
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        <strong>Timestamp:</strong> ${new Date().toLocaleString('nl-NL')}
                    </p>
                </div>
            `,
        });

        if (result.success) {
            console.log('✅ Test email sent successfully:', {
                to,
                subject,
                messageId: result.messageId
            });

            return NextResponse.json({
                success: true,
                message: 'Test email sent successfully',
                to,
                subject,
                messageId: result.messageId,
                timestamp: new Date().toISOString()
            });
        } else {
            console.error('❌ Failed to send test email:', result.error);

            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to send email',
                    details: result.error
                },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Test email error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 