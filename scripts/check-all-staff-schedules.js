const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllStaffSchedules() {
  try {
    // Get all users with their assignments
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['MANAGER', 'EMPLOYEE']
        }
      },
      include: {
        UserScheduleAssignment: {
          where: {
            isActive: true
          },
          include: {
            template: true
          }
        }
      }
    });

    console.log('📊 Overzicht van alle personeelsroosters:\n');
    
    const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
    
    for (const user of users) {
      console.log(`👤 ${user.name} (${user.email})`);
      console.log(`   Rol: ${user.role}`);
      
      if (user.UserScheduleAssignment.length === 0) {
        console.log('   ❌ Geen vaste werkdagen ingesteld');
      } else {
        console.log(`   📅 Werkdagen (${user.UserScheduleAssignment.length}):`);
        user.UserScheduleAssignment
          .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
          .forEach(assignment => {
            console.log(`      ${dayNames[assignment.dayOfWeek]}: ${assignment.template.name}`);
          });
      }
      console.log('');
    }
    
    console.log('📈 Statistieken:');
    console.log(`   Totaal medewerkers: ${users.length}`);
    console.log(`   Met vaste roosters: ${users.filter(u => u.UserScheduleAssignment.length > 0).length}`);
    console.log(`   Zonder roosters: ${users.filter(u => u.UserScheduleAssignment.length === 0).length}`);
    
    // Show available templates
    const templates = await prisma.scheduleTemplate.findMany({
      include: {
        shifts: true
      }
    });
    
    console.log('\n🎯 Beschikbare werk templates:');
    templates.forEach(template => {
      console.log(`   📋 ${template.name}`);
      console.log(`      Categorie: ${template.category}`);
      console.log(`      Shifts: ${template.shifts.length}`);
      template.shifts.forEach(shift => {
        console.log(`         • ${shift.role}: ${shift.startTime} - ${shift.endTime}`);
      });
      console.log('');
    });
    
  } catch (error) {
    console.error('Fout:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllStaffSchedules(); 