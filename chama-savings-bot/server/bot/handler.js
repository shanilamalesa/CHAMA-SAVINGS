
const telegramService = require('../services/telegram.service');
const chamaService = require('../services/chama/chamaService');
const { query } = require('../config/db');

// Import commands
const setupCmd = require('../services/chama/commands/setup');
const joinCmd = require('../services/chama/commands/join');
const balanceCmd = require('../services/chama/commands/balance');
const statsCmd = require('../services/chama/commands/stats');
const membersCmd = require('../services/chama/commands/members');
const contributeCmd = require('../services/chama/commands/contribute');

// ============ MESSAGE HANDLER ============

async function handleMessage(msg) {
   console.log("RAW MESSAGE RECEIVED:", msg.chat.type, msg.chat.id, msg.text);
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text || '';
  const bot = telegramService.getBot();

  try {
    // Check if this is an onboarding response (phone number)
    const onboarding = await chamaService.getMemberOnboarding(userId);
    if (onboarding && /^\+?\d{9,14}$|^0[1-9]\d{8}$/.test(text.replace(/\s/g, ''))) {
      let phone = text.replace(/\s/g, '');
      if (phone.startsWith('0')) {
        phone = '+254' + phone.substring(1);
      } else if (!phone.startsWith('+')) {
        phone = '+' + phone;
      }

      try {
        const chama = await chamaService.findByChatId(onboarding.chama_id);
        const memberName = msg.from.first_name || 'Member';

        await chamaService.completeMemberOnboarding({
          userId,
          chamaId: onboarding.chama_id,
          name: memberName,
          phone,
        });

        await telegramService.sendMessage(userId, `✅ Registration complete! You are now a member of ${chama.name}.\n\n💰 To contribute: /contribute`);

        const memberCount = await chamaService.getMemberCount(onboarding.chama_id);
        await telegramService.sendMessage(
          onboarding.chama_id,
          `✅ ${memberName} joined ${chama.name}! Total members: ${memberCount}`
        );
        return;
      } catch (err) {
        console.error('Onboarding completion failed:', err.message);
        await telegramService.sendMessage(userId, ' Registration failed. Please try again.');
        return;
      }
    }

    // if (!text.startsWith('/')) {
    //   return;
    // }

    // Check if this is a custom contribution amount reply
    const cSession = await telegramService.getSession(userId);
    if (cSession && cSession.state === 'awaiting_custom_amount' && msg.chat.type === 'private') {
      const amountKsh = parseInt(text, 10);
      if (isNaN(amountKsh) || amountKsh <= 0) {
        await telegramService.sendMessage(chatId, 'Please enter a valid amount greater than 0.');
        return;
      }
      const amountCents = amountKsh * 100;
      const cycleId = cSession.context.cycleId;
      await telegramService.clearSession(userId);

      const statusMsg = await telegramService.sendMessage(chatId, ' Initiating M-Pesa prompt...');

      try {
        const result = await chamaService.initiateContribution({ userId, cycleId, amountCents });
        await telegramService.editMessage(chatId, statusMsg.message_id,
          `📱 Check your phone for the M-Pesa prompt.\n` +
          `Reference: ${result.contributionId.slice(0, 8)}\n` +
          `Enter your PIN to complete.`
        );
      } catch (err) {
        console.error('Custom contribution failed:', err.message);
        await telegramService.editMessage(chatId, statusMsg.message_id, ' Could not start payment. Please try again.');
      }
      return;
    }

    if (!text.startsWith('/')) {
      return;
    }

    const parts = text.split(' ');
    const command = parts[0].substring(1).toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'start':
        await handleStart(chatId);
        break;
      case 'setup':
        await setupCmd(bot, msg, args);
        break;
      case 'join':
        await joinCmd(bot, msg);
        break;
      case 'balance':
        await balanceCmd(bot, msg);
        break;
      case 'stats':
        await statsCmd(bot, msg);
        break;
      case 'members':
        await membersCmd(bot, msg);
        break;
      case 'contribute':
        await contributeCmd(bot, msg);
        break;
      case 'dashboard':
        await handleDashboard(bot, msg);
        break;
      case 'help':
        await handleHelp(chatId);
        break;
      default:
        await telegramService.sendMessage(
          chatId,
          `❌ Unknown command: /${command}\n\nType /help for available commands.`
        );
    }
  } catch (err) {
    console.error('Message handler error:', err);
    await telegramService.sendMessage(
      chatId,
      '❌ An error occurred. Please try again.'
    );
  }
}

// ============ CALLBACK QUERY HANDLER ============

async function handleCallbackQuery(query) {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const data = query.data;
  const bot = telegramService.getBot();

  try {
    if (data.startsWith('cntb:')) {
      const parts = data.split(':');
      const cycleId = parseInt(parts[1], 10);
      const amountPart = parts[2];

      if (amountPart === 'cancel') {
        await bot.editMessageText('❌ Cancelled.', {
          chat_id: chatId,
          message_id: query.message.message_id,
        });
        await bot.answerCallbackQuery(query.id);
        return;
      }

      if (amountPart === 'custom') {
        await telegramService.setSession(userId, {
          state: 'awaiting_custom_amount',
          context: { cycleId },
        });
        await telegramService.sendMessage(userId, 'Enter the amount in KSh:');
        await bot.answerCallbackQuery(query.id);
        return;
      }

      const amountCents = parseInt(amountPart, 10);
      await bot.answerCallbackQuery(query.id);
      await initiateContribution(bot, query, cycleId, amountCents);
      return;
    }

    await bot.answerCallbackQuery(query.id, 'Unknown action', true);
  } catch (err) {
    console.error('Callback handler error:', err);
    await bot.answerCallbackQuery(query.id, 'Error processing action', true);
  }
}

// ============ CONTRIBUTION FLOW ============

async function initiateContribution(bot, query, cycleId, amountCents) {
  const userId = query.from.id;
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  try {
    await bot.editMessageText('⏳ Initiating M-Pesa prompt...', {
      chat_id: chatId,
      message_id: messageId,
    });

    const result = await chamaService.initiateContribution({
      userId,
      cycleId,
      amountCents,
    });

    await bot.editMessageText(
      `📱 Check your phone for the M-Pesa prompt.\n` +
      `Reference: ${result.contributionId.slice(0, 8)}\n` +
      `Enter your PIN to complete.`,
      { chat_id: chatId, message_id: messageId }
    );
  } catch (err) {
    console.error('Initiate contribution failed:', err.message);
    await bot.editMessageText(
      '❌ Could not start payment. Please try again.',
      { chat_id: chatId, message_id: messageId }
    );
  }
}

// ============ SPECIAL COMMANDS ============

async function handleStart(chatId) {
  await telegramService.sendMessage(
    chatId,
    `👋 Welcome to Chama Savings Bot!

A Telegram bot for Kenyan savings groups.

📖 Type /help for commands.`
  );
}

async function handleHelp(chatId) {
  const text = `📚 Available Commands:

⚙️ Setup:
/setup <name> <amount_ksh> <cycle_day> - Set up a new chama

👥 Membership:
/join - Register for a chama
/members - See all members (treasurer only)

💰 Contributions:
/contribute - Make a contribution via M-Pesa
/balance - Check your balance
/stats - See group progress

🔧 Misc:
/dashboard - Get treasurer dashboard link
/help - Show this help message`;

  await telegramService.sendMessage(chatId, text);
}

async function handleDashboard(bot, message) {
  const chatId = message.chat.id;
  //from external api
  const userId = message.from.id;
  console.log("DASHBOARD:", { chatId, userId });

  try {
    const chama = await chamaService.findByChatId(chatId);
    if (!chama || String(chama.treasurer_user_id) !== String(userId)) {
      await telegramService.sendMessage(
        chatId,
        '⛔ Only the treasurer can access the dashboard.'
      );
      return;
    }

    const crypto = require('crypto');
    const token = crypto.randomUUID();

    await query(
      `INSERT INTO dashboard_sessions (token, user_id, created_at, expires_at)
       VALUES ($1, $2, NOW(), NOW() + INTERVAL '1 hour')`,
      [token, userId]
    );

    const url = `${process.env.PUBLIC_URL}/treasurer/login?token=${token}`;
    await telegramService.sendMessage(
      userId,
      `🔗 Open your dashboard: ${url}\n(link expires in 1 hour)`
    );
  } catch (err) {
    console.error('Dashboard handler error:', err);
    await telegramService.sendMessage(chatId, '❌ Error. Please try again.');
  }
}

// ============ INITIALIZATION ============

function setupHandlers() {
  const bot = telegramService.getBot();

  bot.on("message", handleMessage);
  bot.on("callback_query", handleCallbackQuery);

  console.log("✓ Bot handlers registered");
}

module.exports = {
  setupHandlers,
  handleMessage,
  handleCallbackQuery,
};
