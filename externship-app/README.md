# Externship Check-In System
**Premiere College — Student Externship Daily Log & Attendance Tracker**

---

## What This App Does

- **Students** log in with their own username/password, select their externship site, enter their check-in time, and add notes. Each submission automatically emails a daily log to the admin.
- **Admin** can add/deactivate students, reset passwords, and view all check-ins filtered by date or student. Students cannot see each other's data.
- **Missed check-in alerts** fire automatically at 9:00 AM (Pacific Time) on weekdays — emailing the student, admin, and their supervisor if they haven't checked in.

---

## Setup Instructions

### Step 1 — Install Node.js
Download and install Node.js (v18 or later): https://nodejs.org

### Step 2 — Download & Install the App
```bash
# Navigate to the app folder
cd externship-app

# Install dependencies
npm install
```

### Step 3 — Configure Your Environment
```bash
# Copy the example env file
cp .env.example .env

# Open .env in a text editor and fill in your values
```

Your `.env` file should look like:
```
PORT=3000
SESSION_SECRET=make-this-a-long-random-string-abc123xyz

GMAIL_USER=yourschool@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

ADMIN_EMAIL=vgunasekera@premierecollege.edu
ADMIN_NAME=Program Administrator
```

### Step 4 — Set Up Gmail App Password
1. Go to your Google Account → **Security**
2. Make sure **2-Step Verification** is ON
3. Search for **"App Passwords"**
4. Create a new App Password (name it "Externship App")
5. Copy the 16-character password into your `.env` as `GMAIL_APP_PASSWORD`

### Step 5 — Set Up Twilio for SMS Alerts
SMS alerts send a text to the student AND your phone when someone misses check-in.

1. Go to **https://twilio.com** and create a free account (no credit card needed)
2. After signing up, go to your **Console Dashboard**
3. Copy your **Account SID** and **Auth Token** into your `.env`
4. Click **"Get a free phone number"** — copy that number into `.env` as `TWILIO_PHONE_NUMBER`
5. Add your own cell phone as `ADMIN_PHONE` (format: `+16265551234`)
6. When adding students in the admin panel, enter their cell phone number to also text them

> ⚠️ **Twilio free trial**: You can only send texts to verified numbers on a trial account. To send to unverified numbers (students), upgrade to a paid account — costs ~$1/month for the phone number + ~$0.0079 per text.

### Step 6 — Start the App
```bash
npm start
```

Visit: **http://localhost:3000**

---

## First Login

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `Admin1234!` |

> ⚠️ **Important:** Change the admin password immediately after your first login by editing the database or adding a password-change route.

---

## Adding Students

1. Log in as admin
2. Go to the **Dashboard**
3. Scroll to **"Add New Student"**
4. Fill in their name, email, username, and a temporary password
5. Optionally add their supervisor's email (will receive missed check-in alerts)
6. Share their username and password with them directly

---

## Deploying to the Internet (Free)

### Option A: Railway (Recommended)
1. Create a free account at https://railway.app
2. Connect your GitHub repo or upload the folder
3. Add your `.env` variables in the Railway dashboard under **Variables**
4. Deploy — Railway gives you a public URL

### Option B: Render
1. Create a free account at https://render.com
2. Create a new **Web Service**
3. Set Build Command: `npm install`
4. Set Start Command: `npm start`
5. Add environment variables in the Render dashboard

---

## File Structure

```
externship-app/
├── server.js           ← Main app entry point + cron job
├── package.json
├── .env.example        ← Copy to .env and fill in values
├── db/
│   └── database.js     ← SQLite setup, tables, seed data
├── middleware/
│   └── auth.js         ← Login protection
├── routes/
│   ├── auth.js         ← Login / logout pages
│   ├── student.js      ← Student check-in page
│   ├── admin.js        ← Admin dashboard + student management
│   └── email.js        ← Email sending (daily logs + alerts)
└── data/
    └── externship.db   ← Auto-created SQLite database (do not delete)
```

---

## Externship Sites (Pre-loaded)
- CORNERSTONE
- QUEEN OF THE VALLEY
- FACE N BODY
- ADVENTIST BEVERLY
- CHINO PREMIER
- RAYMOND RENAISSANCE
- ADVANCED DIAGNOSTIC
- OTHER (student types in custom name)

---

## Need Help?
Contact your IT support or the developer who set this up.
