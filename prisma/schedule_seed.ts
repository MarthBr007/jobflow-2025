import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding schedule data...');

    // Get admin user
    const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
    });

    if (!adminUser) {
        console.log('No admin user found, skipping schedule seed');
        return;
    }

    // Get some users for the schedule
    const users = await prisma.user.findMany({
        where: {
            role: {
                in: ['ADMIN', 'MANAGER', 'FREELANCER']
            }
        },
        take: 3
    });

    // Get a project
    const project = await prisma.project.findFirst();

    if (users.length === 0) {
        console.log('No users found, skipping schedule seed');
        return;
    }

    // Create a schedule for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const schedule = await prisma.schedule.upsert({
        where: { date: today },
        update: {},
        create: {
            date: today,
            title: 'Dagelijks Rooster',
            description: 'Rooster voor vandaag',
            createdById: adminUser.id,
        }
    });

    // Create some shifts
    const shifts = [
        {
            userId: users[0].id,
            projectId: project?.id,
            startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9:00
            endTime: new Date(today.getTime() + 17 * 60 * 60 * 1000), // 17:00
            role: 'Chauffeur',
            notes: 'Route A - Centrum',
            status: 'CONFIRMED' as const,
        },
        {
            userId: users[1]?.id,
            projectId: project?.id,
            startTime: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8:00
            endTime: new Date(today.getTime() + 16 * 60 * 60 * 1000), // 16:00
            role: 'Orderpicker',
            notes: 'Magazijn - Sectie B',
            status: 'SCHEDULED' as const,
        },
        {
            userId: users[2]?.id,
            startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10:00
            endTime: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 14:00
            role: 'Administratie',
            notes: 'Kantoor - Facturen verwerken',
            status: 'SCHEDULED' as const,
        },
    ];

    for (const shiftData of shifts) {
        if (shiftData.userId) {
            // Check if shift already exists
            const existingShift = await prisma.scheduleShift.findFirst({
                where: {
                    scheduleId: schedule.id,
                    userId: shiftData.userId,
                }
            });

            if (!existingShift) {
                await prisma.scheduleShift.create({
                    data: {
                        ...shiftData,
                        scheduleId: schedule.id,
                    }
                });
            }
        }
    }

    console.log('Schedule seed completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 