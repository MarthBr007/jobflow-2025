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

        // Check if user has permission to manage schedules
        if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }

        const patterns = await prisma.workPattern.findMany({
            include: {
                _count: {
                    select: {
                        assignments: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Transform the data to match the frontend interface
        const formattedPatterns = patterns.map((pattern) => ({
            id: pattern.id,
            name: pattern.name,
            description: pattern.description || "",
            type: pattern.type,
            isActive: pattern.isActive,
            workDays: typeof pattern.workDays === 'string'
                ? JSON.parse(pattern.workDays)
                : (pattern.workDays || []),
            totalHoursPerWeek: pattern.totalHoursPerWeek || 0,
            createdAt: pattern.createdAt.toISOString(),
            updatedAt: pattern.updatedAt.toISOString(),
            assignedEmployees: pattern._count.assignments,
            color: pattern.color || "blue",
            icon: pattern.icon || "👔",
            timeForTimeSettings: typeof pattern.timeForTimeSettings === 'string'
                ? JSON.parse(pattern.timeForTimeSettings)
                : (pattern.timeForTimeSettings || null),
        }));

        return NextResponse.json(formattedPatterns);
    } catch (error) {
        console.error("Error fetching patterns:", error);
        return NextResponse.json(
            { error: "Failed to fetch patterns" },
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
        const {
            name,
            description,
            type,
            isActive = true,
            workDays,
            totalHoursPerWeek,
            color = "blue",
            icon = "👔",
            timeForTimeSettings,
        } = body;

        if (!name || !type || !workDays) {
            return NextResponse.json(
                { error: "Name, type, and workDays are required" },
                { status: 400 }
            );
        }

        const pattern = await prisma.workPattern.create({
            data: {
                name,
                description,
                type,
                isActive,
                workDays,
                totalHoursPerWeek,
                color,
                icon,
                timeForTimeSettings,
                createdById: session.user.id,
            },
        });

        return NextResponse.json({
            id: pattern.id,
            name: pattern.name,
            description: pattern.description || "",
            type: pattern.type,
            isActive: pattern.isActive,
            workDays: typeof pattern.workDays === 'string'
                ? JSON.parse(pattern.workDays)
                : (pattern.workDays || []),
            totalHoursPerWeek: pattern.totalHoursPerWeek || 0,
            createdAt: pattern.createdAt.toISOString(),
            updatedAt: pattern.updatedAt.toISOString(),
            assignedEmployees: 0,
            color: pattern.color || "blue",
            icon: pattern.icon || "👔",
            timeForTimeSettings: typeof pattern.timeForTimeSettings === 'string'
                ? JSON.parse(pattern.timeForTimeSettings)
                : (pattern.timeForTimeSettings || null),
        });
    } catch (error) {
        console.error("Error creating pattern:", error);
        return NextResponse.json(
            { error: "Failed to create pattern" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }

        const body = await request.json();
        const {
            id,
            name,
            description,
            type,
            isActive,
            workDays,
            totalHoursPerWeek,
            color,
            icon,
            timeForTimeSettings,
        } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Pattern ID is required" },
                { status: 400 }
            );
        }

        const pattern = await prisma.workPattern.update({
            where: { id },
            data: {
                name,
                description,
                type,
                isActive,
                workDays,
                totalHoursPerWeek,
                color,
                icon,
                timeForTimeSettings,
            },
            include: {
                _count: {
                    select: {
                        assignments: true,
                    },
                },
            },
        });

        return NextResponse.json({
            id: pattern.id,
            name: pattern.name,
            description: pattern.description || "",
            type: pattern.type,
            isActive: pattern.isActive,
            workDays: typeof pattern.workDays === 'string'
                ? JSON.parse(pattern.workDays)
                : (pattern.workDays || []),
            totalHoursPerWeek: pattern.totalHoursPerWeek || 0,
            createdAt: pattern.createdAt.toISOString(),
            updatedAt: pattern.updatedAt.toISOString(),
            assignedEmployees: pattern._count.assignments,
            color: pattern.color || "blue",
            icon: pattern.icon || "👔",
            timeForTimeSettings: typeof pattern.timeForTimeSettings === 'string'
                ? JSON.parse(pattern.timeForTimeSettings)
                : (pattern.timeForTimeSettings || null),
        });
    } catch (error) {
        console.error("Error updating pattern:", error);
        return NextResponse.json(
            { error: "Failed to update pattern" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Pattern ID is required" },
                { status: 400 }
            );
        }

        // Check if pattern has any assignments
        const assignmentCount = await prisma.workPatternAssignment.count({
            where: { patternId: id },
        });

        if (assignmentCount > 0) {
            return NextResponse.json(
                { error: "Cannot delete pattern with active assignments. Remove assignments first." },
                { status: 400 }
            );
        }

        await prisma.workPattern.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting pattern:", error);
        return NextResponse.json(
            { error: "Failed to delete pattern" },
            { status: 500 }
        );
    }
} 