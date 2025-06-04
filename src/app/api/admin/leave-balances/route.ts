import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user has admin permissions
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, company: true },
        });

        if (!currentUser || !["ADMIN", "MANAGER"].includes(currentUser.role)) {
            return NextResponse.json({ error: "Access denied - Admin or Manager only" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

        // Get all employees with their leave balances
        const employees = await prisma.user.findMany({
            where: {
                company: currentUser.company,
                archived: false,
                role: { in: ["EMPLOYEE", "MANAGER"] },
            },
            include: {
                leaveBalances: {
                    where: { year },
                    orderBy: { year: "desc" },
                },
            },
            orderBy: { name: "asc" },
        });

        // Transform data to include current year balance or defaults
        const employeesWithBalances = employees.map(employee => {
            const currentBalance = employee.leaveBalances.find(lb => lb.year === year);

            return {
                id: employee.id,
                name: employee.name,
                email: employee.email,
                employeeType: employee.employeeType,
                leaveBalance: currentBalance || {
                    id: null,
                    userId: employee.id,
                    year,
                    vacationDaysTotal: 25,
                    vacationDaysUsed: 0,
                    vacationDaysRemaining: 25,
                    sickDaysUsed: 0,
                    compensationHours: 0,
                    compensationUsed: 0,
                    specialLeaveUsed: 0,
                    notes: null,
                    lastUpdatedBy: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                year,
                employees: employeesWithBalances,
                totalEmployees: employeesWithBalances.length,
            },
        });
    } catch (error) {
        console.error("Error fetching leave balances:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user has admin permissions
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, company: true, name: true },
        });

        if (!currentUser || !["ADMIN", "MANAGER"].includes(currentUser.role)) {
            return NextResponse.json({ error: "Access denied - Admin or Manager only" }, { status: 403 });
        }

        const body = await request.json();
        const {
            userId,
            year,
            vacationDaysTotal,
            vacationDaysUsed,
            sickDaysUsed,
            compensationHours,
            compensationUsed,
            specialLeaveUsed,
            notes,
        } = body;

        // Validate input
        if (!userId || !year) {
            return NextResponse.json(
                { error: "User ID and year are required" },
                { status: 400 }
            );
        }

        // Check if employee belongs to same company
        const employee = await prisma.user.findUnique({
            where: { id: userId },
            select: { company: true, name: true },
        });

        if (!employee || employee.company !== currentUser.company) {
            return NextResponse.json(
                { error: "Employee not found or access denied" },
                { status: 404 }
            );
        }

        // Calculate remaining vacation days
        const vacationDaysRemaining = Math.max(0, vacationDaysTotal - vacationDaysUsed);

        // Upsert leave balance
        const leaveBalance = await prisma.leaveBalance.upsert({
            where: {
                userId_year: {
                    userId,
                    year,
                },
            },
            update: {
                vacationDaysTotal,
                vacationDaysUsed,
                vacationDaysRemaining,
                sickDaysUsed,
                compensationHours,
                compensationUsed,
                specialLeaveUsed,
                notes,
                lastUpdatedBy: currentUser.name,
                updatedAt: new Date(),
            },
            create: {
                userId,
                year,
                vacationDaysTotal,
                vacationDaysUsed,
                vacationDaysRemaining,
                sickDaysUsed,
                compensationHours,
                compensationUsed,
                specialLeaveUsed,
                notes,
                lastUpdatedBy: currentUser.name,
            },
        });

        return NextResponse.json({
            success: true,
            message: `Leave balance updated for ${employee.name}`,
            data: leaveBalance,
        });
    } catch (error) {
        console.error("Error updating leave balance:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
} 