#!/bin/bash

# 🚀 CrewFlow Environment Variables Setup Script

echo "🚀 Setting up CrewFlow environment variables..."

# PostgreSQL Database URL
echo "📊 Setting DATABASE_URL..."
echo "postgresql://neondb_owner:npg_6s7awkSvMtEe@ep-dry-mountain-a2zm5oy6-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require" | vercel env add DATABASE_URL production

# NextAuth URL
echo "🔐 Setting NEXTAUTH_URL..."
echo "https://jobflow-2025-puhhwnlcd-marthen-bakkers-projects.vercel.app" | vercel env add NEXTAUTH_URL production --force

# Essential settings
echo "⚙️ Setting NODE_ENV..."
echo "production" | vercel env add NODE_ENV production --force

echo "✅ Environment variables setup completed!"
echo "🎯 Next: Deploy the updated version" 