import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin or manager
        if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { status } = body;

        if (!status || !["SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED"].includes(status)) {
            return NextResponse.json(
                { error: "Invalid status" },
                { status: 400 }
            );
        }

        // Check if shift exists
        const existingShift = await prisma.scheduleShift.findUnique({
            where: { id: params.id },
        });

        if (!existingShift) {
            return NextResponse.json({ error: "Shift not found" }, { status: 404 });
        }

        // Update the shift status
        const updatedShift = await prisma.scheduleShift.update({
            where: { id: params.id },
            data: {
                status,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        company: true,
                    },
                },
            },
        });

        return NextResponse.json(updatedShift);
    } catch (error) {
        console.error("Error updating shift status:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 