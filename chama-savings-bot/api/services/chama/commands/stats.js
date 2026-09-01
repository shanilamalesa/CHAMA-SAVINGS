const chamaService = require('../chamaService');

module.exports = async function stats(bot, message) {
  const chatId = message.chat.id;

  const chama = await chamaService.findByChatId(chatId);
  if (!chama) {
    await bot.sendMessage(
      chatId,
      '⚠️ This group is not set up as a chama. Ask an admin to run /setup.'
    );
    return;
  }

  const data = await chamaService.getGroupStats(chatId);

  const progress = data.expectedThisCycle > 0
    ? Math.round((data.collectedThisCycle / data.expectedThisCycle) * 100)
    : 0;

  const progressBar = '█'.repeat(Math.round(progress / 10)) +
    '░'.repeat(10 - Math.round(progress / 10));

  const text =
    `📊 ${chama.name} - This Cycle\n\n` +
    `${progressBar} ${progress}%\n` +
    `KSh ${(data.collectedThisCycle / 100).toLocaleString()} / ${(data.expectedThisCycle / 100).toLocaleString()}\n\n` +
    `👥 Contributors: ${data.contributors} / ${data.totalMembers}\n` +
    `⚠️ Outstanding fines: KSh ${(data.outstandingFines / 100).toLocaleString()}\n` +
    `📈 All-time total: KSh ${(data.allTime / 100).toLocaleString()}`;

  // Send publicly in the group
  await bot.sendMessage(chatId, text);
};
