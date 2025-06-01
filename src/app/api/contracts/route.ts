import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { notificationManager } from '@/lib/notification-system';

const contractSchema = z.object({
    userId: z.string(),
    contractType: z.enum([
        "PERMANENT_FULL_TIME",
        "PERMANENT_PART_TIME",
        "TEMPORARY_FULL_TIME",
        "TEMPORARY_PART_TIME",
        "FREELANCE",
        "ZERO_HOURS",
        "INTERNSHIP",
        "PROBATION"
    ]),
    title: z.string().min(1),
    description: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().optional().nullable(),
    salary: z.string().optional(),
    notes: z.string().optional(),
    fileContent: z.string().optional(), // Base64 encoded file content for uploads
    fileName: z.string().optional(), // Original filename for uploads
});

// GET /api/contracts - List contracts
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const status = searchParams.get("status");

        let where: any = {};

        if (userId) {
            where.userId = userId;
        }
        if (status) {
            where.status = status;
        }

        const contracts = await prisma.contract.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        employeeType: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(contracts);
    } catch (error) {
        console.error("Contracts GET error:", error);
        return NextResponse.json(
            { error: "Failed to fetch contracts" },
            { status: 500 }
        );
    }
}

// POST /api/contracts - Create new contract
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            userId,
            title,
            contractType,
            description,
            startDate,
            endDate,
            salary,
            notes,
            status = "DRAFT",
            sendForSigning = false
        } = body;

        // Validate required fields
        if (!userId || !title || !contractType || !startDate) {
            return NextResponse.json(
                { error: "Missing required fields: userId, title, contractType, startDate" },
                { status: 400 }
            );
        }

        // Get user details for email
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                employeeType: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Create contract
        const contract = await prisma.contract.create({
            data: {
                userId,
                title,
                contractType,
                description: description || null,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                salary: salary || null,
                notes: notes || null,
                status: sendForSigning ? "PENDING_SIGNATURE" : "DRAFT",
                createdBy: session.user.id || "system",
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        // If sending for signing, send notification email
        if (sendForSigning) {
            await sendContractForSigning(contract, user);
        }

        return NextResponse.json({
            success: true,
            contract,
            message: sendForSigning
                ? `Contract verstuurd naar ${user.email} voor ondertekening`
                : "Contract opgeslagen als concept"
        });
    } catch (error) {
        console.error("Contracts POST error:", error);
        return NextResponse.json(
            { error: "Failed to create contract" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { id, action, ...updateData } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Contract ID is required" },
                { status: 400 }
            );
        }

        const contract = await prisma.contract.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        if (!contract) {
            return NextResponse.json(
                { error: "Contract not found" },
                { status: 404 }
            );
        }

        let updatedContract;

        switch (action) {
            case "sign":
                // Digital signature process
                updatedContract = await prisma.contract.update({
                    where: { id },
                    data: {
                        status: "ACTIVE",
                        signedDate: new Date(),
                        // In real implementation, store signature hash and metadata
                    },
                });

                // Send confirmation notifications
                await notificationManager.sendNotification({
                    userId: contract.userId,
                    type: "SYSTEM_ALERT",
                    title: "Contract Ondertekend",
                    message: `Je contract "${contract.title}" is succesvol ondertekend en actief.`,
                    priority: "HIGH"
                });

                // Log activity
                await prisma.activityFeed.create({
                    data: {
                        userId: contract.userId,
                        actorId: contract.userId,
                        type: "SYSTEM_UPDATE",
                        title: "Contract Ondertekend",
                        description: `Contract "${contract.title}" is digitaal ondertekend`,
                        resourceId: contract.id,
                    },
                });

                break;

            case "reject":
                updatedContract = await prisma.contract.update({
                    where: { id },
                    data: {
                        status: "TERMINATED",
                        notes: `${contract.notes || ""}\n\nAfgewezen op ${new Date().toISOString()}: ${updateData.reason || "Geen reden opgegeven"}`,
                    },
                });

                // Send rejection notification
                await notificationManager.sendNotification({
                    userId: contract.userId,
                    type: "SYSTEM_ALERT",
                    title: "Contract Afgewezen",
                    message: `Contract "${contract.title}" is afgewezen. Reden: ${updateData.reason || "Geen reden opgegeven"}`,
                    priority: "HIGH"
                });

                break;

            case "resend":
                await sendContractForSigning(contract, contract.user);
                updatedContract = await prisma.contract.update({
                    where: { id },
                    data: {
                        status: "PENDING_SIGNATURE",
                        updatedAt: new Date(),
                    },
                });
                break;

            default:
                // Regular update
                updatedContract = await prisma.contract.update({
                    where: { id },
                    data: updateData,
                });
        }

        return NextResponse.json({
            success: true,
            contract: updatedContract,
        });
    } catch (error) {
        console.error("Contracts PUT error:", error);
        return NextResponse.json(
            { error: "Failed to update contract" },
            { status: 500 }
        );
    }
}

// Helper function to send contract for signing
async function sendContractForSigning(contract: any, user: any) {
    try {
        // Generate secure signing link (in real implementation)
        const signingToken = generateSecureToken();
        const signingLink = `${process.env.NEXTAUTH_URL}/contract/sign/${contract.id}?token=${signingToken}`;

        // Send notification through notification system
        await notificationManager.sendNotification({
            userId: contract.userId,
            type: "SYSTEM_ALERT",
            title: "Contract Klaar voor Ondertekening",
            message: `Je contract "${contract.title}" is klaar voor ondertekening. Klik op de link in je e-mail om het contract te bekijken en te ondertekenen.`,
            priority: "HIGH",
            data: {
                contractId: contract.id,
                signingLink,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        // In real implementation, also send professional email with:
        // - PDF attachment of the contract
        // - Secure signing link
        // - Instructions for digital signing
        // - Legal disclaimers

        console.log(`Contract signing email sent to ${user.email}`);
        console.log(`Signing link: ${signingLink}`);

        // Create activity log
        await prisma.activityFeed.create({
            data: {
                userId: contract.userId,
                actorId: contract.createdBy,
                type: "SYSTEM_UPDATE",
                title: "Contract Verstuurd",
                description: `Contract "${contract.title}" verstuurd naar ${user.email} voor ondertekening`,
                resourceId: contract.id,
            },
        });
    } catch (error) {
        console.error("Failed to send contract for signing:", error);
        throw error;
    }
}

// Generate secure token for contract signing (simplified)
function generateSecureToken(): string {
    return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
} 