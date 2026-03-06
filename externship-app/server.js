# Copy this file to .env and fill in your values
# NEVER commit .env to version control

# Server
PORT=3000
SESSION_SECRET=change-this-to-a-long-random-string-123456

# Gmail SMTP (use an App Password, not your real password)
# To create an App Password: Google Account > Security > 2-Step Verification > App Passwords
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_NAME=Program Administrator

# Check-in cutoff time (24hr format, default 09:00)
CHECKIN_CUTOFF_HOUR=9
CHECKIN_CUTOFF_MINUTE=0

# App URL (used in SMS messages — set to your public URL when deployed)
APP_URL=http://localhost:3000

# Twilio SMS (get these from https://console.twilio.com)
# Free trial at twilio.com — no credit card needed to start
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX

# Admin cell phone for missed check-in texts (include country code, e.g. +16265551234)
ADMIN_PHONE=+1XXXXXXXXXX
