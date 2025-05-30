import { PrismaClient } from '@prisma/client';
import { hash, compare } from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPasswords() {
    try {
        console.log('🔄 Resetting passwords...');

        // Test current password first
        const admin = await prisma.user.findUnique({
            where: { email: 'admin@jobflow.local' }
        });

        if (admin) {
            console.log('📧 Admin user found:', admin.email);

            // Test common passwords
            const testPasswords = ['password123', 'admin', 'password', 'jobflow123'];
            let currentPasswordWorks = false;

            for (const testPwd of testPasswords) {
                try {
                    const isValid = await compare(testPwd, admin.password);
                    if (isValid) {
                        console.log(`✅ Current password is: "${testPwd}"`);
                        currentPasswordWorks = true;
                        break;
                    }
                } catch (e) {
                    // Continue testing
                }
            }

            if (!currentPasswordWorks) {
                console.log('❌ Current password not recognized, setting new password...');

                // Set new password
                const newPassword = 'admin123';
                const hashedPassword = await hash(newPassword, 12);

                await prisma.user.update({
                    where: { email: 'admin@jobflow.local' },
                    data: { password: hashedPassword }
                });

                console.log(`✅ New password set: "${newPassword}"`);
            }
        }

        // Also check other users
        const allUsers = await prisma.user.findMany({
            select: { email: true, password: true }
        });

        console.log('\n=== ALL LOGIN CREDENTIALS ===');

        for (const user of allUsers) {
            console.log(`\n📧 ${user.email}`);

            // Test if password123 works
            try {
                const isValid = await compare('password123', user.password);
                if (isValid) {
                    console.log(`   🔑 Password: password123`);
                } else {
                    // Set password123 for all users
                    const hashedPassword = await hash('password123', 12);
                    await prisma.user.update({
                        where: { email: user.email },
                        data: { password: hashedPassword }
                    });
                    console.log(`   🔑 Password reset to: password123`);
                }
            } catch (e) {
                console.log(`   ❌ Error checking password for ${user.email}`);
            }
        }

        console.log('\n🎉 Password reset complete!');
        console.log('\n=== LOGIN INFO ===');
        console.log('Admin: admin@jobflow.local / password123');
        console.log('Employee: employee@jobflow.local / password123');
        console.log('Freelancer: freelancer1@jobflow.local / password123');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetPasswords(); 