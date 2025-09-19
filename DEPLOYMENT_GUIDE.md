# MadrassaPlay Platform - Complete Deployment Guide for Hostinger VPS

## 📋 Project Overview

**MadrassaPlay** is an educational gaming platform built with the MERN stack that allows teachers to create and host interactive games for students. The platform features real-time communication, multi-role user management, and comprehensive school administration.

### Tech Stack
- **Frontend**: React 19.1.1 + Vite + Tailwind CSS
- **Backend**: Node.js + Express 5.1.0 + Socket.IO
- **Database**: MongoDB (MongoDB Atlas recommended)
- **Authentication**: JWT with bcrypt
- **Real-time**: Socket.IO for live game sessions

---

## 🚀 Prerequisites

### VPS Requirements
- **OS**: Ubuntu 20.04 LTS or newer
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB SSD
- **CPU**: 2 cores minimum
- **Network**: Public IP with domain name

### Software Requirements
- Node.js 18+ LTS
- MongoDB (Atlas recommended)
- Nginx
- PM2 (Process Manager)
- Git
- SSL Certificate (Let's Encrypt)

---

## 📦 Step 1: VPS Initial Setup

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

## 🟢 Step 2: Install Node.js

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

## 🍃 Step 3: Install and Configure MongoDB

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
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Create a database user
4. Whitelist your VPS IP address
5. Get your connection string

---

## 🌐 Step 4: Install and Configure Nginx

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

## 📁 Step 5: Deploy Application

### 5.1 Create Application Directory
```bash
sudo mkdir -p /var/www/madrassaplay
sudo chown -R $USER:$USER /var/www/madrassaplay
```

### 5.2 Clone Repository
```bash
cd /var/www/madrassaplay
git clone https://github.com/your-username/MadrassaPlay.git .
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

## ⚙️ Step 6: Environment Configuration

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

**IMPORTANT**: The application has hardcoded CORS settings that need to be updated for production. You need to modify the Socket.IO CORS configuration in `server/server.js`:

```bash
nano /var/www/madrassaplay/server/server.js
```

Update lines 23-26 from:
```javascript
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://0.0.0.0:5173"],
    methods: ["GET", "POST"]
  }
});
```

To:
```javascript
const io = new Server(server, {
  cors: {
    origin: [process.env.CORS_ORIGIN || "https://yourdomain.com"],
    methods: ["GET", "POST"],
    credentials: true
  }
});
```

### 6.4 Add Express CORS Middleware

Add CORS middleware to the Express app by modifying `server/app.js`:

```bash
nano /var/www/madrassaplay/server/app.js
```

Add this after line 29 (after `app.use(express.json());`):
```javascript
// Add CORS middleware
const cors = require('cors');
app.use(cors({
  origin: process.env.CORS_ORIGIN || "https://yourdomain.com",
  credentials: true
}));
```

### 6.5 Set Proper Permissions
```bash
sudo chown -R www-data:www-data /var/www/madrassaplay
sudo chmod -R 755 /var/www/madrassaplay
```

---

## 🔧 Step 7: Configure PM2

### 7.1 Create PM2 Ecosystem File
```bash
cd /var/www/madrassaplay
nano ecosystem.config.js
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
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🌐 Step 8: Configure Nginx

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
    
    # Socket.IO routes
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static file serving for uploads
    location /uploads {
        alias /var/www/madrassaplay/server/public/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Badge icons
    location /badge-icons {
        alias /var/www/madrassaplay/server/public/badge-icons;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Game engines
    location /engines {
        alias /var/www/madrassaplay/server/public/engines;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # School documents
    location /school-documents {
        alias /var/www/madrassaplay/server/public/school-documents;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 8.3 Enable Site and Test Configuration
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/madrassaplay /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 Step 9: SSL Certificate Setup

### 9.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 9.2 Obtain SSL Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 9.3 Test SSL Renewal
```bash
sudo certbot renew --dry-run
```

---

## 🔧 Step 10: Database Setup

### 10.1 Connect to MongoDB
```bash
# For local MongoDB
mongo

# For MongoDB Atlas, use the connection string from Atlas dashboard
```

### 10.2 Create Database and User (if using local MongoDB)
```javascript
use madrassaplay
db.createUser({
  user: "madrassaplay_user",
  pwd: "your_secure_password",
  roles: [
    { role: "readWrite", db: "madrassaplay" }
  ]
})
```

### 10.3 Update Environment Variables
Update your `.env` file with the correct MongoDB URI:
```env
MONGO_URI=mongodb://madrassaplay_user:your_secure_password@localhost:27017/madrassaplay
```

---

## 🚀 Step 11: Start and Test Application

### 11.1 Restart PM2
```bash
pm2 restart madrassaplay-api
pm2 status
```

### 11.2 Check Logs
```bash
pm2 logs madrassaplay-api
```

### 11.3 Test Application
```bash
# Test API health
curl http://localhost:5000/api/health

# Test frontend
curl http://yourdomain.com
```

---

## 📊 Step 12: Monitoring and Maintenance

### 12.1 PM2 Monitoring
```bash
# View application status
pm2 status

# View logs
pm2 logs madrassaplay-api

# Monitor resources
pm2 monit

# Restart application
pm2 restart madrassaplay-api

# Stop application
pm2 stop madrassaplay-api
```

### 12.2 Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### 12.3 System Monitoring
```bash
# Check system resources
htop
df -h
free -h

# Check running services
sudo systemctl status nginx
sudo systemctl status mongod
```

---

## 🔄 Step 13: Backup Strategy

### 13.1 Database Backup
```bash
# Create backup script
sudo nano /var/www/madrassaplay/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/madrassaplay"
mkdir -p $BACKUP_DIR

# MongoDB backup
mongodump --uri="your_mongodb_uri" --out="$BACKUP_DIR/mongodb_$DATE"

# Compress backup
tar -czf "$BACKUP_DIR/mongodb_$DATE.tar.gz" -C "$BACKUP_DIR" "mongodb_$DATE"
rm -rf "$BACKUP_DIR/mongodb_$DATE"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "mongodb_*.tar.gz" -mtime +7 -delete

echo "Backup completed: mongodb_$DATE.tar.gz"
```

### 13.2 Make Backup Script Executable
```bash
chmod +x /var/www/madrassaplay/backup-db.sh
```

### 13.3 Setup Cron Job for Backups
```bash
crontab -e
```

Add this line for daily backups at 2 AM:
```bash
0 2 * * * /var/www/madrassaplay/backup-db.sh
```

---

## 🛠️ Step 14: Troubleshooting

### 14.1 Common Issues

#### Application Won't Start
```bash
# Check PM2 logs
pm2 logs madrassaplay-api

# Check if port is in use
sudo netstat -tulpn | grep :5000

# Check environment variables
pm2 show madrassaplay-api
```

#### Database Connection Issues
```bash
# Test MongoDB connection
mongo "your_mongodb_uri"

# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

#### Nginx Issues
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# Reload Nginx
sudo systemctl reload nginx
```

### 14.2 Performance Optimization

#### Enable Gzip Compression
Already included in Nginx configuration above.

#### Set Up Caching
Already included in Nginx configuration above.

#### Monitor Resource Usage
```bash
# Install monitoring tools
sudo apt install -y htop iotop

# Monitor PM2 processes
pm2 monit
```

---

## 🔄 Step 15: Updates and Maintenance

### 15.1 Application Updates
```bash
# Navigate to application directory
cd /var/www/madrassaplay

# Pull latest changes
git pull origin main

# Install new dependencies (if any)
cd server && npm install --production
cd ../client && npm install && npm run build

# Restart application
pm2 restart madrassaplay-api
```

### 15.2 System Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js (if needed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 📋 Step 16: Security Checklist

### 16.1 Firewall Configuration
```bash
# Check firewall status
sudo ufw status

# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw deny 5000   # Block direct access to Node.js
```

### 16.2 SSH Security
```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config
```

Ensure these settings:
```
Port 22
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

### 16.3 Application Security
- Use strong JWT secrets
- Enable HTTPS only
- Regular security updates
- Monitor logs for suspicious activity
- Use environment variables for sensitive data

---

## 📞 Support and Maintenance

### Regular Maintenance Tasks
1. **Daily**: Check application logs and system resources
2. **Weekly**: Review security logs and update packages
3. **Monthly**: Test backup restoration and update dependencies
4. **Quarterly**: Security audit and performance review

### Monitoring Commands
```bash
# Check application status
pm2 status

# Check system resources
htop

# Check disk usage
df -h

# Check memory usage
free -h

# Check network connections
sudo netstat -tulpn
```

---

## 🎯 Final Verification

After completing all steps, verify your deployment:

1. **Frontend**: Visit `https://yourdomain.com` - should load the React app
2. **API**: Test `https://yourdomain.com/api/health` - should return 200 OK
3. **WebSocket**: Test real-time features in the application
4. **File Uploads**: Test file upload functionality
5. **Database**: Verify data persistence

### Health Check Endpoint
Add this to your server for monitoring:
```javascript
// In server/app.js
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

---

## 📚 Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/security/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

---

**🎉 Congratulations! Your MadrassaPlay platform is now successfully deployed on Hostinger VPS!**

For any issues or questions, refer to the troubleshooting section or check the application logs using the provided commands.
