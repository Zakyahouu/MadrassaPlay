# Deployment Guide (Merged)

This file merges:
- docs/deployment/DEPLOYMENT_GUIDE.md
- docs/deployment/README-Deploy.md
- docs/deployment/NETWORK_ACCESS_GUIDE.md

---

# Wajibet Platform - Complete Deployment Guide for Hostinger VPS

## Project Overview

**Wajibet** is an educational gaming platform built with the MERN stack that allows teachers to create and host interactive games for students. The platform features real-time communication, multi-role user management, and comprehensive school administration.

### Tech Stack
- Frontend: React 19.1.1 + Vite + Tailwind CSS
- Backend: Node.js + Express 5.1.0 + Socket.IO
- Database: MongoDB (MongoDB Atlas recommended)
- Authentication: JWT with bcrypt
- Real-time: Socket.IO for live game sessions

---

## Prerequisites

### VPS Requirements
- OS: Ubuntu 20.04 LTS or newer
- RAM: Minimum 2GB (4GB recommended)
- Storage: Minimum 20GB SSD
- CPU: 2 cores minimum
- Network: Public IP with domain name

### Software Requirements
- Node.js 18+ LTS
- MongoDB (Atlas recommended)
- Nginx
- PM2 (Process Manager)
- Git
- SSL Certificate (Let's Encrypt)

---

## Step 1: VPS Initial Setup

### 1.1 Connect to Your VPS
```bash
ssh root@your-vps-ip
# or
ssh username@your-vps-ip
```

### 1.2 Update System Packages
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Install Essential Packages
```bash
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

---

## Step 2: Install Node.js

### 2.1 Install Node.js 18 LTS
```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 2.2 Install PM2 Globally
```bash
sudo npm install -g pm2
```

---

## Step 3: Install and Configure MongoDB

### 3.1 Install MongoDB (if using local MongoDB)
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package list and install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 3.2 Configure MongoDB (if using local)
```bash
# Create MongoDB data directory
sudo mkdir -p /data/db
sudo chown -R mongodb:mongodb /data/db

# Configure MongoDB
sudo nano /etc/mongod.conf
```

Add/modify these settings in `/etc/mongod.conf`:
```yaml
net:
  port: 27017
  bindIp: 127.0.0.1

security:
  authorization: enabled

storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
```

### 3.3 MongoDB Atlas Setup (Recommended)
1. Go to https://www.mongodb.com/atlas
2. Create a new cluster
3. Create a database user
4. Whitelist your VPS IP address
5. Get your connection string

---

## Step 4: Install and Configure Nginx

### 4.1 Install Nginx
```bash
sudo apt install -y nginx
```

### 4.2 Start and Enable Nginx
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4.3 Configure Firewall
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## Step 5: Deploy Application

### 5.1 Create Application Directory
```bash
sudo mkdir -p /var/www/madrassaplay
sudo chown -R $USER:$USER /var/www/madrassaplay
```

### 5.2 Clone Repository
```bash
cd /var/www/madrassaplay
git clone https://github.com/your-username/Wajibet.git .
```

### 5.3 Install Dependencies

#### Backend Dependencies
```bash
cd /var/www/madrassaplay/server
npm install --production
```

#### Frontend Dependencies
```bash
cd /var/www/madrassaplay/client
npm install
```

### 5.4 Build Frontend
```bash
cd /var/www/madrassaplay/client
npm run build
```

---

## Step 6: Environment Configuration

### 6.1 Create Environment File
```bash
cd /var/www/madrassaplay/server
nano .env
```

### 6.2 Environment Variables
```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
MONGO_URI=mongodb://localhost:27017/madrassaplay
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/madrassaplay?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# File Upload Configuration
UPLOADS_DIR=/var/www/madrassaplay/server/public/uploads
SCAN_UPLOADS=false

# Optional: Email Configuration (if using email features)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Optional: School Deletion Cron
ENABLE_SCHOOL_DELETION_CRON=false

# Optional: Backup Configuration
BACKUP_ON_START=false
```

### 6.3 Fix CORS Configuration for Production

Update Socket.IO CORS configuration in `server/server.js`.

### 6.4 Add Express CORS Middleware

Add CORS middleware to the Express app by modifying `server/app.js`.

### 6.5 Set Proper Permissions
```bash
sudo chown -R www-data:www-data /var/www/madrassaplay
sudo chmod -R 755 /var/www/madrassaplay
```

---

## Step 7: Configure PM2

### 7.1 Create PM2 Ecosystem File
```bash
cd /var/www/madrassaplay
nano configs/process/ecosystem.config.js
```

### 7.2 PM2 Configuration
```javascript
module.exports = {
  apps: [{
    name: 'madrassaplay-api',
    script: './server/server.js',
    cwd: '/var/www/madrassaplay',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/pm2/madrassaplay-error.log',
    out_file: '/var/log/pm2/madrassaplay-out.log',
    log_file: '/var/log/pm2/madrassaplay-combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

### 7.3 Create Log Directory
```bash
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2
```

### 7.4 Start Application with PM2
```bash
cd /var/www/madrassaplay
pm2 start configs/process/ecosystem.config.js
pm2 save
pm2 startup
```

---

## Step 8: Configure Nginx

### 8.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/madrassaplay
```

### 8.2 Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Client max body size for file uploads
    client_max_body_size 50M;
    
    # Serve static files from React build
    location / {
        root /var/www/madrassaplay/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API routes - proxy to Node.js backend
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Proxy for 3D Model Service to avoid mixed content (HTTPS safe)
    location /model3d/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

# Deployment Handoff (API + Client + Live Sessions)

This app runs on Node.js (Express + Socket.IO) with MongoDB. Single server works; scale later with Redis.

## 1) Server prerequisites
- Node.js LTS
- MongoDB connection (MongoDB Atlas recommended)
- Optional later: Redis for scaling live sessions across multiple instances

## 2) Environment (.env)
- PORT=5000
- MONGO_URI=...
- JWT_SECRET=...
- CORS_ORIGIN=https://your-domain.com
- UPLOADS_DIR=/srv/madrassa-play/uploads
- SCAN_UPLOADS=false
- Later, for scale: REDIS_URL=redis://...

## 3) Start API with PM2
- pm2 start server/server.js --name madrassa-api
- NODE_ENV=production

## 4) Nginx (core)
- Serve client build at /
- Proxy /api to Node (http://127.0.0.1:5000)
- Proxy /socket.io with WebSocket upgrade
- Serve /uploads from disk or proxy via Node

## 5) Client
- Build with Vite (npm run build) and copy dist/ to web root

## 6) Scaling (when needed)
- Run multiple Node instances (PM2 cluster or multiple VMs/containers)
- Add Redis and socket.io-redis adapter
- Enable sticky sessions on load balancer
- Move uploads to shared storage (S3) or shared volume

## 7) Health & Monitoring
- GET /api/health should return 200
- Use PM2 logs; add Sentry for error tracking (optional)

---

# Network Access Configuration Guide

## Overview
This guide will help you configure your Skill Snap app to be accessible from any device on your local network.

## Configuration Changes Made

### 1. Server Configuration (server/server.js)
- CORS Origins: Added support for `0.0.0.0:5173`
- Network Binding: Server now listens on `0.0.0.0:5000` (all network interfaces)
- Console Logging: Added network access information

### 2. Client Configuration (client/vite.config.js)
- Host Binding: Vite dev server now binds to `0.0.0.0:5173`
- Port Configuration: Explicitly set port 5173
- Proxy Settings: Maintained API proxy configuration

## How to Access from Other Devices

### Step 1: Find Your Computer's IP Address

#### Windows:
```bash
ipconfig
```

#### macOS/Linux:
```bash
ifconfig
# or
ip addr show
```

### Step 2: Start the Application

#### Terminal 1 - Start Server:
```bash
cd server
npm start
```

#### Terminal 2 - Start Client:
```bash
cd client
npm run dev
```

### Step 3: Access from Other Devices
- Web Browser: http://YOUR_IP:5173
- Example: http://192.168.1.100:5173

## Security Considerations
- Allow Node.js and Vite through your firewall
- This configuration is for local network access only
- Do not expose these ports to the internet without proper security

## Troubleshooting
- Check if server is running on port 5000
- Verify firewall settings
- Ensure both server and client are started
- Check browser console for errors
