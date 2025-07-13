#!/bin/bash

# Vercel Deployment Script for Supabase Integration
# Deploys the application with full Supabase database integration

set -e  # Exit on any error

echo "🚀 Starting Vercel deployment with Supabase integration..."

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is required"
    echo "   Please set your Supabase connection string:"
    echo "   export DATABASE_URL='postgresql://postgres:[password]@[host]:[port]/postgres'"
    exit 1
fi

# Verify Supabase connection
echo "🔗 Testing Supabase database connection..."
node scripts/test-database-connection.js || {
    echo "❌ Database connection failed. Please check your DATABASE_URL"
    exit 1
}

# Seed production database
echo "🌱 Seeding production database with comprehensive exam data..."
node scripts/seed-supabase-production.js || {
    echo "❌ Database seeding failed"
    exit 1
}

# Build application for production
echo "🏗️  Building application for production..."
npm run build || {
    echo "❌ Build failed"
    exit 1
}

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
if command -v vercel &> /dev/null; then
    # Production deployment
    vercel --prod || {
        echo "❌ Vercel deployment failed"
        exit 1
    }
else
    echo "❌ Vercel CLI not found. Please install with: npm i -g vercel"
    exit 1
fi

echo "✅ Deployment completed successfully!"
echo ""
echo "🎯 Deployment includes:"
echo "   • 6 certification categories"
echo "   • 13 specialized subcategories" 
echo "   • 19 professional certification subjects"
echo "   • 10 comprehensive practice exams"
echo "   • 50+ realistic practice questions"
echo "   • Live trending certification data"
echo ""
echo "🔗 Your application is now live with:"
echo "   • Full Supabase PostgreSQL integration"
echo "   • Comprehensive certification exam database"
echo "   • Real-time trending analytics"
echo "   • Production-ready security policies"
echo ""
echo "🌟 Ready for certification preparation platform!"