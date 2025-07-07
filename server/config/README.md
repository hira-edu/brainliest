# Server Configuration

## Security Configuration

The security configuration module enforces enterprise-grade security requirements for the Brainliest platform.

### Environment Variables Required for Production

```bash
# JWT Secrets - MUST be 64+ character cryptographically secure random strings
JWT_SECRET=<64-character-random-string>
JWT_REFRESH_SECRET=<64-character-random-string>
ADMIN_JWT_SECRET=<64-character-random-string>

# Session Secret
SESSION_SECRET=<32-character-random-string>

# Admin Authorization
AUTHORIZED_ADMIN_EMAILS=admin@brainliest.com,admin2@brainliest.com

# CORS Origins (production)
CORS_ORIGINS=https://brainliest.com,https://www.brainliest.com
```

### Generate Secure Secrets

Use these commands to generate cryptographically secure secrets:

```bash
# Generate 64-character secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate 32-character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Development Mode

In development mode, the system automatically generates secure secrets and displays warnings.

### Production Mode

In production mode, the system will refuse to start without proper environment variables set.