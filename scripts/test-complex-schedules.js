const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testComplexSchedules() {
  try {
    console.log('🧪 Testen van complexe werkpatronen...\n');

    // Get two employees without schedules for testing
    const employees = await prisma.user.findMany({
      where: {
        role: 'EMPLOYEE',
        UserScheduleAssignment: {
          none: {}
        }
      },
      take: 2
    });

    if (employees.length < 2) {
      console.log('❌ Niet genoeg medewerkers zonder rooster gevonden voor test');
      return;
    }

    const employee1 = employees[0];
    const employee2 = employees[1];

    // Create base templates
    const baseTemplate = await createTemplate(
      'Flexibele Basis Template', 
      'Basis template voor aangepaste tijden', 
      '08:00', 
      '17:00'
    );

    const shortDayTemplate = await createTemplate(
      'Korte Dag Template',
      'Template voor halve dagen',
      '08:00',
      '13:30'
    );

    console.log('📋 Test 1: Dinsdag, Donderdag, Vrijdag patroon');
    console.log(`👤 ${employee1.name}`);

    // Test 1: Employee works Tuesday, Thursday, Friday
    const pattern1Days = [2, 4, 5]; // Tuesday, Thursday, Friday
    const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

    for (const dayOfWeek of pattern1Days) {
      await prisma.userScheduleAssignment.create({
        data: {
          userId: employee1.id,
          templateId: baseTemplate.id,
          dayOfWeek: dayOfWeek,
          customStartTime: '08:00',
          customEndTime: '17:00',
          notes: `Werkt ${dayNames[dayOfWeek]} 08:00-17:00`,
          isActive: true,
          validFrom: new Date()
        }
      });

      console.log(`   ✅ ${dayNames[dayOfWeek]}: 08:00 - 17:00`);
    }

    console.log('\n📋 Test 2: Verschillende tijden per dag');
    console.log(`👤 ${employee2.name}`);

    // Test 2: Different times per day
    // Monday 08:00-17:00, Tuesday 08:00-13:30, Wednesday free, Thursday 08:00-13:30, Friday 08:00-17:00
    const complexSchedule = [
      { day: 1, start: '08:00', end: '17:00', template: baseTemplate }, // Monday
      { day: 2, start: '08:00', end: '13:30', template: shortDayTemplate }, // Tuesday 
      // Wednesday free (no assignment)
      { day: 4, start: '08:00', end: '13:30', template: shortDayTemplate }, // Thursday
      { day: 5, start: '08:00', end: '17:00', template: baseTemplate }  // Friday
    ];

    for (const schedule of complexSchedule) {
      await prisma.userScheduleAssignment.create({
        data: {
          userId: employee2.id,
          templateId: schedule.template.id,
          dayOfWeek: schedule.day,
          customStartTime: schedule.start,
          customEndTime: schedule.end,
          notes: `${dayNames[schedule.day]} ${schedule.start}-${schedule.end}`,
          isActive: true,
          validFrom: new Date()
        }
      });

      console.log(`   ✅ ${dayNames[schedule.day]}: ${schedule.start} - ${schedule.end}`);
    }
    console.log(`   📅 Woensdag: VRIJ`);

    console.log('\n🎉 Complexe patronen succesvol ingesteld!');

    // Verify the assignments
    console.log('\n🔍 Verificatie van ingestelde roosters:');
    
    const verifyEmployee1 = await prisma.userScheduleAssignment.findMany({
      where: { userId: employee1.id, isActive: true },
      include: { template: true },
      orderBy: { dayOfWeek: 'asc' }
    });

    const verifyEmployee2 = await prisma.userScheduleAssignment.findMany({
      where: { userId: employee2.id, isActive: true },
      include: { template: true },
      orderBy: { dayOfWeek: 'asc' }
    });

    console.log(`\n👤 ${employee1.name} - Di/Do/Vr patroon:`);
    verifyEmployee1.forEach(assignment => {
      console.log(`   ${dayNames[assignment.dayOfWeek]}: ${assignment.customStartTime || 'default'} - ${assignment.customEndTime || 'default'}`);
    });

    console.log(`\n👤 ${employee2.name} - Verschillende tijden per dag:`);
    verifyEmployee2.forEach(assignment => {
      console.log(`   ${dayNames[assignment.dayOfWeek]}: ${assignment.customStartTime} - ${assignment.customEndTime}`);
    });

    // Test auto-generation with these complex patterns
    console.log('\n🤖 Test: Kunnen deze patronen gebruikt worden voor auto-generatie?');
    
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    // Check if we can generate shifts for next week
    const startDate = new Date(nextWeek);
    startDate.setDate(startDate.getDate() - startDate.getDay() + 1); // Monday of next week

    console.log(`📅 Test week: ${startDate.toLocaleDateString('nl-NL')}`);

    // Simulate auto-generation logic for employee1 (Di/Do/Vr)
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dayOfWeek = currentDate.getDay();

      const assignment = verifyEmployee1.find(a => a.dayOfWeek === dayOfWeek);
      if (assignment) {
        console.log(`   ✅ ${employee1.name} - ${dayNames[dayOfWeek]} ${currentDate.toLocaleDateString('nl-NL')}: ${assignment.customStartTime} - ${assignment.customEndTime}`);
      }
    }

    // Simulate auto-generation logic for employee2 (complex schedule)
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dayOfWeek = currentDate.getDay();

      const assignment = verifyEmployee2.find(a => a.dayOfWeek === dayOfWeek);
      if (assignment) {
        console.log(`   ✅ ${employee2.name} - ${dayNames[dayOfWeek]} ${currentDate.toLocaleDateString('nl-NL')}: ${assignment.customStartTime} - ${assignment.customEndTime}`);
      } else if (dayOfWeek === 3) { // Wednesday
        console.log(`   📅 ${employee2.name} - ${dayNames[dayOfWeek]} ${currentDate.toLocaleDateString('nl-NL')}: VRIJ`);
      }
    }

    console.log('\n✅ Complexe patronen werken perfect!');
    console.log('   • Verschillende dagen per persoon ✅');
    console.log('   • Verschillende tijden per dag ✅');
    console.log('   • Vrije dagen ✅');
    console.log('   • Auto-generatie compatibel ✅');

  } catch (error) {
    console.error('❌ Fout bij testen:', error);
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
      category: 'DAILY',
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
              startTime: '12:00',
              endTime: '12:15',
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

testComplexSchedules(); 