import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

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
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const status = searchParams.get("status");
        const contractType = searchParams.get("contractType");

        const where: any = {};

        // Admin/Manager can see all contracts, others only their own
        if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
            where.userId = session.user.id;
        } else if (userId) {
            where.userId = userId;
        }

        if (status) {
            where.status = status;
        }

        if (contractType) {
            where.contractType = contractType;
        }

        const contracts = await prisma.contract.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        employeeType: true,
                    }
                }
            },
            orderBy: [
                { createdAt: "desc" }
            ]
        });

        return NextResponse.json(contracts);
    } catch (error) {
        console.error("Error fetching contracts:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/contracts - Create new contract
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admin/manager can create contracts for others
        if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const {
            userId,
            contractType,
            title,
            description,
            startDate,
            endDate,
            salary,
            notes,
            fileContent,
            fileName,
        } = body;

        const validatedData = contractSchema.parse(body);

        // Handle file processing for both uploads and generated contracts
        let fileUrl = null;
        let fileSize = null;
        let mimeType = null;
        let uploadedAt = null;

        if (fileContent) {
            // For uploaded files, we have base64 content
            try {
                const buffer = Buffer.from(fileContent, 'base64');
                fileSize = buffer.length;
                mimeType = 'application/pdf';
                uploadedAt = new Date();

                // For now, we store the base64 content directly
                // In production, you might want to store it in a file storage service
                fileUrl = `data:application/pdf;base64,${fileContent}`;
            } catch (error) {
                console.error('Error processing uploaded file:', error);
                return NextResponse.json(
                    { error: "Invalid file format" },
                    { status: 400 }
                );
            }
        }

        // Create the contract
        const contract = await prisma.contract.create({
            data: {
                userId: validatedData.userId,
                createdBy: session.user.id,
                contractType: validatedData.contractType,
                status: fileContent ? "ACTIVE" : "PENDING_SIGNATURE",
                title: validatedData.title,
                description: validatedData.description,
                startDate: new Date(validatedData.startDate),
                endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
                salary: validatedData.salary,
                notes: validatedData.notes,
                // Store the uploaded file information
                fileName: fileName || `${validatedData.title}.pdf`,
                fileUrl: fileUrl,
                fileSize: fileSize,
                mimeType: mimeType,
                uploadedAt: uploadedAt,
            },
        });

        // Update user's contract status
        await prisma.user.update({
            where: { id: validatedData.userId },
            data: {
                hasContract: true,
                contractStatus: fileContent ? "ACTIVE" : "PENDING_SIGNATURE", // Uploaded contracts are immediately active
                contractType: validatedData.contractType,
                contractStartDate: new Date(validatedData.startDate),
                contractEndDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
                contractFileName: validatedData.fileName,
                contractFileUrl: fileUrl,
            }
        });

        return NextResponse.json(contract, { status: 201 });
    } catch (error) {
        console.error("Error creating contract:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 