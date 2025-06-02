const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupQuincyDuplicates() {
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
      console.log('❌ Quincy niet gevonden');
      return;
    }

    console.log(`✅ Quincy gevonden: ${quincy.name}`);

    // Find all assignments for Quincy grouped by day
    const assignments = await prisma.userScheduleAssignment.findMany({
      where: {
        userId: quincy.id,
        isActive: true
      },
      include: {
        template: true
      },
      orderBy: {
        createdAt: 'asc' // Keep the oldest one
      }
    });

    console.log(`📋 Totaal assignments gevonden: ${assignments.length}`);

    // Group by day of week
    const assignmentsByDay = {};
    assignments.forEach(assignment => {
      if (!assignmentsByDay[assignment.dayOfWeek]) {
        assignmentsByDay[assignment.dayOfWeek] = [];
      }
      assignmentsByDay[assignment.dayOfWeek].push(assignment);
    });

    const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
    let totalRemoved = 0;

    // Remove duplicates, keep the first (oldest) one for each day
    for (const [dayOfWeek, dayAssignments] of Object.entries(assignmentsByDay)) {
      const dayNum = parseInt(dayOfWeek);
      console.log(`\n📅 ${dayNames[dayNum]} (${dayNum}): ${dayAssignments.length} assignments`);
      
      if (dayAssignments.length > 1) {
        console.log(`   🧹 Opruimen van ${dayAssignments.length - 1} duplicate(s)...`);
        
        // Keep the first one, remove the rest
        for (let i = 1; i < dayAssignments.length; i++) {
          await prisma.userScheduleAssignment.delete({
            where: { id: dayAssignments[i].id }
          });
          console.log(`   🗑️  Duplicate verwijderd: ${dayAssignments[i].id}`);
          totalRemoved++;
        }
        
        console.log(`   ✅ Behouden: ${dayAssignments[0].template.name}`);
      } else {
        console.log(`   ✅ Geen duplicates: ${dayAssignments[0].template.name}`);
      }
    }

    console.log(`\n📊 Opruiming voltooid:`);
    console.log(`   🗑️  ${totalRemoved} duplicate assignments verwijderd`);

    // Verify final result
    const finalAssignments = await prisma.userScheduleAssignment.findMany({
      where: {
        userId: quincy.id,
        isActive: true
      },
      include: {
        template: true
      }
    });

    console.log(`\n✅ Eindresultaat - Quincy heeft nu ${finalAssignments.length} unieke assignments:`);
    finalAssignments.forEach(assignment => {
      console.log(`   📅 ${dayNames[assignment.dayOfWeek]}: ${assignment.template.name}`);
    });

  } catch (error) {
    console.error('❌ Fout bij opruimen:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupQuincyDuplicates(); 