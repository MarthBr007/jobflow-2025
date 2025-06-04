import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { startOfYear, endOfYear, format, parseISO, startOfMonth, endOfMonth } from 'date-fns';

const prisma = new PrismaClient();

// Vacation accrual calculation utility
class VacationAccrualCalculator {

    // Calculate vacation hours per year based on contract hours and employee type
    static calculateVacationEntitlement(contractHoursPerWeek: number, employeeType: string): number {
        switch (employeeType) {
            case 'PERMANENT_FULL_TIME':
            case 'PERMANENT_PART_TIME':
            case 'TEMPORARY_FULL_TIME':
            case 'TEMPORARY_PART_TIME':
                // 4 weeks vacation = 4 * contract hours per week
                return 4 * contractHoursPerWeek;

            case 'FLEX_WORKER':
                // Oproepkrachten: 8% vakantiegeld maar ook vakantie-uren
                // Berekend op basis van gemiddelde uren, but still 4 weeks equivalent
                return 4 * contractHoursPerWeek;

            case 'FREELANCER':
                // Freelancers bouwen geen vakantiedagen op
                return 0;

            case 'ZERO_HOURS':
                // 0-urencontract: berekening op basis van daadwerkelijk gewerkte uren
                // 8% regel: vakantie_uren_per_jaar = gewerkte_uren * 0.08
                // Dit wordt dynamisch berekend
                return 0; // Will be calculated based on actual hours worked

            default:
                return 4 * contractHoursPerWeek;
        }
    }

    // Calculate vacation accrual per worked hour
    static calculateAccrualPerHour(contractHoursPerWeek: number, employeeType: string): number {
        const vacationHoursPerYear = this.calculateVacationEntitlement(contractHoursPerWeek, employeeType);

        if (employeeType === 'ZERO_HOURS') {
            // Voor 0-urencontracten: 8% van gewerkte uren
            return 0.08; // 8% = 0.08
        }

        if (vacationHoursPerYear === 0) {
            return 0; // Freelancers
        }

        // Normale berekening: vakantie_uren_per_jaar / (contract_uren_per_week * 52)
        const contractHoursPerYear = contractHoursPerWeek * 52;
        return vacationHoursPerYear / contractHoursPerYear;
    }

    // Get contract hours from work pattern
    static getContractHoursFromWorkPattern(workPattern: any): number {
        if (!workPattern?.totalHoursPerWeek) {
            return 40; // Default fallback
        }
        return workPattern.totalHoursPerWeek;
    }

    // Get contract type based on employee type and contract
    static mapEmployeeTypeToContractType(employeeType: string): string {
        const mapping: { [key: string]: string } = {
            'PERMANENT': 'PERMANENT_FULL_TIME',
            'FREELANCER': 'FREELANCE',
            'FLEX_WORKER': 'ZERO_HOURS',
        };
        return mapping[employeeType] || 'PERMANENT_FULL_TIME';
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admins can trigger recalculation
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, company: true },
        });

        if (!currentUser || !["ADMIN", "MANAGER"].includes(currentUser.role)) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const body = await request.json();
        const { userId, year = new Date().getFullYear(), recalculateAll = false } = body;

        const startDate = startOfYear(new Date(year, 0, 1));
        const endDate = endOfYear(new Date(year, 0, 1));

        // Get user(s) to calculate for
        let users;
        if (userId) {
            users = await prisma.user.findMany({
                where: {
                    id: userId,
                    company: currentUser.company,
                    archived: false
                },
                include: {
                    workPatternAssignments: {
                        where: { isActive: true },
                        include: { pattern: true },
                        take: 1
                    }
                }
            });
        } else if (recalculateAll) {
            users = await prisma.user.findMany({
                where: {
                    company: currentUser.company,
                    archived: false,
                    role: { in: ["EMPLOYEE", "MANAGER", "FREELANCER"] }
                },
                include: {
                    workPatternAssignments: {
                        where: { isActive: true },
                        include: { pattern: true },
                        take: 1
                    }
                }
            });
        } else {
            return NextResponse.json({ error: "Either userId or recalculateAll must be specified" }, { status: 400 });
        }

        const results = [];

        for (const user of users) {
            try {
                // Get current work pattern
                const currentPattern = user.workPatternAssignments[0]?.pattern;
                const contractHoursPerWeek = VacationAccrualCalculator.getContractHoursFromWorkPattern(currentPattern);
                const contractType = VacationAccrualCalculator.mapEmployeeTypeToContractType(user.employeeType || 'PERMANENT');

                // Skip freelancers if they don't accrue vacation
                if ((user.employeeType || 'PERMANENT') === 'FREELANCER') {
                    results.push({
                        userId: user.id,
                        userName: user.name,
                        success: true,
                        message: "Freelancers don't accrue vacation hours",
                        accrualData: null
                    });
                    continue;
                }

                // Get all time entries for the year
                const timeEntries = await prisma.timeEntry.findMany({
                    where: {
                        userId: user.id,
                        startTime: { gte: startDate, lte: endDate },
                        endTime: { not: null },
                        workType: { in: ['REGULAR', 'OVERTIME'] } // Only count actual work
                    },
                    orderBy: { startTime: 'asc' }
                });

                // Calculate total hours worked
                let totalHoursWorked = 0;
                const monthlyData: { [key: string]: { hoursWorked: number; vacationAccrued: number } } = {};

                for (const entry of timeEntries) {
                    const startTime = new Date(entry.startTime);
                    const endTime = new Date(entry.endTime!);
                    const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
                    const hoursWorked = Math.max(0, (totalMinutes - (entry.totalBreakMinutes || 0)) / 60);

                    totalHoursWorked += hoursWorked;

                    // Track monthly data
                    const monthKey = format(startTime, 'yyyy-MM');
                    if (!monthlyData[monthKey]) {
                        monthlyData[monthKey] = { hoursWorked: 0, vacationAccrued: 0 };
                    }
                    monthlyData[monthKey].hoursWorked += hoursWorked;
                }

                // Calculate vacation accrual
                const accrualPerHour = VacationAccrualCalculator.calculateAccrualPerHour(contractHoursPerWeek, user.employeeType || 'PERMANENT');
                let totalVacationAccrued = 0;

                // For each month, calculate accrual
                for (const [monthKey, monthData] of Object.entries(monthlyData)) {
                    if ((user.employeeType || 'PERMANENT') === 'FLEX_WORKER') {
                        // 8% rule for flex workers (oproepkrachten)
                        monthData.vacationAccrued = monthData.hoursWorked * 0.08;
                    } else {
                        // Normal accrual calculation
                        monthData.vacationAccrued = monthData.hoursWorked * accrualPerHour;
                    }
                    totalVacationAccrued += monthData.vacationAccrued;
                }

                // Create or update vacation accrual record
                const accrualData = await prisma.vacationAccrual.upsert({
                    where: {
                        userId_year: {
                            userId: user.id,
                            year: year
                        }
                    },
                    update: {
                        contractHoursPerWeek,
                        contractType: contractType as any,
                        vacationHoursPerYear: VacationAccrualCalculator.calculateVacationEntitlement(contractHoursPerWeek, user.employeeType || 'PERMANENT'),
                        hoursWorkedYTD: totalHoursWorked,
                        vacationHoursAccrued: totalVacationAccrued,
                        monthlyAccrual: monthlyData,
                        lastCalculatedDate: new Date(),
                    },
                    create: {
                        userId: user.id,
                        year,
                        contractHoursPerWeek,
                        contractType: contractType as any,
                        vacationHoursPerYear: VacationAccrualCalculator.calculateVacationEntitlement(contractHoursPerWeek, user.employeeType || 'PERMANENT'),
                        hoursWorkedYTD: totalHoursWorked,
                        vacationHoursAccrued: totalVacationAccrued,
                        monthlyAccrual: monthlyData,
                        lastCalculatedDate: new Date(),
                    }
                });

                // Update leave balance with calculated vacation hours
                // Convert hours to days (assuming 8 hours = 1 day for display)
                const vacationDaysAccrued = Math.floor(totalVacationAccrued / 8);

                await prisma.leaveBalance.upsert({
                    where: {
                        userId_year: {
                            userId: user.id,
                            year: year
                        }
                    },
                    update: {
                        vacationDaysTotal: vacationDaysAccrued,
                        vacationDaysRemaining: Math.max(0, vacationDaysAccrued - (await getUsedVacationDays(user.id, year))),
                    },
                    create: {
                        userId: user.id,
                        year,
                        vacationDaysTotal: vacationDaysAccrued,
                        vacationDaysUsed: 0,
                        vacationDaysRemaining: vacationDaysAccrued,
                    }
                });

                results.push({
                    userId: user.id,
                    userName: user.name,
                    success: true,
                    accrualData: {
                        contractHoursPerWeek,
                        hoursWorkedYTD: totalHoursWorked,
                        vacationHoursAccrued: totalVacationAccrued,
                        vacationDaysAccrued,
                        accrualPerHour,
                        monthlyBreakdown: monthlyData
                    }
                });

            } catch (error) {
                console.error(`Error calculating vacation accrual for user ${user.id}:`, error);
                results.push({
                    userId: user.id,
                    userName: user.name,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const totalProcessed = results.length;

        return NextResponse.json({
            success: true,
            message: `Processed vacation accrual for ${totalProcessed} employees`,
            summary: {
                totalProcessed,
                successful: successCount,
                failed: totalProcessed - successCount,
                year
            },
            results
        });

    } catch (error) {
        console.error("Error calculating vacation accrual:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Helper function to get used vacation days
async function getUsedVacationDays(userId: string, year: number): Promise<number> {
    const startDate = startOfYear(new Date(year, 0, 1));
    const endDate = endOfYear(new Date(year, 0, 1));

    const usedEntries = await prisma.timeEntry.findMany({
        where: {
            userId,
            startTime: { gte: startDate, lte: endDate },
            workType: 'VACATION',
            endTime: { not: null }
        }
    });

    let totalUsedHours = 0;
    for (const entry of usedEntries) {
        const startTime = new Date(entry.startTime);
        const endTime = new Date(entry.endTime!);
        const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        totalUsedHours += hours;
    }

    return Math.floor(totalUsedHours / 8); // Convert to days
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || session.user.id;
        const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

        // Get vacation accrual data
        const accrualData = await prisma.vacationAccrual.findUnique({
            where: {
                userId_year: {
                    userId,
                    year
                }
            }
        });

        if (!accrualData) {
            return NextResponse.json({
                success: false,
                message: "No vacation accrual data found. Run calculation first."
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                ...accrualData,
                vacationDaysAccrued: Math.floor(accrualData.vacationHoursAccrued / 8),
                contractHoursPerYear: accrualData.contractHoursPerWeek * 52,
                accrualPerHour: accrualData.vacationHoursPerYear / (accrualData.contractHoursPerWeek * 52)
            }
        });

    } catch (error) {
        console.error("Error fetching vacation accrual:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 