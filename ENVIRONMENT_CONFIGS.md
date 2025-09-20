# Environment Configuration Guide

## 🏠 **Development Environment (.env.development)**

Create this file for local development:

```env
# Development Environment
NODE_ENV=development
PORT=5000

# Database (use local MongoDB or Atlas)
MONGO_URI=mongodb://localhost:27017/madrassaplay
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/madrassaplay?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-development-secret-key-here

# CORS Configuration (optional - will use defaults if not set)
# CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173,http://72.60.133.119

# File Upload Configuration
UPLOADS_DIR=./public/uploads
SCAN_UPLOADS=false

# Optional: Email Configuration
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASS=your-app-password

# Optional: School Deletion Cron
ENABLE_SCHOOL_DELETION_CRON=false

# Optional: Backup Configuration
BACKUP_ON_START=false
```

## 🚀 **Production Environment (.env.production)**

Create this file for your VPS:

```env
# Production Environment
NODE_ENV=production
PORT=5000

# Database (use MongoDB Atlas for production)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/madrassaplay?retryWrites=true&w=majority

# JWT Configuration (use a strong, unique secret)
JWT_SECRET=your-super-secret-production-jwt-key-here-make-it-long-and-random

# CORS Configuration (your VPS IP or domain)
CORS_ORIGIN=http://72.60.133.119
# When you get a domain, update to:
# CORS_ORIGIN=https://yourdomain.com

# File Upload Configuration
UPLOADS_DIR=/var/www/madrassaplay/server/public/uploads
SCAN_UPLOADS=false

# Optional: Email Configuration
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASS=your-app-password

# Optional: School Deletion Cron
ENABLE_SCHOOL_DELETION_CRON=false

# Optional: Backup Configuration
BACKUP_ON_START=false
```

## 🔄 **How to Use Different Environments**

### For Development:
```bash
# Copy development config
cp ENVIRONMENT_CONFIGS.md .env.development
# Edit the file with your development settings
nano .env.development

# Rename to .env for development
cp .env.development .env

# Start development server
npm run start
```

### For Production:
```bash
# Copy production config
cp ENVIRONMENT_CONFIGS.md .env.production
# Edit the file with your production settings
nano .env.production

# Rename to .env for production
cp .env.production .env

# Start production server
pm2 start ecosystem.config.js
```

## 🌐 **CORS Configuration Details**

### Development Mode:
- Allows: `http://localhost:5173`, `http://127.0.0.1:5173`, `http://0.0.0.0:5173`
- Plus any custom origins from `CORS_ORIGIN` environment variable
- Supports multiple origins separated by commas

### Production Mode:
- Uses `CORS_ORIGIN` environment variable
- Defaults to your VPS IP if not set
- Supports multiple origins separated by commas

### Example CORS_ORIGIN values:
```env
# Single origin
CORS_ORIGIN=http://72.60.133.119

# Multiple origins (comma-separated)
CORS_ORIGIN=http://72.60.133.119,https://yourdomain.com,https://www.yourdomain.com

# With domain
CORS_ORIGIN=https://yourdomain.com
```

## 🔧 **Quick Setup Commands**

### Development:
```bash
# 1. Copy development config
cp ENVIRONMENT_CONFIGS.md .env.development

# 2. Edit with your settings
nano .env.development

# 3. Use for development
cp .env.development .env

# 4. Start development
npm run start
```

### Production:
```bash
# 1. Copy production config
cp ENVIRONMENT_CONFIGS.md .env.production

# 2. Edit with your VPS settings
nano .env.production

# 3. Use for production
cp .env.production .env

# 4. Restart production
pm2 restart madrassaplay-api
```

## 📝 **Notes**

- The server automatically detects `NODE_ENV` and configures CORS accordingly
- Development mode is more permissive for easier testing
- Production mode is more restrictive for security
- You can always override CORS_ORIGIN for custom configurations
- Multiple origins are supported by separating them with commas
