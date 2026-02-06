# Dress2MyDoor Deployment Guide

## Quick Start with Docker Compose (Recommended)

The easiest way to deploy the backend and database together:

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit .env with production values
nano .env  # or use your editor
# Update: ADMIN_TOKEN, EMAIL_*, FRONTEND_URL, MONGO_ADMIN_PASSWORD

# 3. Start services
docker-compose up -d

# 4. Verify services are running
docker-compose ps
docker-compose logs backend

# 5. Test health check
curl http://localhost:5000/api/health

# 6. Seed the database (from your dev machine or CI)
node scripts/syncGallery.js --token=YOUR_ADMIN_TOKEN
```

## Docker Compose Services

**MongoDB** (`mongodb:7.0-alpine`)
- Running on `localhost:27017` (inside container network: `mongodb:27017`)
- Admin user: `admin` / password from `MONGO_ADMIN_PASSWORD` env var
- Default database: `dress2mydoor`
- Persistent volume: `mongodb_data`

**Backend** (Node.js + Express)
- Running on `localhost:5000`
- Depends on MongoDB health check
- Auto-restart on failure
- Logs volume: `./logs` mounted locally for inspection

## Stopping & Cleaning Up

```bash
# Stop services
docker-compose down

# Stop and remove volumes (caution: data loss!)
docker-compose down -v

# View logs
docker-compose logs -f backend
docker-compose logs -f mongodb
```

## Build and Push to Container Registry (for cloud deployment)

```bash
# Build image
docker build -t dress2mydoor-backend:latest .

# Tag for registry (e.g., Docker Hub)
docker tag dress2mydoor-backend:latest yourregistry/dress2mydoor-backend:latest

# Push
docker push yourregistry/dress2mydoor-backend:latest
```

## Deploying to Cloud Platforms

### Render.com (Recommended for simplicity)
1. Connect GitHub repo to Render
2. Create new Web Service (connect to repo)
3. Build command: leave blank (uses Dockerfile)
4. Start command: `node server.js`
5. Add environment variables (same as `.env`)
6. For database:
   - Use MongoDB Atlas (cloud) or
   - Use Render's PostgreSQL/MySQL (requires code change)
7. Deploy

### Railway.app
1. Connect GitHub repo
2. Add service from Dockerfile
3. Add MongoDB plugin (or use external MongoDB Atlas)
4. Set environment variables
5. Deploy

### AWS ECS / Docker Hub Registry
1. Build and push image: `docker build -t yourregistry/dress2mydoor:v1 .`
2. Push: `docker push yourregistry/dress2mydoor:v1`
3. Create ECS task definition pointing to image
4. Set environment variables in task definition
5. Create service + load balancer
6. Deploy

### Self-hosted (VPS / Dedicated Server)
1. Install Docker and Docker Compose on server
2. Copy `docker-compose.yml` and `.env.production` to server
3. Run: `docker-compose up -d`
4. Configure reverse proxy (nginx/caddy) for SSL/HTTPS
5. Set up automated backups for MongoDB volumes

## Environment Variables for Production

Create `.env.production` (or set in platform):

```env
NODE_ENV=production
PORT=5000

# MongoDB (use Atlas URI or local via docker-compose)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dress2mydoor
# OR for Docker Compose:
MONGODB_URI=mongodb://admin:strong_password@mongodb:27017/dress2mydoor?authSource=admin

# Email (use production SMTP provider)
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-app-specific-password
ADMIN_EMAIL=admin@dress2mydoor.com

# Frontend URL (where your static site is hosted)
FRONTEND_URL=https://dress2mydoor.com

# Admin token (strong, random secret)
ADMIN_TOKEN=very_strong_random_secret_abc123xyz

# For docker-compose
MONGO_ADMIN_PASSWORD=very_strong_mongo_password
```

## Monitoring & Health Checks

The backend includes:
- **Health endpoint**: `GET /api/health` returns `{"status": "Backend is running"}`
- **Docker health check**: runs `/api/health` every 30s
- **Logs**: available via `docker-compose logs` or mounted `/logs` volume

For production, add:
- Uptime monitoring (UptimeRobot, Pingdom)
- Error logging (Sentry, LogDNA)
- Performance monitoring (New Relic, Datadog)

## Backups

**MongoDB Data**:
```bash
# Backup from running container
docker-compose exec mongodb mongodump --out /backup --authSource admin -u admin -p PASSWORD

# Or use MongoDB Atlas automated backups (recommended for production)
```

**Scheduled backups** (add to crontab or use cloud provider backup):
```bash
# Example cron job
0 2 * * * cd /path/to/project && docker-compose exec -T mongodb mongodump --out /backup --authSource admin -u admin -p PASSWORD
```

## SSL/HTTPS

For production, add a reverse proxy (nginx, Caddy, or cloud provider SSL):

**Nginx example**:
```nginx
server {
    listen 443 ssl;
    server_name api.dress2mydoor.com;
    
    ssl_certificate /etc/letsencrypt/live/api.dress2mydoor.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.dress2mydoor.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Troubleshooting

**MongoDB connection refused**:
- Wait 10s for MongoDB to start (check health check)
- Verify `MONGODB_URI` in `.env`
- Check: `docker-compose logs mongodb`

**Backend container crashing**:
- Check logs: `docker-compose logs backend`
- Verify all required env vars are set
- Check ADMIN_TOKEN and EMAIL credentials

**Port already in use**:
- Change PORT in `.env` or docker-compose.yml
- Or kill process: `lsof -i :5000` then `kill -9 <PID>`

**Email not sending**:
- Verify EMAIL_SERVICE, EMAIL_USER, EMAIL_PASSWORD
- Check firewall/network access to SMTP server
- View logs: `docker-compose logs backend | grep -i email`

## Next Steps

1. **Test locally**: `docker-compose up && node scripts/syncGallery.js --token=YOUR_TOKEN`
2. **Push to registry**: Build and push image to Docker Hub or cloud registry
3. **Deploy to cloud**: Use Render, Railway, or cloud provider's container service
4. **Enable HTTPS**: Set up domain + SSL certificate (Let's Encrypt free)
5. **Monitor**: Add uptime checks and error logging
6. **Backups**: Set up automatic MongoDB backups (Atlas recommended)
7. **Frontend**: Deploy static HTML files to Vercel, Netlify, or S3
