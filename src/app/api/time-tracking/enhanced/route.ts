import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { EnhancedTimeTracking, TimeEntry, formatDuration, BulkCompensationAction } from '@/lib/time-tracking-enhanced';

const timeTracker = new EnhancedTimeTracking();

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const period = searchParams.get('period') || 'current_month';
        const userId = searchParams.get('userId') || session.user.id;

        // Bereken periode datums
        const now = new Date();
        let startDate: Date;
        let endDate: Date;

        switch (period) {
            case 'current_week':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                break;
            case 'current_month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'last_month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'last_3_months':
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }

        if (action === 'balance') {
            return await getTimeBalance(userId, startDate, endDate);
        } else if (action === 'shortages') {
            return await getShortages(startDate, endDate);
        } else if (action === 'compensation') {
            return await getCompensationOverview(userId);
        } else if (action === 'report') {
            return await getTeamReport(startDate, endDate);
        } else if (action === 'export') {
            return await exportTimeData(userId, startDate, endDate);
        } else if (action === 'auto_notifications') {
            return await processAutoNotifications();
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Enhanced time tracking error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function getTimeBalance(userId: string, startDate: Date, endDate: Date) {
    // Haal gebruiker op met contract informatie
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            contractType: true,
            hourlyRate: true,
            monthlySalary: true,
            // Bepaal contract uren per week op basis van contract type
        },
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Bepaal contract uren per week
    let contractHoursPerWeek = 40; // Default
    if (user.contractType === 'PERMANENT_PART_TIME' || user.contractType === 'TEMPORARY_PART_TIME') {
        contractHoursPerWeek = 32; // Deeltijd
    } else if (user.contractType === 'ZERO_HOURS') {
        contractHoursPerWeek = 0; // Geen minimum
    }

    // Haal time entries op uit database
    const timeEntries = await prisma.timeEntry.findMany({
        where: {
            userId,
            startTime: { gte: startDate, lte: endDate },
        },
        orderBy: { startTime: 'desc' },
    });

    // Converteer naar enhanced format
    const enhancedEntries: TimeEntry[] = timeEntries.map((entry: any) => {
        const startTime = new Date(entry.startTime);
        const isWeekend = startTime.getDay() === 0 || startTime.getDay() === 6;
        const isEvening = startTime.getHours() >= 18;
        const isNight = startTime.getHours() >= 22 || startTime.getHours() < 6;

        return {
            id: entry.id,
            userId: entry.userId,
            clockIn: entry.startTime,
            clockOut: entry.endTime || undefined,
            totalBreakMinutes: entry.totalBreakMinutes || 0,
            workType: entry.workType || 'REGULAR',
            approved: entry.approved,
            location: entry.location || undefined,
            notes: entry.notes || entry.description,
            isWeekend,
            isEvening,
            isNight,
            autoBreakApplied: false,
        };
    });

    // Bereken balans met contract uren
    const balance = timeTracker.calculateTimeBalance(enhancedEntries, { start: startDate, end: endDate }, contractHoursPerWeek);

    return NextResponse.json({
        success: true,
        data: {
            user: user,
            balance: balance,
            contractInfo: {
                type: user.contractType,
                hoursPerWeek: contractHoursPerWeek,
                hourlyRate: user.hourlyRate,
            },
            formatted: {
                expectedHours: formatDuration(balance.expectedHours),
                actualHours: formatDuration(balance.actualHours),
                overtimeHours: formatDuration(balance.overtimeHours),
                compensationBalance: formatDuration(balance.compensationHours - balance.usedCompensationHours),
                shortageHours: balance.shortageHours > 0 ? formatDuration(balance.shortageHours) : null,
                weekendHours: formatDuration(balance.weekendHours),
                eveningHours: formatDuration(balance.eveningHours),
                nightHours: formatDuration(balance.nightHours),
                holidayHours: formatDuration(balance.holidayHours),
                autoBreakDeducted: formatDuration(balance.autoBreakDeducted),
                productivity: Math.round((balance.actualHours / balance.expectedHours) * 100),
            },
            recommendations: generatePersonalRecommendations(balance),
            alerts: generatePersonalAlerts(balance),
        },
    });
}

async function getShortages(startDate: Date, endDate: Date) {
    // Haal alle gebruikers op
    const users = await prisma.user.findMany({
        where: {
            role: { in: ['EMPLOYEE', 'MANAGER'] },
            archived: false
        },
        select: {
            id: true,
            name: true,
            email: true,
            contractType: true,
        },
    });

    const allBalances = [];

    for (const user of users) {
        // Bepaal contract uren
        let contractHoursPerWeek = 40;
        if (user.contractType === 'PERMANENT_PART_TIME' || user.contractType === 'TEMPORARY_PART_TIME') {
            contractHoursPerWeek = 32;
        } else if (user.contractType === 'ZERO_HOURS') {
            contractHoursPerWeek = 0;
        }

        const timeEntries = await prisma.timeEntry.findMany({
            where: {
                userId: user.id,
                startTime: { gte: startDate, lte: endDate },
            },
        });

        const enhancedEntries: TimeEntry[] = timeEntries.map((entry: any) => ({
            id: entry.id,
            userId: entry.userId,
            clockIn: entry.startTime,
            clockOut: entry.endTime || undefined,
            totalBreakMinutes: entry.totalBreakMinutes || 0,
            workType: entry.workType || 'REGULAR',
            approved: entry.approved,
        }));

        const balance = timeTracker.calculateTimeBalance(enhancedEntries, { start: startDate, end: endDate }, contractHoursPerWeek);
        balance.userId = user.id;
        allBalances.push(balance);
    }

    // Haal historische data op voor consecutive weeks berekening
    const historicalData = await getHistoricalShortageData(users.map(u => u.id));

    const shortageAlerts = timeTracker.detectShortages(allBalances, historicalData);

    // Voeg gebruiker details toe
    const enrichedAlerts = shortageAlerts.map(alert => {
        const user = users.find(u => u.id === alert.userId);
        return {
            ...alert,
            userName: user?.name || 'Onbekend',
            userEmail: user?.email,
            contractType: user?.contractType,
            formattedShortage: formatDuration(alert.shortageHours),
            actionRequired: alert.consecutiveWeeksShort >= 2,
            escalationLevel: alert.consecutiveWeeksShort >= 3 ? 'HIGH' : alert.consecutiveWeeksShort >= 2 ? 'MEDIUM' : 'LOW',
        };
    });

    return NextResponse.json({
        success: true,
        data: {
            alerts: enrichedAlerts,
            summary: {
                totalAlerts: enrichedAlerts.length,
                criticalAlerts: enrichedAlerts.filter(a => a.severity === 'CRITICAL').length,
                warningAlerts: enrichedAlerts.filter(a => a.severity === 'WARNING').length,
                escalationRequired: enrichedAlerts.filter(a => a.escalationLevel === 'HIGH').length,
                actionRequired: enrichedAlerts.filter(a => a.actionRequired).length,
            },
            recommendations: generateTeamShortageRecommendations(enrichedAlerts),
        },
    });
}

async function getHistoricalShortageData(userIds: string[]): Promise<any[]> {
    // Haal laatste 12 weken data op voor trend analyse
    const weeks = [];
    for (let i = 0; i < 12; i++) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7));
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start van week

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        weeks.push({ start: weekStart, end: weekEnd });
    }

    // Voor elke week, bereken balances (simplified voor performance)
    const historicalBalances = [];

    for (const week of weeks) {
        const weekBalances = [];
        for (const userId of userIds) {
            // Simplified balance calculation
            const entries = await prisma.timeEntry.findMany({
                where: {
                    userId,
                    startTime: { gte: week.start, lte: week.end },
                },
                select: { startTime: true, endTime: true }
            });

            const totalHours = entries.reduce((total, entry) => {
                if (entry.endTime) {
                    const hours = (entry.endTime.getTime() - entry.startTime.getTime()) / (1000 * 60 * 60);
                    return total + hours;
                }
                return total;
            }, 0);

            const expectedHours = 40; // Simplified
            const shortageHours = Math.max(0, expectedHours - totalHours);

            weekBalances.push({
                userId,
                shortageHours,
                period: week,
            });
        }
        historicalBalances.push(weekBalances);
    }

    return historicalBalances;
}

async function getCompensationOverview(userId: string) {
    // Haal compensatie geschiedenis op
    const compensationEntries = await prisma.timeEntry.findMany({
        where: {
            userId,
            OR: [
                { workType: 'OVERTIME' },
                { workType: 'COMPENSATION_USED' },
                { description: { contains: 'overtime' } },
                { description: { contains: 'compensatie' } },
            ],
        },
        orderBy: { startTime: 'desc' },
        take: 100,
    });

    // Calculate hours worked for each entry
    const entriesWithHours = compensationEntries.map((entry: any) => {
        const hoursWorked = entry.endTime
            ? (entry.endTime.getTime() - entry.startTime.getTime()) / (1000 * 60 * 60)
            : 0;
        return { ...entry, hoursWorked };
    });

    const totalCompensationEarned = entriesWithHours
        .filter((entry: any) => entry.workType === 'OVERTIME' || entry.description?.includes('overtime'))
        .reduce((total: number, entry: any) => total + entry.hoursWorked, 0);

    const totalCompensationUsed = entriesWithHours
        .filter((entry: any) => entry.workType === 'COMPENSATION_USED' || entry.description?.includes('compensatie opgenomen'))
        .reduce((total: number, entry: any) => total + entry.hoursWorked, 0);

    const currentBalance = totalCompensationEarned - totalCompensationUsed;

    // Bereken toeslagen breakdown
    const weekendHours = entriesWithHours
        .filter((entry: any) => {
            const date = new Date(entry.startTime);
            return date.getDay() === 0 || date.getDay() === 6;
        })
        .reduce((total: number, entry: any) => total + entry.hoursWorked, 0);

    const eveningHours = entriesWithHours
        .filter((entry: any) => {
            const date = new Date(entry.startTime);
            return date.getHours() >= 18;
        })
        .reduce((total: number, entry: any) => total + entry.hoursWorked, 0);

    return NextResponse.json({
        success: true,
        data: {
            compensationBalance: {
                earned: totalCompensationEarned,
                used: totalCompensationUsed,
                current: currentBalance,
                formatted: {
                    earned: formatDuration(totalCompensationEarned),
                    used: formatDuration(totalCompensationUsed),
                    current: formatDuration(currentBalance),
                },
            },
            breakdown: {
                weekendHours: {
                    hours: weekendHours,
                    formatted: formatDuration(weekendHours),
                    compensation: weekendHours * 0.5, // 50% toeslag
                },
                eveningHours: {
                    hours: eveningHours,
                    formatted: formatDuration(eveningHours),
                    compensation: eveningHours * 0.25, // 25% toeslag
                },
            },
            recentEntries: entriesWithHours.slice(0, 20).map((entry: any) => ({
                id: entry.id,
                date: entry.startTime.toLocaleDateString('nl-NL'),
                hours: formatDuration(entry.hoursWorked),
                type: entry.workType === 'OVERTIME' ? 'Opgebouwd' : 'Opgenomen',
                description: entry.description,
                location: entry.location || 'Niet opgegeven',
                approved: entry.approved,
            })),
            canUseCompensation: currentBalance > 0,
            maxUsableHours: Math.min(currentBalance, 8), // Max 8 uur per dag
            recommendations: generateCompensationRecommendations(currentBalance, weekendHours, eveningHours),
        },
    });
}

async function getTeamReport(startDate: Date, endDate: Date) {
    // Haal team data op
    const users = await prisma.user.findMany({
        where: {
            role: { in: ['EMPLOYEE', 'MANAGER'] },
            archived: false
        },
        select: {
            id: true,
            name: true,
            email: true,
            contractType: true,
            role: true,
        },
    });

    const teamStats = {
        totalEmployees: users.length,
        totalHoursWorked: 0,
        totalOvertimeHours: 0,
        totalCompensationBalance: 0,
        totalShortageHours: 0,
        averageProductivity: 0,
        departmentBreakdown: {} as any,
    };

    const individualReports = [];

    for (const user of users) {
        const timeEntries = await prisma.timeEntry.findMany({
            where: {
                userId: user.id,
                startTime: { gte: startDate, lte: endDate },
            },
        });

        const enhancedEntries: TimeEntry[] = timeEntries.map((entry: any) => ({
            id: entry.id,
            userId: entry.userId,
            clockIn: entry.startTime,
            clockOut: entry.endTime || undefined,
            totalBreakMinutes: entry.totalBreakMinutes || 0,
            workType: entry.workType || 'REGULAR',
            approved: entry.approved,
        }));

        const balance = timeTracker.calculateTimeBalance(enhancedEntries, { start: startDate, end: endDate });

        teamStats.totalHoursWorked += balance.actualHours;
        teamStats.totalOvertimeHours += balance.overtimeHours;
        teamStats.totalCompensationBalance += (balance.compensationHours - balance.usedCompensationHours);
        teamStats.totalShortageHours += balance.shortageHours;
        teamStats.averageProductivity += (balance.actualHours / balance.expectedHours) * 100;

        individualReports.push({
            userId: user.id,
            userName: user.name,
            role: user.role,
            contractType: user.contractType,
            balance,
            formatted: {
                actualHours: formatDuration(balance.actualHours),
                expectedHours: formatDuration(balance.expectedHours),
                overtimeHours: formatDuration(balance.overtimeHours),
                compensationBalance: formatDuration(balance.compensationHours - balance.usedCompensationHours),
                shortageHours: balance.shortageHours > 0 ? formatDuration(balance.shortageHours) : null,
                productivity: Math.round((balance.actualHours / balance.expectedHours) * 100),
            },
        });
    }

    teamStats.averageProductivity = teamStats.averageProductivity / users.length;

    return NextResponse.json({
        success: true,
        data: {
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                formatted: `${startDate.toLocaleDateString('nl-NL')} - ${endDate.toLocaleDateString('nl-NL')}`,
            },
            teamStats: {
                ...teamStats,
                formatted: {
                    totalHoursWorked: formatDuration(teamStats.totalHoursWorked),
                    totalOvertimeHours: formatDuration(teamStats.totalOvertimeHours),
                    totalCompensationBalance: formatDuration(teamStats.totalCompensationBalance),
                    totalShortageHours: formatDuration(teamStats.totalShortageHours),
                    averageProductivity: Math.round(teamStats.averageProductivity),
                },
            },
            individualReports,
            insights: generateTeamInsights(teamStats, individualReports),
        },
    });
}

async function exportTimeData(userId: string, startDate: Date, endDate: Date) {
    const timeEntries = await prisma.timeEntry.findMany({
        where: {
            userId,
            startTime: { gte: startDate, lte: endDate },
        },
        include: {
            project: { select: { name: true } },
            user: { select: { name: true, email: true } },
        },
        orderBy: { startTime: 'desc' },
    });

    const exportData = timeEntries.map(entry => ({
        Datum: entry.startTime.toLocaleDateString('nl-NL'),
        'Start Tijd': entry.startTime.toLocaleTimeString('nl-NL'),
        'Eind Tijd': entry.endTime?.toLocaleTimeString('nl-NL') || 'Nog bezig',
        'Gewerkte Uren': entry.endTime
            ? formatDuration((entry.endTime.getTime() - entry.startTime.getTime()) / (1000 * 60 * 60))
            : '0:00',
        Project: entry.project?.name || 'Geen project',
        Locatie: entry.location || 'Niet opgegeven',
        Beschrijving: entry.description,
        'Pauze (min)': entry.totalBreakMinutes || 0,
        Type: entry.workType,
        Goedgekeurd: entry.approved ? 'Ja' : 'Nee',
        Notities: entry.notes || '',
    }));

    return NextResponse.json({
        success: true,
        data: {
            exportData,
            summary: {
                totalEntries: exportData.length,
                period: `${startDate.toLocaleDateString('nl-NL')} - ${endDate.toLocaleDateString('nl-NL')}`,
                user: timeEntries[0]?.user?.name || 'Onbekend',
            },
        },
    });
}

async function processAutoNotifications() {
    // Haal alle shortage alerts op
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const shortageResponse = await getShortages(startDate, endDate);
    const shortageData = await shortageResponse.json();

    if (!shortageData.success) {
        return NextResponse.json({ error: 'Failed to get shortage data' }, { status: 500 });
    }

    const alerts = shortageData.data.alerts;
    const notificationsSent = [];

    for (const alert of alerts) {
        if (!alert.autoNotificationSent && alert.severity === 'CRITICAL') {
            // Hier zou je een email/notification service aanroepen
            // Voor nu loggen we alleen
            console.log(`Auto notification for user ${alert.userName}: ${alert.shortageHours} hours short`);

            notificationsSent.push({
                userId: alert.userId,
                userName: alert.userName,
                type: 'SHORTAGE_ALERT',
                message: `Je hebt ${alert.formattedShortage} te kort gewerkt`,
                severity: alert.severity,
            });
        }
    }

    return NextResponse.json({
        success: true,
        data: {
            notificationsSent,
            totalSent: notificationsSent.length,
            message: `${notificationsSent.length} automatische notificaties verzonden`,
        },
    });
}

function generatePersonalRecommendations(balance: any): string[] {
    const recommendations = [];
    const productivity = (balance.actualHours / balance.expectedHours) * 100;
    const compensationBalance = balance.compensationHours - balance.usedCompensationHours;

    if (balance.shortageHours > 0) {
        recommendations.push(`WAARSCHUWING: Je hebt ${formatDuration(balance.shortageHours)} te kort gewerkt deze periode`);
        if (balance.shortageHours <= 4) {
            recommendations.push(`ADVIES: Plan 1-2 extra uren deze week om het tekort in te halen`);
        } else {
            recommendations.push(`URGENT: Plan een inhaaldag om het tekort weg te werken`);
        }
    }

    if (balance.overtimeHours > 8) {
        recommendations.push(`OVERTIME: Je hebt veel overtime gemaakt (${formatDuration(balance.overtimeHours)}). Vergeet niet om te pauzeren!`);
    }

    if (compensationBalance > 16) {
        recommendations.push(`COMPENSATIE: Je hebt ${formatDuration(compensationBalance)} compensatie uren. Tijd voor een vrije dag?`);
    }

    if (balance.weekendHours > 0) {
        recommendations.push(`WEEKEND: Je hebt ${formatDuration(balance.weekendHours)} weekend uren gemaakt (150% compensatie)`);
    }

    if (balance.eveningHours > 0) {
        recommendations.push(`AVOND: Je hebt ${formatDuration(balance.eveningHours)} avond uren gemaakt (125% compensatie)`);
    }

    if (productivity > 110) {
        recommendations.push(`UITSTEKEND: Excellente productiviteit (${Math.round(productivity)}%)! Zorg wel voor goede work-life balance`);
    } else if (productivity < 90) {
        recommendations.push(`VERBETERING: Productiviteit kan beter (${Math.round(productivity)}%). Bespreek eventuele obstakels met je manager`);
    }

    if (balance.autoBreakDeducted > 0) {
        recommendations.push(`PAUZES: ${formatDuration(balance.autoBreakDeducted)} automatische pauze afgetrokken. Vergeet niet handmatig pauzes in te klokken`);
    }

    return recommendations;
}

function generatePersonalAlerts(balance: any): any[] {
    const alerts = [];

    if (balance.shortageHours >= 8) {
        alerts.push({
            type: 'CRITICAL_SHORTAGE',
            message: `Kritiek tekort: ${formatDuration(balance.shortageHours)}`,
            action: 'Plan inhaaldag deze week',
            priority: 'HIGH',
        });
    }

    if (balance.compensationHours - balance.usedCompensationHours > 40) {
        alerts.push({
            type: 'HIGH_COMPENSATION',
            message: `Hoog compensatie saldo: ${formatDuration(balance.compensationHours - balance.usedCompensationHours)}`,
            action: 'Plan vrije dagen om saldo te gebruiken',
            priority: 'MEDIUM',
        });
    }

    if (balance.autoBreakDeducted > 2) {
        alerts.push({
            type: 'MISSING_BREAKS',
            message: `Veel automatische pauzes: ${formatDuration(balance.autoBreakDeducted)}`,
            action: 'Klok pauzes handmatig in voor nauwkeurigere registratie',
            priority: 'LOW',
        });
    }

    return alerts;
}

function generateTeamShortageRecommendations(alerts: any[]): string[] {
    const recommendations = [];
    const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
    const escalationCount = alerts.filter(a => a.escalationLevel === 'HIGH').length;

    if (criticalCount > 0) {
        recommendations.push(`KRITIEK: ${criticalCount} medewerkers hebben kritieke tekorten - directe actie vereist`);
    }

    if (escalationCount > 0) {
        recommendations.push(`ESCALATIE: ${escalationCount} medewerkers vereisen escalatie naar management`);
    }

    if (alerts.length > 5) {
        recommendations.push(`PLANNING: Hoog aantal tekorten (${alerts.length}) - evalueer team planning en werkbelasting`);
    }

    const consecutiveIssues = alerts.filter(a => a.consecutiveWeeksShort >= 2).length;
    if (consecutiveIssues > 0) {
        recommendations.push(`STRUCTUREEL: ${consecutiveIssues} medewerkers hebben structurele tekorten - HR gesprek aanbevolen`);
    }

    return recommendations;
}

function generateCompensationRecommendations(balance: number, weekendHours: number, eveningHours: number): string[] {
    const recommendations = [];

    if (balance > 40) {
        recommendations.push(`VERLOF: Hoog compensatie saldo (${formatDuration(balance)}) - plan vrije dagen`);
    }

    if (weekendHours > 8) {
        recommendations.push(`WEEKEND: Veel weekend uren (${formatDuration(weekendHours)}) - zorg voor voldoende rust`);
    }

    if (eveningHours > 16) {
        recommendations.push(`AVOND: Veel avond uren (${formatDuration(eveningHours)}) - monitor work-life balance`);
    }

    if (balance < 8 && (weekendHours > 0 || eveningHours > 0)) {
        recommendations.push(`CONTROLE: Laag compensatie saldo maar wel toeslag uren - controleer berekening`);
    }

    return recommendations;
}

function generateTeamInsights(teamStats: any, individualReports: any[]): any[] {
    const insights = [];

    const highPerformers = individualReports.filter(r => r.formatted.productivity > 110).length;
    const lowPerformers = individualReports.filter(r => r.formatted.productivity < 90).length;

    insights.push({
        type: 'PRODUCTIVITY',
        title: 'Team Productiviteit',
        value: `${Math.round(teamStats.averageProductivity)}%`,
        details: `${highPerformers} hoge presteerders, ${lowPerformers} onder gemiddelde`,
        trend: teamStats.averageProductivity > 100 ? 'UP' : 'DOWN',
    });

    const overtimeUsers = individualReports.filter(r => r.balance.overtimeHours > 8).length;
    insights.push({
        type: 'OVERTIME',
        title: 'Overtime Verdeling',
        value: formatDuration(teamStats.totalOvertimeHours),
        details: `${overtimeUsers} medewerkers met significante overtime`,
        trend: overtimeUsers > teamStats.totalEmployees * 0.3 ? 'UP' : 'STABLE',
    });

    const shortageUsers = individualReports.filter(r => r.balance.shortageHours > 4).length;
    insights.push({
        type: 'SHORTAGE',
        title: 'Tekorten',
        value: formatDuration(teamStats.totalShortageHours),
        details: `${shortageUsers} medewerkers met tekorten`,
        trend: shortageUsers > 0 ? 'UP' : 'DOWN',
    });

    return insights;
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action, userId, hours, date, type, bulkAction } = body;

        if (action === 'use_compensation') {
            return await useCompensationTime(userId || session.user.id, hours, date, type);
        } else if (action === 'bulk_compensation') {
            return await processBulkCompensationRequest(bulkAction, session.user.id);
        } else if (action === 'approve_compensation') {
            return await approveCompensationRequest(body.requestId, session.user.id);
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Enhanced time tracking POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function useCompensationTime(userId: string, hours: number, date: string, type: string) {
    // Valideer compensatie balans
    const compensationResponse = await getCompensationOverview(userId);
    const compensationData = await compensationResponse.json();

    if (!compensationData.success) {
        return NextResponse.json({ error: 'Could not fetch compensation balance' }, { status: 500 });
    }

    const currentBalance = compensationData.data.compensationBalance.current;

    if (hours > currentBalance) {
        return NextResponse.json(
            { error: `Niet genoeg compensatie uren. Beschikbaar: ${formatDuration(currentBalance)}` },
            { status: 400 }
        );
    }

    // Maak compensatie entry aan
    const compensationEntry = await prisma.timeEntry.create({
        data: {
            userId,
            startTime: new Date(date + 'T09:00:00'),
            endTime: new Date(date + `T${9 + hours}:00:00`),
            approved: false, // Vereist goedkeuring
            description: `Compensatie uren opgenomen: ${formatDuration(hours)} (${type})`,
            workType: 'COMPENSATION_USED',
            projectId: null,
            isWarehouse: false,
            totalBreakMinutes: 0,
            hoursWorked: hours,
            isCompensationUsed: true,
        },
    });

    return NextResponse.json({
        success: true,
        message: `${formatDuration(hours)} compensatie uren aangevraagd voor ${date}`,
        data: {
            entryId: compensationEntry.id,
            date: date,
            hoursUsed: hours,
            remainingBalance: currentBalance - hours,
            requiresApproval: true,
        },
    });
}

async function processBulkCompensationRequest(bulkAction: BulkCompensationAction, requesterId: string) {
    const result = timeTracker.processBulkCompensation(bulkAction);

    if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
    }

    // Maak database entries aan voor elke dag
    const createdEntries = [];

    for (const entry of result.entries) {
        const dbEntry = await prisma.timeEntry.create({
            data: {
                userId: bulkAction.userId,
                startTime: new Date(entry.date + 'T09:00:00'),
                endTime: new Date(entry.date + `T${9 + entry.hours}:00:00`),
                approved: false,
                description: `Bulk compensatie: ${entry.reason}`,
                workType: 'COMPENSATION_USED',
                projectId: null,
                isWarehouse: false,
                totalBreakMinutes: 0,
                hoursWorked: entry.hours,
                isCompensationUsed: true,
            },
        });

        createdEntries.push({
            id: dbEntry.id,
            date: entry.date,
            hours: entry.hours,
            type: entry.type,
        });
    }

    return NextResponse.json({
        success: true,
        message: result.message,
        data: {
            entries: createdEntries,
            totalHours: bulkAction.totalHours,
            remainingBalance: result.remainingBalance,
            requiresApproval: true,
        },
    });
}

async function approveCompensationRequest(requestId: string, approverId: string) {
    const entry = await prisma.timeEntry.findUnique({
        where: { id: requestId },
        include: { user: { select: { name: true, email: true } } },
    });

    if (!entry) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (entry.approved) {
        return NextResponse.json({ error: 'Request already approved' }, { status: 400 });
    }

    // Update entry
    const updatedEntry = await prisma.timeEntry.update({
        where: { id: requestId },
        data: {
            approved: true,
            approvedBy: approverId,
            approvedAt: new Date(),
        },
    });

    return NextResponse.json({
        success: true,
        message: `Compensatie aanvraag goedgekeurd voor ${entry.user.name}`,
        data: {
            entryId: updatedEntry.id,
            approvedAt: updatedEntry.approvedAt,
            approvedBy: approverId,
        },
    });
} 