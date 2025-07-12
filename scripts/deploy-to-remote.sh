#!/bin/bash

# Remote Database Deployment Script
# Deploys the Supabase database schema and data to any remote PostgreSQL database

set -e

echo "🚀 Remote Database Deployment Script"
echo "======================================"

# Check if DATABASE_URL is provided
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is required"
    echo "Usage: DATABASE_URL='postgresql://user:pass@host:port/db' ./scripts/deploy-to-remote.sh"
    exit 1
fi

echo "📊 Deploying to: $(echo $DATABASE_URL | sed 's/:[^@]*@/:***@/')"

# Run the migration
echo "📋 Executing schema and data migration..."
psql "$DATABASE_URL" -f migrations/supabase-export.sql

echo "✅ Database deployment completed successfully!"

# Verify deployment
echo "🔍 Verifying deployment..."
psql "$DATABASE_URL" -c "
SELECT 
    'Categories' as table_name, COUNT(*) as count FROM categories
UNION ALL
SELECT 
    'Subcategories', COUNT(*) FROM subcategories
UNION ALL
SELECT 
    'Subjects', COUNT(*) FROM subjects
UNION ALL
SELECT 
    'Exams', COUNT(*) FROM exams
UNION ALL
SELECT 
    'Interactions', COUNT(*) FROM user_subject_interactions;
"

echo ""
echo "🎉 Deployment completed! Your remote database now contains:"
echo "   • Complete schema with all tables and relationships"
echo "   • Sample certification and academic subjects"
echo "   • Practice exams and questions"
echo "   • Trending data and user interactions"
echo ""
echo "💡 You can now connect your application to this remote database."