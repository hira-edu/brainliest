# Brainliest - Deployment Guide

## Project Overview
Brainliest is a comprehensive exam preparation platform built with React, Node.js, TypeScript, and PostgreSQL. This guide will help you deploy the project on your own server.

## System Requirements

### Server Requirements
- Node.js 18+ 
- PostgreSQL 14+
- 2GB+ RAM recommended
- 20GB+ storage

### Environment Setup
The project requires the following environment variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/brainliest

# Optional: Google Gemini AI Integration (for question help and explanations)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# Session Configuration (generate a random 32+ character string)
SESSION_SECRET=your_super_secret_session_key_here

# Environment
NODE_ENV=production
```

## Deployment Steps

### 1. Database Setup

#### Create PostgreSQL Database
```sql
-- Connect to PostgreSQL as superuser
CREATE DATABASE brainliest;
CREATE USER brainliest_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE brainliest TO brainliest_user;
```

#### Deploy Database Schema
```bash
# Install dependencies
npm install

# Deploy database schema
npm run db:push
```

### 2. Build the Application

```bash
# Install all dependencies
npm install

# Build the frontend and backend
npm run build
```

### 3. Production Deployment

#### Option A: Node.js Server
```bash
# Start the production server
npm start

# Or with PM2 for process management
npm install -g pm2
pm2 start dist/index.js --name "brainliest"
pm2 save
pm2 startup
```

#### Option B: Docker Deployment
```dockerfile
# Use the included Dockerfile
docker build -t brainliest .
docker run -d -p 5000:5000 --env-file .env brainliest
```

### 4. Nginx Configuration (Recommended)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Project Structure

```
brainliest/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities and configurations
│   │   └── hooks/          # Custom React hooks
│   └── index.html
├── server/                 # Express.js backend
│   ├── index.ts           # Main server file
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   ├── db.ts              # Database connection
│   └── ai.ts              # AI integration
├── shared/                # Shared types and schemas
│   └── schema.ts
├── package.json
├── vite.config.ts
├── drizzle.config.ts
└── tsconfig.json
```

## Database Schema

The application uses PostgreSQL with the following main tables:
- `subjects` - Certification categories and academic subjects
- `exams` - Practice exam sets within each subject
- `questions` - Multiple-choice questions with explanations
- `users` - User accounts with role-based access
- `user_sessions` - Exam session tracking
- `comments` - Question discussions

## Features

### Core Functionality
- **47 subjects** across Professional Certifications and University categories
- **Multi-exam practice** with real-time feedback
- **AI-powered assistance** using Google Gemini for hints and explanations
- **Progress tracking** and analytics
- **User authentication** and role management
- **Admin panel** for content management

### Admin Panel Features
- Subject management with categorization
- Exam creation and cloning
- Question bank management with CSV import/export
- User management with ban/unban capabilities
- Advanced search and filtering

## Security Notes

1. **Database Security**: Use strong passwords and restrict database access
2. **Session Security**: Generate a strong SESSION_SECRET (32+ random characters)
3. **API Keys**: Keep AI API keys secure and rotate regularly
4. **HTTPS**: Always use HTTPS in production with SSL certificates
5. **Firewall**: Configure firewall to only allow necessary ports

## Monitoring and Maintenance

### Health Checks
The application provides health check endpoints:
- `GET /api/health` - Application health status
- `GET /api/subjects` - Database connectivity test

### Logs
Application logs are written to stdout/stderr. Use log aggregation tools like:
- PM2 logs: `pm2 logs brainliest`
- Docker logs: `docker logs container_name`

### Backup Strategy
Regular PostgreSQL backups:
```bash
# Daily backup
pg_dump -h localhost -U brainliest_user brainliest > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -h localhost -U brainliest_user brainliest < backup_file.sql
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check DATABASE_URL format
   - Verify PostgreSQL is running
   - Check firewall settings

2. **Build Errors**
   - Ensure Node.js 18+ is installed
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`

3. **Permission Errors**
   - Check file permissions
   - Ensure proper database user privileges

### Support
For deployment issues, check the application logs and verify all environment variables are properly set.

## Performance Optimization

### Database
- Index frequently queried columns
- Use connection pooling
- Regular VACUUM and ANALYZE operations

### Application
- Enable gzip compression
- Use CDN for static assets
- Implement caching strategies

### Monitoring
- Set up application monitoring (e.g., New Relic, DataDog)
- Monitor database performance
- Set up alerting for critical issues

## License and Credits

This project is built using:
- React with TypeScript
- Node.js with Express
- PostgreSQL with Drizzle ORM
- Tailwind CSS with shadcn/ui components
- Google Gemini AI for intelligent assistance

For questions or support, contact the development team.