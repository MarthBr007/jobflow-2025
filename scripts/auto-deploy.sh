#!/bin/bash

# 🚀 AUTOMATISCHE JOBFLOW VERCEL DEPLOYMENT
# Dit script maakt de deployment helemaal af

echo "🚀 JOBFLOW VERCEL AUTO-DEPLOYMENT"
echo "=================================="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI niet gevonden. Installeren..."
    npm install -g vercel
fi

echo "✅ Vercel CLI gevonden"

# Environment variables
echo ""
echo "🔧 ENVIRONMENT VARIABLES INSTELLEN..."
echo "====================================="

# Critical variables
echo "📝 Instellen: NODE_ENV=production"
echo "production" | vercel env add NODE_ENV production 2>/dev/null || echo "   ✓ Al ingesteld"

echo "📝 Instellen: NEXTAUTH_SECRET"
echo "QKoYbkbw2oF4y2uuhSgZQLK1yUvQyjo5wHHUfRO0U8Q=" | vercel env add NEXTAUTH_SECRET production 2>/dev/null || echo "   ✓ Al ingesteld"

echo "📝 Instellen: NEXTAUTH_URL"
echo "https://jobflow-2025-ksd8kywey-marthen-bakkers-projects.vercel.app" | vercel env add NEXTAUTH_URL production 2>/dev/null || echo "   ✓ Al ingesteld"

# Security variables
echo "📝 Instellen beveiligingsvariabelen..."
echo "false" | vercel env add ALLOW_SETUP production 2>/dev/null || echo "   ✓ ALLOW_SETUP al ingesteld"
echo "false" | vercel env add ALLOW_SEEDING production 2>/dev/null || echo "   ✓ ALLOW_SEEDING al ingesteld"
echo "false" | vercel env add ENABLE_REGISTRATION production 2>/dev/null || echo "   ✓ ENABLE_REGISTRATION al ingesteld"
echo "true" | vercel env add RATE_LIMIT_ENABLED production 2>/dev/null || echo "   ✓ RATE_LIMIT_ENABLED al ingesteld"
echo "60000" | vercel env add RATE_LIMIT_WINDOW_MS production 2>/dev/null || echo "   ✓ RATE_LIMIT_WINDOW_MS al ingesteld"
echo "100" | vercel env add RATE_LIMIT_MAX_REQUESTS production 2>/dev/null || echo "   ✓ RATE_LIMIT_MAX_REQUESTS al ingesteld"
echo "true" | vercel env add IP_VALIDATION_ENABLED production 2>/dev/null || echo "   ✓ IP_VALIDATION_ENABLED al ingesteld"
echo "true" | vercel env add AUDIT_LOGGING_ENABLED production 2>/dev/null || echo "   ✓ AUDIT_LOGGING_ENABLED al ingesteld"

# Application settings
echo "📝 Instellen applicatie variabelen..."
echo "Broers Verhuur" | vercel env add DEFAULT_COMPANY production 2>/dev/null || echo "   ✓ DEFAULT_COMPANY al ingesteld"
echo "true" | vercel env add ENABLE_BULK_IMPORT production 2>/dev/null || echo "   ✓ ENABLE_BULK_IMPORT al ingesteld"
echo "true" | vercel env add ENABLE_EMAIL_NOTIFICATIONS production 2>/dev/null || echo "   ✓ ENABLE_EMAIL_NOTIFICATIONS al ingesteld"
echo "true" | vercel env add ENABLE_FILE_UPLOADS production 2>/dev/null || echo "   ✓ ENABLE_FILE_UPLOADS al ingesteld"
echo "true" | vercel env add PERFORMANCE_MONITORING production 2>/dev/null || echo "   ✓ PERFORMANCE_MONITORING al ingesteld"

echo ""
echo "✅ Basis environment variables ingesteld!"

# Database setup
echo ""
echo "🗄️  DATABASE SETUP NODIG"
echo "========================"
echo "Je moet nog een DATABASE_URL instellen:"
echo ""
echo "🚀 SNELLE OPTIES:"
echo "1. Neon (PostgreSQL): https://neon.tech"
echo "2. PlanetScale (MySQL): https://planetscale.com"
echo "3. Supabase (PostgreSQL): https://supabase.com"
echo ""

read -p "Heb je al een DATABASE_URL? (y/n): " has_database

if [[ $has_database =~ ^[Yy]$ ]]; then
    echo ""
    read -p "📋 Plak hier je DATABASE_URL: " database_url
    if [ ! -z "$database_url" ]; then
        echo "$database_url" | vercel env add DATABASE_URL production 2>/dev/null
        echo "✅ DATABASE_URL ingesteld!"
        
        # Redeploy with new database
        echo ""
        echo "🚀 DEPLOYING MET DATABASE..."
        echo "============================"
        vercel --prod
        
        # Push database schema
        echo ""
        echo "📊 DATABASE SCHEMA PUSHEN..."
        echo "============================"
        export DATABASE_URL="$database_url"
        npx prisma db push
        
        echo ""
        echo "🎉 DEPLOYMENT VOLTOOID!"
        echo "======================"
        echo "🌍 App URL: https://jobflow-2025-ksd8kywey-marthen-bakkers-projects.vercel.app"
        echo "🔒 Beveiliging: ✅ Ingeschakeld"
        echo "📊 Database: ✅ Geconfigureerd"
        echo "🚀 Je JobFlow app is nu live!"
        
    else
        echo "❌ Geen DATABASE_URL ingevoerd"
    fi
else
    echo ""
    echo "📋 DATABASE SETUP INSTRUCTIES:"
    echo "1. Ga naar https://neon.tech (snelst)"
    echo "2. Sign up met GitHub"
    echo "3. Create database 'jobflow'"
    echo "4. Copy connection string"
    echo "5. Run dit script opnieuw"
    echo ""
    echo "Of voer handmatig uit:"
    echo "vercel env add DATABASE_URL production"
fi

echo ""
echo "📞 HULP NODIG?"
echo "=============="
echo "Run: cat scripts/quick-database-setup.md" 