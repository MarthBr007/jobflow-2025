import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const searchParams = url.searchParams;

        // Parse filter parameters
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role') || '';
        const employeeType = searchParams.get('employeeType') || '';
        const company = searchParams.get('company') || '';
        const workTypes = searchParams.get('workTypes')?.split(',').filter(Boolean) || [];
        const status = searchParams.get('status') || '';
        const hasContract = searchParams.get('hasContract');
        const quickFilters = searchParams.get('quickFilters')?.split(',').filter(Boolean) || [];
        const includeArchived = searchParams.get('includeArchived') === 'true';

        // Salary range filters
        const salaryType = searchParams.get('salaryType') || 'all';
        const salaryMin = searchParams.get('salaryMin');
        const salaryMax = searchParams.get('salaryMax');

        // Date range filters
        const hiredStartDate = searchParams.get('hiredStartDate');
        const hiredEndDate = searchParams.get('hiredEndDate');
        const lastActivityStartDate = searchParams.get('lastActivityStartDate');
        const lastActivityEndDate = searchParams.get('lastActivityEndDate');

        // Build Prisma where clause
        const whereClause: any = {};

        // Filter out archived users by default
        if (!includeArchived) {
            whereClause.archived = false;
        }

        // Text search
        if (search) {
            whereClause.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Basic filters
        if (role) whereClause.role = role;
        if (employeeType) whereClause.employeeType = employeeType;
        if (company) whereClause.company = company;
        if (status) whereClause.status = status;
        if (hasContract !== null) {
            whereClause.hasContract = hasContract === 'true';
        }

        // Work types filter
        if (workTypes.length > 0) {
            whereClause.UserWorkType = {
                some: {
                    workType: {
                        name: { in: workTypes }
                    }
                }
            };
        }

        // Salary range filters
        if (salaryMin || salaryMax) {
            const salaryConditions: any[] = [];

            if (salaryType === 'hourlyRate' || salaryType === 'all') {
                const hourlyRateCondition: any = {
                    hourlyRate: { not: null }
                };
                if (salaryMin) hourlyRateCondition.hourlyRate = { ...hourlyRateCondition.hourlyRate, gte: parseFloat(salaryMin) };
                if (salaryMax) hourlyRateCondition.hourlyRate = { ...hourlyRateCondition.hourlyRate, lte: parseFloat(salaryMax) };
                salaryConditions.push(hourlyRateCondition);
            }

            if (salaryType === 'hourlyWage' || salaryType === 'all') {
                const hourlyWageCondition: any = {
                    hourlyWage: { not: null }
                };
                if (salaryMin) hourlyWageCondition.hourlyWage = { ...hourlyWageCondition.hourlyWage, gte: parseFloat(salaryMin) };
                if (salaryMax) hourlyWageCondition.hourlyWage = { ...hourlyWageCondition.hourlyWage, lte: parseFloat(salaryMax) };
                salaryConditions.push(hourlyWageCondition);
            }

            if (salaryType === 'monthlySalary' || salaryType === 'all') {
                const monthlySalaryCondition: any = {
                    monthlySalary: { not: null }
                };
                if (salaryMin) monthlySalaryCondition.monthlySalary = { ...monthlySalaryCondition.monthlySalary, gte: parseFloat(salaryMin) };
                if (salaryMax) monthlySalaryCondition.monthlySalary = { ...monthlySalaryCondition.monthlySalary, lte: parseFloat(salaryMax) };
                salaryConditions.push(monthlySalaryCondition);
            }

            if (salaryConditions.length > 0) {
                whereClause.OR = whereClause.OR ?
                    [...whereClause.OR, ...salaryConditions] :
                    salaryConditions;
            }
        }

        // Date range filters
        if (hiredStartDate || hiredEndDate) {
            whereClause.createdAt = {};
            if (hiredStartDate) whereClause.createdAt.gte = new Date(hiredStartDate);
            if (hiredEndDate) whereClause.createdAt.lte = new Date(hiredEndDate);
        }

        if (lastActivityStartDate || lastActivityEndDate) {
            whereClause.lastLoginAt = {};
            if (lastActivityStartDate) whereClause.lastLoginAt.gte = new Date(lastActivityStartDate);
            if (lastActivityEndDate) whereClause.lastLoginAt.lte = new Date(lastActivityEndDate);
        }

        // Quick filters
        if (quickFilters.length > 0) {
            const quickFilterConditions: any[] = [];

            quickFilters.forEach(filter => {
                switch (filter) {
                    case 'new_employees':
                        // Hired in last 30 days
                        quickFilterConditions.push({
                            createdAt: {
                                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                            }
                        });
                        break;

                    case 'active_this_week':
                        // Has time entry this week
                        const startOfWeek = new Date();
                        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
                        startOfWeek.setHours(0, 0, 0, 0);

                        quickFilterConditions.push({
                            timeEntries: {
                                some: {
                                    startTime: { gte: startOfWeek }
                                }
                            }
                        });
                        break;

                    case 'contract_expiring':
                        // This would need a contract expiry date field
                        // For now, we'll skip this filter
                        break;

                    case 'high_earners':
                        // Above average salary (simplified)
                        quickFilterConditions.push({
                            OR: [
                                { hourlyRate: { gte: "50" } },
                                { hourlyWage: { gte: "25" } },
                                { monthlySalary: { gte: "4000" } }
                            ]
                        });
                        break;

                    case 'no_contract':
                        quickFilterConditions.push({
                            hasContract: false
                        });
                        break;

                    case 'freelancers_only':
                        quickFilterConditions.push({
                            employeeType: 'FREELANCER'
                        });
                        break;

                    case 'archived':
                        quickFilterConditions.push({
                            archived: true
                        });
                        break;
                }
            });

            if (quickFilterConditions.length > 0) {
                whereClause.AND = whereClause.AND ?
                    [...whereClause.AND, ...quickFilterConditions] :
                    quickFilterConditions;
            }
        }

        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                employeeType: true,
                company: true,
                phone: true,
                status: true,
                hasContract: true,
                hourlyRate: true,
                monthlySalary: true,
                hourlyWage: true,
                createdAt: true,
                lastLoginAt: true,
                archived: true,
                archivedAt: true,
                UserWorkType: {
                    include: {
                        workType: {
                            select: {
                                id: true,
                                name: true,
                                emoji: true
                            }
                        }
                    }
                },
                timeEntries: {
                    select: {
                        id: true,
                        startTime: true,
                        endTime: true
                    },
                    take: 5,
                    orderBy: {
                        startTime: 'desc'
                    }
                }
            },
            orderBy: [
                { archived: 'asc' }, // Non-archived first
                { createdAt: 'desc' }
            ]
        });

        // Transform data for frontend
        const transformedUsers = users.map(user => ({
            ...user,
            name: user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`.trim()
                : user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0],
            workTypes: user.UserWorkType.map(uwt => uwt.workType),
            recentActivity: user.timeEntries.length > 0 ? user.timeEntries[0].startTime : user.lastLoginAt
        }));

        return NextResponse.json(transformedUsers);
    } catch (error) {
        console.error('Error fetching personnel:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
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
        const {
            name,
            email,
            role,
            employeeType,
            company,
            phone,
            address,
            hourlyRate,
            monthlySalary,
            hourlyWage,
            workTypes,
            kvkNumber,
            btwNumber,
            hasContract
        } = body;

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            );
        }

        const hashedPassword = await hash('changeme123', 12);

        // Map role to valid Prisma enum values
        let mappedRole: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'FREELANCER';
        switch (role?.toUpperCase()) {
            case 'ADMIN':
                mappedRole = 'ADMIN';
                break;
            case 'MANAGER':
                mappedRole = 'MANAGER';
                break;
            case 'EMPLOYEE':
                mappedRole = 'EMPLOYEE';
                break;
            case 'FREELANCER':
            default:
                mappedRole = 'FREELANCER';
                break;
        }

        // Get work type IDs from names
        const workTypeRecords = workTypes ? await prisma.workType.findMany({
            where: {
                name: {
                    in: workTypes
                }
            },
            select: {
                id: true,
                name: true
            }
        }) : [];

        const employee = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: mappedRole,
                employeeType,
                company,
                status: 'AVAILABLE',
                phone,
                address,
                hourlyRate,
                monthlySalary,
                hourlyWage,
                kvkNumber,
                btwNumber,
                hasContract,
                UserWorkType: {
                    create: workTypeRecords.map((workType) => ({
                        workTypeId: workType.id
                    }))
                }
            },
            include: {
                UserWorkType: {
                    select: {
                        workType: {
                            select: {
                                id: true,
                                name: true,
                                emoji: true,
                                description: true
                            }
                        }
                    }
                }
            }
        });

        // Transform the data to match the frontend interface
        const transformedEmployee = {
            ...employee,
            workTypes: employee.UserWorkType.map((uwt: any) => uwt.workType.name)
        };

        return NextResponse.json(transformedEmployee);
    } catch (error) {
        console.error('Error creating employee:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 