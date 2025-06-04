import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
        const { year, defaultSettings } = body;

        // Validate input
        if (!year || !defaultSettings) {
            return NextResponse.json(
                { error: "Year and default settings are required" },
                { status: 400 }
            );
        }

        // Get all employees in the company
        const employees = await prisma.user.findMany({
            where: {
                company: currentUser.company,
                archived: false,
                role: { in: ["EMPLOYEE", "MANAGER"] },
            },
            select: { id: true, name: true, email: true, employeeType: true },
        });

        const results = [];
        const errors = [];

        // Create leave balances for each employee
        for (const employee of employees) {
            try {
                // Determine vacation days based on employee type
                let vacationDaysTotal = defaultSettings.vacationDaysTotal || 25;

                // Adjust for different employee types
                if (employee.employeeType === 'FREELANCER') {
                    vacationDaysTotal = 0; // Freelancers typically don't get vacation days
                } else if (employee.employeeType === 'FLEX_WORKER') {
                    vacationDaysTotal = Math.round(vacationDaysTotal * 0.6); // 60% for flex workers
                }
                // PERMANENT employees get the full amount

                const leaveBalance = await prisma.leaveBalance.upsert({
                    where: {
                        userId_year: {
                            userId: employee.id,
                            year,
                        },
                    },
                    update: {
                        vacationDaysTotal,
                        vacationDaysRemaining: vacationDaysTotal,
                        lastUpdatedBy: currentUser.name,
                        updatedAt: new Date(),
                    },
                    create: {
                        userId: employee.id,
                        year,
                        vacationDaysTotal,
                        vacationDaysUsed: 0,
                        vacationDaysRemaining: vacationDaysTotal,
                        sickDaysUsed: 0,
                        compensationHours: defaultSettings.compensationHours || 0,
                        compensationUsed: 0,
                        specialLeaveUsed: 0,
                        notes: `Bulk ingesteld op ${new Date().toLocaleDateString()} door ${currentUser.name}`,
                        lastUpdatedBy: currentUser.name,
                    },
                });

                results.push({
                    employeeId: employee.id,
                    employeeName: employee.name,
                    vacationDaysAssigned: vacationDaysTotal,
                    success: true,
                });
            } catch (error) {
                console.error(`Error creating leave balance for ${employee.name}:`, error);
                errors.push({
                    employeeId: employee.id,
                    employeeName: employee.name,
                    error: "Failed to create leave balance",
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Verlof saldo's ingesteld voor ${results.length} medewerkers`,
            data: {
                year,
                processed: results.length,
                errorCount: errors.length,
                results,
                errors,
            },
        });
    } catch (error) {
        console.error("Error in bulk leave balance creation:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
} 