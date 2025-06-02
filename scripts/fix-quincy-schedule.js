const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixQuincySchedule() {
  try {
    console.log('🔍 Zoeken naar Quincy...');
    
    // Find Quincy
    const quincy = await prisma.user.findFirst({
      where: {
        name: {
          contains: 'quincy',
          mode: 'insensitive'
        }
      }
    });

    if (!quincy) {
      console.log('❌ Quincy niet gevonden in de database');
      return;
    }

    console.log(`✅ Quincy gevonden: ${quincy.name} (${quincy.email})`);

    // Find all current assignments for Quincy
    const currentAssignments = await prisma.userScheduleAssignment.findMany({
      where: {
        userId: quincy.id
      },
      include: {
        template: true
      }
    });

    console.log(`📋 Huidige assignments voor Quincy: ${currentAssignments.length}`);
    currentAssignments.forEach(assignment => {
      const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
      console.log(`   - ${dayNames[assignment.dayOfWeek]} (${assignment.dayOfWeek}): ${assignment.template.name}`);
    });

    // Remove incorrect Monday assignment (dayOfWeek = 1)
    const mondayAssignments = currentAssignments.filter(a => a.dayOfWeek === 1);
    if (mondayAssignments.length > 0) {
      console.log(`🗑️  Verwijderen van ${mondayAssignments.length} verkeerde maandag assignment(s)...`);
      for (const assignment of mondayAssignments) {
        await prisma.userScheduleAssignment.delete({
          where: { id: assignment.id }
        });
        console.log(`   ✅ Verwijderd: Maandag assignment`);
      }
    } else {
      console.log('ℹ️  Geen verkeerde maandag assignments gevonden');
    }

    // Find or create a suitable template for Quincy's work pattern
    let workTemplate = await prisma.scheduleTemplate.findFirst({
      where: {
        name: {
          contains: 'quincy',
          mode: 'insensitive'
        }
      },
      include: {
        shifts: true
      }
    });

    if (!workTemplate) {
      // Create a template for Quincy
      console.log('📝 Aanmaken van werkpatroon template voor Quincy...');
      workTemplate = await prisma.scheduleTemplate.create({
        data: {
          name: 'Quincy - Standaard Werkdag',
          description: 'Werkpatroon voor Quincy: Dinsdag t/m Zaterdag',
          category: 'WEEKLY',
          createdById: quincy.id,
          shifts: {
            create: [
              {
                role: 'Algemeen Medewerker',
                startTime: '08:00',
                endTime: '17:00',
                minPersons: 1,
                maxPersons: 1,
                requirements: [],
                totalBreakDuration: 60,
                breaks: [
                  {
                    startTime: '10:00',
                    endTime: '10:15',
                    type: 'morning',
                    duration: 15
                  },
                  {
                    startTime: '12:00',
                    endTime: '12:30',
                    type: 'lunch', 
                    duration: 30
                  },
                  {
                    startTime: '15:00',
                    endTime: '15:15',
                    type: 'afternoon',
                    duration: 15
                  }
                ]
              }
            ]
          }
        },
        include: {
          shifts: true
        }
      });
      console.log(`✅ Template aangemaakt: ${workTemplate.name}`);
    } else {
      console.log(`✅ Bestaande template gevonden: ${workTemplate.name}`);
    }

    // Create correct assignments for Tuesday through Saturday (dayOfWeek 2-6)
    const correctDays = [2, 3, 4, 5, 6]; // Di, Wo, Do, Vr, Za
    const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

    console.log('📅 Controleren en aanmaken van juiste assignments...');
    
    for (const dayOfWeek of correctDays) {
      const existingAssignment = currentAssignments.find(a => a.dayOfWeek === dayOfWeek);
      
      if (!existingAssignment) {
        console.log(`   📌 Aanmaken assignment voor ${dayNames[dayOfWeek]}...`);
        await prisma.userScheduleAssignment.create({
          data: {
            userId: quincy.id,
            templateId: workTemplate.id,
            dayOfWeek: dayOfWeek,
            notes: `Werkpatroon Quincy: ${dayNames[dayOfWeek]}`,
            isActive: true,
            validFrom: new Date()
          }
        });
        console.log(`   ✅ Assignment aangemaakt voor ${dayNames[dayOfWeek]}`);
      } else {
        console.log(`   ℹ️  Assignment voor ${dayNames[dayOfWeek]} bestaat al`);
      }
    }

    // Verify final assignments
    const finalAssignments = await prisma.userScheduleAssignment.findMany({
      where: {
        userId: quincy.id,
        isActive: true
      },
      include: {
        template: true
      }
    });

    console.log('\n📊 Eindresultaat - Quincy\'s werkpatroon:');
    finalAssignments.forEach(assignment => {
      console.log(`   ✅ ${dayNames[assignment.dayOfWeek]} (${assignment.dayOfWeek}): ${assignment.template.name}`);
    });

    // Remove any existing shifts for Quincy on Monday for the next few weeks
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    console.log('\n🧹 Opruimen van bestaande shifts op maandag...');
    const mondayShifts = await prisma.scheduleShift.findMany({
      where: {
        userId: quincy.id,
        startTime: {
          gte: today,
          lte: nextMonth
        }
      },
      include: {
        schedule: true
      }
    });

    let removedShifts = 0;
    for (const shift of mondayShifts) {
      const shiftDate = new Date(shift.startTime);
      if (shiftDate.getDay() === 1) { // Monday
        await prisma.scheduleShift.delete({
          where: { id: shift.id }
        });
        removedShifts++;
        console.log(`   🗑️  Verwijderd: Maandag shift op ${shiftDate.toLocaleDateString('nl-NL')}`);
      }
    }

    if (removedShifts === 0) {
      console.log('   ℹ️  Geen maandag shifts gevonden om te verwijderen');
    }

    console.log('\n🎉 Quincy\'s rooster is succesvol gecorrigeerd!');
    console.log('   ✅ Verkeerde maandag assignments verwijderd');
    console.log('   ✅ Juiste assignments voor di-za aangemaakt/gecontroleerd');
    console.log('   ✅ Bestaande maandag shifts opgeruimd');
    console.log('\n💡 Gebruik nu de "Auto Rooster" functie in de web app om nieuwe shifts te genereren gebaseerd op het gecorrigeerde patroon.');

  } catch (error) {
    console.error('❌ Fout bij het corrigeren van Quincy\'s rooster:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixQuincySchedule(); 