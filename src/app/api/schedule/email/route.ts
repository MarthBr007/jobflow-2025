import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const { scheduleId, recipients, subject, message } = await request.json();

        if (!scheduleId || !recipients || recipients.length === 0) {
            return NextResponse.json(
                { error: "Schedule ID and recipients are required" },
                { status: 400 }
            );
        }

        // For now, we'll just return a success message
        // In a real implementation, you would integrate with an email service like:
        // - SendGrid
        // - AWS SES
        // - Nodemailer with SMTP
        // - Resend
        // - etc.

        console.log("Email would be sent to:", recipients);
        console.log("Subject:", subject);
        console.log("Message:", message);
        console.log("Schedule ID:", scheduleId);

        return NextResponse.json({
            success: true,
            message: `Rooster zou worden gemaild naar ${recipients.length} ontvangers (demo mode)`,
        });

    } catch (error) {
        console.error("Error in email route:", error);
        return NextResponse.json(
            { error: "Failed to send email" },
            { status: 500 }
        );
    }
} 