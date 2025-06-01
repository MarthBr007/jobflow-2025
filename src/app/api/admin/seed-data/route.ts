import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { setupKey } = body;

        // Security check
        if (setupKey !== 'jobflow-admin-setup-2025') {
            return NextResponse.json({ error: 'Invalid setup key' }, { status: 401 });
        }

        // Check if we already have users (don't seed if data exists)
        const existingUsers = await prisma.user.count();
        if (existingUsers > 1) {
            return NextResponse.json({
                message: `Database already has ${existingUsers} users, skipping seed`
            });
        }

        const hashedPassword = await hash('changeme123', 12);

        const testUsers = [
            {
                email: 'manager@broersverhuur.nl',
                name: 'Manager Broers',
                role: 'MANAGER' as const,
                employeeType: 'PERMANENT' as const,
                company: 'Broers Verhuur'
            },
            {
                email: 'jan.devries@broersverhuur.nl',
                name: 'Jan de Vries',
                role: 'EMPLOYEE' as const,
                employeeType: 'PERMANENT' as const,
                company: 'Broers Verhuur',
                phone: '+31 6 12345678',
                monthlySalary: '3500'
            },
            {
                email: 'marie.bakker@dcrt.nl',
                name: 'Marie Bakker',
                role: 'MANAGER' as const,
                employeeType: 'PERMANENT' as const,
                company: 'DCRT Event Decorations'
            },
            {
                email: 'piet.janssen@freelance.nl',
                name: 'Piet Janssen',
                role: 'FREELANCER' as const,
                employeeType: 'FREELANCER' as const,
                company: 'Broers Verhuur',
                hourlyRate: '25',
                kvkNumber: '12345678',
                btwNumber: 'NL123456789B01'
            },
            {
                email: 'lisa.vandenberg@dcrt.nl',
                name: 'Lisa van den Berg',
                role: 'EMPLOYEE' as const,
                employeeType: 'FLEX_WORKER' as const,
                company: 'DCRT Event Decorations',
                hourlyWage: '15.50'
            }
        ];

        const createdUsers = [];

        for (const userData of testUsers) {
            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email: userData.email }
            });

            if (!existingUser) {
                const user = await prisma.user.create({
                    data: {
                        ...userData,
                        password: hashedPassword,
                        status: 'AVAILABLE'
                    }
                });
                createdUsers.push(user.email);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Created ${createdUsers.length} test users`,
            createdUsers
        });

    } catch (error) {
        console.error('Seed data error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 