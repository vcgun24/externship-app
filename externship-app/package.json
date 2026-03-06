const nodemailer = require('nodemailer');

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
}

async function sendDailyLogEmail({ studentName, studentEmail, siteName, checkinTime, notes }) {
  const transporter = createTransporter();
  const adminEmail = process.env.ADMIN_EMAIL || 'vgunasekera@premierecollege.edu';
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
      <div style="background: #1a3a5c; color: white; padding: 24px;">
        <h2 style="margin:0;">📋 Externship Daily Check-In Log</h2>
        <p style="margin:6px 0 0; opacity:0.8;">${dateStr}</p>
      </div>
      <div style="padding: 24px;">
        <table style="width:100%; border-collapse: collapse;">
          <tr><td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold; width:40%;">Student Name</td><td style="padding:10px; border-bottom:1px solid #eee;">${studentName}</td></tr>
          <tr><td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Externship Site</td><td style="padding:10px; border-bottom:1px solid #eee;">${siteName}</td></tr>
          <tr><td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Check-In Time</td><td style="padding:10px; border-bottom:1px solid #eee;">${checkinTime}</td></tr>
          <tr><td style="padding:10px; font-weight:bold; vertical-align:top;">Notes</td><td style="padding:10px;">${notes || '<em style="color:#999;">No notes provided</em>'}</td></tr>
        </table>
      </div>
      <div style="background: #f5f5f5; padding: 14px 24px; font-size: 12px; color: #888;">
        This is an automated message from the Premiere College Externship Check-In System.
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Externship System" <${process.env.GMAIL_USER}>`,
    to: adminEmail,
    cc: studentEmail,
    subject: `✅ Check-In Log: ${studentName} — ${dateStr}`,
    html
  });
}

async function sendMissedCheckinAlert({ studentName, studentEmail, supervisorEmail }) {
  const transporter = createTransporter();
  const adminEmail = process.env.ADMIN_EMAIL || 'vgunasekera@premierecollege.edu';
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const recipients = [adminEmail];
  if (studentEmail) recipients.push(studentEmail);
  if (supervisorEmail) recipients.push(supervisorEmail);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #e53e3e; border-radius: 8px; overflow: hidden;">
      <div style="background: #e53e3e; color: white; padding: 24px;">
        <h2 style="margin:0;">⚠️ Missed Check-In Alert</h2>
        <p style="margin:6px 0 0; opacity:0.8;">${dateStr}</p>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 16px;">The following student has <strong>not checked in</strong> as of 9:00 AM:</p>
        <div style="background: #fff5f5; border-left: 4px solid #e53e3e; padding: 16px; margin: 16px 0; border-radius: 4px;">
          <p style="margin:0; font-size: 18px; font-weight: bold;">${studentName}</p>
          <p style="margin:4px 0 0; color: #666;">${studentEmail}</p>
        </div>
        <p style="color: #555;">Please follow up with this student to confirm their attendance or address any issues.</p>
      </div>
      <div style="background: #f5f5f5; padding: 14px 24px; font-size: 12px; color: #888;">
        This is an automated alert from the Premiere College Externship Check-In System.
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Externship System" <${process.env.GMAIL_USER}>`,
    to: recipients.join(', '),
    subject: `⚠️ MISSED CHECK-IN: ${studentName} — ${dateStr}`,
    html
  });
}

module.exports = { sendDailyLogEmail, sendMissedCheckinAlert };
