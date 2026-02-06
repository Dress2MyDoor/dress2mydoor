# Dress2MyDoor Backend Setup Guide

## System Architecture

This backend system uses:
- **Express.js** - Web server and API framework
- **MongoDB** - NoSQL database
- **Nodemailer** - Email service for confirmations
- **CORS** - Cross-origin requests for frontend

## Prerequisites

Before starting, ensure you have:
- **Node.js** (v14+) - [Download](https://nodejs.org/)
- **MongoDB Atlas Account** - [Sign up free](https://www.mongodb.com/cloud/atlas) (recommended for cloud)

## Setup Instructions

### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `express` - Web framework
- `mongoose` - MongoDB driver
- `cors` - Cross-origin support
- `dotenv` - Environment variables
- `nodemailer` - Email sending

### Step 2: Configure Environment Variables

Create a `.env` file in the root directory with your configuration:

```bash
cp .env.example .env
```

Edit `.env` and update these values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dress2mydoor
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
ADMIN_EMAIL=admin@dress2mydoor.com
FRONTEND_URL=http://localhost:3000
```

#### Email Configuration (Gmail Example)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Find "App passwords" (only visible if 2FA is enabled)
   - Select "Mail" and "Windows Computer"
   - Copy the generated 16-character password
3. **Add to .env**:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=abcd efgh ijkl mnop
   ```

#### MongoDB Atlas Setup

**Step 1: Create a MongoDB Atlas Cluster**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign in or create an account (free tier available)
3. Click **Build a Cluster** → Select **Free** tier
4. Choose a cloud provider and region (AWS recommended)
5. Click **Create Cluster** and wait ~3 minutes

**Step 2: Create Database User**
1. In Atlas, go to **Security** → **Database Access**
2. Click **Add New Database User**
3. Choose **Password** authentication
4. Enter username (e.g., `dress2mydoor_user`)
5. Enter a strong password (save it!)
6. Click **Add User**

**Step 3: Whitelist Your IP**
1. Go to **Security** → **Network Access**
2. Click **Add IP Address**
3. Choose **Add Current IP Address** (your dev machine) or **0.0.0.0/0** for development
4. Click **Confirm**

**Step 4: Get Connection String**
1. Go to **Clusters** → Click **Connect**
2. Click **Connect your application**
3. Select **Node.js** and version **3.6 or later**
4. Copy the connection string (example):
   ```
   mongodb+srv://dress2mydoor_user:MyPassword123@cluster0.abcd123.mongodb.net/dress2mydoor?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your database user password
6. If your password contains special characters, URL-encode them (e.g., `@` → `%40`, `#` → `%23`)

**Step 5: Add to .env**
```env
MONGODB_URI=mongodb+srv://dress2mydoor_user:MyPassword123@cluster0.abcd123.mongodb.net/dress2mydoor?retryWrites=true&w=majority
```

**Troubleshooting Connection Issues:**
- **MongoServerSelectionError**: IP not whitelisted. Re-check Network Access whitelist.
- **Authentication failed**: Wrong username or password. Verify exact string from Atlas.
- **DNS/SRV errors**: Ensure your ISP/network doesn't block SRV lookups (rare).

### Step 3: Verify Environment Configuration

Your `.env` file should now look like:
```env
PORT=5000
MONGODB_URI=mongodb+srv://dress2mydoor_user:YourPassword@cluster0.abcd123.mongodb.net/dress2mydoor?retryWrites=true&w=majority
EMAIL_SERVICE=hotmail
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-app-specific-password
ADMIN_EMAIL=your-email@outlook.com
FRONTEND_URL=http://127.0.0.1:5500
```

**Important**: Do NOT commit `.env` to Git. Add it to `.gitignore`.

### Step 4: Start the Backend Server & Seed Database

```bash
# From project root directory
cd "c:\Users\Dom_P\OneDrive\Documents\Dress2MyDoorDigitalisation"

# Install dependencies (first time only)
npm install

# Start server in development mode (auto-reload)
npm run dev
```

You should see:
```
Connected to MongoDB
Server running on http://localhost:5000
Endpoints available:
  GET  /api/dresses
  POST /api/bookings
  POST /api/contact
  GET  /api/health
```

**In a new terminal, seed the database:**

First, ensure `ADMIN_TOKEN` is set in your `.env`:
```env
ADMIN_TOKEN=your-secret-admin-token-12345
```

Then seed using one of these methods:

**Option 1: Using npm script (recommended)**
```bash
npm run sync:gallery --token=your-secret-admin-token-12345
```

**Option 2: Using curl with token header**
```bash
curl -X POST http://localhost:5000/api/dresses/seed \
  -H "Authorization: Bearer your-secret-admin-token-12345"
```

**Option 3: Using the CLI directly**
```bash
node scripts/syncGallery.js --token=your-secret-admin-token-12345
```

Response (success):
```json
{
  "message": "Dresses seeded successfully",
  "count": 6
}
```

Response (missing token):
```json
{
  "error": "Missing admin credentials"
}
```

### Step 5: Verify Backend is Running

**Test health check:**
```bash
curl http://localhost:5000/api/health
```

Response:
```json
{"status": "Backend is running"}
```

**Test database connection:**
```bash
curl http://localhost:5000/api/dresses
```

Should return the seeded dresses as JSON.

## API Endpoints

### Dresses

**GET /api/dresses**
- Fetch all dresses with optional filters
- Query parameters: `type`, `size`, `colour`
- Example: `/api/dresses?type=wedding&colour=white`

**GET /api/dresses/:id**
- Fetch single dress by ID

### Bookings

**POST /api/bookings**
- Create booking request
- Body:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+44 123 456 7890",
    "date": "2024-02-15",
    "time": "18:00",
    "message": "Looking for a wedding dress"
  }
  ```

**GET /api/bookings** (admin)
- List all bookings

**GET /api/bookings/:id** (admin)
- Get specific booking

**PATCH /api/bookings/:id** (admin)
- Update booking status
- Body: `{ "status": "confirmed" }`

### Contact

**POST /api/contact**
- Submit contact form
- Body:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+44 987 654 3210",
    "message": "Question about rental terms"
  }
  ```

**GET /api/contact** (admin)
- List all contact submissions

**PATCH /api/contact/:id** (admin)
- Update submission status
- Body: `{ "status": "read" }`

## Testing the API

### Check Backend Health
```bash
curl http://localhost:5000/api/health
```

### Get All Dresses
```bash
curl http://localhost:5000/api/dresses
```

### Submit a Booking
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+44 123 456 7890",
    "date": "2024-02-15",
    "time": "18:00",
    "message": "Test booking"
  }'
```

### Submit Contact Form
```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+44 123 456 7890",
    "message": "Test message"
  }'
```

## Frontend Integration

The frontend (`app.js`) automatically connects to the backend at `http://localhost:5000/api`.

**To test locally:**

1. Start the backend server (steps above)
2. Open the frontend HTML files in your browser

The frontend will:
- Load dresses from `/api/dresses`
- Submit bookings to `/api/bookings`
- Submit contact forms to `/api/contact`
- Receive automatic confirmation emails

## Deployment

### Deploy to Heroku

```bash
# Install Heroku CLI (if not already installed)
npm install -g heroku

# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/dress2mydoor?retryWrites=true&w=majority"
heroku config:set EMAIL_USER=your-email@outlook.com
heroku config:set EMAIL_PASSWORD=your-app-password
heroku config:set ADMIN_EMAIL=your-email@outlook.com
heroku config:set FRONTEND_URL=https://your-frontend-domain.com

# Deploy
git push heroku main
```

### Deploy to Railway, Render, or Other Cloud Services

1. Create an account on [Railway](https://railway.app), [Render](https://render.com), or similar
2. Create a new project and connect your GitHub repo
3. Add environment variables in the platform's dashboard (same as `.env` values)
4. Set `PORT` to whatever the platform assigns (usually auto-detected)
5. Update `API_BASE_URL` in `app.js` to your deployed backend URL:
   ```javascript
   const API_BASE_URL = 'https://your-app-name.herokuapp.com/api';
   ```
6. Redeploy frontend with updated API URL

## Troubleshooting

### "MongoServerSelectionError" or "Cannot connect to MongoDB"
- **Check MongoDB Atlas status**: Go to Atlas → Clusters → verify cluster is running (green icon)
- **IP Whitelist**: Security → Network Access → ensure your current IP is whitelisted
  - If unsure, temporarily add `0.0.0.0/0` (dev only)
- **Connection string**: Copy from Atlas again and verify `username:password` are correct
- **Special characters in password**: If your password has `@#$%&`, URL-encode it (e.g., `@` → `%40`)
- **Check server logs**: Look at terminal running `npm run dev` for the exact error

### "Email not sending"
- Verify `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`
- For Outlook/Hotmail: Generate an [app-specific password](https://account.microsoft.com/account/manage-my-microsoft-account)
- For Gmail: Enable 2FA and generate [app password](https://myaccount.google.com/apppasswords)
- Check server logs for SMTP errors

### "CORS errors" in frontend
- Backend CORS is enabled for all origins by default
- Ensure `FRONTEND_URL` in `.env` matches your frontend server URL
- To restrict to specific origin, modify `server.js`:
  ```javascript
  app.use(cors({
    origin: 'http://localhost:5500'
  }));
  ```

### "Port 5000 already in use"
- Change `PORT` in `.env` to another port (e.g., 5001)
- Or kill the process using that port (platform-specific)

### "Port already in use"
- Change `PORT` in `.env` to an available port (e.g., 5001)
- Or kill the process on port 5000:
  - **Windows**: `netstat -ano | findstr :5000` then `taskkill /PID <PID>`
  - **Mac/Linux**: `lsof -i :5000` then `kill -9 <PID>`

## Database Schema

### Dress
```javascript
{
  id: Number,
  name: String,
  price: Number,
  type: String (enum: ['wedding', 'casual', 'evening', 'cocktail', 'party', 'prom']),
  sizes: [String] (enum: ['xs', 's', 'm', 'l', 'xl']),
  colour: String,
  image: String,
  createdAt: Date
}
```

### Booking
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  date: Date,
  time: String,
  message: String,
  status: String (enum: ['pending', 'confirmed', 'cancelled']),
  createdAt: Date
}
```

### ContactSubmission
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  message: String,
  status: String (enum: ['unread', 'read', 'replied']),
  createdAt: Date
}
```

## Support

For issues or questions, check:
- Express.js docs: https://expressjs.com/
- MongoDB docs: https://docs.mongodb.com/
- Mongoose docs: https://mongoosejs.com/
- Nodemailer docs: https://nodemailer.com/
