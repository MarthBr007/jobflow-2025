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
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');
        const contractId = params.id;

        if (!contractId) {
            return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 });
        }

        // If token is provided, validate it (for employee signing)
        if (token) {
            // In a real implementation, validate the token against database
            // For now, we'll allow access with any token for demo purposes
            console.log(`Token-based access for contract ${contractId}: ${token}`);
        } else {
            // Regular session-based access
            const session = await getServerSession(authOptions);
            if (!session?.user?.email) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        // Fetch contract with user details
        const contract = await prisma.contract.findUnique({
            where: { id: contractId },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        employeeType: true,
                    },
                },
            },
        });

        if (!contract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }

        return NextResponse.json(contract);

    } catch (error) {
        console.error('Contract GET error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch contract' },
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
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const contractId = params.id;

        if (!contractId) {
            return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 });
        }

        // Check if contract exists and can be deleted
        const contract = await prisma.contract.findUnique({
            where: { id: contractId },
        });

        if (!contract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }

        // Only allow deletion of DRAFT contracts
        if (contract.status !== 'DRAFT') {
            return NextResponse.json(
                { error: 'Only draft contracts can be deleted' },
                { status: 400 }
            );
        }

        // Delete the contract
        await prisma.contract.delete({
            where: { id: contractId },
        });

        // Log activity
        await prisma.activityFeed.create({
            data: {
                userId: contract.userId,
                actorId: session.user.id || 'system',
                type: 'SYSTEM_UPDATE',
                title: 'Contract Verwijderd',
                description: `Contract "${contract.title}" is verwijderd`,
                resourceId: contract.id,
            },
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Contract DELETE error:', error);
        return NextResponse.json(
            { error: 'Failed to delete contract' },
            { status: 500 }
        );
    }
} 