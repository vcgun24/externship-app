const twilio = require('twilio');

function getClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not set in .env (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)');
  }
  return twilio(accountSid, authToken);
}

// Format a US phone number to E.164 (+1XXXXXXXXXX)
function formatPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

async function sendSMS(to, message) {
  const formatted = formatPhone(to);
  if (!formatted) {
    console.warn(`[SMS] Invalid phone number: ${to}`);
    return false;
  }
  const client = getClient();
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: formatted
  });
  console.log(`[SMS] Sent to ${formatted}`);
  return true;
}

async function sendMissedCheckinSMS({ studentName, studentPhone, adminPhone }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  });

  const results = { studentSent: false, adminSent: false };

  // Text the student
  if (studentPhone) {
    try {
      results.studentSent = await sendSMS(
        studentPhone,
        `Hi ${studentName.split(' ')[0]}, this is a reminder from Premiere College Externship.\n\nYou have NOT checked in yet today (${today}). Please log in and check in as soon as possible.\n\nLogin: ${process.env.APP_URL || 'http://localhost:3000'}`
      );
    } catch (err) {
      console.error(`[SMS] Failed to text student ${studentName}:`, err.message);
    }
  }

  // Text the admin
  if (adminPhone) {
    try {
      results.adminSent = await sendSMS(
        adminPhone,
        `⚠️ MISSED CHECK-IN ALERT\n\nStudent: ${studentName}\nDate: ${today}\n\nThis student has not checked in as of 9:00 AM. Please follow up.\n\n— Premiere College Externship System`
      );
    } catch (err) {
      console.error(`[SMS] Failed to text admin:`, err.message);
    }
  }

  return results;
}

module.exports = { sendMissedCheckinSMS, formatPhone };
