const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupWorkPatterns() {
  try {
    console.log('🎯 Instellen van werkpatronen voor CrewFlow...\n');

    // Get admin user to assign as creator
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.log('❌ Geen admin gebruiker gevonden');
      return;
    }

    // Definieer werkpatronen
    const patterns = [
      {
        name: "Fulltime Standaard",
        description: "Standaard 40-urige werkweek, maandag t/m vrijdag",
        type: "FULLTIME",
        color: "blue",
        icon: "👔",
        workDays: [
          { dayOfWeek: 1, isWorkingDay: true, startTime: "09:00", endTime: "17:00", breakDuration: 60 }, // Maandag
          { dayOfWeek: 2, isWorkingDay: true, startTime: "09:00", endTime: "17:00", breakDuration: 60 }, // Dinsdag
          { dayOfWeek: 3, isWorkingDay: true, startTime: "09:00", endTime: "17:00", breakDuration: 60 }, // Woensdag
          { dayOfWeek: 4, isWorkingDay: true, startTime: "09:00", endTime: "17:00", breakDuration: 60 }, // Donderdag
          { dayOfWeek: 5, isWorkingDay: true, startTime: "09:00", endTime: "17:00", breakDuration: 60 }, // Vrijdag
          { dayOfWeek: 6, isWorkingDay: false }, // Zaterdag
          { dayOfWeek: 0, isWorkingDay: false }, // Zondag
        ],
        totalHoursPerWeek: 35
      },
      {
        name: "Parttime 24 uur",
        description: "24-urige werkweek, drie dagen per week",
        type: "PARTTIME",
        color: "green",
        icon: "⏰",
        workDays: [
          { dayOfWeek: 1, isWorkingDay: true, startTime: "09:00", endTime: "17:00", breakDuration: 60 }, // Maandag
          { dayOfWeek: 2, isWorkingDay: false }, // Dinsdag
          { dayOfWeek: 3, isWorkingDay: true, startTime: "09:00", endTime: "17:00", breakDuration: 60 }, // Woensdag
          { dayOfWeek: 4, isWorkingDay: false }, // Donderdag
          { dayOfWeek: 5, isWorkingDay: true, startTime: "09:00", endTime: "17:00", breakDuration: 60 }, // Vrijdag
          { dayOfWeek: 6, isWorkingDay: false }, // Zaterdag
          { dayOfWeek: 0, isWorkingDay: false }, // Zondag
        ],
        totalHoursPerWeek: 21
      },
      {
        name: "Parttime 32 uur",
        description: "32-urige werkweek, vier dagen per week",
        type: "PARTTIME",
        color: "green",
        icon: "⏰",
        workDays: [
          { dayOfWeek: 1, isWorkingDay: true, startTime: "09:00", endTime: "17:00", breakDuration: 60 }, // Maandag
          { dayOfWeek: 2, isWorkingDay: true, startTime: "09:00", endTime: "17:00", breakDuration: 60 }, // Dinsdag
          { dayOfWeek: 3, isWorkingDay: false }, // Woensdag
          { dayOfWeek: 4, isWorkingDay: true, startTime: "09:00", endTime: "17:00", breakDuration: 60 }, // Donderdag
          { dayOfWeek: 5, isWorkingDay: true, startTime: "09:00", endTime: "17:00", breakDuration: 60 }, // Vrijdag
          { dayOfWeek: 6, isWorkingDay: false }, // Zaterdag
          { dayOfWeek: 0, isWorkingDay: false }, // Zondag
        ],
        totalHoursPerWeek: 28
      },
      {
        name: "Vroege Dienst",
        description: "Vroege dienst voor magazijn en logistiek",
        type: "SHIFT",
        color: "purple",
        icon: "🔄",
        workDays: [
          { dayOfWeek: 1, isWorkingDay: true, startTime: "06:00", endTime: "14:00", breakDuration: 60 }, // Maandag
          { dayOfWeek: 2, isWorkingDay: true, startTime: "06:00", endTime: "14:00", breakDuration: 60 }, // Dinsdag
          { dayOfWeek: 3, isWorkingDay: true, startTime: "06:00", endTime: "14:00", breakDuration: 60 }, // Woensdag
          { dayOfWeek: 4, isWorkingDay: true, startTime: "06:00", endTime: "14:00", breakDuration: 60 }, // Donderdag
          { dayOfWeek: 5, isWorkingDay: true, startTime: "06:00", endTime: "14:00", breakDuration: 60 }, // Vrijdag
          { dayOfWeek: 6, isWorkingDay: false }, // Zaterdag
          { dayOfWeek: 0, isWorkingDay: false }, // Zondag
        ],
        totalHoursPerWeek: 35
      },
      {
        name: "Late Dienst",
        description: "Late dienst voor avondactiviteiten",
        type: "SHIFT",
        color: "purple",
        icon: "🔄",
        workDays: [
          { dayOfWeek: 1, isWorkingDay: true, startTime: "14:00", endTime: "22:00", breakDuration: 60 }, // Maandag
          { dayOfWeek: 2, isWorkingDay: true, startTime: "14:00", endTime: "22:00", breakDuration: 60 }, // Dinsdag
          { dayOfWeek: 3, isWorkingDay: true, startTime: "14:00", endTime: "22:00", breakDuration: 60 }, // Woensdag
          { dayOfWeek: 4, isWorkingDay: true, startTime: "14:00", endTime: "22:00", breakDuration: 60 }, // Donderdag
          { dayOfWeek: 5, isWorkingDay: true, startTime: "14:00", endTime: "22:00", breakDuration: 60 }, // Vrijdag
          { dayOfWeek: 6, isWorkingDay: false }, // Zaterdag
          { dayOfWeek: 0, isWorkingDay: false }, // Zondag
        ],
        totalHoursPerWeek: 35
      },
      {
        name: "Weekend Dienst",
        description: "Weekend werker met enkele doordeweekse dagen",
        type: "WEEKEND",
        color: "teal",
        icon: "🏖️",
        workDays: [
          { dayOfWeek: 1, isWorkingDay: false }, // Maandag
          { dayOfWeek: 2, isWorkingDay: false }, // Dinsdag
          { dayOfWeek: 3, isWorkingDay: false }, // Woensdag
          { dayOfWeek: 4, isWorkingDay: false }, // Donderdag
          { dayOfWeek: 5, isWorkingDay: true, startTime: "09:00", endTime: "17:00", breakDuration: 60 }, // Vrijdag
          { dayOfWeek: 6, isWorkingDay: true, startTime: "09:00", endTime: "17:00", breakDuration: 60 }, // Zaterdag
          { dayOfWeek: 0, isWorkingDay: true, startTime: "10:00", endTime: "16:00", breakDuration: 30 }, // Zondag
        ],
        totalHoursPerWeek: 20.5
      },
      {
        name: "Flexibel Kantoor",
        description: "Flexibele werktijden voor kantoorpersoneel",
        type: "FLEXIBLE",
        color: "orange",
        icon: "🎯",
        workDays: [
          { dayOfWeek: 1, isWorkingDay: true, startTime: "08:30", endTime: "16:30", breakDuration: 60 }, // Maandag
          { dayOfWeek: 2, isWorkingDay: true, startTime: "09:30", endTime: "17:30", breakDuration: 60 }, // Dinsdag
          { dayOfWeek: 3, isWorkingDay: true, startTime: "08:00", endTime: "16:00", breakDuration: 60 }, // Woensdag
          { dayOfWeek: 4, isWorkingDay: true, startTime: "09:00", endTime: "17:00", breakDuration: 60 }, // Donderdag
          { dayOfWeek: 5, isWorkingDay: true, startTime: "08:00", endTime: "15:00", breakDuration: 45 }, // Vrijdag
          { dayOfWeek: 6, isWorkingDay: false }, // Zaterdag
          { dayOfWeek: 0, isWorkingDay: false }, // Zondag
        ],
        totalHoursPerWeek: 33.25
      },
      {
        name: "Student Rooster",
        description: "Studentenbaan avonden en weekenden",
        type: "PARTTIME",
        color: "pink",
        icon: "🎓",
        workDays: [
          { dayOfWeek: 1, isWorkingDay: false }, // Maandag
          { dayOfWeek: 2, isWorkingDay: false }, // Dinsdag
          { dayOfWeek: 3, isWorkingDay: true, startTime: "18:00", endTime: "22:00", breakDuration: 0 }, // Woensdag
          { dayOfWeek: 4, isWorkingDay: false }, // Donderdag
          { dayOfWeek: 5, isWorkingDay: true, startTime: "17:00", endTime: "22:00", breakDuration: 30 }, // Vrijdag
          { dayOfWeek: 6, isWorkingDay: true, startTime: "10:00", endTime: "18:00", breakDuration: 60 }, // Zaterdag
          { dayOfWeek: 0, isWorkingDay: true, startTime: "12:00", endTime: "17:00", breakDuration: 30 }, // Zondag
        ],
        totalHoursPerWeek: 17.5
      },
      {
        name: "Oproepkracht",
        description: "Flexibele oproepkracht voor verschillende dagen",
        type: "CUSTOM",
        color: "gray",
        icon: "⚡",
        workDays: [
          { dayOfWeek: 1, isWorkingDay: false }, // Maandag
          { dayOfWeek: 2, isWorkingDay: false }, // Dinsdag
          { dayOfWeek: 3, isWorkingDay: false }, // Woensdag
          { dayOfWeek: 4, isWorkingDay: false }, // Donderdag
          { dayOfWeek: 5, isWorkingDay: false }, // Vrijdag
          { dayOfWeek: 6, isWorkingDay: false }, // Zaterdag
          { dayOfWeek: 0, isWorkingDay: false }, // Zondag
        ],
        totalHoursPerWeek: 0
      }
    ];

    console.log('📝 Aanmaken van werkpatronen...\n');

    for (const patternData of patterns) {
      try {
        const pattern = await prisma.workPattern.create({
          data: {
            ...patternData,
            createdById: adminUser.id,
          },
        });

        console.log(`✅ ${pattern.name} - ${pattern.type} (${pattern.totalHoursPerWeek}u/week)`);
      } catch (error) {
        console.log(`❌ Fout bij aanmaken van patroon "${patternData.name}":`, error.message);
      }
    }

    console.log('\n🎯 Werkpatronen succesvol ingesteld!');
    console.log('\n📋 Overzicht van beschikbare patronen:');
    console.log('   • Fulltime Standaard (40u) - Ma t/m Vr 09:00-17:00');
    console.log('   • Parttime 24u - Ma/Wo/Vr 09:00-17:00');
    console.log('   • Parttime 32u - Ma/Di/Do/Vr 09:00-17:00');
    console.log('   • Vroege Dienst - Ma t/m Vr 06:00-14:00');
    console.log('   • Late Dienst - Ma t/m Vr 14:00-22:00');
    console.log('   • Weekend Dienst - Vr/Za/Zo');
    console.log('   • Flexibel Kantoor - Wisselende tijden');
    console.log('   • Student Rooster - Avonden en weekenden');
    console.log('   • Oproepkracht - Naar behoefte');

    console.log('\n🚀 Je kunt deze patronen nu toewijzen aan medewerkers via:');
    console.log('   Dashboard → Admin → Werkpatronen');

    // Optioneel: automatisch enkele voorbeeldtoewijzingen maken
    const employees = await prisma.user.findMany({
      where: {
        role: { in: ['EMPLOYEE', 'FREELANCER'] },
        workPatternAssignments: {
          none: {}
        }
      },
      take: 5
    });

    if (employees.length > 0) {
      console.log('\n📋 Automatisch toewijzen van voorbeeldpatronen...');
      
      const createdPatterns = await prisma.workPattern.findMany({
        where: { createdById: adminUser.id }
      });

      // Wijs willekeurige patronen toe aan medewerkers
      for (let i = 0; i < Math.min(employees.length, createdPatterns.length); i++) {
        const employee = employees[i];
        const pattern = createdPatterns[i];

        try {
          await prisma.workPatternAssignment.create({
            data: {
              userId: employee.id,
              patternId: pattern.id,
              assignedById: adminUser.id,
              notes: `Automatisch toegewezen als voorbeeld op ${new Date().toLocaleDateString('nl-NL')}`,
            },
          });

          console.log(`   ✅ ${employee.name} → ${pattern.name}`);
        } catch (error) {
          console.log(`   ❌ ${employee.name} → ${pattern.name} (fout)`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Fout bij instellen van werkpatronen:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupWorkPatterns(); 