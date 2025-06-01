import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { emailService } from "@/lib/email-service";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admin/manager can send contract emails
        if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const contractId = params.id;
        const body = await request.json();
        const { emailType = 'new', subject, content } = body; // 'new', 'signed', 'reminder', 'custom'

        // Fetch contract with user details
        const contract = await prisma.contract.findUnique({
            where: { id: contractId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!contract) {
            return NextResponse.json({ error: "Contract not found" }, { status: 404 });
        }

        // Check if contract has a PDF file
        if (!contract.fileUrl) {
            return NextResponse.json(
                { error: "Contract heeft geen PDF bestand. Genereer eerst een PDF." },
                { status: 400 }
            );
        }

        // Validate email type
        const validEmailTypes = ['new', 'signed', 'reminder', 'custom'];
        if (!validEmailTypes.includes(emailType)) {
            return NextResponse.json(
                { error: "Ongeldig email type. Gebruik 'new', 'signed', 'reminder', of 'custom'." },
                { status: 400 }
            );
        }

        // For custom emails, validate subject and content
        if (emailType === 'custom') {
            if (!subject || !content) {
                return NextResponse.json(
                    { error: "Subject en content zijn verplicht voor custom emails." },
                    { status: 400 }
                );
            }
        }

        // Create email service (already imported as singleton)
        // const emailService = createEmailService(); // Remove this line

        let emailSent = false;

        if (emailType === 'custom') {
            // Send custom email
            const pdfBuffer = Buffer.from(contract.fileUrl.split(',')[1], 'base64');

            const result = await emailService.sendEmail({
                to: contract.user.email,
                subject: subject,
                text: content,
                html: content.replace(/\n/g, '<br>'),
                attachments: [
                    {
                        filename: `${contract.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf',
                    },
                ],
            });
            emailSent = result.success;
        } else {
            // Send contract signing email with URL instead of attachment
            const signingUrl = `${process.env.APP_URL || 'http://localhost:3000'}/contract/sign/${contractId}?token=demo-token`;

            const result = await emailService.sendContractSigningEmail(
                contract.user.email,
                contract.user.name || "Medewerker",
                contract.title,
                signingUrl
            );
            emailSent = result.success;
        }

        if (!emailSent) {
            return NextResponse.json(
                { error: "Kon email niet verzenden. Controleer email instellingen." },
                { status: 500 }
            );
        }

        // Log the email activity
        const logMessage = emailType === 'custom'
            ? `Custom email verstuurd naar ${contract.user.email} - Onderwerp: ${subject}`
            : `${emailType.toUpperCase()} email verstuurd naar ${contract.user.email}`;

        await prisma.contract.update({
            where: { id: contractId },
            data: {
                notes: contract.notes
                    ? `${contract.notes}\n\n[${new Date().toLocaleString('nl-NL')}] ${logMessage}`
                    : `[${new Date().toLocaleString('nl-NL')}] ${logMessage}`,
            },
        });

        const responseMessage = emailType === 'custom'
            ? `Custom email succesvol verzonden naar ${contract.user.email}`
            : `${emailType.charAt(0).toUpperCase() + emailType.slice(1)} email succesvol verzonden naar ${contract.user.email}`;

        return NextResponse.json({
            success: true,
            message: responseMessage,
            recipient: contract.user.email,
            emailType,
        });
    } catch (error) {
        console.error("Error sending contract email:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 