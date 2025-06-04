import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { format } from "date-fns";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { date, hours, reason, type } = body;

        // Validate input
        if (!date || !hours || hours <= 0) {
            return NextResponse.json(
                { error: "Datum en uren zijn verplicht" },
                { status: 400 }
            );
        }

        if (hours > 8) {
            return NextResponse.json(
                { error: "Maximaal 8 uur per dag toegestaan" },
                { status: 400 }
            );
        }

        // Parse the date
        const requestDate = new Date(date);
        if (requestDate < new Date()) {
            return NextResponse.json(
                { error: "Kan geen verlof aanvragen voor verleden datums" },
                { status: 400 }
            );
        }

        // Check if there's already a request for this date
        const existingRequest = await prisma.timeEntry.findFirst({
            where: {
                userId: session.user.id,
                startTime: {
                    gte: new Date(date + 'T00:00:00'),
                    lt: new Date(date + 'T23:59:59'),
                },
                workType: 'COMPENSATION_USED',
            },
        });

        if (existingRequest) {
            return NextResponse.json(
                { error: "Er bestaat al een compensatie aanvraag voor deze datum" },
                { status: 400 }
            );
        }

        // Calculate current compensation balance
        // This would ideally be stored in a separate balance table for performance
        const allTimeEntries = await prisma.timeEntry.findMany({
            where: {
                userId: session.user.id,
                endTime: { not: null },
            },
        });

        let totalAccrued = 0;
        let totalUsed = 0;

        for (const entry of allTimeEntries) {
            const startTime = new Date(entry.startTime);
            const endTime = new Date(entry.endTime!);
            const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
            const hoursWorked = (totalMinutes - (entry.totalBreakMinutes || 0)) / 60;

            if (entry.workType === 'COMPENSATION_USED') {
                totalUsed += hoursWorked;
            } else {
                // Check for compensation earning conditions
                const isWeekend = startTime.getDay() === 0 || startTime.getDay() === 6;
                const isEvening = startTime.getHours() >= 18 || endTime.getHours() >= 18;
                const isNight = (startTime.getHours() >= 22 || startTime.getHours() < 6) ||
                    (endTime.getHours() >= 22 || endTime.getHours() < 6);

                let compensationEarned = 0;

                // Weekend compensation (50% extra)
                if (isWeekend) {
                    compensationEarned += hoursWorked * 0.5;
                }

                // Evening compensation (25% extra, not on weekends)
                if (isEvening && !isWeekend) {
                    compensationEarned += hoursWorked * 0.25;
                }

                // Night compensation (50% extra)
                if (isNight) {
                    compensationEarned += hoursWorked * 0.5;
                }

                // Overtime compensation (daily > 8 hours = 100% compensation)
                const dailyOvertime = Math.max(0, hoursWorked - 8);
                if (dailyOvertime > 0) {
                    compensationEarned += dailyOvertime * 1.0;
                }

                totalAccrued += compensationEarned;
            }
        }

        const currentBalance = totalAccrued - totalUsed;

        // Check if user has enough compensation hours
        if (hours > currentBalance) {
            const formatDuration = (h: number): string => {
                const hours = Math.floor(Math.abs(h));
                const minutes = Math.round((Math.abs(h) - hours) * 60);
                return `${hours}u ${minutes}m`;
            };

            return NextResponse.json(
                {
                    error: `Niet genoeg compensatie uren. Beschikbaar: ${formatDuration(currentBalance)}, Aangevraagd: ${formatDuration(hours)}`
                },
                { status: 400 }
            );
        }

        // Create the compensation request
        const startDateTime = new Date(date + 'T09:00:00'); // Default start at 9 AM
        const endDateTime = new Date(startDateTime.getTime() + (hours * 60 * 60 * 1000)); // Add hours

        const compensationRequest = await prisma.timeEntry.create({
            data: {
                userId: session.user.id,
                startTime: startDateTime,
                endTime: endDateTime,
                description: reason || `Compensatie verlof - ${type === 'FULL_DAY' ? 'Hele dag' : type === 'HALF_DAY' ? 'Halve dag' : 'Aangepast'}`,
                workType: 'COMPENSATION_USED',
                approved: false, // Requires approval
                projectId: null,
                isWarehouse: false,
                totalBreakMinutes: 0,
                hoursWorked: hours,
                isCompensationUsed: true,
            },
        });

        // Fetch user info for notification (you can extend this later)
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { name: true, email: true },
        });

        const formatDuration = (h: number): string => {
            const hours = Math.floor(Math.abs(h));
            const minutes = Math.round((Math.abs(h) - hours) * 60);
            return `${hours}u ${minutes}m`;
        };

        return NextResponse.json({
            success: true,
            message: `Compensatie verlof aangevraagd voor ${format(requestDate, 'dd-MM-yyyy')}`,
            data: {
                requestId: compensationRequest.id,
                date: format(requestDate, 'yyyy-MM-dd'),
                hours: hours,
                formattedHours: formatDuration(hours),
                remainingBalance: currentBalance - hours,
                formattedRemainingBalance: formatDuration(currentBalance - hours),
                status: 'PENDING',
                requiresApproval: true,
                description: compensationRequest.description,
            },
        });

    } catch (error) {
        console.error("Error creating compensation request:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 