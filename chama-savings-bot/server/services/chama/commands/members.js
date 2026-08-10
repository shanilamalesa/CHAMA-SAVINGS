const chamaService = require('../chamaService');

module.exports = async function members(bot, message) {
  const chatId = message.chat.id;
  const userId = message.from.id;

  const chama = await chamaService.findByChatId(chatId);
  if (!chama) {
    await bot.sendMessage(
      chatId,
      '⚠️ This group is not set up as a chama. Ask an admin to run /setup.'
    );
    return;
  }

  // Only treasurer can see this
  if (chama.treasurer_user_id !== userId) {
    await bot.sendMessage(
      chatId,
      '⛔ Only the treasurer can run /members.'
    );
    return;
  }

  const list = await chamaService.getMemberStatusList(chatId);

  if (list.length === 0) {
    await bot.sendMessage(userId, 'No members yet. Share the group link!');
    return;
  }

  const lines = list.map((m) => {
    const icon = m.contributedThisCycle >= m.expected ? '✅' : '⏳';
    const missing = Math.max(0, m.expected - m.contributedThisCycle);
    const missingText =
      missing > 0 ? ` (missing KSh ${(missing / 100).toLocaleString()})` : '';
    return `${icon} ${m.name}: KSh ${(m.contributedThisCycle / 100).toLocaleString()}${missingText}`;
  });

  const text = `👥 Member Status for ${chama.name}:\n\n${lines.join('\n')}`;

  // Send privately to treasurer
  await bot.sendMessage(userId, text);
};
