const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateExistingUsers() {
  console.log('🔄 Updating existing users with firstName/lastName...');

  try {
    // Find users that have name but no firstName/lastName
    const usersToUpdate = await prisma.user.findMany({
      where: {
        AND: [
          { name: { not: null } },
          { OR: [
            { firstName: null },
            { lastName: null }
          ]}
        ]
      }
    });

    console.log(`Found ${usersToUpdate.length} users to update`);

    for (const user of usersToUpdate) {
      try {
        // Split name into first and last name
        const nameParts = (user.name || '').trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Update the user
        await prisma.user.update({
          where: { id: user.id },
          data: {
            firstName: firstName || null,
            lastName: lastName || null,
          }
        });

        console.log(`✅ Updated: ${user.name} -> ${firstName} ${lastName} (${user.email})`);
      } catch (error) {
        console.error(`❌ Error updating user ${user.email}:`, error);
      }
    }

    console.log('🎉 Finished updating existing users!');
  } catch (error) {
    console.error('Error:', error);
  }
}

updateExistingUsers()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 