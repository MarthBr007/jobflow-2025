import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        // Test basic connection
        const userCount = await prisma.user.count();
        console.log('Database connection successful!');
        console.log('Total users in database:', userCount);

        // Try to find a specific user
        const user = await prisma.user.findFirst({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                company: true
            }
        });

        if (user) {
            console.log('Sample user found:', user);
        } else {
            console.log('No users found in database');
        }
    } catch (error) {
        console.error('Database error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main(); 