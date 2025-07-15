# Admin User Creation Guide

## 🔐 Default Admin Access

Your Vercel deployment comes with a default admin user already created:

- **Admin Email**: `admin@brainliest.com`
- **Admin Password**: `Super.Admin.123!@#`
- **Admin Panel URL**: `https://your-app.vercel.app/admin`

## 🚀 Quick Start

### 1. Access Admin Panel
1. Visit `https://your-app.vercel.app/admin`
2. Sign in with the default credentials above
3. You'll have access to:
   - User Management
   - Content Management (Questions, Exams, Subjects)
   - Analytics Dashboard
   - System Settings

### 2. Change Default Password (Recommended)
For security, change the default admin password immediately:
1. Go to Admin Panel → User Management
2. Find the admin user
3. Click "Reset Password"
4. Set a new secure password

## 📝 Creating Additional Admin Users

### Method 1: Via Admin Panel (Recommended)
1. Sign in to the admin panel
2. Navigate to **User Management**
3. Click **"Add User"**
4. Fill in the form:
   - Email: `new-admin@yourdomain.com`
   - Role: `admin`
   - Password: Generate or enter a secure password
   - First Name, Last Name (optional)
5. Click **"Create User"**

### Method 2: Using Node.js Script
```bash
# Make sure you're in the project directory
cd /path/to/your/project

# Run the interactive script
node scripts/create-admin-user.js
```

The script will:
- Prompt for admin credentials
- Ask for new user details
- Generate a secure password (optional)
- Create the admin user via API

### Method 3: Using cURL Script
```bash
# Make the script executable
chmod +x scripts/create-admin-curl.sh

# Update the VERCEL_URL in the script first
nano scripts/create-admin-curl.sh

# Run the script
./scripts/create-admin-curl.sh
```

### Method 4: Direct API Call
```bash
# Step 1: Login as admin
curl -X POST "https://your-app.vercel.app/api/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@brainliest.com",
    "password": "Super.Admin.123!@#"
  }'

# Step 2: Extract token from response and create user
curl -X POST "https://your-app.vercel.app/api/admin/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "email": "new-admin@yourdomain.com",
    "password": "SecurePassword123!",
    "role": "admin",
    "firstName": "New",
    "lastName": "Admin"
  }'
```

## 🔒 Security Best Practices

### Password Requirements
Admin passwords must meet these criteria:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Admin Email Authorization
Only emails listed in the `AUTHORIZED_ADMIN_EMAILS` environment variable can be created as admin users. 

Default authorized emails:
- `admin@brainliest.com`
- `super.admin@brainliest.com`
- `platform.admin@brainliest.com`

To add more authorized emails, update your Vercel environment variables:
```env
AUTHORIZED_ADMIN_EMAILS=admin@brainliest.com,your-admin@yourdomain.com,another-admin@yourdomain.com
```

### Account Security Features
- **Account Lockout**: After 3 failed login attempts, accounts are locked for 30 minutes
- **JWT Token Expiry**: Admin tokens expire after 8 hours
- **Password Hashing**: All passwords are hashed using bcrypt with 12 rounds
- **Audit Logging**: All admin actions are logged with timestamps and IP addresses

## 🔧 Environment Variables

### Required for Production
```env
# JWT secrets (minimum 32 characters)
JWT_SECRET=your-secure-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-secure-refresh-secret-min-32-chars
ADMIN_JWT_SECRET=your-secure-admin-secret-min-32-chars
SESSION_SECRET=your-secure-session-secret-min-32-chars

# Database connection
DATABASE_URL=your-postgresql-connection-string

# Admin email whitelist
AUTHORIZED_ADMIN_EMAILS=admin@brainliest.com,your-admin@yourdomain.com
```

### Optional
```env
# For enhanced features
GEMINI_API_KEY=your-gemini-api-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
```

## 📊 Admin Capabilities

### User Management
- Create, edit, and delete users
- Assign roles (user, moderator, admin)
- Reset passwords
- View user activity logs
- Ban/unban users

### Content Management
- Create and edit exam categories
- Manage subjects and subcategories
- Add/edit/delete questions
- Import/export questions via CSV
- Manage question explanations

### Analytics
- View user engagement metrics
- Monitor exam performance
- Track popular subjects
- System health monitoring

### System Administration
- Configure system settings
- Monitor database performance
- View audit logs
- Manage freemium limits

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Access denied" Error
**Cause**: Email not in authorized list
**Solution**: Add the email to `AUTHORIZED_ADMIN_EMAILS` environment variable

#### 2. "Invalid admin credentials"
**Cause**: Wrong email/password or user doesn't exist
**Solution**: Use the default admin credentials or reset password

#### 3. "Admin user not found"
**Cause**: User exists but doesn't have admin role
**Solution**: Update user role in database or create new admin user

#### 4. "Token expired"
**Cause**: Admin session expired (8 hours)
**Solution**: Sign in again to get a new token

### Database Direct Access
If you need to create an admin user directly in the database:

```sql
-- Connect to your database
-- Hash a password using bcrypt with 12 rounds
-- Insert admin user

INSERT INTO users (
  email, 
  username, 
  first_name, 
  last_name, 
  role, 
  password_hash, 
  email_verified, 
  created_at, 
  updated_at
) VALUES (
  'new-admin@yourdomain.com',
  'newadmin',
  'New',
  'Admin',
  'admin',
  '$2b$12$your-bcrypt-hashed-password-here',
  true,
  NOW(),
  NOW()
);
```

## 📞 Support

If you encounter issues:
1. Check the admin panel logs
2. Verify environment variables are set correctly
3. Ensure the database connection is working
4. Check the Vercel function logs for errors

## 🎉 Success!

Once you've created your admin users, you can:
- Access the full admin panel
- Manage your question database
- Monitor user activity
- Configure system settings
- Scale your exam platform

Your admin users will have full access to manage the Brainliest platform on Vercel! 