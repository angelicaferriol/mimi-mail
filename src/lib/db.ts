import Database from 'better-sqlite3';
import path from 'path';

// Define DB file location inside the project directory
const dbPath = path.join(process.cwd(), 'mimi_mail.db');

const db = new Database(dbPath);

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

// Safe migrations for existing databases
try {
  db.exec("ALTER TABLE users ADD COLUMN display_name TEXT;");
} catch {
  // Column already exists
}
try {
  db.exec("ALTER TABLE users ADD COLUMN bio TEXT;");
} catch {
  // Column already exists
}
try {
  db.exec("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0;");
} catch {
  // Column already exists
}
try {
  db.exec("ALTER TABLE users ADD COLUMN verification_pin TEXT;");
} catch {
  // Column already exists
}
try {
  db.exec("ALTER TABLE users ADD COLUMN verification_pin_created_at TIMESTAMP;");
} catch {
  // Column already exists
}
try {
  db.exec("ALTER TABLE users ADD COLUMN verification_pin_attempts INTEGER DEFAULT 0;");
} catch {
  // Column already exists
}
try {
  db.exec("ALTER TABLE users ADD COLUMN login_attempts INTEGER DEFAULT 0;");
} catch {
  // Column already exists
}
try {
  db.exec("ALTER TABLE users ADD COLUMN reset_pin TEXT;");
} catch {
  // Column already exists
}
try {
  db.exec("ALTER TABLE users ADD COLUMN reset_pin_created_at TIMESTAMP;");
} catch {
  // Column already exists
}
try {
  db.exec("ALTER TABLE users ADD COLUMN reset_pin_attempts INTEGER DEFAULT 0;");
} catch {
  // Column already exists
}

db.exec(`
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
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages (recipient_id);
`);

export default db;
