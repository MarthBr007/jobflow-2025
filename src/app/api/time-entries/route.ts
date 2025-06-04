import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { format, startOfYear, endOfYear } from 'date-fns';

// Import vacation accrual calculator
class VacationAccrualCalculator {
    static calculateVacationEntitlement(contractHoursPerWeek: number, employeeType: string): number {
        switch (employeeType) {
            case 'PERMANENT':
                return 4 * contractHoursPerWeek;
            case 'FLEX_WORKER':
                return 4 * contractHoursPerWeek;
            case 'FREELANCER':
                return 0; // No vacation accrual
            default:
                return 4 * contractHoursPerWeek;
        }
    }

    static calculateAccrualPerHour(contractHoursPerWeek: number, employeeType: string): number {
        const vacationHoursPerYear = this.calculateVacationEntitlement(contractHoursPerWeek, employeeType);

        if (employeeType === 'FREELANCER') {
            return 0;
        }

        if (employeeType === 'FLEX_WORKER') {
            return 0.08; // 8% rule for flex workers
        }

        if (vacationHoursPerYear === 0) return 0;

        const contractHoursPerYear = contractHoursPerWeek * 52;
        return vacationHoursPerYear / contractHoursPerYear;
    }

    static getContractHoursFromWorkPattern(workPattern: any): number {
        return workPattern?.totalHoursPerWeek || 40;
    }

    static mapEmployeeTypeToContractType(employeeType: string): string {
        const mapping: { [key: string]: string } = {
            'PERMANENT': 'PERMANENT_FULL_TIME',
            'FREELANCER': 'FREELANCE',
            'FLEX_WORKER': 'ZERO_HOURS',
        };
        return mapping[employeeType] || 'PERMANENT_FULL_TIME';
    }
}

// Function to update vacation accrual when time entries change
async function updateVacationAccrual(userId: string, year: number) {
    try {
        // Get user info
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                workPatternAssignments: {
                    where: { isActive: true },
                    include: { pattern: true },
                    take: 1
                }
            }
        });

        if (!user || user.employeeType === 'FREELANCER') {
            return; // Skip freelancers
        }

        const currentPattern = user.workPatternAssignments[0]?.pattern;
        const contractHoursPerWeek = VacationAccrualCalculator.getContractHoursFromWorkPattern(currentPattern);
        const contractType = VacationAccrualCalculator.mapEmployeeTypeToContractType(user.employeeType || 'PERMANENT');

        // Get all time entries for the year
        const startDate = startOfYear(new Date(year, 0, 1));
        const endDate = endOfYear(new Date(year, 0, 1));

        const timeEntries = await prisma.timeEntry.findMany({
            where: {
                userId,
                startTime: { gte: startDate, lte: endDate },
                endTime: { not: null },
                workType: { in: ['REGULAR', 'OVERTIME'] }
            }
        });

        // Calculate total hours and monthly breakdown
        let totalHoursWorked = 0;
        const monthlyData: { [key: string]: { hoursWorked: number; vacationAccrued: number } } = {};

        for (const entry of timeEntries) {
            const startTime = new Date(entry.startTime);
            const endTime = new Date(entry.endTime!);
            const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
            const hoursWorked = Math.max(0, (totalMinutes - (entry.totalBreakMinutes || 0)) / 60);

            totalHoursWorked += hoursWorked;

            const monthKey = format(startTime, 'yyyy-MM');
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { hoursWorked: 0, vacationAccrued: 0 };
            }
            monthlyData[monthKey].hoursWorked += hoursWorked;
        }

        // Calculate vacation accrual
        const accrualPerHour = VacationAccrualCalculator.calculateAccrualPerHour(contractHoursPerWeek, user.employeeType || 'PERMANENT');
        let totalVacationAccrued = 0;

        for (const [monthKey, monthData] of Object.entries(monthlyData)) {
            if ((user.employeeType || 'PERMANENT') === 'FLEX_WORKER') {
                monthData.vacationAccrued = monthData.hoursWorked * 0.08;
            } else {
                monthData.vacationAccrued = monthData.hoursWorked * accrualPerHour;
            }
            totalVacationAccrued += monthData.vacationAccrued;
        }

        // Update vacation accrual record
        await prisma.vacationAccrual.upsert({
            where: {
                userId_year: { userId, year }
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
                userId,
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

        // Update leave balance
        const vacationDaysAccrued = Math.floor(totalVacationAccrued / 8);
        const usedVacationDays = await getUsedVacationDays(userId, year);

        await prisma.leaveBalance.upsert({
            where: {
                userId_year: { userId, year }
            },
            update: {
                vacationDaysTotal: vacationDaysAccrued,
                vacationDaysRemaining: Math.max(0, vacationDaysAccrued - usedVacationDays),
            },
            create: {
                userId,
                year,
                vacationDaysTotal: vacationDaysAccrued,
                vacationDaysUsed: usedVacationDays,
                vacationDaysRemaining: Math.max(0, vacationDaysAccrued - usedVacationDays),
            }
        });

    } catch (error) {
        console.error('Error updating vacation accrual:', error);
    }
}

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

    return Math.floor(totalUsedHours / 8);
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const projectId = searchParams.get("projectId");

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const whereClause: any = {
            userId: user.id,
        };

        if (startDate && endDate) {
            whereClause.startTime = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        if (projectId) {
            whereClause.projectId = projectId;
        }

        const timeEntries = await prisma.timeEntry.findMany({
            where: whereClause,
            include: {
                project: true,
            },
            orderBy: {
                startTime: "desc",
            },
        });

        return NextResponse.json(timeEntries);
    } catch (error) {
        console.error("Error fetching time entries:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { date, projectId, hours, description } = body;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Calculate endTime based on hours (assuming hours is the duration)
        const startTime = new Date(date);
        const endTime = new Date(startTime.getTime() + (parseFloat(hours) * 60 * 60 * 1000));

        const timeEntry = await prisma.timeEntry.create({
            data: {
                startTime: startTime,
                endTime: endTime,
                description,
                userId: user.id,
                projectId,
                hoursWorked: parseFloat(hours),
                workType: 'REGULAR',
            },
            include: {
                project: true,
            },
        });

        // Trigger vacation accrual update
        const year = startTime.getFullYear();
        await updateVacationAccrual(user.id, year);

        return NextResponse.json(timeEntry);
    } catch (error) {
        console.error('Error creating time entry:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 