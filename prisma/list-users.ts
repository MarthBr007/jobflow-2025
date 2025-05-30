import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                company: true,
                createdAt: true
            },
            orderBy: { createdAt: 'asc' }
        });

        console.log('=== LOGIN ACCOUNTS ===');
        console.log('Totaal aantal accounts:', users.length);
        console.log('');

        users.forEach((user: any, index: number) => {
            console.log(`${index + 1}. ${user.name || 'Geen naam'}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Rol: ${user.role}`);
            console.log(`   Bedrijf: ${user.company || 'Niet ingesteld'}`);
            console.log(`   Aangemaakt: ${user.createdAt.toLocaleDateString('nl-NL')}`);
            console.log('');
        });

        console.log('=== STANDAARD WACHTWOORDEN ===');
        console.log('Voor alle accounts geldt waarschijnlijk:');
        console.log('- Admin accounts: mogelijk een specifiek wachtwoord');
        console.log('- Nieuwe accounts: "changeme123" (standaard)');
        console.log('');
        console.log('💡 TIP: Log in met email + wachtwoord');

    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

getUsers(); 