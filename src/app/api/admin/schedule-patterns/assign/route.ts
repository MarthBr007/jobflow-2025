import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
        const { patternId, employeeIds, startDate, endDate, replaceExisting = true } = body;

        if (!patternId || !employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
            return NextResponse.json(
                { error: "Pattern ID and employee IDs are required" },
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

        // Verify all employees exist
        const employees = await prisma.user.findMany({
            where: {
                id: { in: employeeIds },
                role: { in: ["EMPLOYEE", "FREELANCER"] },
            },
        });

        if (employees.length !== employeeIds.length) {
            return NextResponse.json(
                { error: "One or more employees not found or invalid" },
                { status: 400 }
            );
        }

        const results = [];
        const errors = [];

        // Process each employee assignment
        for (const employee of employees) {
            try {
                // If replaceExisting is true, deactivate current assignments
                if (replaceExisting) {
                    await prisma.workPatternAssignment.updateMany({
                        where: {
                            userId: employee.id,
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
                        userId: employee.id,
                        patternId: patternId,
                        startDate: startDate ? new Date(startDate) : new Date(),
                        endDate: endDate ? new Date(endDate) : null,
                        isActive: true,
                        assignedById: session.user.id,
                        notes: `Toegewezen via bulk-toewijzing op ${new Date().toLocaleDateString('nl-NL')}`,
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                        pattern: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                totalHoursPerWeek: true,
                            },
                        },
                    },
                });

                results.push({
                    employeeId: employee.id,
                    employeeName: employee.name,
                    assignmentId: assignment.id,
                    success: true,
                });

                // Note: Audit logging would be implemented here if needed

            } catch (error) {
                console.error(`Error assigning pattern to employee ${employee.id}:`, error);
                errors.push({
                    employeeId: employee.id,
                    employeeName: employee.name,
                    error: "Failed to create assignment",
                });
            }
        }

        return NextResponse.json({
            success: true,
            pattern: {
                id: pattern.id,
                name: pattern.name,
                type: pattern.type,
            },
            results,
            errors,
            summary: {
                total: employeeIds.length,
                successful: results.length,
                failed: errors.length,
            },
        });

    } catch (error) {
        console.error("Error assigning pattern:", error);
        return NextResponse.json(
            { error: "Failed to assign pattern" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const patternId = searchParams.get("patternId");
        const userId = searchParams.get("userId");

        let whereClause: any = {
            isActive: true,
        };

        if (patternId) {
            whereClause.patternId = patternId;
        }

        if (userId) {
            whereClause.userId = userId;
        }

        const assignments = await prisma.workPatternAssignment.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        employeeType: true,
                        profileImage: true,
                    },
                },
                pattern: {
                    select: {
                        id: true,
                        name: true,
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
                    },
                },
            },
            orderBy: {
                startDate: "desc",
            },
        });

        const formattedAssignments = assignments.map((assignment) => ({
            id: assignment.id,
            startDate: assignment.startDate.toISOString(),
            endDate: assignment.endDate?.toISOString() || null,
            isActive: assignment.isActive,
            notes: assignment.notes,
            createdAt: assignment.createdAt.toISOString(),
            user: assignment.user,
            pattern: assignment.pattern,
            assignedBy: assignment.assignedBy,
        }));

        return NextResponse.json(formattedAssignments);

    } catch (error) {
        console.error("Error fetching pattern assignments:", error);
        return NextResponse.json(
            { error: "Failed to fetch assignments" },
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

        if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }

        const body = await request.json();
        const { assignmentIds, userId, patternId } = body;

        let whereClause: any = {};

        if (assignmentIds && Array.isArray(assignmentIds)) {
            whereClause.id = { in: assignmentIds };
        } else if (userId && patternId) {
            whereClause = {
                userId,
                patternId,
                isActive: true,
            };
        } else if (userId) {
            whereClause = {
                userId,
                isActive: true,
            };
        } else {
            return NextResponse.json(
                { error: "Assignment IDs, user ID, or pattern ID required" },
                { status: 400 }
            );
        }

        // Mark assignments as inactive instead of deleting them
        const updatedAssignments = await prisma.workPatternAssignment.updateMany({
            where: whereClause,
            data: {
                isActive: false,
                endDate: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            deactivatedCount: updatedAssignments.count,
        });

    } catch (error) {
        console.error("Error removing pattern assignments:", error);
        return NextResponse.json(
            { error: "Failed to remove assignments" },
            { status: 500 }
        );
    }
} 