import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateContractPDF, ContractData } from "@/lib/pdf-generator";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admin/manager can generate PDFs
        if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const contractId = params.id;

        // Fetch contract with user details
        const contract = await prisma.contract.findUnique({
            where: { id: contractId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        employeeType: true,
                        address: true,
                        phone: true,
                    },
                },
            },
        });

        if (!contract) {
            return NextResponse.json({ error: "Contract not found" }, { status: 404 });
        }

        // Prepare contract data for PDF generation
        const contractData: ContractData = {
            contractType: contract.contractType,
            title: contract.title,
            description: contract.description || undefined,
            startDate: new Date(contract.startDate),
            endDate: contract.endDate ? new Date(contract.endDate) : null,
            salary: contract.salary || undefined,
            notes: contract.notes || undefined,
            employee: {
                name: contract.user.name || "Onbekend",
                email: contract.user.email,
                address: contract.user.address || undefined,
                phone: contract.user.phone || undefined,
                employeeType: contract.user.employeeType || "EMPLOYEE",
            },
            company: {
                name: "Broers Verhuur",
                address: "Bedrijfsadres 123, 1234 AB Stad",
                kvk: "12345678",
                email: "info@broersverhuur.nl",
                phone: "0123-456789",
            },
        };

        // Generate PDF
        const pdfDataUrl = generateContractPDF(contractData, {
            template: contract.contractType === "FREELANCE" ? "freelance" : "standard",
            language: "nl",
        });

        // Update contract with generated PDF
        const fileName = `${contract.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

        await prisma.contract.update({
            where: { id: contractId },
            data: {
                fileName: fileName,
                fileUrl: pdfDataUrl,
                fileSize: Buffer.from(pdfDataUrl.split(',')[1], 'base64').length,
                mimeType: 'application/pdf',
                uploadedAt: new Date(),
            },
        });

        // Also update user's contract info
        await prisma.user.update({
            where: { id: contract.userId },
            data: {
                contractFileName: fileName,
                contractFileUrl: pdfDataUrl,
            },
        });

        return NextResponse.json({
            success: true,
            fileName: fileName,
            fileUrl: pdfDataUrl,
            message: "PDF gegenereerd en opgeslagen",
        });
    } catch (error) {
        console.error("Error generating PDF:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 