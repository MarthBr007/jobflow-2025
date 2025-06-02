const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupVariedSchedules() {
  try {
    console.log('🎯 Instellen van verschillende werkpatronen als voorbeeld...\n');

    // Get some employees to set up different patterns
    const employees = await prisma.user.findMany({
      where: {
        role: 'EMPLOYEE',
        UserScheduleAssignment: {
          none: {}
        }
      },
      take: 6
    });

    if (employees.length === 0) {
      console.log('❌ Geen medewerkers zonder rooster gevonden');
      return;
    }

    // Create different template patterns
    const templates = {
      partTime3Days: await createTemplate('Parttime 3 Dagen', 'Ma/Wo/Vr patroon', '09:00', '15:00'),
      weekend: await createTemplate('Weekend Medewerker', 'Weekenden + vrijdag', '10:00', '18:00'),
      evening: await createTemplate('Avonddienst', 'Avonduren', '14:00', '22:00'),
      morning: await createTemplate('Ochtenddienst', 'Vroege dienst', '06:00', '14:00'),
      flexible: await createTemplate('Flexibel Rooster', 'Wisselende tijden', '08:00', '16:00'),
      student: await createTemplate('Student Rooster', 'Deeltijd student', '18:00', '22:00')
    };

    // Define different schedule patterns
    const schedulePatterns = [
      {
        name: 'Parttime Ma/Wo/Vr',
        days: [1, 3, 5], // Monday, Wednesday, Friday
        template: templates.partTime3Days
      },
      {
        name: 'Weekend + Vrijdag',
        days: [5, 6, 0], // Friday, Saturday, Sunday
        template: templates.weekend
      },
      {
        name: 'Dinsdag t/m Donderdag',
        days: [2, 3, 4], // Tuesday, Wednesday, Thursday
        template: templates.evening
      },
      {
        name: 'Vroege week (Ma t/m Wo)',
        days: [1, 2, 3], // Monday, Tuesday, Wednesday  
        template: templates.morning
      },
      {
        name: 'Flexibel 4 dagen',
        days: [1, 2, 4, 5], // Mon, Tue, Thu, Fri
        template: templates.flexible
      },
      {
        name: 'Student avonden',
        days: [1, 3, 5], // Monday, Wednesday, Friday evenings
        template: templates.student
      }
    ];

    const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

    // Assign patterns to employees
    for (let i = 0; i < Math.min(employees.length, schedulePatterns.length); i++) {
      const employee = employees[i];
      const pattern = schedulePatterns[i];

      console.log(`👤 ${employee.name} - ${pattern.name}`);

      for (const dayOfWeek of pattern.days) {
        await prisma.userScheduleAssignment.create({
          data: {
            userId: employee.id,
            templateId: pattern.template.id,
            dayOfWeek: dayOfWeek,
            notes: `${pattern.name} - ${dayNames[dayOfWeek]}`,
            isActive: true,
            validFrom: new Date()
          }
        });

        console.log(`   ✅ ${dayNames[dayOfWeek]}: ${pattern.template.name}`);
      }
      console.log('');
    }

    console.log('🎉 Verschillende werkpatronen succesvol ingesteld!');
    console.log('\n📊 Nu heb je variatie met:');
    console.log('   • Quincy: Dinsdag t/m Zaterdag');
    console.log('   • Rofiat & Jort: Maandag t/m Vrijdag'); 
    console.log('   • + 6 nieuwe gevarieerde patronen!');
    console.log('\n💡 Je kunt deze patronen aanpassen via de Admin > Schedule Templates pagina');

  } catch (error) {
    console.error('❌ Fout:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createTemplate(name, description, startTime, endTime) {
  const existing = await prisma.scheduleTemplate.findFirst({
    where: { name }
  });

  if (existing) {
    console.log(`ℹ️  Template '${name}' bestaat al`);
    return existing;
  }

  console.log(`📝 Aanmaken template: ${name}`);
  return await prisma.scheduleTemplate.create({
    data: {
      name,
      description,
      category: 'WEEKLY',
      createdById: (await prisma.user.findFirst({ where: { role: 'MANAGER' } })).id,
      shifts: {
        create: [{
          role: 'Algemeen Medewerker',
          startTime,
          endTime,
          minPersons: 1,
          maxPersons: 1,
          requirements: [],
          totalBreakDuration: 30,
          breaks: [
            {
              startTime: '10:00',
              endTime: '10:15',
              type: 'morning',
              duration: 15
            },
            {
              startTime: '14:00',
              endTime: '14:15',
              type: 'afternoon',
              duration: 15
            }
          ]
        }]
      }
    },
    include: {
      shifts: true
    }
  });
}

setupVariedSchedules(); 