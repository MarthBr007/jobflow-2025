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

        // Get current user to filter by company
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: {
                id: true,
                company: true,
                role: true
            },
        });

        if (!currentUser || !currentUser.company) {
            return NextResponse.json({ error: "User or company not found" }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const date = searchParams.get("date");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        // Support both single date and date range queries
        if (!date && (!startDate || !endDate)) {
            return NextResponse.json({ error: "Date parameter or date range (startDate & endDate) required" }, { status: 400 });
        }

        if (date) {
            // Single date query (existing logic)
            const targetDate = new Date(date);
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);

            // Admin and Manager can see all schedules, Employee/Freelancer only their own
            const isAdminOrManager = currentUser.role === "ADMIN" || currentUser.role === "MANAGER";

            // Find schedule for the date
            let schedule = await prisma.schedule.findUnique({
                where: {
                    date: startOfDay,
                },
                include: {
                    shifts: {
                        where: {
                            AND: [
                                {
                                    user: {
                                        company: currentUser.company,
                                    },
                                },
                                // If not admin/manager, only show user's own shifts
                                ...(isAdminOrManager ? [] : [{ userId: currentUser.id }])
                            ]
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
                        orderBy: {
                            startTime: "asc",
                        },
                    },
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            if (!schedule) {
                return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
            }

            return NextResponse.json(schedule);
        } else {
            // Date range query (new logic for week view)
            const startOfRange = new Date(startDate!);
            startOfRange.setHours(0, 0, 0, 0);
            const endOfRange = new Date(endDate!);
            endOfRange.setHours(23, 59, 59, 999);

            // Admin and Manager can see all schedules, Employee/Freelancer only their own
            const isAdminOrManager = currentUser.role === "ADMIN" || currentUser.role === "MANAGER";

            // Find all schedules in the date range
            const schedules = await prisma.schedule.findMany({
                where: {
                    date: {
                        gte: startOfRange,
                        lte: endOfRange,
                    },
                },
                include: {
                    shifts: {
                        where: {
                            AND: [
                                {
                                    user: {
                                        company: currentUser.company,
                                    },
                                },
                                // If not admin/manager, only show user's own shifts
                                ...(isAdminOrManager ? [] : [{ userId: currentUser.id }])
                            ]
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
                        orderBy: {
                            startTime: "asc",
                        },
                    },
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    date: "asc",
                },
            });

            return NextResponse.json(schedules);
        }
    } catch (error) {
        console.error("Error fetching schedule:", error);
        return NextResponse.json(
            { error: "Internal server error" },
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

        // Check if user is admin or manager
        if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get current user to filter by company
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { company: true },
        });

        if (!currentUser || !currentUser.company) {
            return NextResponse.json({ error: "User or company not found" }, { status: 404 });
        }

        const body = await request.json();
        const { date, title, description } = body;

        if (!date) {
            return NextResponse.json({ error: "Date is required" }, { status: 400 });
        }

        // Parse the date and create start of day
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        // Create or update schedule
        const schedule = await prisma.schedule.upsert({
            where: {
                date: startOfDay,
            },
            update: {
                title,
                description,
            },
            create: {
                date: startOfDay,
                title,
                description,
                createdById: session.user.id,
            },
            include: {
                shifts: {
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
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json(schedule);
    } catch (error) {
        console.error("Error creating/updating schedule:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 