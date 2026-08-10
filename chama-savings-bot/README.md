# Chama Savings Bot 💰

A complete Telegram bot platform for managing Kenyan savings groups (chamas). Members contribute via M-Pesa, track balances, and treasurers manage cycles - all in Telegram and a web dashboard.

## Features

- 🤖 **Telegram Bot Interface** - Members interact entirely in Telegram
- 💳 **M-Pesa Payments** - Secure STK Push contributions
- 📊 **Live Tracking** - Real-time balances and group progress
- ⚠️ **Automatic Fines** - Late fees calculated instantly
- 📈 **Treasurer Dashboard** - Web interface for group management
- 🔔 **Smart Reminders** - Cycle reminders and late payment alerts
- ⚡ **Async Processing** - Outbox pattern for reliable events

## Quick Start

### 1. Create a Telegram Bot

Follow the [detailed bot creation guide](SETUP.md#creating-a-new-telegram-bot), or quick version:

1. Message **@BotFather** on Telegram
2. Send `/newbot`
3. Choose a name (e.g., "Chama Savings Bot")
4. Choose a username (must be unique, e.g., `chamaSavingsBot_yourname`)
5. Save the token you receive

### 2. Setup Project

```bash
# Clone/setup
git clone <repo> chama-savings-bot
cd chama-savings-bot

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your Telegram token and database URL
```

### 3. Setup Database

```bash
# Create PostgreSQL database
createdb chama_db

# Run migrations
npm run db:migrate
```

### 4. Run Locally

```bash
npm run dev
```

Visit http://localhost:3000 and test `/help` in your bot.

---

## Commands Reference

### Setup (Group Admin Only)

```
/setup <name> <amount_ksh> <cycle_day>
```

Example: `/setup "Kilimani Chama" 1000 1`

Sets up a new chama with:
- `name`: Group display name
- `amount_ksh`: Monthly contribution (e.g., 1000 = KSh 1000)
- `cycle_day`: Day of month cycle ends (1-28)

### Membership

```
/join                    - Register for a chama
/members                 - See member status (treasurer only)
```

### Contributions

```
/contribute              - Make an M-Pesa payment
/balance                 - Check your balance (private)
/stats                   - See group progress (public)
```

### Management

```
/dashboard               - Get treasurer dashboard link
/help                    - Show all commands
```

---

## Architecture

```
┌─────────────────┐
│  Telegram Bot   │  ← Members use /commands
│  (Polling)      │
└────────┬────────┘
         │
         ├─────────────────────────────────────┐
         │                                     │
    ┌────▼─────────────────────────────────┐  │
    │    Express Server (Node.js)           │  │
    ├─────────────────────────────────────┐│  │
    │ • Bot handlers & routing            ││  │
    │ • Chama services                    ││  │
    │ • Payments integration              ││  │
    │ • Cron jobs                         ││  │
    │ • Outbox worker                     ││  │
    └────┬──────────────────────────────┘│  │
         │                               │  │
         ├─► API Routes                  │  │
         │                               │  │
    ┌────▼──────────────────────────────┐│  │
    │    Next.js Frontend                ││  │
    ├────────────────────────────────────┤│  │
    │ • Treasurer Dashboard              ││  │
    │ • Auth (bot-token based)           ││  │
    │ • Group stats                      ││  │
    └────────────────────────────────────┘│  │
                                           │  │
                                    ┌──────▼──▼──────┐
                                    │  PostgreSQL    │
                                    │  + Redis       │
                                    └────────────────┘
```

## Database Schema

### Core Tables

- **chamas** - Group configuration
- **chama_members** - Membership records
- **cycles** - Contribution periods
- **contributions** - Individual payments
- **fines** - Late payment penalties
- **payouts** - Money going out

### Supporting Tables

- **outbox** - Event log for async processing
- **dashboard_sessions** - Auth tokens for web access
- **member_onboarding** - Multi-step registration state
- **cron_runs** - Scheduled job execution log

See [schema.sql](server/db/schema.sql) for full details.

## Project Structure

```
chama-savings-bot/
├── app/                              # Next.js frontend
│   ├── api/                          # API routes
│   │   └── auth/                     # Auth endpoints
│   ├── treasurer/                    # Dashboard pages
│   ├── lib/                          # Utilities (db, etc)
│   └── page.js                       # Home page
│
├── server/                           # Backend
│   ├── bot/                          # Bot message handling
│   │   └── handler.js                # Main handler
│   ├── config/                       # Configuration
│   │   └── db.js                     # Database connection
│   ├── db/                           # Database
│   │   ├── schema.sql                # Table definitions
│   │   └── migrate.js                # Migration script
│   ├── services/
│   │   ├── chama/
│   │   │   ├── chamaService.js       # Business logic
│   │   │   ├── chamaRepo.js          # Database queries
│   │   │   ├── ARCHITECTURE.md       # Domain architecture
│   │   │   └── commands/             # Bot commands
│   │   │       ├── setup.js
│   │   │       ├── join.js
│   │   │       ├── balance.js
│   │   │       ├── stats.js
│   │   │       ├── members.js
│   │   │       └── contribute.js
│   │   └── telegram.service.js       # Bot utilities
│   ├── routes/                       # Express routes
│   │   └── api.js                    # API endpoints
│   ├── workers/                      # Background jobs
│   ├── cron/                         # Scheduled tasks
│   └── index.js                      # Server entry
│
├── public/                           # Static files
├── .env.example                      # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── SETUP.md                          # Detailed setup guide
└── README.md                         # This file
```

## Key Design Patterns

### The Chama Invariants

Never break these rules:

1. **One open cycle per chama** - Cycles close and new ones open, never overlap
2. **Contribution amounts** - Match the monthly_amount exactly (or explicit top-up)
3. **Balance formula** - `SUM(contributions) - SUM(payouts)` always (never stored)
4. **Member access** - Members can only contribute during their membership
5. **Fine payment** - Fines paid separately or added to next contribution
6. **Transactional safety** - All changes in a transaction, no partial updates

### Async Processing with Outbox

When M-Pesa confirms a payment:

1. Payments package writes to `outbox` table
2. Outbox worker picks up the event
3. Worker checks if it's a chama contribution
4. Updates contribution status
5. Sends Telegram announcement
6. Marks event processed

This decouples payment confirmation from bot notifications.

### Bot-First UX

- Members never leave Telegram (the app they check 10x/day)
- All core features in bot: contribute, balance, stats
- Web dashboard only for treasurer (who needs tabular view)
- No friction = high adoption

## Development

### Local Development

```bash
# Terminal 1: Bot + API
npm run dev

# Terminal 2: (Optional) Database monitoring
psql -d chama_db -c "SELECT * FROM chamas;"
```

### Running Tests

```bash
# (TBD) Add test suite
npm test
```

### Database

```bash
# Connect
psql -d chama_db

# Check tables
\dt

# View schema
\d chamas

# Exit
\q
```

## Deployment

### Quick Deploy (Fly.io)

```bash
fly launch
fly secrets set TELEGRAM_BOT_TOKEN=your_token
fly secrets set DATABASE_URL=your_postgres_url
fly deploy
```

### More Options

See [SETUP.md - Deployment](SETUP.md#deployment) for Railway, Heroku, and other platforms.

## Roadmap

### Done
- ✅ Core bot commands
- ✅ Chama setup and membership
- ✅ Balance tracking
- ✅ Database schema

### In Progress
- 🟡 M-Pesa payment integration
- 🟡 Outbox event processing
- 🟡 Treasurer dashboard

### Coming Soon
- 🟢 Cycle closing (automatic + manual)
- 🟢 Fine calculation and reminders
- 🟢 Payout tracking
- 🟢 Monthly PDF reports
- 🟢 Multi-chama support
- 🟢 Language support (Kiswahili)

## Common Issues

### Bot doesn't respond

1. Verify token in `.env` is correct
2. Check bot is running: `npm run dev` should show "Bot is polling"
3. Check bot was added to group
4. Try `/help` command

### Database errors

1. Check PostgreSQL is running: `pg_isready`
2. Check `.env` DATABASE_URL is correct
3. Check database exists: `psql -l`
4. Re-run migrations: `npm run db:migrate`

### Port 3000 in use

```bash
# Change in .env:
PORT=3001
```

## Contributing

Contributions welcome! Please:

1. Create a feature branch
2. Follow existing code style
3. Write tests for new features
4. Update documentation
5. Submit PR

## License

MIT

## Support

- 📖 See [SETUP.md](SETUP.md) for detailed setup
- 🏗️ See [server/services/chama/ARCHITECTURE.md](server/services/chama/ARCHITECTURE.md) for system design
- 💬 Issues? Check troubleshooting in SETUP.md

---

Built for Kenyan chamas 🇰🇪
