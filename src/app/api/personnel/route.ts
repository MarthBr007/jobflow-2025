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

        console.log('Personnel API: Session user:', session.user.email);

        // Simple query first to test database connection
        const users = await prisma.user.findMany({
            where: {
                archived: false
            },
            select: {
                id: true,
                email: true,
                name: true,
                firstName: true,
                lastName: true,
                role: true,
                employeeType: true,
                company: true,
                phone: true,
                address: true,
                bsnNumber: true,
                hourlyRate: true,
                monthlySalary: true,
                hourlyWage: true,
                kvkNumber: true,
                btwNumber: true,
                hasContract: true,
                iban: true,
                availableDays: true,
                status: true,
                createdAt: true,
                lastLoginAt: true,
                archived: true
            },
            orderBy: [
                { archived: 'asc' },
                { createdAt: 'desc' }
            ]
        });

        console.log(`Personnel API: Found ${users.length} users`);

        // Transform data for frontend
        const transformedUsers = users.map((user: any) => ({
            ...user,
            name: user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`.trim()
                : user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0],
            workTypes: [], // Simplified for now
            recentActivity: user.lastLoginAt
        }));

        return NextResponse.json(transformedUsers);
    } catch (error) {
        console.error('Error fetching personnel:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
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
                    create: workTypeRecords.map((workType: any) => ({
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