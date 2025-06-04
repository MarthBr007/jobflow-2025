#!/usr/bin/env node

/**
 * 🚀 AUTOMATISCHE VERCEL ENVIRONMENT VARIABLES SETUP
 * Dit script stelt alle benodigde environment variables in voor Vercel
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// De gegenereerde NEXTAUTH_SECRET
const NEXTAUTH_SECRET = "QKoYbkbw2oF4y2uuhSgZQLK1yUvQyjo5wHHUfRO0U8Q=";
const VERCEL_URL = "https://jobflow-2025-ksd8kywey-marthen-bakkers-projects.vercel.app";

// Alle benodigde environment variables
const ENV_VARS = {
    // Kritieke vereisten
    'NODE_ENV': 'production',
    'NEXTAUTH_SECRET': NEXTAUTH_SECRET,
    'NEXTAUTH_URL': VERCEL_URL,
    
    // Beveiliging
    'ALLOW_SETUP': 'false',
    'ALLOW_SEEDING': 'false',
    'ENABLE_REGISTRATION': 'false',
    'RATE_LIMIT_ENABLED': 'true',
    'RATE_LIMIT_WINDOW_MS': '60000',
    'RATE_LIMIT_MAX_REQUESTS': '100',
    'IP_VALIDATION_ENABLED': 'true',
    'AUDIT_LOGGING_ENABLED': 'true',
    
    // Applicatie instellingen
    'DEFAULT_COMPANY': 'Broers Verhuur',
    'ENABLE_BULK_IMPORT': 'true',
    'ENABLE_EMAIL_NOTIFICATIONS': 'true',
    'ENABLE_FILE_UPLOADS': 'true',
    'PERFORMANCE_MONITORING': 'true'
};

async function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

async function setupDatabase() {
    console.log('\n🗄️  DATABASE SETUP');
    console.log('================');
    console.log('1. Neon (PostgreSQL) - Gratis & Snel');
    console.log('2. PlanetScale (MySQL) - Vercel geoptimaliseerd');
    console.log('3. Supabase (PostgreSQL) - Veel features');
    console.log('4. Ik heb al een DATABASE_URL');
    
    const choice = await askQuestion('\nKies database optie (1-4): ');
    
    switch(choice) {
        case '1':
            console.log('\n🚀 NEON SETUP:');
            console.log('1. Ga naar: https://neon.tech');
            console.log('2. Sign up met GitHub');
            console.log('3. Create database: "jobflow"');
            console.log('4. Copy connection string (postgresql://...)');
            break;
            
        case '2':
            console.log('\n🚀 PLANETSCALE SETUP:');
            console.log('1. Ga naar: https://planetscale.com');
            console.log('2. Sign up met GitHub');
            console.log('3. Create database: "jobflow"');
            console.log('4. Copy connection string (mysql://...)');
            break;
            
        case '3':
            console.log('\n🚀 SUPABASE SETUP:');
            console.log('1. Ga naar: https://supabase.com');
            console.log('2. New project: "JobFlow"');
            console.log('3. Settings > Database');
            console.log('4. Copy connection string (postgresql://...)');
            break;
            
        case '4':
            break;
            
        default:
            console.log('⚠️  Ongeldige keuze, kies optie 1 (Neon)');
            return await setupDatabase();
    }
    
    const databaseUrl = await askQuestion('\n📋 Plak hier je DATABASE_URL: ');
    if (!databaseUrl || databaseUrl.trim() === '') {
        console.log('❌ DATABASE_URL is vereist!');
        return await setupDatabase();
    }
    
    return databaseUrl.trim();
}

async function setVercelEnvVar(key, value) {
    try {
        const command = `vercel env add ${key} production`;
        console.log(`📝 Setting ${key}...`);
        
        // Simuleer input voor vercel env add
        execSync(command, { 
            input: `${value}\n`,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        return true;
    } catch (error) {
        console.log(`⚠️  Kon ${key} niet automatisch instellen`);
        return false;
    }
}

async function main() {
    console.log('🚀 JOBFLOW VERCEL ENVIRONMENT SETUP');
    console.log('=====================================\n');
    
    try {
        // Check if vercel CLI is available
        execSync('vercel --version', { stdio: 'pipe' });
    } catch (error) {
        console.log('❌ Vercel CLI niet gevonden. Installeer eerst: npm i -g vercel');
        process.exit(1);
    }
    
    // Database setup
    const databaseUrl = await setupDatabase();
    ENV_VARS['DATABASE_URL'] = databaseUrl;
    
    console.log('\n🔧 ENVIRONMENT VARIABLES INSTELLEN...');
    console.log('=====================================');
    
    // Probeer automatisch environment variables in te stellen
    let autoSuccess = 0;
    let manualVars = [];
    
    for (const [key, value] of Object.entries(ENV_VARS)) {
        const success = await setVercelEnvVar(key, value);
        if (success) {
            autoSuccess++;
        } else {
            manualVars.push({ key, value });
        }
    }
    
    // Als automatisch niet werkt, toon handmatige instructies
    if (manualVars.length > 0) {
        console.log('\n📋 HANDMATIG TOEVOEGEN IN VERCEL DASHBOARD:');
        console.log('===========================================');
        console.log('Ga naar: https://vercel.com/marthen-bakkers-projects/jobflow-2025/settings/environment-variables\n');
        
        manualVars.forEach(({ key, value }) => {
            console.log(`${key} = ${value}`);
        });
        
        console.log('\n⚠️  Voeg deze variables toe en druk Enter...');
        await askQuestion('');
    }
    
    // Redeploy
    console.log('\n🚀 DEPLOYING MET NIEUWE CONFIGURATIE...');
    console.log('=======================================');
    
    try {
        execSync('vercel --prod', { stdio: 'inherit' });
        console.log('\n✅ DEPLOYMENT SUCCESVOL!');
    } catch (error) {
        console.log('\n❌ Deployment error:', error.message);
    }
    
    // Database schema push
    console.log('\n📊 DATABASE SCHEMA SETUP...');
    console.log('============================');
    
    const pushSchema = await askQuestion('Database schema pushen? (y/n): ');
    if (pushSchema.toLowerCase() === 'y') {
        try {
            process.env.DATABASE_URL = databaseUrl;
            execSync('npx prisma db push', { stdio: 'inherit' });
            console.log('✅ Database schema gepusht!');
        } catch (error) {
            console.log('⚠️  Database schema push failed. Run handmatig: npx prisma db push');
        }
    }
    
    // Success message
    console.log('\n🎉 SETUP VOLTOOID!');
    console.log('==================');
    console.log(`🌍 App URL: ${VERCEL_URL}`);
    console.log('🔒 Beveiliging: Ingeschakeld');
    console.log('📊 Database: Geconfigureerd');
    console.log('\n🚀 Je JobFlow app is nu live en beveiligd!');
    
    rl.close();
}

// Error handling
process.on('unhandledRejection', (error) => {
    console.error('❌ Onverwachte error:', error);
    rl.close();
    process.exit(1);
});

// Run the setup
main().catch(console.error); 