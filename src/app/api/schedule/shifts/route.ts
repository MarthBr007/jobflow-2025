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

        // Check if user is admin or manager
        if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { userId, projectId, startTime, endTime, role, notes, date, breaks } = body;

        if (!userId || !startTime || !endTime || !date) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Parse the date and create start of day
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        // Find or create schedule for the date
        let schedule = await prisma.schedule.findUnique({
            where: {
                date: startOfDay,
            },
        });

        if (!schedule) {
            schedule = await prisma.schedule.create({
                data: {
                    date: startOfDay,
                    createdById: session.user.id,
                },
            });
        }

        // Check for overlapping shifts for the same user
        const overlappingShift = await prisma.scheduleShift.findFirst({
            where: {
                userId,
                scheduleId: schedule.id,
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

        // Create the shift
        const shift = await prisma.scheduleShift.create({
            data: {
                scheduleId: schedule.id,
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

        return NextResponse.json(shift);
    } catch (error) {
        console.error("Error creating shift:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 