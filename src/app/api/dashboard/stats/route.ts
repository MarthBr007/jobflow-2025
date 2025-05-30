import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const userRole = session.user.role;
        const isAdminOrManager = userRole === "ADMIN" || userRole === "MANAGER";

        if (isAdminOrManager) {
            // Admin/Manager stats
            const [
                activeProjects,
                totalPersonnel,
                scheduledShifts
            ] = await Promise.all([
                // Active projects count
                prisma.project.count({
                    where: { status: "ACTIVE" }
                }),

                // Total personnel count
                prisma.user.count({
                    where: {
                        role: {
                            in: ["FREELANCER", "MANAGER"]
                        }
                    }
                }),

                // Scheduled shifts this week
                prisma.scheduleShift.count({
                    where: {
                        startTime: {
                            gte: new Date(new Date().setDate(new Date().getDate() - 7)),
                            lte: new Date(new Date().setDate(new Date().getDate() + 7))
                        }
                    }
                })
            ]);

            // Calculate week hours manually
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - 7);

            const timeEntries = await prisma.timeEntry.findMany({
                where: {
                    startTime: {
                        gte: weekStart
                    },
                    endTime: {
                        not: null
                    }
                },
                select: {
                    startTime: true,
                    endTime: true
                }
            });

            const weekHours = timeEntries.reduce((total, entry) => {
                if (entry.endTime) {
                    const duration = (entry.endTime.getTime() - entry.startTime.getTime()) / (1000 * 60 * 60);
                    return total + duration;
                }
                return total;
            }, 0);

            return NextResponse.json({
                activeProjects,
                totalPersonnel,
                weekHours: Math.round(weekHours),
                scheduledShifts,
                myProjects: 0,
                availableProjects: 0
            });
        } else {
            // Employee/Freelancer stats
            const [
                myProjects,
                availableProjects
            ] = await Promise.all([
                // My assigned projects
                prisma.projectMember.count({
                    where: {
                        userId: userId,
                        project: {
                            status: "ACTIVE"
                        }
                    }
                }),

                // Available projects (not assigned to me)
                prisma.project.count({
                    where: {
                        status: "ACTIVE",
                        assignments: {
                            none: {
                                userId: userId
                            }
                        }
                    }
                })
            ]);

            return NextResponse.json({
                activeProjects: 0,
                totalPersonnel: 0,
                weekHours: 0,
                scheduledShifts: 0,
                myProjects,
                availableProjects
            });
        }
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard stats" },
            { status: 500 }
        );
    }
} 