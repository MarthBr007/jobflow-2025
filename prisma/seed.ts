import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    // Create different passwords for each role
    const adminPassword = await bcrypt.hash('admin123', 10);
    const managerPassword = await bcrypt.hash('manager123', 10);
    const employeePassword = await bcrypt.hash('employee123', 10);
    const freelancerPassword = await bcrypt.hash('freelancer123', 10);

    // Admin user
    const admin = await prisma.user.upsert({
        where: { email: 'admin@jobflow.nl' },
        update: {},
        create: {
            email: 'admin@jobflow.nl',
            name: 'Admin User',
            password: adminPassword,
            role: 'ADMIN',
            company: 'Broers Verhuur',
            status: 'AVAILABLE',
        },
    });

    // Manager user
    const manager = await prisma.user.upsert({
        where: { email: 'manager@jobflow.nl' },
        update: {},
        create: {
            email: 'manager@jobflow.nl',
            name: 'Manager User',
            password: managerPassword,
            role: 'MANAGER',
            company: 'Broers Verhuur',
            status: 'AVAILABLE',
        },
    });

    // Employee user
    const employee = await prisma.user.upsert({
        where: { email: 'employee@jobflow.nl' },
        update: {},
        create: {
            email: 'employee@jobflow.nl',
            name: 'Employee User',
            password: employeePassword,
            role: 'EMPLOYEE',
            company: 'Broers Verhuur',
            status: 'AVAILABLE',
        },
    });

    // Freelancer users - some for Broers Verhuur, some for DCRT
    const freelancer1 = await prisma.user.upsert({
        where: { email: 'freelancer1@jobflow.nl' },
        update: {},
        create: {
            email: 'freelancer1@jobflow.nl',
            name: 'Freelancer One',
            password: freelancerPassword,
            role: 'FREELANCER',
            company: 'Broers Verhuur', // Changed to same company as admin
            status: 'AVAILABLE',
            phone: '+31612345678',
            address: 'Teststraat 1, 1234 AB Amsterdam',
            hourlyRate: '25.00',
            kvkNumber: '12345678',
            btwNumber: 'NL123456789B01',
            hasContract: true,
        },
    });

    const freelancer2 = await prisma.user.upsert({
        where: { email: 'freelancer2@jobflow.nl' },
        update: {},
        create: {
            email: 'freelancer2@jobflow.nl',
            name: 'Freelancer Two',
            password: freelancerPassword,
            role: 'FREELANCER',
            company: 'Broers Verhuur', // Changed to same company as admin
            status: 'AVAILABLE',
            phone: '+31687654321',
            address: 'Voorbeeldlaan 2, 5678 CD Rotterdam',
            hourlyRate: '22.50',
            kvkNumber: '87654321',
            btwNumber: 'NL987654321B01',
            hasContract: true,
        },
    });

    // Add some DCRT freelancers as well
    const dcrtFreelancer1 = await prisma.user.upsert({
        where: { email: 'dcrt1@jobflow.nl' },
        update: {},
        create: {
            email: 'dcrt1@jobflow.nl',
            name: 'DCRT Freelancer One',
            password: freelancerPassword,
            role: 'FREELANCER',
            company: 'DCRT Event Decorations',
            status: 'AVAILABLE',
            phone: '+31698765432',
            address: 'DCRT Straat 10, 1000 AB Amsterdam',
            hourlyRate: '28.00',
            kvkNumber: '11223344',
            btwNumber: 'NL112233445B01',
            hasContract: true,
        },
    });

    const dcrtFreelancer2 = await prisma.user.upsert({
        where: { email: 'dcrt2@jobflow.nl' },
        update: {},
        create: {
            email: 'dcrt2@jobflow.nl',
            name: 'DCRT Freelancer Two',
            password: freelancerPassword,
            role: 'FREELANCER',
            company: 'DCRT Event Decorations',
            status: 'AVAILABLE',
            phone: '+31687654321',
            address: 'Event Laan 5, 2000 CD Rotterdam',
            hourlyRate: '26.50',
            kvkNumber: '55667788',
            btwNumber: 'NL556677889B01',
            hasContract: true,
        },
    });

    // Create some test projects
    const project1 = await prisma.project.create({
        data: {
            name: 'Warehouse Project Alpha',
            description: 'Groot warehouse project voor de zomer',
            startDate: new Date('2024-06-01'),
            endDate: new Date('2024-08-31'),
            status: 'ACTIVE',
            company: 'Broers Verhuur',
            address: 'Industrieweg 25',
            city: 'Utrecht',
            postalCode: '3542 AD',
            country: 'Nederland',
            latitude: 52.0907,
            longitude: 5.1214,
            contactPerson: 'Jan Broers',
            contactPhone: '+31 30 123 4567',
        },
    });

    const project2 = await prisma.project.create({
        data: {
            name: 'Event Setup Beta',
            description: 'Event decoratie project',
            startDate: new Date('2024-07-15'),
            endDate: new Date('2024-07-20'),
            status: 'ACTIVE',
            company: 'DCRT Event Decorations',
            projectNumber: 'DCRT-2024-001',
            location: 'Amsterdam RAI',
            workDescription: 'Opbouw en afbouw van event decoraties',
            duration: '5 dagen',
            address: 'Europaplein 24',
            city: 'Amsterdam',
            postalCode: '1078 GZ',
            country: 'Nederland',
            latitude: 52.3389,
            longitude: 4.8917,
            contactPerson: 'Maria van der Berg',
            contactPhone: '+31 20 549 1212',
        },
    });

    // Assign freelancers to projects
    await prisma.projectMember.create({
        data: {
            projectId: project1.id,
            userId: freelancer1.id,
            role: 'FREELANCER',
            status: 'ACCEPTED',
        },
    });

    await prisma.projectMember.create({
        data: {
            projectId: project2.id,
            userId: dcrtFreelancer1.id,
            role: 'FREELANCER',
            status: 'ACCEPTED',
        },
    });

    // Create some test availability data
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    await prisma.availability.createMany({
        data: [
            {
                userId: freelancer1.id,
                date: today,
                status: 'AVAILABLE',
                hours: 8,
                notes: 'Beschikbaar voor alle werkzaamheden'
            },
            {
                userId: freelancer1.id,
                date: tomorrow,
                status: 'PARTIAL',
                hours: 4,
                notes: 'Alleen ochtend beschikbaar'
            },
            {
                userId: freelancer2.id,
                date: today,
                status: 'UNAVAILABLE',
                notes: 'Ziek'
            },
            {
                userId: freelancer2.id,
                date: tomorrow,
                status: 'AVAILABLE',
                hours: 8,
                notes: 'Volledig beschikbaar'
            },
            {
                userId: freelancer2.id,
                date: dayAfterTomorrow,
                status: 'PARTIAL',
                hours: 6,
                notes: 'Vroeg weg voor afspraak'
            },
            {
                userId: dcrtFreelancer1.id,
                date: today,
                status: 'AVAILABLE',
                hours: 8,
                notes: 'Klaar voor DCRT projecten'
            },
            {
                userId: dcrtFreelancer2.id,
                date: tomorrow,
                status: 'AVAILABLE',
                hours: 8,
                notes: 'Beschikbaar voor event werk'
            }
        ]
    });

    // Create some test project interests
    await prisma.projectInterest.createMany({
        data: [
            {
                projectId: project1.id,
                userId: freelancer2.id,
                status: 'INTERESTED',
                notes: 'Heb ervaring met warehouse werk'
            },
            {
                projectId: project2.id,
                userId: dcrtFreelancer2.id,
                status: 'INTERESTED',
                notes: 'Kan goed met decoraties werken'
            },
            {
                projectId: project1.id,
                userId: dcrtFreelancer1.id,
                status: 'NOT_INTERESTED',
                notes: 'Niet beschikbaar in die periode'
            }
        ]
    });

    console.log('🌱 Seeding work types...');

    const workTypesData = [
        { name: 'wasstraat', description: 'Voertuigen wassen en reinigen', emoji: '🚗' },
        { name: 'orderpicker', description: 'Orders verzamelen in het magazijn', emoji: '📦' },
        { name: 'chauffeur', description: 'Voertuigen besturen en goederen vervoeren', emoji: '🚚' },
        { name: 'op en afbouw werkzaamheden', description: 'Installatie en demontage werkzaamheden', emoji: '🔧' },
        { name: 'magazijn', description: 'Algemene magazijnwerkzaamheden', emoji: '🏭' },
        { name: 'administratie', description: 'Kantoorwerk en administratieve taken', emoji: '📋' },
        { name: 'klantenservice', description: 'Klanten helpen en ondersteunen', emoji: '🎧' },
        { name: 'technische dienst', description: 'Technische ondersteuning en reparaties', emoji: '⚙️' },
        { name: 'beveiliging', description: 'Bewaking en veiligheidstaken', emoji: '🛡️' },
        { name: 'schoonmaak', description: 'Schoonmaak en onderhoudswerkzaamheden', emoji: '🧹' },
    ];

    for (const workTypeData of workTypesData) {
        await prisma.workType.upsert({
            where: { name: workTypeData.name },
            update: {},
            create: {
                ...workTypeData,
                createdBy: admin.id,
            },
        });
    }

    console.log('✅ Work types seeded successfully');

    console.log('🌱 Seeding work locations...');

    const workLocationsData = [
        {
            name: 'Broers Verhuur Hoofdkantoor',
            description: 'Hoofdkantoor en administratie',
            address: 'Bedrijfsweg 10',
            city: 'Utrecht',
            postalCode: '3542 AB',
            company: 'Broers Verhuur',
            contactInfo: 'Receptie: +31 30 123 4500',
            latitude: 52.0907,
            longitude: 5.1214,
        },
        {
            name: 'Broers Verhuur Magazijn Noord',
            description: 'Groothandel magazijn voor verhuurmateriaal',
            address: 'Magazijnstraat 45',
            city: 'Amsterdam',
            postalCode: '1013 LK',
            company: 'Broers Verhuur',
            contactInfo: 'Magazijn: +31 20 456 7890',
            latitude: 52.3792,
            longitude: 4.9003,
        },
        {
            name: 'Broers Verhuur Wasstraat',
            description: 'Wasstraat voor voertuigen en materiaal',
            address: 'Wasplaats 12',
            city: 'Utrecht',
            postalCode: '3542 CD',
            company: 'Broers Verhuur',
            contactInfo: 'Wasstraat: +31 30 789 0123',
            latitude: 52.0915,
            longitude: 5.1205,
        },
        {
            name: 'DCRT Event Center',
            description: 'Event decoratie en opslagcentrum',
            address: 'Eventlaan 88',
            city: 'Rotterdam',
            postalCode: '3012 KN',
            company: 'DCRT Event Decorations',
            contactInfo: 'Events: +31 10 234 5678',
            latitude: 51.9225,
            longitude: 4.4792,
        },
        {
            name: 'DCRT Decoratie Atelier',
            description: 'Creatief atelier voor decoratie ontwikkeling',
            address: 'Kunstweg 34',
            city: 'Amsterdam',
            postalCode: '1072 XY',
            company: 'DCRT Event Decorations',
            contactInfo: 'Atelier: +31 20 345 6789',
            latitude: 52.3518,
            longitude: 4.8936,
        },
    ];

    for (const locationData of workLocationsData) {
        await prisma.workLocation.upsert({
            where: { name: locationData.name },
            update: {},
            create: {
                ...locationData,
                createdBy: admin.id,
            },
        });
    }

    console.log('✅ Work locations seeded successfully');

    console.log('🌱 Seeding email settings...');

    // Create initial email settings using Broers Verhuur SMTP
    await prisma.emailSettings.upsert({
        where: { id: 'initial-email-settings' },
        update: {},
        create: {
            id: 'initial-email-settings',
            smtpHost: 'mail.antagonist.nl',
            smtpPort: 587,
            smtpUser: 'no-reply@broersverhuur.nl',
            smtpPass: 'ifg90u[09uh@HOT',
            smtpFrom: '"Broers Verhuur JobFlow" <no-reply@broersverhuur.nl>',
            isEnabled: true,
            updatedBy: admin.id,
        },
    });

    console.log('✅ Email settings seeded successfully');

    console.log('🌱 Database seeded successfully!');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    }); 