const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function resetDefaultPasswords() {
    console.log('🔐 Starting password reset for users with default passwords...');
    
    try {
        // Generate secure random passwords
        function generateSecurePassword() {
            const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
            let password = '';
            for (let i = 0; i < 16; i++) {
                password += charset.charAt(Math.floor(Math.random() * charset.length));
            }
            return password;
        }

        // Find users who potentially have default passwords
        // This is based on creation time and common patterns
        const suspiciousUsers = await prisma.user.findMany({
            where: {
                OR: [
                    // Users created in the last 30 days (potential setup users)
                    {
                        createdAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        }
                    },
                    // Test emails that likely have default passwords
                    {
                        email: {
                            contains: '@broersverhuur.nl'
                        }
                    },
                    {
                        email: {
                            contains: '@dcrt.nl'
                        }
                    },
                    {
                        email: {
                            contains: '@freelance.nl'
                        }
                    }
                ]
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        });

        if (suspiciousUsers.length === 0) {
            console.log('✅ No users found with potentially weak passwords');
            return;
        }

        console.log(`Found ${suspiciousUsers.length} users that may have default passwords:`);
        suspiciousUsers.forEach(user => {
            console.log(`  - ${user.email} (${user.role}) - Created: ${user.createdAt.toDateString()}`);
        });

        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const answer = await new Promise((resolve) => {
            rl.question('\nDo you want to reset passwords for these users? (yes/no): ', resolve);
        });

        rl.close();

        if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
            console.log('Password reset cancelled.');
            return;
        }

        const resetResults = [];

        for (const user of suspiciousUsers) {
            const newPassword = generateSecurePassword();
            const hashedPassword = await bcrypt.hash(newPassword, 12);

            await prisma.user.update({
                where: { id: user.id },
                data: { 
                    password: hashedPassword,
                    // Force password change on next login
                    // You could add a field like 'mustChangePassword: true' if you have it
                }
            });

            resetResults.push({
                email: user.email,
                name: user.name,
                role: user.role,
                newPassword: newPassword
            });

            console.log(`✅ Password reset for ${user.email}`);
        }

        // Save passwords to a secure file for distribution
        const fs = require('fs');
        const passwordFile = `new-passwords-${Date.now()}.txt`;
        
        let passwordContent = '🔐 NEW PASSWORDS - DISTRIBUTE SECURELY AND DELETE THIS FILE\n';
        passwordContent += '================================================================\n\n';
        
        resetResults.forEach(result => {
            passwordContent += `Email: ${result.email}\n`;
            passwordContent += `Name: ${result.name}\n`;
            passwordContent += `Role: ${result.role}\n`;
            passwordContent += `New Password: ${result.newPassword}\n`;
            passwordContent += '---\n\n';
        });

        passwordContent += 'IMPORTANT:\n';
        passwordContent += '1. Distribute these passwords securely (encrypted email, secure chat, etc.)\n';
        passwordContent += '2. Instruct users to change their password on first login\n';
        passwordContent += '3. DELETE this file after distributing passwords\n';
        passwordContent += '4. Users should not share these passwords\n';

        fs.writeFileSync(passwordFile, passwordContent);

        console.log('\n🔐 Password Reset Complete!');
        console.log(`📁 New passwords saved to: ${passwordFile}`);
        console.log('⚠️  IMPORTANT: Distribute passwords securely and delete the file afterwards');
        console.log('\n📧 Next steps:');
        console.log('1. Securely send new passwords to each user');
        console.log('2. Instruct users to change password on first login');
        console.log('3. Delete the password file');
        console.log('4. Monitor login attempts');

    } catch (error) {
        console.error('❌ Error resetting passwords:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Check if running directly
if (require.main === module) {
    resetDefaultPasswords();
}

module.exports = { resetDefaultPasswords }; 