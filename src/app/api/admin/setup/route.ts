import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function POST(request: Request) {
    try {
        // 🚨 SECURITY: Disable this endpoint in production
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json(
                {
                    error: 'Setup endpoint is disabled in production for security reasons',
                    code: 'SETUP_DISABLED_PRODUCTION'
                },
                { status: 403 }
            );
        }

        // Additional security check: Only allow in development or with explicit override
        const allowSetup = process.env.ALLOW_SETUP === 'true';
        if (!allowSetup && process.env.NODE_ENV !== 'development') {
            return NextResponse.json(
                {
                    error: 'Setup endpoint is not allowed in this environment',
                    code: 'SETUP_NOT_ALLOWED'
                },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { email, password, setupKey } = body;

        // Use environment variable for setup key instead of hardcoded value
        const expectedSetupKey = process.env.ADMIN_SETUP_KEY;
        if (!expectedSetupKey) {
            return NextResponse.json(
                {
                    error: 'Setup is not configured properly - missing ADMIN_SETUP_KEY',
                    code: 'SETUP_KEY_MISSING'
                },
                { status: 500 }
            );
        }

        if (setupKey !== expectedSetupKey) {
            console.warn('Invalid setup attempt with key:', setupKey.substring(0, 10) + '...');
            return NextResponse.json(
                {
                    error: 'Invalid setup key',
                    code: 'INVALID_SETUP_KEY'
                },
                { status: 401 }
            );
        }

        if (!email || !password) {
            return NextResponse.json(
                {
                    error: 'Email and password required',
                    code: 'MISSING_CREDENTIALS'
                },
                { status: 400 }
            );
        }

        // Check if we already have admin users (prevent multiple setups)
        const existingAdmins = await prisma.user.count({
            where: { role: 'ADMIN' }
        });

        if (existingAdmins > 0) {
            return NextResponse.json(
                {
                    error: 'Admin users already exist. Setup can only be run once.',
                    code: 'SETUP_ALREADY_COMPLETED'
                },
                { status: 409 }
            );
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

        // Log the setup completion for audit purposes
        console.log(`🔧 SETUP: Admin user ${user.email} setup completed in ${process.env.NODE_ENV} environment`);

        return NextResponse.json({
            success: true,
            message: `Admin user ${user.email} setup complete with ADMIN role`,
            userId: user.id,
            role: user.role,
            company: user.company,
            environment: process.env.NODE_ENV
        });

    } catch (error) {
        console.error('Admin setup error:', error);
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                details: error instanceof Error ? error.message : 'Unknown error',
                code: 'SETUP_ERROR'
            },
            { status: 500 }
        );
    }
} 