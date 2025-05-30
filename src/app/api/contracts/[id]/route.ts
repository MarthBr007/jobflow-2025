import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/contracts/[id] - Get specific contract
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const contract = await prisma.contract.findUnique({
            where: { id: params.id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        employeeType: true,
                        company: true,
                    }
                }
            }
        });

        if (!contract) {
            return NextResponse.json({ error: "Contract not found" }, { status: 404 });
        }

        // Check permission - users can only view their own contracts unless admin/manager
        if (
            session.user.role !== "ADMIN" &&
            session.user.role !== "MANAGER" &&
            contract.userId !== session.user.id
        ) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json(contract);
    } catch (error) {
        console.error("Error fetching contract:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT /api/contracts/[id] - Update contract
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admin/manager can update contracts
        if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const {
            title,
            description,
            startDate,
            endDate,
            status,
            salary,
            notes,
            signedDate,
        } = body;

        const existingContract = await prisma.contract.findUnique({
            where: { id: params.id }
        });

        if (!existingContract) {
            return NextResponse.json({ error: "Contract not found" }, { status: 404 });
        }

        const updatedContract = await prisma.contract.update({
            where: { id: params.id },
            data: {
                title: title || existingContract.title,
                description: description !== undefined ? description : existingContract.description,
                startDate: startDate ? new Date(startDate) : existingContract.startDate,
                endDate: endDate ? new Date(endDate) : endDate === null ? null : existingContract.endDate,
                status: status || existingContract.status,
                salary: salary !== undefined ? salary : existingContract.salary,
                notes: notes !== undefined ? notes : existingContract.notes,
                signedDate: signedDate ? new Date(signedDate) : signedDate === null ? null : existingContract.signedDate,
                updatedAt: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        employeeType: true,
                    }
                }
            }
        });

        // Update user's contract status if status changed
        if (status && status !== existingContract.status) {
            await prisma.user.update({
                where: { id: existingContract.userId },
                data: {
                    contractStatus: status,
                    hasContract: status !== "NONE",
                }
            });
        }

        return NextResponse.json(updatedContract);
    } catch (error) {
        console.error("Error updating contract:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PATCH /api/contracts/[id] - Update contract status (for signing, etc.)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { status, signedDate } = body;

        const existingContract = await prisma.contract.findUnique({
            where: { id: params.id }
        });

        if (!existingContract) {
            return NextResponse.json({ error: "Contract not found" }, { status: 404 });
        }

        // Users can sign their own contracts, admin/manager can change any status
        const canUpdate =
            session.user.role === "ADMIN" ||
            session.user.role === "MANAGER" ||
            (existingContract.userId === session.user.id && status === "ACTIVE");

        if (!canUpdate) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updatedContract = await prisma.contract.update({
            where: { id: params.id },
            data: {
                status,
                signedDate: signedDate ? new Date(signedDate) : (status === "ACTIVE" ? new Date() : existingContract.signedDate),
                updatedAt: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        employeeType: true,
                    }
                }
            }
        });

        // Update user's contract status
        await prisma.user.update({
            where: { id: existingContract.userId },
            data: {
                contractStatus: status,
                hasContract: status === "ACTIVE",
            }
        });

        return NextResponse.json(updatedContract);
    } catch (error) {
        console.error("Error updating contract status:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/contracts/[id] - Delete contract
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admin can delete contracts
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const existingContract = await prisma.contract.findUnique({
            where: { id: params.id }
        });

        if (!existingContract) {
            return NextResponse.json({ error: "Contract not found" }, { status: 404 });
        }

        await prisma.contract.delete({
            where: { id: params.id }
        });

        // Update user's contract status
        const remainingContracts = await prisma.contract.findMany({
            where: {
                userId: existingContract.userId,
                status: "ACTIVE"
            }
        });

        await prisma.user.update({
            where: { id: existingContract.userId },
            data: {
                hasContract: remainingContracts.length > 0,
                contractStatus: remainingContracts.length > 0 ? "ACTIVE" : "NONE",
            }
        });

        return NextResponse.json({ message: "Contract deleted successfully" });
    } catch (error) {
        console.error("Error deleting contract:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 