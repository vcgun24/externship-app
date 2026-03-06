const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');

// GET signup page
router.get('/signup', (req, res) => {
  if (req.session.userId) return res.redirect('/student');
  res.send(renderSignup(null, null, {}));
});

// POST signup
router.post('/signup', (req, res) => {
  const { full_name, email, phone, username, password, confirm_password, externship_start, externship_end } = req.body;

  // Validate
  if (!full_name || !email || !username || !password || !confirm_password || !externship_start || !externship_end) {
    return res.send(renderSignup('Please fill in all required fields.', null, req.body));
  }
  if (password !== confirm_password) {
    return res.send(renderSignup('Passwords do not match.', null, req.body));
  }
  if (password.length < 6) {
    return res.send(renderSignup('Password must be at least 6 characters.', null, req.body));
  }
  if (externship_end < externship_start) {
    return res.send(renderSignup('End date must be after start date.', null, req.body));
  }

  const existing = db.prepare(`SELECT id FROM users WHERE username = ?`).get(username.trim().toLowerCase());
  if (existing) return res.send(renderSignup('That username is already taken. Please choose another.', null, req.body));

  const existingEmail = db.prepare(`SELECT id FROM users WHERE email = ? AND role = 'student'`).get(email.trim().toLowerCase());
  if (existingEmail) return res.send(renderSignup('An account with that email already exists.', null, req.body));

  const hash = bcrypt.hashSync(password, 10);
  db.prepare(`
    INSERT INTO users (username, password_hash, full_name, email, phone, role, externship_start, externship_end, approved, is_active)
    VALUES (?, ?, ?, ?, ?, 'student', ?, ?, 0, 1)
  `).run(
    username.trim().toLowerCase(),
    hash,
    full_name.trim(),
    email.trim().toLowerCase(),
    phone?.trim() || null,
    externship_start,
    externship_end
  );

  res.send(renderSignup(null, 'success', {}));
});

function renderSignup(error, success, vals) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Student Sign Up — Externship</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f1f35;
      font-family: 'DM Sans', sans-serif;
      padding: 40px 20px;
      position: relative;
      overflow-x: hidden;
    }
    body::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at 20% 50%, rgba(30,80,160,0.35) 0%, transparent 60%),
                  radial-gradient(ellipse at 85% 15%, rgba(0,150,120,0.2) 0%, transparent 50%);
      pointer-events: none;
    }
    .card {
      background: rgba(255,255,255,0.04);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      padding: 44px 40px;
      width: 100%;
      max-width: 500px;
      position: relative;
      z-index: 1;
    }
    .logo { text-align: center; margin-bottom: 32px; }
    .logo-badge {
      display: inline-flex; align-items: center; justify-content: center;
      width: 60px; height: 60px; background: linear-gradient(135deg, #2563eb, #0ea5e9);
      border-radius: 16px; font-size: 26px; margin-bottom: 14px;
      box-shadow: 0 8px 32px rgba(37,99,235,0.4);
    }
    h1 { font-family: 'DM Serif Display', serif; color: #fff; font-size: 24px; text-align: center; }
    .subtitle { color: rgba(255,255,255,0.45); text-align: center; font-size: 14px; margin-top: 6px; }
    .section-label {
      color: rgba(255,255,255,0.35);
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 24px 0 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .form-group { margin-bottom: 16px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    label { display: block; color: rgba(255,255,255,0.55); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 7px; }
    .required { color: #f87171; }
    input {
      width: 100%; padding: 12px 14px;
      background: rgba(255,255,255,0.07);
      border: 1.5px solid rgba(255,255,255,0.1);
      border-radius: 10px; color: #fff;
      font-size: 14px; font-family: 'DM Sans', sans-serif;
      outline: none; transition: border-color 0.2s, background 0.2s;
    }
    input:focus { border-color: #2563eb; background: rgba(255,255,255,0.1); }
    input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.5); cursor: pointer; }
    .btn {
      width: 100%; padding: 14px; margin-top: 24px;
      background: linear-gradient(135deg, #2563eb, #0ea5e9);
      color: #fff; font-size: 16px; font-weight: 600;
      font-family: 'DM Sans', sans-serif;
      border: none; border-radius: 10px; cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
      box-shadow: 0 4px 20px rgba(37,99,235,0.4);
    }
    .btn:hover { opacity: 0.9; transform: translateY(-1px); }
    .error {
      background: rgba(229,62,62,0.15); border: 1px solid rgba(229,62,62,0.35);
      color: #fc8181; padding: 12px 16px; border-radius: 8px;
      font-size: 14px; margin-bottom: 16px; text-align: center;
    }
    .success-box { text-align: center; padding: 16px 0; }
    .success-icon { font-size: 52px; margin-bottom: 16px; }
    .success-box h2 { font-family: 'DM Serif Display', serif; color: #fff; font-size: 24px; margin-bottom: 10px; }
    .success-box p { color: rgba(255,255,255,0.55); font-size: 15px; line-height: 1.6; }
    .pending-badge {
      display: inline-block; background: rgba(234,179,8,0.2); border: 1px solid rgba(234,179,8,0.4);
      color: #fcd34d; padding: 6px 14px; border-radius: 20px;
      font-size: 13px; font-weight: 600; margin: 16px 0;
    }
    .login-link { text-align: center; margin-top: 22px; }
    .login-link a { color: #60a5fa; font-size: 14px; text-decoration: none; }
    .login-link a:hover { text-decoration: underline; }
    .optional { color: rgba(255,255,255,0.3); font-weight: 400; text-transform: none; font-size: 11px; }
    @media(max-width: 480px) { .form-row { grid-template-columns: 1fr; } .card { padding: 32px 24px; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <div class="logo-badge">🏥</div>
      <h1>Student Sign Up</h1>
      <p class="subtitle">Premiere College Externship Program</p>
    </div>

    ${success === 'success' ? `
      <div class="success-box">
        <div class="success-icon">🎉</div>
        <h2>You're registered!</h2>
        <p>Your account has been created and is waiting for admin approval.</p>
        <div class="pending-badge">⏳ Pending Approval</div>
        <p>You'll be able to log in once your coordinator activates your account. You may want to let them know you signed up!</p>
      </div>
      <div class="login-link"><a href="/login">← Back to Login</a></div>
    ` : `
      ${error ? `<div class="error">${error}</div>` : ''}
      <form method="POST" action="/signup">

        <div class="section-label">Personal Info</div>
        <div class="form-group">
          <label>Full Name <span class="required">*</span></label>
          <input type="text" name="full_name" value="${vals.full_name || ''}" placeholder="Jane Smith" required/>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Email <span class="required">*</span></label>
            <input type="email" name="email" value="${vals.email || ''}" placeholder="jane@email.com" required/>
          </div>
          <div class="form-group">
            <label>Cell Phone <span class="optional">(for alerts)</span></label>
            <input type="tel" name="phone" value="${vals.phone || ''}" placeholder="(626) 555-1234"/>
          </div>
        </div>

        <div class="section-label">Externship Dates</div>
        <div class="form-row">
          <div class="form-group">
            <label>Start Date <span class="required">*</span></label>
            <input type="date" name="externship_start" value="${vals.externship_start || ''}" required/>
          </div>
          <div class="form-group">
            <label>End Date <span class="required">*</span></label>
            <input type="date" name="externship_end" value="${vals.externship_end || ''}" required/>
          </div>
        </div>

        <div class="section-label">Create Your Login</div>
        <div class="form-group">
          <label>Username <span class="required">*</span></label>
          <input type="text" name="username" value="${vals.username || ''}" placeholder="janesmith" autocomplete="username" required/>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Password <span class="required">*</span></label>
            <input type="password" name="password" placeholder="Min. 6 characters" autocomplete="new-password" required/>
          </div>
          <div class="form-group">
            <label>Confirm Password <span class="required">*</span></label>
            <input type="password" name="confirm_password" placeholder="Repeat password" autocomplete="new-password" required/>
          </div>
        </div>

        <button type="submit" class="btn">Create My Account →</button>
      </form>
      <div class="login-link"><a href="/login">Already have an account? Sign in</a></div>
    `}
  </div>
</body>
</html>`;
}

module.exports = router;
