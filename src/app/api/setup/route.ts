import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function GET(request: NextRequest) {
    try {
        console.log('🔄 Starting database setup...');

        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        // Check current users
        const existingUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                role: true,
                createdAt: true
            }
        });

        console.log('📊 Current users in database:', existingUsers.length);

        // Create Admin User (Marthen) if not exists
        const adminEmail = 'marthen@broersverhuur.nl';
        const adminPassword = await hash('zw@rteKip69!', 12);
        
        let adminUser = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (!adminUser) {
            adminUser = await prisma.user.create({
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
            // Update password if user exists
            await prisma.user.update({
                where: { email: adminEmail },
                data: {
                    password: adminPassword,
                    role: 'ADMIN'
                }
            });
            console.log('✅ Admin user password updated:', adminEmail);
        }

        // Create Demo Admin if not exists
        const demoAdminEmail = 'admin@jobflow.nl';
        const demoAdminPassword = await hash('admin123', 12);
        
        let demoAdmin = await prisma.user.findUnique({
            where: { email: demoAdminEmail }
        });

        if (!demoAdmin) {
            demoAdmin = await prisma.user.create({
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
            console.log('✅ Demo admin user created:', demoAdmin.email);
        } else {
            // Update password if user exists
            await prisma.user.update({
                where: { email: demoAdminEmail },
                data: {
                    password: demoAdminPassword,
                    role: 'ADMIN'
                }
            });
            console.log('✅ Demo admin password updated:', demoAdminEmail);
        }

        // Final verification
        const finalUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                role: true,
                createdAt: true
            }
        });

        console.log('🎉 Setup completed successfully!');

        return NextResponse.json({
            success: true,
            message: 'Database setup completed successfully',
            users: finalUsers,
            adminCredentials: {
                primary: {
                    email: adminEmail,
                    password: 'zw@rteKip69!'
                },
                demo: {
                    email: demoAdminEmail,
                    password: 'admin123'
                }
            },
            databaseUrl: process.env.DATABASE_URL ? 'Connected' : 'Not configured',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Setup failed:', error);
        return NextResponse.json(
            { 
                error: 'Setup failed', 
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
} 