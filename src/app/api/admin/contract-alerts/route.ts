import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hasPermission, UserRole } from "@/lib/permissions";
import { format, addDays } from "date-fns";
import { nl } from "date-fns/locale";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { role: true, company: true },
        });

        if (!currentUser || !hasPermission(currentUser.role as UserRole, 'canViewAllTimeEntries')) {
            return NextResponse.json({ error: 'Access denied - Admin or Manager only' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const alertDays = parseInt(searchParams.get('days') || '60'); // Default 60 days warning

        const today = new Date();
        const alertDate = addDays(today, alertDays);

        // Get all permanent employees with contract end dates within the alert period
        const expiringContracts = await prisma.user.findMany({
            where: {
                company: currentUser.company,
                employeeType: 'PERMANENT',
                contractEndDate: {
                    gte: today,
                    lte: alertDate,
                },
                archived: false,
            },
            select: {
                id: true,
                name: true,
                email: true,
                contractType: true,
                contractStartDate: true,
                contractEndDate: true,
                contractStatus: true,
                contractVersion: true,
            },
            orderBy: {
                contractEndDate: 'asc',
            },
        });

        // Get already expired contracts
        const expiredContracts = await prisma.user.findMany({
            where: {
                company: currentUser.company,
                employeeType: 'PERMANENT',
                contractEndDate: {
                    lt: today,
                },
                contractStatus: {
                    in: ['ACTIVE', 'PENDING_SIGNATURE'], // Still marked as active but expired
                },
                archived: false,
            },
            select: {
                id: true,
                name: true,
                email: true,
                contractType: true,
                contractStartDate: true,
                contractEndDate: true,
                contractStatus: true,
                contractVersion: true,
            },
            orderBy: {
                contractEndDate: 'desc',
            },
        });

        // Calculate days until expiry for each contract
        const contractAlerts = expiringContracts.map(employee => {
            const daysUntilExpiry = Math.ceil(
                (new Date(employee.contractEndDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            let severity: 'warning' | 'urgent' | 'critical' = 'warning';
            if (daysUntilExpiry <= 7) {
                severity = 'critical';
            } else if (daysUntilExpiry <= 30) {
                severity = 'urgent';
            }

            return {
                id: employee.id,
                name: employee.name,
                email: employee.email,
                contractType: employee.contractType,
                contractStartDate: employee.contractStartDate,
                contractEndDate: employee.contractEndDate,
                contractStatus: employee.contractStatus,
                contractVersion: employee.contractVersion,
                daysUntilExpiry,
                severity,
                message: `Contract verloopt over ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'dag' : 'dagen'}`,
                formattedEndDate: format(new Date(employee.contractEndDate!), 'dd MMMM yyyy', { locale: nl }),
            };
        });

        const expiredAlerts = expiredContracts.map(employee => {
            const daysOverdue = Math.ceil(
                (today.getTime() - new Date(employee.contractEndDate!).getTime()) / (1000 * 60 * 60 * 24)
            );

            return {
                id: employee.id,
                name: employee.name,
                email: employee.email,
                contractType: employee.contractType,
                contractStartDate: employee.contractStartDate,
                contractEndDate: employee.contractEndDate,
                contractStatus: employee.contractStatus,
                contractVersion: employee.contractVersion,
                daysOverdue,
                severity: 'critical' as const,
                message: `Contract is verlopen sinds ${daysOverdue} ${daysOverdue === 1 ? 'dag' : 'dagen'}`,
                formattedEndDate: format(new Date(employee.contractEndDate!), 'dd MMMM yyyy', { locale: nl }),
            };
        });

        // Summary statistics
        const summary = {
            totalExpiring: contractAlerts.length,
            totalExpired: expiredAlerts.length,
            criticalAlerts: [...contractAlerts, ...expiredAlerts].filter(alert => alert.severity === 'critical').length,
            urgentAlerts: contractAlerts.filter(alert => alert.severity === 'urgent').length,
            warningAlerts: contractAlerts.filter(alert => alert.severity === 'warning').length,
        };

        return NextResponse.json({
            success: true,
            summary,
            alerts: {
                expiring: contractAlerts,
                expired: expiredAlerts,
            },
            alertPeriod: {
                days: alertDays,
                startDate: format(today, 'yyyy-MM-dd'),
                endDate: format(alertDate, 'yyyy-MM-dd'),
            },
        });

    } catch (error) {
        console.error('Error fetching contract alerts:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Update contract status (mark as expired, etc.)
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { role: true, company: true },
        });

        if (!currentUser || !hasPermission(currentUser.role as UserRole, 'canEditUsers')) {
            return NextResponse.json({ error: 'Access denied - Admin or Manager only' }, { status: 403 });
        }

        const body = await request.json();
        const { userId, action, newEndDate } = body;

        const employee = await prisma.user.findUnique({
            where: { id: userId },
            select: { company: true, name: true, contractEndDate: true },
        });

        if (!employee || employee.company !== currentUser.company) {
            return NextResponse.json({ error: 'Employee not found or access denied' }, { status: 404 });
        }

        let updateData: any = {};

        switch (action) {
            case 'mark_expired':
                updateData = {
                    contractStatus: 'EXPIRED',
                };
                break;

            case 'extend_contract':
                if (!newEndDate) {
                    return NextResponse.json({ error: 'New end date required for extension' }, { status: 400 });
                }
                updateData = {
                    contractEndDate: new Date(newEndDate),
                    contractStatus: 'ACTIVE',
                };
                break;

            case 'make_permanent':
                updateData = {
                    contractEndDate: null,
                    contractStatus: 'ACTIVE',
                    contractType: 'PERMANENT_FULL_TIME',
                };
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            message: `Contract updated for ${employee.name}`,
            action,
        });

    } catch (error) {
        console.error('Error updating contract:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 