const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { requireAdmin } = require('../middleware/auth');

// Admin Dashboard
router.get('/admin', requireAdmin, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const students = db.prepare(`SELECT * FROM users WHERE role = 'student' ORDER BY approved ASC, full_name`).all();
  const todayCheckins = db.prepare(`
    SELECT c.*, u.full_name, u.email, s.name as site_name
    FROM checkins c
    JOIN users u ON c.user_id = u.id
    LEFT JOIN sites s ON c.site_id = s.id
    WHERE c.checkin_date = ?
    ORDER BY c.checkin_time
  `).all(today);

  const checkedInIds = todayCheckins.map(c => c.user_id);
  // Only show "not checked in" for approved students whose externship is active today
  const notCheckedIn = students.filter(s =>
    s.is_active && s.approved &&
    !checkedInIds.includes(s.id) &&
    (!s.externship_start || s.externship_start <= today) &&
    (!s.externship_end   || s.externship_end   >= today)
  );
  const pendingApproval = students.filter(s => !s.approved);

  res.send(renderAdminDashboard(req.session.fullName, students, todayCheckins, notCheckedIn, pendingApproval, today, null));
});

// Add student
router.post('/admin/students/add', requireAdmin, (req, res) => {
  const { full_name, email, username, password, supervisor_email, phone, externship_start, externship_end } = req.body;

  if (!full_name || !email || !username || !password) {
    return res.redirect('/admin?error=All+fields+required');
  }

  const existing = db.prepare(`SELECT id FROM users WHERE username = ?`).get(username.trim().toLowerCase());
  if (existing) return res.redirect('/admin?error=Username+already+exists');

  const hash = bcrypt.hashSync(password, 10);
  db.prepare(`
    INSERT INTO users (username, password_hash, full_name, email, role, supervisor_email, phone, externship_start, externship_end, approved, created_by)
    VALUES (?, ?, ?, ?, 'student', ?, ?, ?, ?, 1, ?)
  `).run(
    username.trim().toLowerCase(), hash, full_name.trim(), email.trim(),
    supervisor_email?.trim() || null, phone?.trim() || null,
    externship_start || null, externship_end || null,
    req.session.userId
  );

  res.redirect('/admin?success=Student+added+successfully');
});

// Approve student (self-signed up)
router.post('/admin/students/approve/:id', requireAdmin, (req, res) => {
  db.prepare(`UPDATE users SET approved = 1 WHERE id = ? AND role = 'student'`).run(req.params.id);
  res.redirect('/admin?success=Student+approved');
});

// Update student dates
router.post('/admin/students/update-dates/:id', requireAdmin, (req, res) => {
  const { externship_start, externship_end } = req.body;
  db.prepare(`UPDATE users SET externship_start = ?, externship_end = ? WHERE id = ? AND role = 'student'`)
    .run(externship_start || null, externship_end || null, req.params.id);
  res.redirect('/admin?success=Dates+updated');
});

// Toggle student active/inactive
router.post('/admin/students/toggle/:id', requireAdmin, (req, res) => {
  const student = db.prepare(`SELECT * FROM users WHERE id = ? AND role = 'student'`).get(req.params.id);
  if (!student) return res.redirect('/admin');
  db.prepare(`UPDATE users SET is_active = ? WHERE id = ?`).run(student.is_active ? 0 : 1, student.id);
  res.redirect('/admin');
});

// Reset student password
router.post('/admin/students/reset-password/:id', requireAdmin, (req, res) => {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 6) return res.redirect('/admin?error=Password+must+be+at+least+6+characters');
  const hash = bcrypt.hashSync(new_password, 10);
  db.prepare(`UPDATE users SET password_hash = ? WHERE id = ? AND role = 'student'`).run(hash, req.params.id);
  res.redirect('/admin?success=Password+updated');
});

// View all check-ins (admin only)
router.get('/admin/checkins', requireAdmin, (req, res) => {
  const { date, student_id } = req.query;
  let query = `
    SELECT c.*, u.full_name, u.email, s.name as site_name
    FROM checkins c
    JOIN users u ON c.user_id = u.id
    LEFT JOIN sites s ON c.site_id = s.id
    WHERE 1=1
  `;
  const params = [];
  if (date) { query += ` AND c.checkin_date = ?`; params.push(date); }
  if (student_id) { query += ` AND c.user_id = ?`; params.push(student_id); }
  query += ` ORDER BY c.checkin_date DESC, c.checkin_time DESC`;

  const checkins = db.prepare(query).all(...params);
  const students = db.prepare(`SELECT id, full_name FROM users WHERE role = 'student' ORDER BY full_name`).all();

  res.send(renderCheckinHistory(req.session.fullName, checkins, students, date, student_id));
});

function renderAdminDashboard(adminName, students, todayCheckins, notCheckedIn, pendingApproval, today, error) {
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const urlParams = '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Admin Panel — Externship</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f0f4f9; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
    header { background: #0f1f35; color: white; padding: 18px 32px; display: flex; align-items: center; justify-content: space-between; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .header-title { font-family: 'DM Serif Display', serif; font-size: 20px; }
    .header-sub { font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 2px; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .admin-badge { background: rgba(37,99,235,0.4); color: #93c5fd; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .logout { color: rgba(255,255,255,0.6); font-size: 13px; text-decoration: none; padding: 6px 14px; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; }
    .logout:hover { background: rgba(255,255,255,0.1); color: white; }
    nav { background: #1a3a5c; padding: 0 32px; display: flex; gap: 0; }
    nav a { color: rgba(255,255,255,0.6); text-decoration: none; padding: 14px 18px; font-size: 14px; font-weight: 500; border-bottom: 3px solid transparent; transition: all 0.2s; }
    nav a:hover, nav a.active { color: white; border-bottom-color: #2563eb; }
    .container { max-width: 1100px; margin: 0 auto; padding: 32px 20px; }
    .page-header { margin-bottom: 28px; }
    .page-header h1 { font-family: 'DM Serif Display', serif; font-size: 28px; color: #0f1f35; }
    .page-header p { color: #718096; margin-top: 4px; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: white; border-radius: 12px; padding: 20px 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .stat-num { font-family: 'DM Serif Display', serif; font-size: 36px; color: #0f1f35; }
    .stat-label { font-size: 13px; color: #718096; margin-top: 4px; font-weight: 500; }
    .stat-card.green .stat-num { color: #276749; }
    .stat-card.red .stat-num { color: #c53030; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .card { background: white; border-radius: 16px; padding: 28px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .card h2 { font-family: 'DM Serif Display', serif; font-size: 19px; color: #0f1f35; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid #f0f4f9; }
    .checkin-item { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #f0f4f9; gap: 12px; }
    .checkin-item:last-child { border-bottom: none; }
    .avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #0ea5e9); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px; flex-shrink: 0; }
    .checkin-info .name { font-weight: 600; font-size: 14px; color: #2d3748; }
    .checkin-info .meta { font-size: 12px; color: #a0aec0; margin-top: 2px; }
    .time-badge { margin-left: auto; background: #ebf8ff; color: #2b6cb0; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; flex-shrink: 0; }
    .missed-item { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #f0f4f9; gap: 12px; }
    .missed-item:last-child { border-bottom: none; }
    .missed-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #e53e3e, #fc8181); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px; flex-shrink: 0; }
    .missed-badge { margin-left: auto; background: #fff5f5; color: #c53030; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; flex-shrink: 0; }
    .empty-state { text-align: center; padding: 32px 20px; color: #a0aec0; font-size: 14px; }
    .empty-state .icon { font-size: 32px; margin-bottom: 8px; }
    .full-card { margin-bottom: 32px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .form-group { margin-bottom: 16px; }
    label { display: block; font-size: 12px; font-weight: 600; color: #4a5568; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    input[type="text"], input[type="email"], input[type="password"] {
      width: 100%; padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 14px; font-family: 'DM Sans', sans-serif; color: #2d3748; outline: none; transition: border-color 0.2s;
    }
    input:focus { border-color: #2563eb; }
    .btn { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; border: none; transition: all 0.2s; }
    .btn-primary { background: linear-gradient(135deg, #2563eb, #0ea5e9); color: white; box-shadow: 0 2px 8px rgba(37,99,235,0.3); }
    .btn-primary:hover { opacity: 0.9; }
    .btn-danger { background: #fff5f5; color: #c53030; border: 1px solid #fed7d7; }
    .btn-danger:hover { background: #fed7d7; }
    .btn-sm { padding: 6px 12px; font-size: 12px; }
    .alert { padding: 12px 16px; border-radius: 8px; font-size: 14px; margin-bottom: 20px; }
    .alert-success { background: #f0fff4; border: 1px solid #c6f6d5; color: #276749; }
    .alert-error { background: #fff5f5; border: 1px solid #fed7d7; color: #c53030; }
    .student-table { width: 100%; border-collapse: collapse; }
    .student-table th { text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #718096; border-bottom: 2px solid #f0f4f9; }
    .student-table td { padding: 12px 12px; border-bottom: 1px solid #f0f4f9; font-size: 14px; color: #2d3748; vertical-align: middle; }
    .student-table tr:last-child td { border-bottom: none; }
    .status-active { background: #f0fff4; color: #276749; padding: 3px 8px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-inactive { background: #f7fafc; color: #a0aec0; padding: 3px 8px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .actions { display: flex; gap: 6px; flex-wrap: wrap; }
    details summary { cursor: pointer; color: #2563eb; font-size: 13px; font-weight: 600; margin-top: 6px; }
    details { margin-top: 4px; }
    details[open] summary { margin-bottom: 10px; }
    .reset-form { display: flex; gap: 8px; margin-top: 8px; }
    .reset-form input { flex: 1; }
    @media(max-width:768px) { .grid-2 { grid-template-columns: 1fr; } .stats-grid { grid-template-columns: 1fr; } .form-row { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header>
    <div class="header-left">
      <span style="font-size:24px;">🏥</span>
      <div>
        <div class="header-title">Externship Check-In</div>
        <div class="header-sub">Premiere College — Admin Panel</div>
      </div>
    </div>
    <div class="header-right">
      <span class="admin-badge">ADMIN</span>
      <a href="/logout" class="logout">Sign Out</a>
    </div>
  </header>
  <nav>
    <a href="/admin" class="active">Dashboard</a>
    <a href="/admin/checkins">Check-In History</a>
  </nav>

  <div class="container">
    <div class="page-header">
      <h1>Dashboard</h1>
      <p>${dateStr}</p>
    </div>

    ${error ? `<div class="alert alert-error">${error}</div>` : ''}

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-num">${students.filter(s=>s.is_active && s.approved).length}</div>
        <div class="stat-label">Active Students</div>
      </div>
      <div class="stat-card green">
        <div class="stat-num">${todayCheckins.length}</div>
        <div class="stat-label">Checked In Today</div>
      </div>
      <div class="stat-card red">
        <div class="stat-num">${notCheckedIn.length}</div>
        <div class="stat-label">Not Yet Checked In</div>
      </div>
      ${pendingApproval.length > 0 ? `
      <div class="stat-card" style="border-left:4px solid #d97706;">
        <div class="stat-num" style="color:#d97706;">${pendingApproval.length}</div>
        <div class="stat-label">⏳ Awaiting Approval</div>
      </div>` : ''}
    </div>

    <div class="grid-2">
      <div class="card">
        <h2>✅ Checked In Today</h2>
        ${todayCheckins.length === 0 ? `<div class="empty-state"><div class="icon">📋</div>No check-ins yet today.</div>` :
          todayCheckins.map(c => `
            <div class="checkin-item">
              <div class="avatar">${c.full_name.charAt(0)}</div>
              <div class="checkin-info">
                <div class="name">${c.full_name}</div>
                <div class="meta">${c.site_custom_name || c.site_name || 'Unknown site'}</div>
              </div>
              <div class="time-badge">${c.checkin_time}</div>
            </div>
          `).join('')}
      </div>

      <div class="card">
        <h2>⚠️ Not Checked In</h2>
        ${notCheckedIn.length === 0 ? `<div class="empty-state"><div class="icon">🎉</div>All active students have checked in!</div>` :
          notCheckedIn.map(s => `
            <div class="missed-item">
              <div class="missed-avatar">${s.full_name.charAt(0)}</div>
              <div class="checkin-info">
                <div class="name">${s.full_name}</div>
                <div class="meta">${s.email}</div>
              </div>
              <div class="missed-badge">ABSENT</div>
            </div>
          `).join('')}
      </div>
    </div>

    ${pendingApproval.length > 0 ? `
    <div class="card full-card" style="border-left: 4px solid #d97706; margin-bottom:32px;">
      <h2>⏳ Pending Approval (${pendingApproval.length})</h2>
      <p style="color:#718096;font-size:14px;margin-bottom:16px;">These students signed up themselves and are waiting for you to approve them.</p>
      <table class="student-table">
        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Externship Dates</th><th>Signed Up</th><th>Action</th></tr></thead>
        <tbody>
          ${pendingApproval.map(s => `
            <tr>
              <td><strong>${s.full_name}</strong><br/><span style="font-size:12px;color:#a0aec0;">${s.username}</span></td>
              <td>${s.email}</td>
              <td>${s.phone || '—'}</td>
              <td style="font-size:13px;">${s.externship_start ? `${s.externship_start} → ${s.externship_end || '?'}` : '<span style="color:#a0aec0">Not set</span>'}</td>
              <td style="font-size:12px;color:#a0aec0;">${s.created_at.split('T')[0]}</td>
              <td>
                <form method="POST" action="/admin/students/approve/${s.id}" style="display:inline;">
                  <button type="submit" class="btn btn-sm btn-primary">✓ Approve</button>
                </form>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>` : ''}

    <!-- Add Student -->
    <div class="card full-card">
      <h2>➕ Add New Student</h2>
      <form method="POST" action="/admin/students/add">
        <div class="form-row">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" name="full_name" placeholder="Jane Smith" required/>
          </div>
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" name="email" placeholder="jane@email.com" required/>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Username</label>
            <input type="text" name="username" placeholder="janesmith" required/>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" name="password" placeholder="Minimum 6 characters" required/>
          </div>
        </div>
        <div class="form-group">
          <label>Supervisor Email (optional)</label>
          <input type="email" name="supervisor_email" placeholder="supervisor@site.com"/>
        </div>
        <div class="form-group">
          <label>Student Cell Phone <span style="color:#a0aec0;font-weight:400;text-transform:none;">(for missed check-in texts)</span></label>
          <input type="tel" name="phone" placeholder="(626) 555-1234"/>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Externship Start Date</label>
            <input type="date" name="externship_start"/>
          </div>
          <div class="form-group">
            <label>Externship End Date</label>
            <input type="date" name="externship_end"/>
          </div>
        </div>
        <button type="submit" class="btn btn-primary">Add Student</button>
      </form>
    </div>

    <!-- Student List -->
    <div class="card full-card">
      <h2>👥 All Students</h2>
      ${students.length === 0 ? `<div class="empty-state"><div class="icon">👤</div>No students added yet.</div>` : `
      <table class="student-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Cell Phone</th>
            <th>Externship Dates</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${students.map(s => `
            <tr>
              <td><strong>${s.full_name}</strong></td>
              <td>${s.username}</td>
              <td>${s.email}</td>
              <td>${s.phone || '<span style="color:#a0aec0">—</span>'}</td>
              <td style="font-size:13px;">
                ${s.externship_start ? `<span style="color:#276749;">${s.externship_start}</span> → <span style="color:#c53030;">${s.externship_end || '?'}</span>` : '<span style="color:#a0aec0">Not set</span>'}
                <details style="margin-top:6px;">
                  <summary style="cursor:pointer;color:#2563eb;font-size:12px;font-weight:600;">Edit dates</summary>
                  <form method="POST" action="/admin/students/update-dates/${s.id}" style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
                    <input type="date" name="externship_start" value="${s.externship_start || ''}" style="flex:1;min-width:130px;padding:6px 8px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:12px;"/>
                    <input type="date" name="externship_end" value="${s.externship_end || ''}" style="flex:1;min-width:130px;padding:6px 8px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:12px;"/>
                    <button type="submit" class="btn btn-sm btn-primary">Save</button>
                  </form>
                </details>
              </td>
              <td><span class="${s.is_active ? 'status-active' : 'status-inactive'}">${s.is_active ? 'Active' : 'Inactive'}</span></td>
              <td>
                <div class="actions">
                  <form method="POST" action="/admin/students/toggle/${s.id}" style="display:inline;">
                    <button type="submit" class="btn btn-sm ${s.is_active ? 'btn-danger' : 'btn-primary'}">${s.is_active ? 'Deactivate' : 'Activate'}</button>
                  </form>
                  <details>
                    <summary>Reset Password</summary>
                    <form method="POST" action="/admin/students/reset-password/${s.id}" class="reset-form">
                      <input type="password" name="new_password" placeholder="New password" minlength="6" required/>
                      <button type="submit" class="btn btn-sm btn-primary">Save</button>
                    </form>
                  </details>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>`}
    </div>
  </div>
</body>
</html>`;
}

function renderCheckinHistory(adminName, checkins, students, filterDate, filterStudentId) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Check-In History — Admin</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f0f4f9; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
    header { background: #0f1f35; color: white; padding: 18px 32px; display: flex; align-items: center; justify-content: space-between; }
    .header-title { font-family: 'DM Serif Display', serif; font-size: 20px; }
    .header-sub { font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 2px; }
    .admin-badge { background: rgba(37,99,235,0.4); color: #93c5fd; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .logout { color: rgba(255,255,255,0.6); font-size: 13px; text-decoration: none; padding: 6px 14px; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; }
    nav { background: #1a3a5c; padding: 0 32px; display: flex; }
    nav a { color: rgba(255,255,255,0.6); text-decoration: none; padding: 14px 18px; font-size: 14px; font-weight: 500; border-bottom: 3px solid transparent; transition: all 0.2s; }
    nav a:hover, nav a.active { color: white; border-bottom-color: #2563eb; }
    .container { max-width: 1100px; margin: 0 auto; padding: 32px 20px; }
    .card { background: white; border-radius: 16px; padding: 28px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 24px; }
    h1 { font-family: 'DM Serif Display', serif; font-size: 28px; color: #0f1f35; margin-bottom: 6px; }
    .filter-row { display: flex; gap: 14px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 24px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 12px; font-weight: 600; color: #4a5568; text-transform: uppercase; letter-spacing: 0.5px; }
    select, input[type="date"] { padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 14px; font-family: 'DM Sans', sans-serif; color: #2d3748; outline: none; }
    select:focus, input[type="date"]:focus { border-color: #2563eb; }
    .btn { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; border: none; background: linear-gradient(135deg, #2563eb, #0ea5e9); color: white; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 10px 14px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #718096; border-bottom: 2px solid #f0f4f9; }
    td { padding: 13px 14px; border-bottom: 1px solid #f0f4f9; font-size: 14px; color: #2d3748; }
    tr:last-child td { border-bottom: none; }
    .notes-cell { max-width: 200px; color: #718096; font-style: italic; font-size: 13px; }
    .empty { text-align: center; padding: 40px; color: #a0aec0; font-size: 14px; }
  </style>
</head>
<body>
  <header>
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="font-size:24px;">🏥</span>
      <div>
        <div class="header-title">Externship Check-In</div>
        <div class="header-sub">Premiere College — Admin Panel</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:12px;">
      <span class="admin-badge">ADMIN</span>
      <a href="/logout" class="logout">Sign Out</a>
    </div>
  </header>
  <nav>
    <a href="/admin">Dashboard</a>
    <a href="/admin/checkins" class="active">Check-In History</a>
  </nav>

  <div class="container">
    <h1>Check-In History</h1>
    <p style="color:#718096;margin-bottom:24px;">Full visibility of all student check-ins.</p>

    <div class="card">
      <form method="GET" action="/admin/checkins">
        <div class="filter-row">
          <div class="form-group">
            <label>Filter by Date</label>
            <input type="date" name="date" value="${filterDate || ''}"/>
          </div>
          <div class="form-group">
            <label>Filter by Student</label>
            <select name="student_id">
              <option value="">All Students</option>
              ${students.map(s => `<option value="${s.id}" ${String(filterStudentId) === String(s.id) ? 'selected' : ''}>${s.full_name}</option>`).join('')}
            </select>
          </div>
          <button type="submit" class="btn">Apply Filters</button>
          <a href="/admin/checkins" style="align-self:flex-end;padding:10px 16px;font-size:14px;color:#718096;text-decoration:none;">Clear</a>
        </div>
      </form>

      ${checkins.length === 0 ? `<div class="empty">No check-ins found for the selected filters.</div>` : `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Student</th>
            <th>Site</th>
            <th>Check-In Time</th>
            <th>Notes</th>
            <th>Email Sent</th>
          </tr>
        </thead>
        <tbody>
          ${checkins.map(c => `
            <tr>
              <td>${c.checkin_date}</td>
              <td><strong>${c.full_name}</strong><br/><span style="font-size:12px;color:#a0aec0;">${c.email}</span></td>
              <td>${c.site_custom_name || c.site_name || '—'}</td>
              <td>${c.checkin_time}</td>
              <td class="notes-cell">${c.notes || '—'}</td>
              <td>${c.email_sent ? '✅' : '❌'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`}
    </div>
  </div>
</body>
</html>`;
}

module.exports = router;
