import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        const assignments = await prisma.workPatternAssignment.findMany({
            where: {
                userId: userId,
                isActive: true,
            },
            include: {
                pattern: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        type: true,
                        totalHoursPerWeek: true,
                        workDays: true,
                        color: true,
                        icon: true,
                    },
                },
                assignedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                startDate: 'desc',
            },
        });

        return NextResponse.json(assignments);

    } catch (error) {
        console.error("Error fetching work pattern assignments:", error);
        return NextResponse.json(
            { error: "Failed to fetch work pattern assignments" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }

        const body = await request.json();
        const { userId, patternId, startDate, endDate, notes } = body;

        if (!userId || !patternId) {
            return NextResponse.json(
                { error: "User ID and Pattern ID are required" },
                { status: 400 }
            );
        }

        // Deactivate existing assignments
        await prisma.workPatternAssignment.updateMany({
            where: {
                userId: userId,
                isActive: true,
            },
            data: {
                isActive: false,
                endDate: new Date(),
            },
        });

        // Create new assignment
        const assignment = await prisma.workPatternAssignment.create({
            data: {
                userId: userId,
                patternId: patternId,
                startDate: startDate ? new Date(startDate) : new Date(),
                endDate: endDate ? new Date(endDate) : null,
                isActive: true,
                assignedById: session.user.id,
                notes: notes || `Toegewezen op ${new Date().toLocaleDateString('nl-NL')}`,
            },
            include: {
                pattern: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        type: true,
                        totalHoursPerWeek: true,
                        workDays: true,
                        color: true,
                        icon: true,
                    },
                },
                assignedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            assignment,
        });

    } catch (error) {
        console.error("Error creating work pattern assignment:", error);
        return NextResponse.json(
            { error: "Failed to create work pattern assignment" },
            { status: 500 }
        );
    }
} 