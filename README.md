# Mimi Mail

Mimi Mail is a minimalist retro 90s-ui styled anonymous messaging board application. Users can register to claim a unique profile URL, receive anonymous notes from visitors, and reply to them directly from their private inbox to publish them on their public profile board.

---

## Features

* **Retro 90s Desktop Aesthetic**: Nostalgic pixel-art interfaces and custom theme switchers (e.g. peach, windows).
* **Anonymous Letters**: Visitors can send notes (up to 500 characters) anonymously to any user.
* **Owner Inbox**: Dashboard to filter notes (All, Answered, Unanswered) and delete unwanted notes.
* **Public Note Publishing**: Replying to an anonymous note automatically publishes it and your reply onto your public profile.
* **SMTP Email Verification**: Support for email verification OTPs and password resets via secure SMTP.
* **Persistent Rate Limiting**: SQLite-backed rate limiting protecting auth endpoints and note-sending from spam and abuse.

---

## Tech Stack

* **Frontend & Backend**: [Next.js (App Router)](https://nextjs.org/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Database**: [SQLite](https://www.sqlite.org/) (managed locally via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) and in production via [Cloudflare D1 Database](https://developers.cloudflare.com/d1/))
* **Styling**: Vanilla CSS for bespoke retro aesthetics
* **Emails**: [worker-mailer](https://github.com/zou-yu/worker-mailer) (for production Cloudflare Edge SMTP sending) and [Nodemailer](https://nodemailer.com/) (for local development SMTP)
* **Encryption**: [Bcrypt.js](https://github.com/dcodeIO/bcrypt.js) for secure password hashing

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a file named `.env.local` in the root of the project and define the following variables:

```ini
# JWT authentication secret (Required)
JWT_SECRET=your_secret_key

# Gmail SMTP Configuration (Optional - Mock mode is used if empty)
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_generated_app_password
```
> **Note**: Never use your standard Gmail password for `EMAIL_PASS`. Instead, generate a 16-character App Password via *Google Account Security > 2-Step Verification > App Passwords*.

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## Deployment on Cloudflare Pages

Mimi Mail is designed to compile and run on the Cloudflare Edge runtime using Cloudflare Pages Functions and Cloudflare D1.

### 1. Database Setup (Cloudflare D1)
Create a D1 database named `mimi-mail-db` via the Cloudflare dashboard or wrangler:
```bash
npx wrangler d1 create mimi-mail-db
```
Link the generated database ID in `wrangler.json` under `d1_databases`.

### 2. Initialize the Database Schema
Apply the database schema to your production D1 instance:
```bash
npx wrangler d1 execute mimi-mail-db --remote --file=schema.sql
```

### 3. Configure Production Secrets
Set the production environment variables in `wrangler.json` under `"vars"` or through the Cloudflare Pages settings dashboard:
- `EMAIL_USER`
- `EMAIL_PASS`
- `JWT_SECRET`

### 4. Build and Deploy
Build the project using next-on-pages and deploy:
```bash
# Build
npm run build:pages

# Deploy
npx wrangler pages deploy .vercel/output/static --project-name mimi-mail --commit-dirty=true
```

---

## Project Structure

```text
├── public/                 # Static assets
├── schema.sql              # Cloudflare D1 SQL schema script
├── wrangler.json           # Cloudflare Pages and D1 configuration
├── src/
│   ├── app/                # Next.js App Router (Pages, Components & APIs)
│   │   ├── api/            # Authentication, Messages, and Contact endpoints
│   │   ├── dashboard/      # Owner Inbox Dashboard
│   │   ├── u/[username]/   # Visitor note-writing pages
│   │   ├── layout.tsx      # Global layout wrapper
│   │   └── globals.css     # CSS variable themes and layout styling
│   ├── lib/                # Shared utilities
│   │   ├── auth.ts         # JWT Session Creation & Verification
│   │   ├── db.ts           # SQLite connection with D1 fallback
│   │   ├── mail.ts         # worker-mailer (edge) and Nodemailer (dev) transport
│   │   ├── rate-limit.ts   # Sliding-window rate limit checks
│   │   └── date-utils.ts   # UTC timezone normalization
```
```