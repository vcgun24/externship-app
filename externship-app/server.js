require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'externship-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 8 * 60 * 60 * 1000 } // 8 hour session
}));

// Initialize DB (runs migrations + seeds)
const db = require('./db/database');

// Routes
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/signup'));
app.use('/', require('./routes/student'));
app.use('/', require('./routes/admin'));

// Root redirect
app.get('/', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  res.redirect(req.session.role === 'admin' ? '/admin' : '/student');
});

// ─── Missed Check-In Cron Job ───────────────────────────────────────────────
// Runs every weekday at 9:00 AM Pacific Time
const { sendMissedCheckinAlert } = require('./routes/email');
const { sendMissedCheckinSMS }   = require('./routes/sms');

cron.schedule('0 9 * * 1-5', async () => {
  console.log('[CRON] Running missed check-in check at 9:00 AM');

  const today = new Date().toISOString().split('T')[0];

  // Get all active students whose externship is active today
  const students = db.prepare(`
    SELECT * FROM users
    WHERE role = 'student'
      AND is_active = 1
      AND approved = 1
      AND (externship_start IS NULL OR externship_start <= ?)
      AND (externship_end   IS NULL OR externship_end   >= ?)
  `).all(today, today);

  // Get who has checked in today
  const checkedIn = db.prepare(`
    SELECT user_id FROM checkins WHERE checkin_date = ?
  `).all(today).map(r => r.user_id);

  // Get who already got an alert today
  const alreadyAlerted = db.prepare(`
    SELECT user_id FROM missed_alerts WHERE alert_date = ?
  `).all(today).map(r => r.user_id);

  const missed = students.filter(s => !checkedIn.includes(s.id) && !alreadyAlerted.includes(s.id));

  for (const student of missed) {
    let emailOk = false;
    let smsOk   = false;

    // Send email alert
    try {
      await sendMissedCheckinAlert({
        studentName:     student.full_name,
        studentEmail:    student.email,
        supervisorEmail: student.supervisor_email
      });
      emailOk = true;
    } catch (err) {
      console.error(`[CRON] Email failed for ${student.full_name}:`, err.message);
    }

    // Send SMS alert (student + admin)
    try {
      const result = await sendMissedCheckinSMS({
        studentName:  student.full_name,
        studentPhone: student.phone,
        adminPhone:   process.env.ADMIN_PHONE
      });
      smsOk = result.studentSent || result.adminSent;
    } catch (err) {
      console.error(`[CRON] SMS failed for ${student.full_name}:`, err.message);
    }

    // Record alert (only if at least one method succeeded)
    if (emailOk || smsOk) {
      db.prepare(`
        INSERT INTO missed_alerts (user_id, alert_date, sms_sent)
        VALUES (?, ?, ?)
      `).run(student.id, today, smsOk ? 1 : 0);
      console.log(`[CRON] Alert sent for ${student.full_name} — email:${emailOk} sms:${smsOk}`);
    }
  }
}, {
  timezone: 'America/Los_Angeles'
});

app.listen(PORT, () => {
  console.log(`\n✅ Externship Check-In App running at http://localhost:${PORT}`);
  console.log(`   Default admin login: username=admin, password=Admin1234!`);
  console.log(`   ⚠️  Change the admin password after first login!\n`);
});
