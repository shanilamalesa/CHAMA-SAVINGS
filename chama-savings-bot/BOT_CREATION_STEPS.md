# Creating a New Telegram Bot - Quick Reference

This guide walks you through creating your own Telegram bot that will power your Chama Savings platform.

## Overview

A Telegram bot is just an app that connects to Telegram's servers. You create it through **BotFather** (Telegram's bot creation service), get an auth token, and use that token to run your bot code.

## Step-by-Step Bot Creation

### Step 1: Open Telegram and Find BotFather

1. Open Telegram app (on your phone or desktop)
2. In the search bar, search for **`@BotFather`**
3. Click on the official BotFather account (it will have a ✅ verification check)
4. Click **Start**

### Step 2: Create a New Bot

1. Send the message: `/newbot`
2. BotFather will ask: **"Alright! Send me the name of your bot..."**
3. Send your bot name (this is what users see):
   ```
   Chama Savings Bot
   ```
   Or be more creative:
   ```
   My Group Savings Bot
   Kilimani Chama Bot
   ```

4. BotFather will ask: **"Good. Now let's choose a username for your bot..."**
5. Send a unique username (must end with `bot`):
   ```
   chamaSavingsBot_firstname
   myGroupSavingsBot_2024
   kilimaniChamaBot
   ```

   ⚠️ **Important**: The username must be:
   - All lowercase (except optional CamelCase)
   - End with `bot`
   - Be unique (not taken by someone else)
   - Between 5-32 characters

### Step 3: Save Your Token

BotFather will respond with:

```
Done! Congratulations on your new bot. You will find it at t.me/chamaSavingsBot_firstname.
You can now add a description, about section and profile picture for your bot, see /help for a list of commands.

Use this token to access the HTTP API:
123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

For a description of the Bot API, see this page: https://core.telegram.org/bots/api
```

**🔑 SAVE THIS TOKEN!** You'll need it for your `.env` file:
```
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
```

### Step 4: Get Your Bot Username

From the response above, your bot username is: `chamaSavingsBot_firstname`

Save it:
```
TELEGRAM_BOT_USERNAME=chamaSavingsBot_firstname
```

---

## Optional: Configure Your Bot

### Add Bot Description (Optional)

Message BotFather with: `/setdescription`

Then send your bot username, then the description:
```
A savings group bot for Kenyan chamas. 
Contribute via M-Pesa, track balances, manage fines.
```

### Add Commands List (Optional)

Message BotFather with: `/setcommands`

Then send your bot username, then paste:
```
setup - Set up a new chama
join - Join a chama
contribute - Make an M-Pesa payment
balance - Check your balance
stats - See group progress
members - List members (treasurer)
help - Show all commands
```

Users will see these suggestions when they type `/`.

### Add Bot Profile Picture (Optional)

Message BotFather with: `/setuserpic`

Choose your bot and upload an image.

---

## Test Your Bot

### 1. Go to Your Bot

Click the link from BotFather's message, or search for your username:
```
t.me/chamaSavingsBot_firstname
```

### 2. Click Start

The bot won't respond yet (you haven't run the code), but this opens the chat.

### 3. Once You Run The Code

After you `npm run dev`, the bot will start responding to messages.

Test by typing `/help` to see if your bot responds.

---

## Using the Token in Your Code

### Update `.env` File

1. Open `.env` in your project root
2. Find this line:
   ```env
   TELEGRAM_BOT_TOKEN=
   ```
3. Paste your token:
   ```env
   TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
   TELEGRAM_BOT_USERNAME=chamaSavingsBot_firstname
   ```

### Important Security Notes

- ✅ **DO** keep your token secret
- ✅ **DO** add `.env` to `.gitignore` (it's already done)
- ❌ **DON'T** commit `.env` to git
- ❌ **DON'T** share your token online
- ❌ **DON'T** paste it in Slack/Discord/etc

If you accidentally expose it, message BotFather with `/revoke` to invalidate it.

---

## Bot Features Available

Your bot can do these things (out of the box):

### Basic
- ✅ Respond to commands (`/help`, `/contribute`, etc)
- ✅ Send messages to groups and private chats
- ✅ Handle inline buttons (keyboard clicks)
- ✅ Edit messages
- ✅ Delete messages
- ✅ Send documents (PDFs)

### Advanced (Coming Soon)
- 🟡 Receive payment callbacks
- 🟡 Schedule messages
- 🟡 Use webhooks instead of polling

---

## Common Issues

### "Username is already taken"

The username you chose is taken. Try adding a number or your name:
```
chamaSavingsBot_friday
chamaSavingsBot_2024
myGroupSavingsBot
```

### Bot doesn't respond

1. Check you copied the token correctly to `.env`
2. Check the token starts with numbers, then a colon: `123456:ABC...`
3. Run `npm run dev` to start the bot
4. Check the terminal for errors

### "Token is invalid"

1. Copy the token again from BotFather
2. Make sure there are no extra spaces or characters
3. Try a fresh `/newbot` if it still doesn't work

---

## Next Steps

1. ✅ Create bot with BotFather (this guide)
2. ✅ Save token to `.env`
3. → Run `npm install`
4. → Run `npm run db:migrate` (setup database)
5. → Run `npm run dev` (start bot)
6. → Test `/help` in your bot

---

## Reference

- **BotFather**: @BotFather on Telegram
- **Bot API Docs**: https://core.telegram.org/bots/api
- **Telegram Bot Handbook**: https://core.telegram.org/bots

---

## Example `.env` After Bot Setup

```env
# ✅ Filled in from BotFather
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_BOT_USERNAME=chamaSavingsBot_firstname

# 🔲 To be filled in next
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
# ... etc
```

That's it! You're ready to start the bot. 🚀
