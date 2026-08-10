# Chama Savings Bot - Quick Start Checklist

Follow this checklist to get your bot running in 15 minutes.

---

## ⏱️ Estimated Time: 15 minutes

### Phase 1: Create Your Bot (5 min)

- [ ] Open Telegram
- [ ] Search for `@BotFather`
- [ ] Send `/newbot`
- [ ] Choose bot name: e.g., "Chama Savings Bot"
- [ ] Choose bot username: e.g., `chamaSavingsBot_yourname`
- [ ] **Save the token** you receive (looks like: `123456:ABC-DEF1234...`)
- [ ] **Save the username** (e.g., `chamaSavingsBot_yourname`)

**Saved?** ✅

---

### Phase 2: Setup Project (5 min)

1. **Install dependencies:**
   ```bash
   npm install
   ```
   (Wait for it to finish)

2. **Setup environment:**
   ```bash
   # If you haven't already, copy the example
   cp .env.example .env
   ```

3. **Edit `.env` file** - Open with your editor and fill in:
   ```env
   TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
   TELEGRAM_BOT_USERNAME=chamaSavingsBot_yourname
   ```

   The rest of the `.env` values should be left empty for now - they'll ask you to fill them in a moment.

**Done?** ✅

---

### Phase 3: Setup Database (3 min)

1. **Check PostgreSQL is running:**
   ```bash
   pg_isready
   ```
   
   Should show: `accepting connections`
   
   If not, start PostgreSQL:
   ```bash
   # macOS (if installed with Homebrew)
   brew services start postgresql@15
   
   # Ubuntu/Debian
   sudo service postgresql start
   ```

2. **Create the database:**
   ```bash
   createdb chama_db
   ```

3. **Run migrations:**
   ```bash
   npm run db:migrate
   ```
   
   Should show: `✓ Database migration completed successfully`

**Done?** ✅

---

### Phase 4: Run Your Bot (2 min)

1. **Start the bot:**
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

2. **Keep this terminal open** - your bot is now running

**Running?** ✅

---

## 🧪 Test Your Bot (5 min)

In a **new terminal** (don't close the first one):

1. **Visit home page:**
   ```bash
   open http://localhost:3000
   ```
   Should see the home page with features.

2. **Test the bot:**
   - Open Telegram
   - Go to `t.me/chamaSavingsBot_yourname` (replace with your username)
   - Click **Start**
   - Type `/help`
   - Should see all commands listed

**Test successful?** ✅

---

## 🚀 Create Your First Chama (5 min)

1. **Create a Telegram group:**
   - Open Telegram → "Create group"
   - Name it: "Kilimani Chama" (or any name)
   - Add your bot to the group
   - Make yourself an admin (if not automatic)

2. **Setup the chama** (in the group):
   ```
   /setup "Kilimani Chama" 1000 1
   ```
   
   This means:
   - Name: Kilimani Chama
   - Members contribute: KSh 1000 per cycle
   - Cycle closes on: Day 1 of each month

   Should see: `✅ "Kilimani Chama" is now a chama!`

**Setup complete?** ✅

---

## 👥 Add Members (2 min)

1. **Invite a friend** to the group (or use another test account)

2. **Friend runs:** `/join` (in the group)

3. **Friend gets a private message** asking for phone number

4. **Friend replies** with phone: `0712345678`

5. **Check members:**
   ```
   /members
   ```
   
   (Your phone - as treasurer)
   
   Should show the new member

**Members added?** ✅

---

## ✅ You're Done!

Your Chama Savings Bot is now:
- ✅ Running locally
- ✅ Responding to commands
- ✅ Storing data in database
- ✅ Ready for contributions (when M-Pesa is hooked up)

---

## 🎯 Next Steps

### Short Term (This week)
1. Invite more friends to test
2. Try the `/stats` command to see group progress
3. Test `/balance` to see member status

### Medium Term (Next week)
1. Integrate with M-Pesa Daraja API (if you have access)
2. Test the `/contribute` button flow
3. Set up production database

### Long Term (Next month)
1. Deploy to Fly.io or Railway
2. Set up automatic cycle processing (cron)
3. Build treasurer dashboard UI

---

## 🐛 Troubleshooting

### "Bot doesn't respond to commands"

**Fix:**
1. Check the terminal where you ran `npm run dev`
2. Look for `Bot is polling for messages...`
3. Check your `.env` file has the correct token
4. Try typing `/help` again

### "Database migration failed"

**Fix:**
1. Check PostgreSQL is running: `pg_isready`
2. Check database exists: `psql -l` (look for `chama_db`)
3. Try migration again: `npm run db:migrate`

### "Port 3000 already in use"

**Fix:**
Edit `.env` and change:
```env
PORT=3001
```
Then run `npm run dev` again.

### "Token is invalid"

**Fix:**
1. Go back to BotFather (`@BotFather`)
2. Send `/start`
3. Send `/mybots` → select your bot → `/revoke`
4. Run `/newbot` again to create a new token
5. Update `.env` with the new token

---

## 📚 Need More Help?

- **Full setup guide:** See [SETUP.md](SETUP.md)
- **Bot creation details:** See [BOT_CREATION_STEPS.md](BOT_CREATION_STEPS.md)
- **System architecture:** See [server/services/chama/ARCHITECTURE.md](server/services/chama/ARCHITECTURE.md)
- **Project overview:** See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

---

## 💡 Pro Tips

1. **Add bot to multiple groups** - Each group can be a different chama
2. **Use `/stats` daily** - Shows progress and motivates members
3. **Members can run `/balance` anytime** - Easy self-service
4. **Treasurer uses `/members`** - See who's paid, who owes

---

## ✨ You've Completed Setup!

🎉 **Congratulations!** Your Chama Savings Bot is running!

Next: Invite friends, create chamas, and watch it work. 🚀

---

**Questions?** Check the documentation or create an issue.

**Made for Kenyan chamas** 🇰🇪
