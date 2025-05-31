import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createEmailService } from "@/lib/email-service";

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
        const { emailType = 'new' } = body; // 'new', 'signed', 'reminder'

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
        const validEmailTypes = ['new', 'signed', 'reminder'];
        if (!validEmailTypes.includes(emailType)) {
            return NextResponse.json(
                { error: "Ongeldig email type. Gebruik 'new', 'signed', of 'reminder'." },
                { status: 400 }
            );
        }

        // Create email service
        const emailService = createEmailService();

        // Send email with contract PDF
        const emailSent = await emailService.sendContractEmail(
            contract.user.email,
            contract.user.name || "Medewerker",
            contract.title,
            contract.fileUrl,
            emailType as 'new' | 'signed' | 'reminder'
        );

        if (!emailSent) {
            return NextResponse.json(
                { error: "Kon email niet verzenden. Controleer email instellingen." },
                { status: 500 }
            );
        }

        // Log the email activity
        await prisma.contract.update({
            where: { id: contractId },
            data: {
                notes: contract.notes
                    ? `${contract.notes}\n\n[${new Date().toLocaleString('nl-NL')}] ${emailType.toUpperCase()} email verstuurd naar ${contract.user.email}`
                    : `[${new Date().toLocaleString('nl-NL')}] ${emailType.toUpperCase()} email verstuurd naar ${contract.user.email}`,
            },
        });

        return NextResponse.json({
            success: true,
            message: `${emailType.charAt(0).toUpperCase() + emailType.slice(1)} email succesvol verzonden naar ${contract.user.email}`,
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