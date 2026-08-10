const chamaService = require('../chamaService');

module.exports = async function join(bot, message) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const firstName = message.from.first_name || 'Member';

  // Check if chama exists
  const chama = await chamaService.findByChatId(chatId);
  if (!chama) {
    await bot.sendMessage(
      chatId,
      "⚠️ This group is not set up as a chama. Ask an admin to run /setup."
    );
    return;
  }

  // Check if already a member
  const existing = await chamaService.findMember(chatId, userId);
  if (existing && !existing.left_at) {
    await bot.sendMessage(
      chatId,
      `✓ ${firstName}, you are already a member of ${chama.name}.`
    );
    return;
  }

  // Start onboarding flow (will ask for phone in private chat)
  try {
    await bot.sendMessage(
      userId,
      `👋 Welcome to ${chama.name}!\n\n` +
      `To complete your registration, please reply with your M-Pesa phone number.\n\n` +
      `Format: +254712345678\n` +
      `(or just: 0712345678)`
    );

    // Save onboarding state
    await chamaService.startMemberOnboarding(userId, chatId);

    // Notify group that we're waiting
    await bot.sendMessage(
      chatId,
      `${firstName} is joining ${chama.name}. Check your private chat with the bot to complete registration.`
    );
  } catch (err) {
    if (err.response?.body?.error_code === 403) {
      await bot.sendMessage(
        chatId,
        `${firstName}, please start a private chat with me first (${process.env.TELEGRAM_BOT_USERNAME}), then run /join again.`
      );
    } else {
      console.error('Join failed:', err.message);
      await bot.sendMessage(chatId, '❌ Join failed. Please try again.');
    }
  }
};
