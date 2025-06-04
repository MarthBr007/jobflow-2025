import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    subMonths,
    format,
    startOfDay,
    endOfDay,
    isToday
} from "date-fns";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = params.id;
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
            case "current_year":
                startDate = startOfYear(now);
                endDate = endOfYear(now);
                break;
            default:
                startDate = startOfMonth(now);
                endDate = endOfMonth(now);
        }

        // Get leave balance data from database
        const currentYear = new Date().getFullYear();
        const leaveBalance = await prisma.leaveBalance.findFirst({
            where: {
                userId,
                year: currentYear,
            },
        });

        // Calculate leave balance info
        const leaveBalanceData = leaveBalance ? {
            vacationDays: {
                total: leaveBalance.vacationDaysTotal,
                used: leaveBalance.vacationDaysUsed,
                remaining: leaveBalance.vacationDaysRemaining,
            },
            sickDays: {
                used: leaveBalance.sickDaysUsed,
            },
            compensationTime: {
                available: leaveBalance.compensationHours,
                used: leaveBalance.compensationUsed,
                remaining: leaveBalance.compensationHours - leaveBalance.compensationUsed,
            },
        } : {
            // Default values if no balance record exists
            vacationDays: {
                total: 25,
                used: 0,
                remaining: 25,
            },
            sickDays: {
                used: 0,
            },
            compensationTime: {
                available: 0,
                used: 0,
                remaining: 0,
            },
        };

        // Mock data for attendance with leave balance and comprehensive information
        const attendanceData = {
            userId: userId,
            userName: "Test User",
            currentStatus: "WORKING",
            workingHoursToday: 6.5,
            workingHoursWeek: 32.25,
            absentDays: 2,
            period,
            periodStart: startDate,
            periodEnd: endDate,

            // Leave balance information
            leaveBalance: leaveBalanceData,

            // Period totals
            periodTotals: {
                currentWeek: {
                    regularHours: 32.25,
                    overtimeHours: 2.5,
                    compensationEarned: 3.75
                },
                currentMonth: {
                    regularHours: 128.75,
                    overtimeHours: 8.5,
                    compensationEarned: 12.75
                },
                lastMonth: {
                    regularHours: 142.5,
                    overtimeHours: 12.25,
                    compensationEarned: 18.33
                },
                currentYear: {
                    regularHours: 1456,
                    overtimeHours: 87.75,
                    compensationEarned: 131.17
                }
            },

            // Recent time entries (last 10 days)
            recentEntries: [
                {
                    date: "2025-01-13",
                    startTime: "08:30",
                    endTime: "17:15",
                    totalHours: 8.75,
                    workType: "Regulier werk",
                    isOvertime: false
                },
                {
                    date: "2025-01-12",
                    startTime: "08:00",
                    endTime: "16:30",
                    totalHours: 8.5,
                    workType: "Regulier werk",
                    isOvertime: false
                },
                {
                    date: "2025-01-11",
                    startTime: "08:30",
                    endTime: "18:45",
                    totalHours: 10.25,
                    workType: "Project werk",
                    isOvertime: true,
                    overtimeHours: 2.25
                },
                {
                    date: "2025-01-10",
                    startTime: "09:00",
                    endTime: "17:00",
                    totalHours: 8,
                    workType: "Regulier werk",
                    isOvertime: false
                },
                {
                    date: "2025-01-09",
                    startTime: "08:30",
                    endTime: "16:30",
                    totalHours: 8,
                    workType: "Regulier werk",
                    isOvertime: false
                }
            ],

            // Leave requests
            leaveRequests: [
                {
                    id: "lr_001",
                    type: "VACATION",
                    startDate: "2025-01-20",
                    endDate: "2025-01-24",
                    duration: 40, // hours (5 days)
                    status: "APPROVED",
                    reason: "Vakantie"
                },
                {
                    id: "lr_002",
                    type: "SICK",
                    startDate: "2025-01-08",
                    endDate: "2025-01-08",
                    duration: 8, // hours (1 day)
                    status: "APPROVED",
                    reason: "Ziek"
                },
                {
                    id: "lr_003",
                    type: "COMPENSATION",
                    startDate: "2025-01-15",
                    endDate: "2025-01-15",
                    duration: 8, // hours (1 day)
                    status: "PENDING",
                    reason: "Compensatie verlof"
                }
            ]
        };

        return NextResponse.json({
            success: true,
            data: attendanceData,
        });

    } catch (error) {
        console.error("Error fetching attendance data:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Internal server error"
            },
            { status: 500 }
        );
    }
} 