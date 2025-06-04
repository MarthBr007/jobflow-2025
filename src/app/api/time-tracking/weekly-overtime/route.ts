import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { nl } from "date-fns/locale";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const weekStart = searchParams.get("weekStart");

        if (!weekStart) {
            return NextResponse.json({ error: "Week start date is required" }, { status: 400 });
        }

        const startDate = startOfWeek(new Date(weekStart), { weekStartsOn: 1 }); // Monday start
        const endDate = endOfWeek(startDate, { weekStartsOn: 1 });

        // Get all users with their work patterns
        const users = await prisma.user.findMany({
            where: {
                role: { in: ["EMPLOYEE", "FREELANCER", "MANAGER"] },
                archived: false,
            },
            include: {
                workPatternAssignments: {
                    where: {
                        isActive: true,
                        startDate: { lte: endDate },
                        OR: [
                            { endDate: null },
                            { endDate: { gte: startDate } }
                        ]
                    },
                    include: {
                        pattern: true
                    }
                },
                timeEntries: {
                    where: {
                        startTime: {
                            gte: startDate,
                            lte: endDate
                        },
                        endTime: { not: null }
                    }
                }
            }
        });

        // Process each user's weekly overtime
        const weeklyOvertimeData = await Promise.all(users.map(async (user) => {
            const currentPattern = user.workPatternAssignments[0]?.pattern;
            const timeForTimeSettings = currentPattern?.timeForTimeSettings ?
                (typeof currentPattern.timeForTimeSettings === 'string' ?
                    JSON.parse(currentPattern.timeForTimeSettings) :
                    currentPattern.timeForTimeSettings) : null;

            if (!timeForTimeSettings?.enabled) {
                return null; // Skip users without time-for-time enabled
            }

            // Calculate total worked hours for the week
            let totalWorkedHours = 0;
            let dailyEntries: any[] = [];

            user.timeEntries.forEach(entry => {
                if (entry.endTime) {
                    const startTime = new Date(entry.startTime);
                    const endTime = new Date(entry.endTime);
                    const hoursWorked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
                    const breakHours = (entry.totalBreakMinutes || 0) / 60;
                    const netHours = Math.max(0, hoursWorked - breakHours);

                    totalWorkedHours += netHours;

                    // Check if this day has overtime
                    const dayOvertime = Math.max(0, netHours - timeForTimeSettings.overtimeThreshold);

                    dailyEntries.push({
                        date: format(startTime, 'yyyy-MM-dd'),
                        startTime: entry.startTime,
                        endTime: entry.endTime,
                        totalHours: netHours,
                        overtimeHours: dayOvertime,
                        isWeekend: startTime.getDay() === 0 || startTime.getDay() === 6,
                        isEvening: startTime.getHours() >= 18 || endTime.getHours() >= 18,
                        isNight: (startTime.getHours() >= 22 || startTime.getHours() < 6) ||
                            (endTime.getHours() >= 22 || endTime.getHours() < 6),
                        entry: entry
                    });
                }
            });

            // Calculate weekly overtime
            const weeklyOvertimeThreshold = timeForTimeSettings.weeklyOvertimeThreshold || 40;
            const weeklyOvertime = Math.max(0, totalWorkedHours - weeklyOvertimeThreshold);

            // Calculate compensation earned
            let compensationEarned = 0;

            // Daily overtime compensation
            const dailyOvertimeTotal = dailyEntries.reduce((total, day) => total + day.overtimeHours, 0);
            compensationEarned += dailyOvertimeTotal * timeForTimeSettings.compensationMultiplier;

            // Weekend compensation
            if (timeForTimeSettings.weekendCompensation) {
                const weekendHours = dailyEntries
                    .filter(day => day.isWeekend)
                    .reduce((total, day) => total + day.totalHours, 0);
                compensationEarned += weekendHours * 0.5; // 50% extra for weekend
            }

            // Evening compensation
            if (timeForTimeSettings.eveningCompensation) {
                const eveningHours = dailyEntries
                    .filter(day => day.isEvening && !day.isWeekend)
                    .reduce((total, day) => total + day.totalHours, 0);
                compensationEarned += eveningHours * 0.25; // 25% extra for evening
            }

            // Night compensation
            if (timeForTimeSettings.nightCompensation) {
                const nightHours = dailyEntries
                    .filter(day => day.isNight)
                    .reduce((total, day) => total + day.totalHours, 0);
                compensationEarned += nightHours * 0.5; // 50% extra for night
            }

            // Weekly overtime compensation
            if (weeklyOvertime > 0) {
                compensationEarned += weeklyOvertime * timeForTimeSettings.compensationMultiplier;
            }

            return {
                userId: user.id,
                userName: user.name,
                email: user.email,
                workPattern: currentPattern?.name,
                timeForTimeSettings,
                weekPeriod: {
                    start: startDate,
                    end: endDate,
                    formatted: `${format(startDate, 'dd MMM', { locale: nl })} - ${format(endDate, 'dd MMM yyyy', { locale: nl })}`
                },
                summary: {
                    totalWorkedHours: Math.round(totalWorkedHours * 100) / 100,
                    weeklyOvertimeThreshold,
                    weeklyOvertime: Math.round(weeklyOvertime * 100) / 100,
                    dailyOvertimeTotal: Math.round(dailyOvertimeTotal * 100) / 100,
                    compensationEarned: Math.round(compensationEarned * 100) / 100,
                },
                dailyBreakdown: dailyEntries,
                needsApproval: compensationEarned > 0,
                autoApprovalEligible: compensationEarned > 0 && compensationEarned <= timeForTimeSettings.autoApprovalThreshold
            };
        }));

        // Filter out null results (users without time-for-time enabled)
        const validResults = weeklyOvertimeData.filter(data => data !== null);

        return NextResponse.json({
            weekPeriod: {
                start: startDate,
                end: endDate,
                formatted: `${format(startDate, 'dd MMM', { locale: nl })} - ${format(endDate, 'dd MMM yyyy', { locale: nl })}`
            },
            totalUsers: validResults.length,
            usersNeedingApproval: validResults.filter(user => user.needsApproval).length,
            autoApprovalEligible: validResults.filter(user => user.autoApprovalEligible).length,
            data: validResults
        });

    } catch (error) {
        console.error("Error fetching weekly overtime data:", error);
        return NextResponse.json(
            { error: "Failed to fetch weekly overtime data" },
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

        // Only managers and admins can approve overtime
        if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }

        const body = await request.json();
        const { approvals, weekStart } = body;

        if (!approvals || !Array.isArray(approvals) || !weekStart) {
            return NextResponse.json({
                error: "Approvals array and week start date are required"
            }, { status: 400 });
        }

        const startDate = startOfWeek(new Date(weekStart), { weekStartsOn: 1 });
        const endDate = endOfWeek(startDate, { weekStartsOn: 1 });

        const results = await Promise.all(approvals.map(async (approval: any) => {
            const { userId, approve, compensationHours, notes } = approval;

            try {
                // Get user's time entries for the week
                const timeEntries = await prisma.timeEntry.findMany({
                    where: {
                        userId,
                        startTime: {
                            gte: startDate,
                            lte: endDate
                        },
                        endTime: { not: null }
                    }
                });

                if (approve && compensationHours > 0) {
                    // Create compensation time entry
                    await prisma.timeEntry.create({
                        data: {
                            userId,
                            startTime: endDate, // Use end of week for compensation entry
                            endTime: new Date(endDate.getTime() + (compensationHours * 60 * 60 * 1000)),
                            description: `Tijd-voor-tijd compensatie - Week ${format(startDate, 'dd MMM', { locale: nl })} - ${format(endDate, 'dd MMM yyyy', { locale: nl })}`,
                            workType: 'COMPENSATION_EARNED',
                            notes: `Week ${format(startDate, 'dd MMM', { locale: nl })} - ${format(endDate, 'dd MMM yyyy', { locale: nl })}: ${compensationHours}u tijd-voor-tijd opgebouwd${notes ? ` - ${notes}` : ''}`,
                            approved: true,
                            approvedBy: session.user.id,
                            approvedAt: new Date(),
                        }
                    });

                    // Mark original time entries as processed for compensation
                    await prisma.timeEntry.updateMany({
                        where: {
                            id: { in: timeEntries.map(entry => entry.id) }
                        },
                        data: {
                            approved: true,
                            approvedBy: session.user.id,
                            approvedAt: new Date(),
                        }
                    });
                } else {
                    // Just mark as approved without compensation
                    await prisma.timeEntry.updateMany({
                        where: {
                            id: { in: timeEntries.map(entry => entry.id) }
                        },
                        data: {
                            approved: true,
                            approvedBy: session.user.id,
                            approvedAt: new Date(),
                        }
                    });
                }

                return {
                    userId,
                    success: true,
                    compensationAwarded: approve ? compensationHours : 0
                };

            } catch (error) {
                console.error(`Error processing approval for user ${userId}:`, error);
                return {
                    userId,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        }));

        const successCount = results.filter(r => r.success).length;
        const totalCompensation = results.reduce((total, r) => total + (r.compensationAwarded || 0), 0);

        return NextResponse.json({
            success: true,
            processed: results.length,
            successful: successCount,
            failed: results.length - successCount,
            totalCompensationAwarded: totalCompensation,
            results
        });

    } catch (error) {
        console.error("Error processing overtime approvals:", error);
        return NextResponse.json(
            { error: "Failed to process overtime approvals" },
            { status: 500 }
        );
    }
} 