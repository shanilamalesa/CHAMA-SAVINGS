const chamaService = require('../chamaService');

module.exports = async function balance(bot, message) {
  const chatId = message.chat.id;
  const userId = message.from.id;

  let chamaId;
  let chamaName;

  if (message.chat.type === 'private') {
    // User might be in multiple chamas, look them up by their membership
    // For now, we'll need to look up all chamas they belong to
    // This requires a query we don't have yet - for now, ask them to run in group
    await bot.sendMessage(
      chatId,
      '💡 Run /balance in your chama group to see your balance for that group.'
    );
    return;
  } else {
    // In a group, get the chama
    const chama = await chamaService.findByChatId(chatId);
    if (!chama) {
      await bot.sendMessage(
        chatId,
        '⚠️ This group is not set up as a chama. Ask an admin to run /setup.'
      );
      return;
    }
    chamaId = chatId;
    chamaName = chama.name;
  }

  // Get member balance
  const data = await chamaService.getMemberBalance(chamaId, userId);
  if (!data) {
    await bot.sendMessage(
      chatId,
      `⚠️ You are not a member of ${chamaName}. Run /join to sign up.`
    );
    return;
  }

  const statusIcon = data.contributedThisCycle >= data.expected ? '✅' : '⏳';
  const finesText =
    data.outstandingFines > 0
      ? `\n⚠️ Outstanding fines: KSh ${(data.outstandingFines / 100).toLocaleString()}`
      : '';

  const text =
    `💰 ${data.name}, your summary for ${chamaName}:\n\n` +
    `${statusIcon} This cycle: KSh ${(data.contributedThisCycle / 100).toLocaleString()} / ${(data.expected / 100).toLocaleString()}\n` +
    `📊 All-time contributed: KSh ${(data.totalContributed / 100).toLocaleString()}` +
    finesText;

  // Send privately
  await bot.sendMessage(userId, text);
};
