-- Mimi Mail Database Schema

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  bio TEXT,
  is_verified INTEGER DEFAULT 0,
  verification_pin TEXT,
  verification_pin_created_at TIMESTAMP,
  verification_pin_attempts INTEGER DEFAULT 0,
  login_attempts INTEGER DEFAULT 0,
  reset_pin TEXT,
  reset_pin_created_at TIMESTAMP,
  reset_pin_attempts INTEGER DEFAULT 0,
  theme TEXT DEFAULT 'theme-peach',
  dark_mode INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient_id INTEGER NOT NULL,
  message_text TEXT NOT NULL,
  reply_text TEXT,
  is_answered INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  answered_at TIMESTAMP,
  FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages (recipient_id);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);
