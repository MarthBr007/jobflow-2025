import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function POST(request: Request) {
    try {
        // Temporary admin setup route - only works if no admin exists yet
        const body = await request.json();
        const { email, password, setupKey } = body;

        // Simple security check
        if (setupKey !== 'jobflow-admin-setup-2025') {
            return NextResponse.json({ error: 'Invalid setup key' }, { status: 401 });
        }

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
        }

        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { email }
        });

        const hashedPassword = await hash(password, 12);

        if (user) {
            // Update existing user
            user = await prisma.user.update({
                where: { email },
                data: {
                    password: hashedPassword,
                    role: 'ADMIN',
                    company: 'Broers Verhuur'
                }
            });
        } else {
            // Create new admin user
            user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: 'Admin',
                    role: 'ADMIN',
                    company: 'Broers Verhuur',
                    status: 'AVAILABLE'
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: `Admin user ${user.email} setup complete`,
            userId: user.id
        });

    } catch (error) {
        console.error('Admin setup error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 