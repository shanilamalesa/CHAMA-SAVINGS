# Chama Savings Bot - Setup Guide

A complete guide to set up and deploy the Chama Savings Bot.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Creating a New Telegram Bot](#creating-a-new-telegram-bot)
3. [Environment Setup](#environment-setup)
4. [Database Setup](#database-setup)
5. [Running Locally](#running-locally)
6. [Deployment](#deployment)

---

## Prerequisites

Before you start, you'll need:

- **Node.js** 18+ and npm
- **PostgreSQL** 12+ (local or cloud instance)
- **Telegram Account** (to create a bot)
- **M-Pesa Account** (for Daraja API access, if using payments)

### Install Node.js and PostgreSQL

**macOS (using Homebrew):**
```bash
brew install node postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql postgresql-contrib
sudo service postgresql start
```

**Windows:**
- Download Node.js from https://nodejs.org/
- Download PostgreSQL from https://www.postgresql.org/download/windows/

---

## Creating a New Telegram Bot

### Step 1: Talk to BotFather

1. Open Telegram and search for **@BotFather**
2. Click **Start** and send `/newbot`
3. Follow the prompts:
   - **Name**: e.g., "Chama Savings Bot"
   - **Username**: e.g., "chamaSavingsBot_yourname" (must be unique)
4. BotFather will respond with:
   ```
   Done! Congratulations on your new bot. You will find it at 
   t.me/chamaSavingsBot_yourname
   
   Use this token to access the HTTP API:
   123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
   ```

**Save this token!** You'll need it for the `.env` file.

### Step 2: Get Your Bot Username

From BotFather's response, your bot username is `chamaSavingsBot_yourname`.

### Step 3: Enable Payments (Optional)

If you want to accept payments, send `/mybots` to BotFather and enable payments.

---

## Environment Setup

### 1. Clone or Initialize Your Project

```bash
cd /path/to/chama-savings-bot
npm install
```

### 2. Fill in `.env` File

Copy the template and fill in your values:

```bash
cp .env.example .env  # (or edit the existing .env)
```

Edit `.env` with your credentials:

```env
# Telegram Bot (from BotFather)
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_BOT_USERNAME=chamaSavingsBot_yourname

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/chama_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chama_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Redis (optional, for sessions)
REDIS_URL=redis://localhost:6379

# M-Pesa Daraja API (if using payments)
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_BUSINESS_SHORTCODE=123456
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/webhook/mpesa

# Server
PORT=3000
NODE_ENV=development
PUBLIC_URL=http://localhost:3000

# JWT
JWT_SECRET=your_random_secret_key_here
```

**Never commit `.env` to git!** It contains secrets.

---

## Database Setup

### 1. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database (in psql prompt)
CREATE DATABASE chama_db;
```

Or using a single command:

```bash
createdb -U postgres chama_db
```

### 2. Run Migrations

```bash
npm run db:migrate
```

This will:
- Create all tables (chamas, members, contributions, etc.)
- Create indexes for performance
- Set up the outbox for async processing

**Check it worked:**

```bash
psql -U postgres -d chama_db -c "\dt"
```

You should see these tables:
- `chamas`
- `chama_members`
- `cycles`
- `contributions`
- `fines`
- `payouts`
- `outbox`
- `dashboard_sessions`
- `member_onboarding`
- `cron_runs`

---

## Running Locally

### 1. Start the Bot & Server

```bash
npm run dev
```

You should see:
```
🚀 Starting Chama Savings Bot...
✓ Next.js ready
✓ Telegram bot initialized
✓ Bot handlers registered
✅ Server running on http://localhost:3000
   Bot is polling for messages...
```

### 2. Test the Bot in Telegram

1. Open Telegram and go to your bot (t.me/chamaSavingsBot_yourname)
2. Click **Start**
3. Type `/help` to see all commands

### 3. Create Your First Chama

1. Create a Telegram group (e.g., "Kilimani Chama")
2. Add your bot to the group
3. Make yourself an admin
4. Run in the group:
   ```
   /setup "Kilimani Chama" 1000 1
   ```
   - Name: Kilimani Chama
   - Amount: KSh 1000 per cycle
   - Cycle day: 1 (of each month)

### 4. Test Member Flow

1. Have another user (or test account) run `/join` in the group
2. They'll get a private message asking for their phone
3. They reply with: `0712345678` (or `+254712345678`)
4. They're now a member!
5. Run `/balance` to check their status
6. Run `/stats` to see group progress

---

## Deployment

### Option 1: Fly.io (Recommended)

**Install Fly CLI:**
```bash
curl -L https://fly.io/install.sh | sh
```

**Initialize:**
```bash
fly launch
```

**Set Environment Variables:**
```bash
fly secrets set TELEGRAM_BOT_TOKEN=your_token
fly secrets set DATABASE_URL=your_postgres_url
# ... set all other .env variables
```

**Deploy:**
```bash
fly deploy
```

**View Logs:**
```bash
fly logs
```

### Option 2: Railway.app

1. Go to railway.app and sign up
2. Create new project
3. Add PostgreSQL plugin
4. Connect your GitHub repo (or use Railway CLI)
5. Set environment variables
6. Deploy

### Option 3: Heroku

**Deprecated** - Heroku removed free tier, but you can follow the general pattern:

```bash
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set TELEGRAM_BOT_TOKEN=your_token
git push heroku main
```

---

## Webhook Setup (Advanced)

If instead of polling you want to use webhooks (faster):

### 1. Generate SSL Certificate

```bash
openssl req -newkey rsa:2048 -sha256 -nodes -keyout private.key -x509 -days 365 -out cert.pem
```

### 2. Set Webhook

```bash
curl -X POST "https://api.telegram.org/bot{TOKEN}/setWebhook" \
  -F "url=https://yourdomain.com/webhook/telegram" \
  -F "certificate=@cert.pem"
```

### 3. Verify

```bash
curl "https://api.telegram.org/bot{TOKEN}/getWebhookInfo"
```

---

## Troubleshooting

### Bot doesn't respond

1. Check TELEGRAM_BOT_TOKEN is correct
2. Check bot is polling: `npm run dev` should show "Bot is polling"
3. Check bot was added to group correctly
4. Try `/help` command

### Database connection error

1. Check PostgreSQL is running: `pg_isready`
2. Check DATABASE_URL is correct
3. Check database exists: `psql -l`
4. Run migrations again: `npm run db:migrate`

### Port 3000 already in use

```bash
# Change port in .env
PORT=3001

# Or kill the process
lsof -i :3000
kill -9 <PID>
```

---

## Next Steps

1. **Customize**: Edit bot commands in `server/services/chama/commands/`
2. **Add M-Pesa**: Integrate with mctaba-payments package
3. **Setup Cron**: Configure cycle processing, fines, reminders
4. **Deploy**: Follow deployment guide above
5. **Monitor**: Set up error tracking (Sentry, LogRocket)

---

## File Structure

```
chama-savings-bot/
├── app/                          # Next.js frontend
│   ├── api/auth/                 # Auth endpoints
│   ├── treasurer/                # Treasurer dashboard
│   ├── lib/                       # Shared utilities
│   ├── layout.js                 # Root layout
│   └── page.js                   # Home page
├── server/                        # Express + Bot backend
│   ├── bot/                       # Bot handler
│   ├── config/                    # Database config
│   ├── db/                        # Migrations
│   ├── services/
│   │   ├── chama/                # Chama logic
│   │   │   ├── commands/         # Bot commands
│   │   │   ├── chamaService.js   # Business logic
│   │   │   └── chamaRepo.js      # Database queries
│   │   └── telegram.service.js   # Telegram helpers
│   ├── routes/                    # API routes
│   ├── workers/                   # Background jobs
│   ├── cron/                      # Scheduled tasks
│   └── index.js                  # Main server
├── .env                           # Environment variables (DO NOT COMMIT)
├── package.json
├── next.config.js
├── tailwind.config.js
└── SETUP.md                       # This file
```

---

## Common Commands

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Build for production
npm run build
npm start

# Database migration
npm run db:migrate

# Linting
npm run lint
```

---

## Support

For issues:
1. Check the documentation at the top of each file
2. Look at example usage in commands/
3. Check server logs: `npm run dev`
4. Check database: `psql -d chama_db`

Happy chama-ing! 🇰🇪
