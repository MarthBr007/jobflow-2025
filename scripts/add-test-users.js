const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const testUsers = [
  {
    firstName: 'Jan',
    lastName: 'de Vries',
    email: 'jan.devries@broersverhuur.nl',
    role: 'EMPLOYEE',
    employeeType: 'PERMANENT',
    company: 'Broers Verhuur',
    phone: '+31 6 12345678',
    hasContract: true,
    monthlySalary: '3500'
  },
  {
    firstName: 'Marie',
    lastName: 'Bakker',
    email: 'marie.bakker@dcrt.nl',
    role: 'MANAGER',
    employeeType: 'PERMANENT',
    company: 'DCRT Event Decorations',
    phone: '+31 6 87654321',
    hasContract: true,
    monthlySalary: '4500'
  },
  {
    firstName: 'Piet',
    lastName: 'Janssen',
    email: 'piet.janssen@freelance.nl',
    role: 'FREELANCER',
    employeeType: 'FREELANCER',
    company: 'Broers Verhuur',
    phone: '+31 6 11223344',
    hasContract: true,
    hourlyRate: '35.00',
    kvkNumber: '12345678',
    btwNumber: 'NL123456789B01'
  },
  {
    firstName: 'Lisa',
    lastName: 'van der Berg',
    email: 'lisa.vandenberg@dcrt.nl',
    role: 'EMPLOYEE',
    employeeType: 'FLEX_WORKER',
    company: 'DCRT Event Decorations',
    phone: '+31 6 55667788',
    hasContract: false,
    hourlyWage: '18.50'
  },
  {
    firstName: 'Tom',
    lastName: 'Peters',
    email: 'tom.peters@broers.nl',
    role: 'EMPLOYEE',
    employeeType: 'PERMANENT',
    company: 'Broers Verhuur',
    phone: '+31 6 99887766',
    hasContract: true,
    monthlySalary: '3200'
  }
];

async function addTestUsers() {
  console.log('🚀 Adding test users...');

  for (const userData of testUsers) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash('changeme123', 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          ...userData,
          name: `${userData.firstName} ${userData.lastName}`,
          password: hashedPassword,
          status: 'AVAILABLE'
        }
      });

      console.log(`✅ Created user: ${user.firstName} ${user.lastName} (${user.email})`);
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error);
    }
  }

  console.log('🎉 Finished adding test users!');
}

addTestUsers()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 