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
        const { userId, projectId, startTime, endTime, role, notes, breaks } = body;

        if (!userId || !startTime || !endTime) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check if shift exists
        const existingShift = await prisma.scheduleShift.findUnique({
            where: { id: params.id },
            include: { schedule: true },
        });

        if (!existingShift) {
            return NextResponse.json({ error: "Shift not found" }, { status: 404 });
        }

        // Check for overlapping shifts for the same user (excluding current shift)
        const overlappingShift = await prisma.scheduleShift.findFirst({
            where: {
                userId,
                scheduleId: existingShift.scheduleId,
                id: { not: params.id },
                OR: [
                    {
                        AND: [
                            { startTime: { lte: new Date(startTime) } },
                            { endTime: { gt: new Date(startTime) } },
                        ],
                    },
                    {
                        AND: [
                            { startTime: { lt: new Date(endTime) } },
                            { endTime: { gte: new Date(endTime) } },
                        ],
                    },
                    {
                        AND: [
                            { startTime: { gte: new Date(startTime) } },
                            { endTime: { lte: new Date(endTime) } },
                        ],
                    },
                ],
            },
        });

        if (overlappingShift) {
            return NextResponse.json(
                { error: "Deze medewerker heeft al een dienst op dit tijdstip" },
                { status: 400 }
            );
        }

        // Update the shift
        const updatedShift = await prisma.scheduleShift.update({
            where: { id: params.id },
            data: {
                userId,
                projectId: projectId || null,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                role: role || null,
                notes: notes || null,
                breaks: breaks || null,
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
        console.error("Error updating shift:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
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

        // Check if shift exists
        const existingShift = await prisma.scheduleShift.findUnique({
            where: { id: params.id },
        });

        if (!existingShift) {
            return NextResponse.json({ error: "Shift not found" }, { status: 404 });
        }

        // Delete the shift
        await prisma.scheduleShift.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting shift:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(
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

        const shift = await prisma.scheduleShift.findUnique({
            where: {
                id: params.id,
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

        if (!shift) {
            return NextResponse.json({ error: "Shift not found" }, { status: 404 });
        }

        return NextResponse.json(shift);
    } catch (error) {
        console.error("Error fetching shift:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 