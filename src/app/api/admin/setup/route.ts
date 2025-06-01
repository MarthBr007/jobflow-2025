import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function POST(request: Request) {
    try {
        // Temporary admin setup route
        const body = await request.json();
        const { email, password, setupKey } = body;

        // Simple security check
        if (setupKey !== 'jobflow-admin-setup-2025') {
            return NextResponse.json({ error: 'Invalid setup key' }, { status: 401 });
        }

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
        }

        const hashedPassword = await hash(password, 12);

        // First, try to update existing user
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        let user;

        if (existingUser) {
            // Update existing user to admin
            user = await prisma.user.update({
                where: { email },
                data: {
                    password: hashedPassword,
                    role: 'ADMIN',
                    company: 'Broers Verhuur',
                    name: email === 'admin@jobflow.nl' ? 'Administrator' : existingUser.name,
                    status: 'AVAILABLE'
                }
            });
        } else {
            // Create new admin user
            user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: email === 'admin@jobflow.nl' ? 'Administrator' : 'Admin',
                    role: 'ADMIN',
                    company: 'Broers Verhuur',
                    status: 'AVAILABLE',
                    employeeType: 'PERMANENT'
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: `Admin user ${user.email} setup complete with ADMIN role`,
            userId: user.id,
            role: user.role,
            company: user.company
        });

    } catch (error) {
        console.error('Admin setup error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 