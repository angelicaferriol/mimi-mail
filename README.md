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
* **Database**: [SQLite](https://www.sqlite.org/) (managed locally via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3))
* **Styling**: Vanilla CSS for bespoke retro aesthetics
* **Emails**: [Nodemailer](https://nodemailer.com/) (configured for Gmail SMTP)
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

## Project Structure

```text
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js App Router (Pages, Components & APIs)
│   │   ├── api/            # Authentication, Messages, and Contact endpoints
│   │   ├── dashboard/      # Owner Inbox Dashboard
│   │   ├── u/[username]/   # Visitor note-writing pages
│   │   ├── layout.tsx      # Global layout wrapper
│   │   └── globals.css     # CSS variable themes and layout styling
│   ├── lib/                # Shared utilities
│   │   ├── auth.ts         # JWT Session Creation & Verification
│   │   ├── db.ts           # SQLite connection & table schemas
│   │   ├── mail.ts         # SMTP Nodemailer transport
│   │   ├── rate-limit.ts   # SQLite sliding-window rate limit checks
│   │   └── date-utils.ts   # SQLite UTC timezone normalization
```