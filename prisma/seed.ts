import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seeding...');

    // Check if seeding is allowed
    if (process.env.ALLOW_SEEDING !== 'true') {
        console.log('❌ Seeding is disabled. Set ALLOW_SEEDING=true to enable.');
        return;
    }

    try {
        // 1. Create Admin User (Marthen)
        console.log('👤 Creating admin user...');

        const adminEmail = 'marthen@broersverhuur.nl';
        const adminPassword = await hash('zw@rteKip69!', 12);

        // Check if admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (!existingAdmin) {
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
                    // accountStatus: 'APPROVED', // TODO: Re-enable after migration
                    // approvedAt: new Date(),
                    company: 'Broers Verhuur',
                    address: 'Hoofdkantoor',
                    phone: '+31-123-456-789',
                    hasContract: true,
                    contractStatus: 'ACTIVE'
                }
            });
            console.log('✅ Admin user created:', adminUser.email);
        } else {
            // Update existing admin to ensure APPROVED status
            /*
            await prisma.user.update({
                where: { email: adminEmail },
                data: {
                    accountStatus: 'APPROVED',
                    approvedAt: new Date()
                }
            });
            */
            console.log('✅ Admin user already exists and updated to APPROVED');
        }

        // 2. Create default admin user for demo (if not exists)
        console.log('👤 Creating default demo admin...');

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
                    // accountStatus: 'APPROVED', // TODO: Re-enable after migration
                    // approvedAt: new Date(),
                    company: 'Demo Company',
                    address: 'Demo Address',
                    phone: '+31-000-000-000'
                }
            });
            console.log('✅ Demo admin user created');
        } else {
            /*
            await prisma.user.update({
                where: { email: demoAdminEmail },
                data: {
                    accountStatus: 'APPROVED',
                    approvedAt: new Date()
                }
            });
            */
            console.log('✅ Demo admin already exists and updated to APPROVED');
        }

        // 3. Create sample pending users (for testing approval system) - DISABLED FOR NOW
        /*
        console.log('👥 Creating sample pending users for testing...');
        
        const sampleUsers = [
            {
                email: 'test.employee@example.com',
                password: await hash('password123', 12),
                firstName: 'Test',
                lastName: 'Employee',
                role: 'EMPLOYEE',
                phone: '+31-111-111-111',
                address: 'Test Street 1, Amsterdam'
            },
            {
                email: 'test.freelancer@example.com', 
                password: await hash('password123', 12),
                firstName: 'Test',
                lastName: 'Freelancer',
                role: 'FREELANCER',
                phone: '+31-222-222-222',
                address: 'Freelancer Street 2, Rotterdam',
                kvkNumber: '12345678',
                btwNumber: 'NL123456789B01',
                iban: 'NL91ABNA0417164300'
            }
        ];

        for (const userData of sampleUsers) {
            const existingUser = await prisma.user.findUnique({
                where: { email: userData.email }
            });

            if (!existingUser) {
                await prisma.user.create({
                    data: {
                        ...userData,
                        name: `${userData.firstName} ${userData.lastName}`,
                        employeeType: userData.role === 'FREELANCER' ? 'FREELANCER' : 'PERMANENT',
                        status: 'AVAILABLE',
                        accountStatus: 'PENDING', // These need admin approval
                        company: 'Test Company'
                    }
                });
                console.log(`✅ Sample ${userData.role.toLowerCase()} created: ${userData.email}`);
            }
        }
        */

        console.log('🎉 Seeding completed successfully!');
        console.log('');
        console.log('📧 Login credentials:');
        console.log('👤 Admin (Marthen): marthen@broersverhuur.nl / zw@rteKip69!');
        console.log('👤 Demo Admin: admin@jobflow.nl / admin123');
        console.log('⏳ Pending users created for approval testing');

    } catch (error) {
        console.error('❌ Error during seeding:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 