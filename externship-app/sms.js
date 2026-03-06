const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const DB_PATH = path.join(dataDir, 'externship.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'student',
    supervisor_email TEXT,
    externship_start TEXT,
    externship_end TEXT,
    approved INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by INTEGER
  );

  CREATE TABLE IF NOT EXISTS sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    site_id INTEGER,
    site_custom_name TEXT,
    checkin_time TEXT NOT NULL,
    checkin_date TEXT NOT NULL DEFAULT (date('now')),
    notes TEXT,
    email_sent INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (site_id) REFERENCES sites(id)
  );

  CREATE TABLE IF NOT EXISTS missed_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    alert_date TEXT NOT NULL,
    sent_at TEXT NOT NULL DEFAULT (datetime('now')),
    sms_sent INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Migrations: add new columns if they don't exist (for existing databases)
try { db.exec(`ALTER TABLE users ADD COLUMN phone TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN externship_start TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN externship_end TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN approved INTEGER NOT NULL DEFAULT 0`); } catch(e) {}

// Seed default sites
const sites = [
  'CORNERSTONE',
  'QUEEN OF THE VALLEY',
  'FACE N BODY',
  'ADVENTIST BEVERLY',
  'CHINO PREMIER',
  'RAYMOND RENAISSANCE',
  'ADVANCED DIAGNOSTIC',
  'OTHER'
];

const insertSite = db.prepare(`INSERT OR IGNORE INTO sites (name) VALUES (?)`);
sites.forEach(s => insertSite.run(s));

// Create default admin if none exists
const adminExists = db.prepare(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`).get();
if (!adminExists) {
  const hash = bcrypt.hashSync('Admin1234!', 10);
  db.prepare(`
    INSERT INTO users (username, password_hash, full_name, email, role)
    VALUES ('admin', ?, 'Program Administrator', 'vgunasekera@premierecollege.edu', 'admin')
  `).run(hash);
  console.log('Default admin created: username=admin, password=Admin1234!');
}

module.exports = db;
