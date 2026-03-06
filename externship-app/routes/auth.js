const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');

router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect(req.session.role === 'admin' ? '/admin' : '/student');
  res.send(renderLogin(null));
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.send(renderLogin('Please enter username and password.'));

  const user = db.prepare(`SELECT * FROM users WHERE username = ? AND is_active = 1`).get(username.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.send(renderLogin('Invalid username or password.'));
  }

  if (user.role === 'student' && !user.approved) {
    return res.send(renderLogin('Your account is pending approval by your coordinator. Please check back soon.'));
  }

  req.session.userId = user.id;
  req.session.role = user.role;
  req.session.fullName = user.full_name;

  if (user.role === 'admin') return res.redirect('/admin');
  return res.redirect('/student');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

function renderLogin(error) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Externship Check-In — Login</title>
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
      position: relative;
      overflow: hidden;
    }
    body::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at 30% 50%, rgba(30,80,160,0.35) 0%, transparent 60%),
                  radial-gradient(ellipse at 80% 20%, rgba(0,150,120,0.2) 0%, transparent 50%);
    }
    .card {
      background: rgba(255,255,255,0.04);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      padding: 48px 40px;
      width: 100%;
      max-width: 420px;
      position: relative;
      z-index: 1;
    }
    .logo {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px; height: 64px;
      background: linear-gradient(135deg, #2563eb, #0ea5e9);
      border-radius: 16px;
      font-size: 28px;
      margin-bottom: 16px;
      box-shadow: 0 8px 32px rgba(37,99,235,0.4);
    }
    h1 {
      font-family: 'DM Serif Display', serif;
      color: #fff;
      font-size: 26px;
      text-align: center;
      line-height: 1.2;
    }
    .subtitle {
      color: rgba(255,255,255,0.5);
      text-align: center;
      font-size: 14px;
      margin-top: 6px;
    }
    .form-group { margin-top: 22px; }
    label { display: block; color: rgba(255,255,255,0.6); font-size: 13px; font-weight: 500; margin-bottom: 8px; letter-spacing: 0.5px; text-transform: uppercase; }
    input {
      width: 100%;
      padding: 13px 16px;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 10px;
      color: #fff;
      font-size: 15px;
      font-family: 'DM Sans', sans-serif;
      transition: border-color 0.2s, background 0.2s;
      outline: none;
    }
    input:focus { border-color: #2563eb; background: rgba(255,255,255,0.1); }
    .btn {
      width: 100%;
      padding: 14px;
      margin-top: 28px;
      background: linear-gradient(135deg, #2563eb, #0ea5e9);
      color: #fff;
      font-size: 16px;
      font-weight: 600;
      font-family: 'DM Sans', sans-serif;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
      box-shadow: 0 4px 20px rgba(37,99,235,0.4);
    }
    .btn:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn:active { transform: translateY(0); }
    .error {
      background: rgba(229,62,62,0.15);
      border: 1px solid rgba(229,62,62,0.4);
      color: #fc8181;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      margin-top: 20px;
      text-align: center;
    }
    .footer-note {
      text-align: center;
      color: rgba(255,255,255,0.25);
      font-size: 12px;
      margin-top: 28px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <div class="logo-badge">🏥</div>
      <h1>Externship Check-In</h1>
      <p class="subtitle">Premiere College</p>
    </div>
    ${error ? `<div class="error">${error}</div>` : ''}
    <form method="POST" action="/login">
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" placeholder="Enter your username" autocomplete="username" required/>
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" placeholder="Enter your password" autocomplete="current-password" required/>
      </div>
      <button type="submit" class="btn">Sign In</button>
    </form>
    <p class="footer-note">Contact your administrator if you need access.</p>
    <p style="text-align:center;margin-top:14px;"><a href="/signup" style="color:#60a5fa;font-size:14px;text-decoration:none;">New student? Sign up here →</a></p>
  </div>
</body>
</html>`;
}

module.exports = router;
