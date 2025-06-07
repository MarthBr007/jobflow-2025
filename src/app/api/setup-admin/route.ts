import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        // Simple environment check
        if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SETUP !== 'true') {
            return NextResponse.json(
                { error: 'Setup disabled in production without ALLOW_SETUP=true' },
                { status: 403 }
            );
        }

        console.log('🔄 Starting admin user setup...');

        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connected');

        // Create/Update Admin User (Marthen)
        const adminEmail = 'marthen@broersverhuur.nl';
        const adminPassword = await hash('zw@rteKip69!', 12);

        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        let adminResult;
        if (!existingAdmin) {
            // Create new admin
            adminResult = await prisma.user.create({
                data: {
                    email: adminEmail,
                    password: adminPassword,
                    firstName: 'Marthen',
                    lastName: 'Bakker',
                    name: 'Marthen Bakker',
                    role: 'ADMIN',
                    employeeType: 'PERMANENT',
                    status: 'AVAILABLE',
                    company: 'Broers Verhuur',
                    address: 'Hoofdkantoor',
                    phone: '+31-123-456-789',
                    hasContract: true,
                    contractStatus: 'ACTIVE'
                }
            });
            console.log('✅ Admin user created:', adminResult.email);
        } else {
            // Update existing admin password
            adminResult = await prisma.user.update({
                where: { email: adminEmail },
                data: {
                    password: adminPassword,
                    role: 'ADMIN'
                }
            });
            console.log('✅ Admin user updated:', adminEmail);
        }

        // Create demo admin if not exists
        const demoAdminEmail = 'admin@jobflow.nl';
        const demoAdminPassword = await hash('admin123', 12);

        const existingDemoAdmin = await prisma.user.findUnique({
            where: { email: demoAdminEmail }
        });

        if (!existingDemoAdmin) {
            await prisma.user.create({
                data: {
                    email: demoAdminEmail,
                    password: demoAdminPassword,
                    firstName: 'Admin',
                    lastName: 'Demo',
                    name: 'Admin Demo',
                    role: 'ADMIN',
                    employeeType: 'PERMANENT',
                    status: 'AVAILABLE',
                    company: 'Demo Company',
                    address: 'Demo Address',
                    phone: '+31-000-000-000'
                }
            });
            console.log('✅ Demo admin user created');
        }

        console.log('🎉 Admin setup completed successfully!');

        return NextResponse.json({
            success: true,
            message: 'Admin users setup completed',
            adminEmail: adminEmail,
            demoEmail: demoAdminEmail,
            canLogin: true,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Setup failed:', error);
        return NextResponse.json(
            {
                error: 'Setup failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 