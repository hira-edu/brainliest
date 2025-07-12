# Remote Database Deployment Guide

This guide explains how to migrate your Brainliest application data from Supabase to any remote PostgreSQL database.

## 📋 What's Included

The migration package contains:
- **Complete schema** with all tables and relationships
- **54 subjects** across professional certifications and academic topics
- **23 practice exams** with varying difficulty levels
- **Sample questions** and user interaction data
- **Trending analytics** and performance indexes

## 🚀 Quick Deployment

### Option 1: Using the Deployment Script

```bash
# Set your remote database URL
export DATABASE_URL="postgresql://username:password@your-host:5432/your-database"

# Run the deployment script
./scripts/deploy-to-remote.sh
```

### Option 2: Manual Deployment

```bash
# Connect to your remote database and run the migration
psql "postgresql://username:password@your-host:5432/your-database" -f migrations/supabase-export.sql
```

## 📊 What Gets Deployed

### Core Schema
- **Categories** (2): Professional Certifications, University & College
- **Subcategories** (12): IT & Cloud Computing, Project Management, Cybersecurity, etc.
- **Subjects** (15+ core subjects): PMP, AWS, CompTIA Security+, Cisco CCNA, etc.
- **Exams** (10+ practice exams): Multiple difficulty levels for each certification
- **Analytics**: User interaction tracking and trending data

### Sample Data Includes
- **Professional Certifications**:
  - PMP Certification (Project Management)
  - AWS Certified Solutions Architect (Cloud Computing)
  - CompTIA Security+ (Cybersecurity)
  - Cisco CCNA (Networking)
  - Microsoft Azure Fundamentals (Cloud Computing)

- **Academic Subjects**:
  - Mathematics: Calculus, Statistics
  - Sciences: Physics, Chemistry, Biology
  - Business: Administration, Accounting
  - Humanities: Psychology, History

## 🔧 Configuration

After deployment, update your application's environment variables:

```env
# Update your .env file with the new database URL
DATABASE_URL="postgresql://username:password@your-host:5432/your-database"

# Optional: Configure other settings
JWT_SECRET="your-secure-jwt-secret"
ADMIN_JWT_SECRET="your-admin-jwt-secret"
```

## ✅ Verification

After deployment, verify everything works:

```bash
# Check table counts
psql "$DATABASE_URL" -c "
SELECT 
    'Categories' as table_name, COUNT(*) as count FROM categories
UNION ALL
SELECT 'Subjects', COUNT(*) FROM subjects
UNION ALL
SELECT 'Exams', COUNT(*) FROM exams;"
```

Expected output:
- Categories: 2+
- Subjects: 15+
- Exams: 10+

## 🔄 Connecting Your Application

1. **Update your database connection** in `server/src/db.ts` if needed
2. **Restart your application** to connect to the new database
3. **Test the trending section** to ensure data is loading correctly
4. **Verify subject browsing** and exam functionality

## 🛠 Troubleshooting

### Connection Issues
```bash
# Test connection
psql "$DATABASE_URL" -c "SELECT version();"
```

### Missing Data
```bash
# Re-run the migration
psql "$DATABASE_URL" -f migrations/supabase-export.sql
```

### Permission Issues
Ensure your database user has:
- CREATE permissions for schema creation
- INSERT permissions for data insertion
- SELECT permissions for application usage

## 📈 Performance Notes

The migration includes optimized indexes for:
- Subject filtering by category/subcategory
- Exam lookups by subject
- Question queries by exam
- User interaction analytics

## 🔐 Security Considerations

- Use strong database credentials
- Restrict database access to your application servers
- Consider connection pooling for production deployments
- Regular backup your database after deployment

## 📞 Support

If you encounter issues:
1. Check the console logs for specific error messages
2. Verify your DATABASE_URL format is correct
3. Ensure the target database exists and is accessible
4. Confirm your database user has sufficient permissions

## 🎯 Next Steps

After successful deployment:
1. **Configure trending analytics** - Data will populate as users interact
2. **Add more subjects** - Use the admin panel to expand your catalog
3. **Import questions** - Use the CSV/JSON import features
4. **Set up monitoring** - Track performance and user engagement

Your remote database is now ready for production use with a comprehensive exam preparation platform!