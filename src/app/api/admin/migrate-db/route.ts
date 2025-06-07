import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        // Security check - only allow in development or with explicit setup
        if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SETUP !== 'true') {
            return NextResponse.json(
                { error: 'Migration endpoint disabled in production' },
                { status: 403 }
            );
        }

        console.log('🔄 Starting database migration and setup...');

        // 1. Test database connection
        console.log('🔗 Testing database connection...');
        await prisma.$connect();
        console.log('✅ Database connected');

        // 2. Check if User table exists and has accountStatus column
        try {
            const result = await prisma.$queryRaw`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'User' AND column_name = 'accountStatus'
            `;
            console.log('📊 AccountStatus column check:', result);
        } catch (error) {
            console.log('⚠️ AccountStatus column might not exist yet:', error);
        }

        // 3. Create/Update Admin User (Marthen)
        console.log('👤 Creating/updating admin user...');

        const adminEmail = 'marthen@broersverhuur.nl';
        const adminPassword = await hash('zw@rteKip69!', 12);

        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (!existingAdmin) {
            // Create new admin
            const adminUser = await prisma.user.create({
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
            console.log('✅ Admin user created:', adminUser.email);
        } else {
            // Update existing admin
            await prisma.user.update({
                where: { email: adminEmail },
                data: {
                    password: adminPassword,
                    firstName: 'Marthen',
                    lastName: 'Bakker',
                    name: 'Marthen Bakker',
                    role: 'ADMIN'
                }
            });
            console.log('✅ Admin user updated:', adminEmail);
        }

        // 4. Create demo admin if not exists
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

        // 5. Test user lookup
        const testUser = await prisma.user.findUnique({
            where: { email: adminEmail },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true
            }
        });

        console.log('🎉 Migration completed successfully!');

        return NextResponse.json({
            success: true,
            message: 'Database migration and setup completed',
            adminUser: testUser,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Migration failed:', error);
        return NextResponse.json(
            {
                error: 'Migration failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 