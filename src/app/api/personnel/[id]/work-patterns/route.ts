import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/personnel/[id]/work-patterns - Get work patterns for employee
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get current and historical work pattern assignments for employee
        const assignments = await prisma.workPatternAssignment.findMany({
            where: {
                userId: params.id,
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

        // Get all available patterns for assignment
        const availablePatterns = await prisma.workPattern.findMany({
            where: {
                isActive: true,
            },
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
            orderBy: {
                name: 'asc',
            },
        });

        // Safe JSON parsing function
        const safeParseWorkDays = (workDays: any) => {
            if (typeof workDays === 'string') {
                try {
                    return JSON.parse(workDays);
                } catch (error) {
                    console.error('Error parsing workDays JSON:', error);
                    return []; // Return empty array as fallback
                }
            }
            return workDays || [];
        };

        return NextResponse.json({
            currentAssignments: assignments.filter(a => a.isActive).map(assignment => ({
                ...assignment,
                pattern: {
                    ...assignment.pattern,
                    workDays: safeParseWorkDays(assignment.pattern.workDays)
                }
            })),
            historicalAssignments: assignments.filter(a => !a.isActive).map(assignment => ({
                ...assignment,
                pattern: {
                    ...assignment.pattern,
                    workDays: safeParseWorkDays(assignment.pattern.workDays)
                }
            })),
            availablePatterns: availablePatterns.map(pattern => ({
                ...pattern,
                workDays: safeParseWorkDays(pattern.workDays)
            })),
        });

    } catch (error) {
        console.error("Error fetching work patterns:", error);
        return NextResponse.json(
            { error: "Failed to fetch work patterns" },
            { status: 500 }
        );
    }
}

// POST /api/personnel/[id]/work-patterns - Assign work pattern to employee
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }

        const body = await request.json();
        const { patternId, startDate, endDate, replaceExisting = true, notes } = body;

        if (!patternId) {
            return NextResponse.json(
                { error: "Pattern ID is required" },
                { status: 400 }
            );
        }

        // Verify the pattern exists
        const pattern = await prisma.workPattern.findUnique({
            where: { id: patternId },
        });

        if (!pattern) {
            return NextResponse.json(
                { error: "Pattern not found" },
                { status: 404 }
            );
        }

        // Verify the employee exists
        const employee = await prisma.user.findUnique({
            where: { id: params.id },
        });

        if (!employee) {
            return NextResponse.json(
                { error: "Employee not found" },
                { status: 404 }
            );
        }

        // If replaceExisting is true, deactivate current assignments
        if (replaceExisting) {
            await prisma.workPatternAssignment.updateMany({
                where: {
                    userId: params.id,
                    isActive: true,
                },
                data: {
                    isActive: false,
                    endDate: new Date(),
                },
            });
        }

        // Create new assignment
        const assignment = await prisma.workPatternAssignment.create({
            data: {
                userId: params.id,
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
            message: `Werkpatroon "${pattern.name}" toegewezen aan ${employee.name}`,
        });

    } catch (error) {
        console.error("Error assigning work pattern:", error);
        return NextResponse.json(
            { error: "Failed to assign work pattern" },
            { status: 500 }
        );
    }
}

// DELETE /api/personnel/[id]/work-patterns - Remove work pattern assignment
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const assignmentId = searchParams.get("assignmentId");

        if (!assignmentId) {
            return NextResponse.json(
                { error: "Assignment ID is required" },
                { status: 400 }
            );
        }

        // Deactivate the assignment
        const assignment = await prisma.workPatternAssignment.update({
            where: { id: assignmentId },
            data: {
                isActive: false,
                endDate: new Date(),
            },
            include: {
                pattern: { select: { name: true } },
                user: { select: { name: true } },
            },
        });

        return NextResponse.json({
            success: true,
            message: `Werkpatroon "${assignment.pattern.name}" verwijderd van ${assignment.user.name}`,
        });

    } catch (error) {
        console.error("Error removing work pattern assignment:", error);
        return NextResponse.json(
            { error: "Failed to remove work pattern assignment" },
            { status: 500 }
        );
    }
} 