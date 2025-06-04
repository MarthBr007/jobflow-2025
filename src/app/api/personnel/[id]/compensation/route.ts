import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    subMonths,
    format
} from "date-fns";

// Helper function to format duration
const formatDuration = (hours: number): string => {
    const h = Math.floor(Math.abs(hours));
    const m = Math.round((Math.abs(hours) - h) * 60);
    return `${h}u ${m}m`;
};

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "current_month";
        const userId = params.id;

        // Check if the requesting user has permission to view this employee's data
        const requestingUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });

        if (!requestingUser || !["ADMIN", "MANAGER", "HR_MANAGER"].includes(requestingUser.role)) {
            // If not admin/manager, only allow viewing own data
            if (session.user.id !== userId) {
                return NextResponse.json({ error: "Access denied" }, { status: 403 });
            }
        }

        // Determine date range based on period
        let startDate: Date;
        let endDate: Date;
        const now = new Date();

        switch (period) {
            case "current_week":
                startDate = startOfWeek(now, { weekStartsOn: 1 });
                endDate = endOfWeek(now, { weekStartsOn: 1 });
                break;
            case "current_month":
                startDate = startOfMonth(now);
                endDate = endOfMonth(now);
                break;
            case "last_month":
                const lastMonth = subMonths(now, 1);
                startDate = startOfMonth(lastMonth);
                endDate = endOfMonth(lastMonth);
                break;
            case "last_3_months":
                startDate = startOfMonth(subMonths(now, 2));
                endDate = endOfMonth(now);
                break;
            default:
                startDate = startOfMonth(now);
                endDate = endOfMonth(now);
        }

        // Fetch user's contract information
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                contractType: true,
                hourlyRate: true,
                monthlySalary: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Determine contract hours per week
        let contractHoursPerWeek = 40; // Default
        if (user.contractType === 'PERMANENT_PART_TIME' || user.contractType === 'TEMPORARY_PART_TIME') {
            contractHoursPerWeek = 32; // Part-time
        } else if (user.contractType === 'ZERO_HOURS') {
            contractHoursPerWeek = 0; // No minimum
        }

        // Fetch all time entries in the period
        const timeEntries = await prisma.timeEntry.findMany({
            where: {
                userId: userId,
                startTime: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { startTime: 'desc' },
        });

        // Calculate compensation data
        let totalAccrued = 0;
        let totalUsed = 0;
        let pendingRequests = 0;

        const breakdown = {
            overtimeHours: { total: 0, compensation: 0, formatted: "0u 0m" },
            weekendHours: { total: 0, compensation: 0, formatted: "0u 0m" },
            eveningHours: { total: 0, compensation: 0, formatted: "0u 0m" },
            nightHours: { total: 0, compensation: 0, formatted: "0u 0m" },
            holidayHours: { total: 0, compensation: 0, formatted: "0u 0m" },
        };

        const recentTransactions: any[] = [];

        // Process each time entry
        for (const entry of timeEntries) {
            if (!entry.endTime) continue;

            const startTime = new Date(entry.startTime);
            const endTime = new Date(entry.endTime);
            const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
            const hoursWorked = (totalMinutes - (entry.totalBreakMinutes || 0)) / 60;

            // Check for different types of compensation hours
            const isWeekend = startTime.getDay() === 0 || startTime.getDay() === 6;
            const isEvening = startTime.getHours() >= 18 || endTime.getHours() >= 18;
            const isNight = (startTime.getHours() >= 22 || startTime.getHours() < 6) ||
                (endTime.getHours() >= 22 || endTime.getHours() < 6);
            const isHoliday = false; // You can add holiday logic here

            if (entry.workType === 'COMPENSATION_USED') {
                // This is compensation being used
                totalUsed += hoursWorked;
                if (!entry.approved) {
                    pendingRequests += hoursWorked;
                }

                recentTransactions.push({
                    id: entry.id,
                    date: format(startTime, 'yyyy-MM-dd'),
                    type: 'USED',
                    hours: hoursWorked,
                    reason: entry.description || 'Compensatie opgenomen',
                    source: 'VACATION',
                    status: entry.approved ? 'APPROVED' : 'PENDING',
                    approvedBy: entry.approved ? 'System' : undefined,
                });
            } else {
                // Regular work - check for compensation accrual
                let compensationEarned = 0;

                if (isWeekend) {
                    breakdown.weekendHours.total += hoursWorked;
                    const weekendCompensation = hoursWorked * 0.5; // 50% extra for weekend
                    breakdown.weekendHours.compensation += weekendCompensation;
                    compensationEarned += weekendCompensation;
                    breakdown.weekendHours.formatted = formatDuration(breakdown.weekendHours.total);
                }

                if (isEvening && !isWeekend) {
                    breakdown.eveningHours.total += hoursWorked;
                    const eveningCompensation = hoursWorked * 0.25; // 25% extra for evening
                    breakdown.eveningHours.compensation += eveningCompensation;
                    compensationEarned += eveningCompensation;
                    breakdown.eveningHours.formatted = formatDuration(breakdown.eveningHours.total);
                }

                if (isNight) {
                    breakdown.nightHours.total += hoursWorked;
                    const nightCompensation = hoursWorked * 0.5; // 50% extra for night
                    breakdown.nightHours.compensation += nightCompensation;
                    compensationEarned += nightCompensation;
                    breakdown.nightHours.formatted = formatDuration(breakdown.nightHours.total);
                }

                if (isHoliday) {
                    breakdown.holidayHours.total += hoursWorked;
                    const holidayCompensation = hoursWorked * 1.0; // 100% extra for holidays
                    breakdown.holidayHours.compensation += holidayCompensation;
                    compensationEarned += holidayCompensation;
                    breakdown.holidayHours.formatted = formatDuration(breakdown.holidayHours.total);
                }

                // Check for overtime (daily or weekly)
                const dailyOvertime = Math.max(0, hoursWorked - 8);
                if (dailyOvertime > 0) {
                    breakdown.overtimeHours.total += dailyOvertime;
                    const overtimeCompensation = dailyOvertime * 1.0; // 100% compensation for overtime
                    breakdown.overtimeHours.compensation += overtimeCompensation;
                    compensationEarned += overtimeCompensation;
                    breakdown.overtimeHours.formatted = formatDuration(breakdown.overtimeHours.total);
                }

                if (compensationEarned > 0) {
                    totalAccrued += compensationEarned;

                    recentTransactions.push({
                        id: entry.id,
                        date: format(startTime, 'yyyy-MM-dd'),
                        type: 'ACCRUED',
                        hours: compensationEarned,
                        reason: `${formatDuration(hoursWorked)} gewerkt ${isWeekend ? '(weekend)' : ''} ${isEvening ? '(avond)' : ''} ${isNight ? '(nacht)' : ''}`,
                        source: isWeekend ? 'WEEKEND' : isEvening ? 'EVENING' : isNight ? 'NIGHT' : isHoliday ? 'HOLIDAY' : 'OVERTIME',
                        status: 'APPROVED',
                        approvedBy: 'System',
                    });
                }
            }
        }

        // Calculate current balance (this would normally come from a dedicated balance table)
        const currentBalance = totalAccrued - totalUsed;

        // Sort transactions by date (most recent first)
        recentTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const compensationData = {
            userId: userId,
            userName: user.name,
            currentBalance,
            totalAccrued,
            totalUsed,
            pendingRequests,
            breakdown,
            recentTransactions: recentTransactions.slice(0, 10), // Latest 10 transactions
            projectedBalance: currentBalance, // You can add projection logic here
            period: {
                start: format(startDate, 'yyyy-MM-dd'),
                end: format(endDate, 'yyyy-MM-dd'),
                label: period,
            },
        };

        return NextResponse.json({
            success: true,
            data: compensationData,
        });

    } catch (error) {
        console.error("Error fetching employee compensation data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 