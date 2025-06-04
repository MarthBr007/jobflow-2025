#!/usr/bin/env node

/**
 * 🚀 CrewFlow Database Setup Script
 * Sets up PostgreSQL database for new deployment
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Setting up CrewFlow database...\n');

// Set environment
process.env.NODE_ENV = 'production';

try {
  console.log('1️⃣ Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('\n2️⃣ Pushing database schema...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  
  console.log('\n3️⃣ Running database seed...');
  execSync('npx prisma db seed', { stdio: 'inherit' });
  
  console.log('\n✅ Database setup completed successfully!');
  console.log('\n🎯 Next steps:');
  console.log('   • Deploy to Vercel');
  console.log('   • Configure environment variables');
  console.log('   • Test the application');
  
} catch (error) {
  console.error('\n❌ Database setup failed:', error.message);
  process.exit(1);
} 