const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireLogin } = require('../middleware/auth');
const { sendDailyLogEmail } = require('./email');

router.get('/student', requireLogin, (req, res) => {
  if (req.session.role === 'admin') return res.redirect('/admin');

  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.session.userId);
  const sites = db.prepare(`SELECT * FROM sites WHERE is_active = 1 ORDER BY name`).all();
  const today = new Date().toISOString().split('T')[0];

  // Check approval
  if (!user.approved) {
    return res.send(renderStudentPage(user.full_name, sites, null, null, false, '', 'pending'));
  }

  // Check date range
  if (user.externship_start && today < user.externship_start) {
    return res.send(renderStudentPage(user.full_name, sites, null, null, false, '', 'not_started', user.externship_start));
  }
  if (user.externship_end && today > user.externship_end) {
    return res.send(renderStudentPage(user.full_name, sites, null, null, false, '', 'completed', user.externship_end));
  }

  const alreadyCheckedIn = db.prepare(
    `SELECT * FROM checkins WHERE user_id = ? AND checkin_date = ?`
  ).get(req.session.userId, today);

  res.send(renderStudentPage(user.full_name, sites, alreadyCheckedIn, null));
});

router.post('/student/checkin', requireLogin, async (req, res) => {
  if (req.session.role === 'admin') return res.redirect('/admin');

  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.session.userId);
  const { site_id, custom_site_name, checkin_time, notes } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const sites = db.prepare(`SELECT * FROM sites WHERE is_active = 1 ORDER BY name`).all();

  if (!user.approved) return res.send(renderStudentPage(user.full_name, sites, null, null, false, '', 'pending'));
  if (user.externship_start && today < user.externship_start) return res.send(renderStudentPage(user.full_name, sites, null, null, false, '', 'not_started', user.externship_start));
  if (user.externship_end && today > user.externship_end) return res.send(renderStudentPage(user.full_name, sites, null, null, false, '', 'completed', user.externship_end));

  // Check duplicate
  const alreadyCheckedIn = db.prepare(
    `SELECT * FROM checkins WHERE user_id = ? AND checkin_date = ?`
  ).get(req.session.userId, today);

  if (alreadyCheckedIn) {
    return res.send(renderStudentPage(req.session.fullName, sites, alreadyCheckedIn, 'You have already checked in today.'));
  }

  if (!site_id || !checkin_time) {
    return res.send(renderStudentPage(req.session.fullName, sites, null, 'Please select a site and enter your check-in time.'));
  }

  const site = db.prepare(`SELECT * FROM sites WHERE id = ?`).get(site_id);
  const isOther = site && site.name === 'OTHER';

  if (isOther && !custom_site_name?.trim()) {
    return res.send(renderStudentPage(req.session.fullName, sites, null, 'Please enter the site name.'));
  }

  // Save check-in
  const result = db.prepare(`
    INSERT INTO checkins (user_id, site_id, site_custom_name, checkin_time, checkin_date, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.session.userId, site_id, isOther ? custom_site_name.trim() : null, checkin_time, today, notes?.trim() || null);

  // Send email
  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.session.userId);
  const siteName = isOther ? custom_site_name.trim() : site.name;

  try {
    await sendDailyLogEmail({
      studentName: user.full_name,
      studentEmail: user.email,
      siteName,
      checkinTime: checkin_time,
      notes: notes?.trim()
    });
    db.prepare(`UPDATE checkins SET email_sent = 1 WHERE id = ?`).run(result.lastInsertRowid);
  } catch (err) {
    console.error('Email send failed:', err.message);
  }

  const newCheckin = db.prepare(`SELECT * FROM checkins WHERE id = ?`).get(result.lastInsertRowid);
  res.send(renderStudentPage(req.session.fullName, sites, newCheckin, null, true, siteName));
});

function renderStudentPage(fullName, sites, checkin, error, justCheckedIn = false, siteName = '', status = '', statusDate = '') {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>My Check-In — Externship</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { min-height: 100vh; background: #f0f4f9; font-family: 'DM Sans', sans-serif; }
    header {
      background: #0f1f35;
      color: white;
      padding: 18px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .header-icon { font-size: 24px; }
    .header-title { font-family: 'DM Serif Display', serif; font-size: 20px; }
    .header-sub { font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 2px; }
    .logout { color: rgba(255,255,255,0.6); font-size: 13px; text-decoration: none; padding: 6px 14px; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; transition: all 0.2s; }
    .logout:hover { background: rgba(255,255,255,0.1); color: white; }
    .container { max-width: 560px; margin: 40px auto; padding: 0 20px; }
    .date-banner { background: #1a3a5c; color: white; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
    .date-banner .icon { font-size: 22px; }
    .date-text { font-size: 15px; font-weight: 500; }
    .card { background: white; border-radius: 16px; padding: 32px; box-shadow: 0 2px 16px rgba(0,0,0,0.07); }
    .card h2 { font-family: 'DM Serif Display', serif; font-size: 22px; color: #0f1f35; margin-bottom: 24px; }
    .form-group { margin-bottom: 20px; }
    label { display: block; font-size: 13px; font-weight: 600; color: #4a5568; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    select, input[type="time"], textarea {
      width: 100%;
      padding: 12px 14px;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      font-size: 15px;
      font-family: 'DM Sans', sans-serif;
      color: #2d3748;
      outline: none;
      transition: border-color 0.2s;
      background: white;
    }
    select:focus, input[type="time"]:focus, textarea:focus { border-color: #2563eb; }
    textarea { resize: vertical; min-height: 100px; }
    #custom-site-wrap { margin-top: 12px; display: none; }
    .btn-submit {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #2563eb, #0ea5e9);
      color: white;
      font-size: 16px;
      font-weight: 600;
      font-family: 'DM Sans', sans-serif;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      margin-top: 8px;
      transition: opacity 0.2s, transform 0.1s;
      box-shadow: 0 4px 16px rgba(37,99,235,0.3);
    }
    .btn-submit:hover { opacity: 0.9; transform: translateY(-1px); }
    .error { background: #fff5f5; border: 1px solid #fed7d7; color: #c53030; padding: 12px 16px; border-radius: 8px; font-size: 14px; margin-bottom: 20px; }
    .success-card { background: white; border-radius: 16px; padding: 40px 32px; box-shadow: 0 2px 16px rgba(0,0,0,0.07); text-align: center; }
    .success-icon { font-size: 56px; margin-bottom: 16px; }
    .success-card h2 { font-family: 'DM Serif Display', serif; font-size: 26px; color: #0f1f35; margin-bottom: 8px; }
    .success-card p { color: #718096; font-size: 15px; margin-bottom: 24px; }
    .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f0f4f9; font-size: 15px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #718096; font-weight: 500; }
    .detail-value { color: #2d3748; font-weight: 600; text-align: right; max-width: 60%; }
    .email-note { background: #ebf8ff; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #2b6cb0; margin-top: 20px; }
  </style>
  <script>
    function toggleCustomSite(val) {
      document.getElementById('custom-site-wrap').style.display = val === '${sites.find(s=>s.name==='OTHER')?.id}' ? 'block' : 'none';
    }
  </script>
</head>
<body>
  <header>
    <div class="header-left">
      <span class="header-icon">🏥</span>
      <div>
        <div class="header-title">Externship Check-In</div>
        <div class="header-sub">Premiere College</div>
      </div>
    </div>
    <a href="/logout" class="logout">Sign Out</a>
  </header>

  <div class="container">
    <div class="date-banner">
      <span class="icon">📅</span>
      <span class="date-text">${today}</span>
    </div>

    ${status === 'pending' ? `
    <div class="success-card">
      <div class="success-icon">⏳</div>
      <h2>Account Pending Approval</h2>
      <p>Hi ${fullName}! Your account is waiting to be approved by your coordinator.<br/>You'll be able to check in once they activate your account.</p>
    </div>
    ` : status === 'not_started' ? `
    <div class="success-card">
      <div class="success-icon">📅</div>
      <h2>Externship Not Started Yet</h2>
      <p>Hi ${fullName}! Your externship begins on <strong>${new Date(statusDate + 'T12:00:00').toLocaleDateString('en-US', {weekday:'long',month:'long',day:'numeric',year:'numeric'})}</strong>.<br/>Check-in will be available starting that day.</p>
    </div>
    ` : status === 'completed' ? `
    <div class="success-card">
      <div class="success-icon">🎓</div>
      <h2>Externship Completed!</h2>
      <p>Congratulations, ${fullName}! Your externship ended on <strong>${new Date(statusDate + 'T12:00:00').toLocaleDateString('en-US', {weekday:'long',month:'long',day:'numeric',year:'numeric'})}</strong>.<br/>No further check-ins are required. Great work!</p>
    </div>
    ` : checkin && !justCheckedIn ? `
    <div class="success-card">
      <div class="success-icon">✅</div>
      <h2>Already Checked In</h2>
      <p>You've already submitted your check-in for today, ${fullName}.</p>
      <div class="detail-row"><span class="detail-label">Time</span><span class="detail-value">${checkin.checkin_time}</span></div>
      <div class="email-note">📧 Your daily log has been emailed to your coordinator.</div>
    </div>
    ` : justCheckedIn ? `
    <div class="success-card">
      <div class="success-icon">🎉</div>
      <h2>Check-In Successful!</h2>
      <p>Great job, ${fullName}! Your check-in has been recorded.</p>
      <div class="detail-row"><span class="detail-label">Site</span><span class="detail-value">${siteName}</span></div>
      <div class="detail-row"><span class="detail-label">Time</span><span class="detail-value">${checkin.checkin_time}</span></div>
      ${checkin.notes ? `<div class="detail-row"><span class="detail-label">Notes</span><span class="detail-value">${checkin.notes}</span></div>` : ''}
      <div class="email-note">📧 Your daily log has been emailed to your coordinator.</div>
    </div>
    ` : `
    <div class="card">
      <h2>Daily Check-In</h2>
      ${error ? `<div class="error">${error}</div>` : ''}
      <form method="POST" action="/student/checkin">
        <div class="form-group">
          <label for="site_id">Externship Site</label>
          <select id="site_id" name="site_id" required onchange="toggleCustomSite(this.value)">
            <option value="">— Select your site —</option>
            ${sites.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
          </select>
          <div id="custom-site-wrap">
            <input type="text" name="custom_site_name" placeholder="Enter site name..." maxlength="120"/>
          </div>
        </div>
        <div class="form-group">
          <label for="checkin_time">Check-In Time</label>
          <input type="time" id="checkin_time" name="checkin_time" required/>
        </div>
        <div class="form-group">
          <label for="notes">Notes / Comments (optional)</label>
          <textarea id="notes" name="notes" placeholder="Any notes about today's shift..."></textarea>
        </div>
        <button type="submit" class="btn-submit">Submit Check-In →</button>
      </form>
    </div>
    `}
  </div>
</body>
</html>`;
}

module.exports = router;
