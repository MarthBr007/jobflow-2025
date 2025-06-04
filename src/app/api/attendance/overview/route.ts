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
    format,
    startOfDay,
    endOfDay
} from "date-fns";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user has permission to view attendance data
        const requestingUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });

        if (!requestingUser || !["ADMIN", "MANAGER", "HR_MANAGER"].includes(requestingUser.role)) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "current_month";

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

        // Fetch all active users
        const users = await prisma.user.findMany({
            where: {
                archived: false,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                contractType: true,
                hourlyRate: true,
                monthlySalary: true,
            },
        });

        const employees = [];
        let currentlyWorking = 0;
        let onLeave = 0;
        let totalCompensationRequests = 0;

        // Process each employee
        for (const user of users) {
            // Fetch time entries for this period
            const timeEntries = await prisma.timeEntry.findMany({
                where: {
                    userId: user.id,
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
            let workingHoursWeek = 0;
            let workingHoursToday = 0;

            // Check current status
            const today = new Date();
            const todayStart = startOfDay(today);
            const todayEnd = endOfDay(today);

            const todayEntries = await prisma.timeEntry.findMany({
                where: {
                    userId: user.id,
                    startTime: {
                        gte: todayStart,
                        lte: todayEnd,
                    },
                },
            });

            // Check if currently working (has an active time entry today)
            const activeEntry = todayEntries.find(entry => !entry.endTime);
            let status: 'WORKING' | 'ON_LEAVE' | 'OFFLINE' | 'SICK' = 'OFFLINE';

            if (activeEntry) {
                status = 'WORKING';
                currentlyWorking++;
            } else {
                // Check for leave requests or sick days
                const leaveToday = todayEntries.find(entry =>
                    entry.workType === 'COMPENSATION_USED' ||
                    entry.workType === 'SICK_LEAVE' ||
                    entry.workType === 'VACATION'
                );

                if (leaveToday) {
                    if (leaveToday.workType === 'SICK_LEAVE') {
                        status = 'SICK';
                    } else {
                        status = 'ON_LEAVE';
                        onLeave++;
                    }
                }
            }

            // Calculate working hours for today
            for (const entry of todayEntries) {
                if (entry.endTime) {
                    const startTime = new Date(entry.startTime);
                    const endTime = new Date(entry.endTime);
                    const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
                    const hoursWorked = (totalMinutes - (entry.totalBreakMinutes || 0)) / 60;
                    workingHoursToday += hoursWorked;
                }
            }

            // Calculate working hours for this week
            const weekStart = startOfWeek(today, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

            const weekEntries = await prisma.timeEntry.findMany({
                where: {
                    userId: user.id,
                    startTime: {
                        gte: weekStart,
                        lte: weekEnd,
                    },
                },
            });

            for (const entry of weekEntries) {
                if (entry.endTime) {
                    const startTime = new Date(entry.startTime);
                    const endTime = new Date(entry.endTime);
                    const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
                    const hoursWorked = (totalMinutes - (entry.totalBreakMinutes || 0)) / 60;
                    workingHoursWeek += hoursWorked;
                }
            }

            // Process time entries for compensation calculation
            for (const entry of timeEntries) {
                if (!entry.endTime) continue;

                const startTime = new Date(entry.startTime);
                const endTime = new Date(entry.endTime);
                const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
                const hoursWorked = (totalMinutes - (entry.totalBreakMinutes || 0)) / 60;

                if (entry.workType === 'COMPENSATION_USED') {
                    totalUsed += hoursWorked;
                    if (!entry.approved) {
                        pendingRequests += hoursWorked;
                        totalCompensationRequests++;
                    }
                } else {
                    // Calculate compensation earned
                    const isWeekend = startTime.getDay() === 0 || startTime.getDay() === 6;
                    const isEvening = startTime.getHours() >= 18 || endTime.getHours() >= 18;
                    const isNight = (startTime.getHours() >= 22 || startTime.getHours() < 6) ||
                        (endTime.getHours() >= 22 || endTime.getHours() < 6);

                    let compensationEarned = 0;

                    if (isWeekend) {
                        compensationEarned += hoursWorked * 0.5; // 50% extra for weekend
                    }
                    if (isEvening && !isWeekend) {
                        compensationEarned += hoursWorked * 0.25; // 25% extra for evening
                    }
                    if (isNight) {
                        compensationEarned += hoursWorked * 0.5; // 50% extra for night
                    }

                    // Check for overtime (daily)
                    const dailyOvertime = Math.max(0, hoursWorked - 8);
                    if (dailyOvertime > 0) {
                        compensationEarned += dailyOvertime * 1.0; // 100% compensation for overtime
                    }

                    totalAccrued += compensationEarned;
                }
            }

            const currentBalance = totalAccrued - totalUsed;

            // Determine expected hours per week based on contract
            let expectedHoursWeek = 40; // Default
            if (user.contractType === 'PERMANENT_PART_TIME' || user.contractType === 'TEMPORARY_PART_TIME') {
                expectedHoursWeek = 32; // Part-time
            } else if (user.contractType === 'ZERO_HOURS') {
                expectedHoursWeek = 0; // No minimum
            }

            // Get last activity
            const lastEntry = timeEntries[0];
            const lastActivity = lastEntry ? format(new Date(lastEntry.startTime), 'yyyy-MM-dd HH:mm') : undefined;

            employees.push({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status,
                currentBalance,
                totalAccrued,
                totalUsed,
                pendingRequests,
                lastActivity,
                workingHoursToday,
                workingHoursWeek,
                expectedHoursWeek,
            });
        }

        const attendanceData = {
            totalEmployees: users.length,
            currentlyWorking,
            onLeave,
            compensationRequests: totalCompensationRequests,
            employees: employees.sort((a, b) => (a.name || '').localeCompare(b.name || '')),
            period: {
                start: format(startDate, 'yyyy-MM-dd'),
                end: format(endDate, 'yyyy-MM-dd'),
                label: period,
            },
        };

        return NextResponse.json({
            success: true,
            data: attendanceData,
        });

    } catch (error) {
        console.error("Error fetching attendance overview:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 