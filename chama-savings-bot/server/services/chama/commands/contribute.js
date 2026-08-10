const chamaService = require('../chamaService');

module.exports = async function contribute(bot, message) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const firstName = message.from.first_name || 'Member';

  // Check if group is a chama
  const chama = await chamaService.findByChatId(chatId);
  if (!chama) {
    await bot.sendMessage(
      chatId,
      '⚠️ This group is not set up as a chama. Ask an admin to run /setup.'
    );
    return;
  }

  // Check if user is a member
  const member = await chamaService.findMember(chatId, userId);
  if (!member) {
    await bot.sendMessage(
      chatId,
      `${firstName}, run /join first to register for ${chama.name}.`
    );
    return;
  }

  // Check if there's an open cycle
  const cycle = await chamaService.getOpenCycle(chatId);
  if (!cycle) {
    await bot.sendMessage(
      chatId,
      "⚠️ No open cycle right now. Ask the treasurer to open a new cycle."
    );
    return;
  }

  const amountKsh = chama.monthly_amount_cents / 100;
  const periodDate = new Date(cycle.period_start);
  const periodLabel = periodDate.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });

  // Show keyboard privately
  await bot.sendMessage(
    userId,
    `💰 Contribute to ${chama.name}:`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `📱 Contribute KSh ${amountKsh.toLocaleString()} for ${periodLabel}`,
              callback_data: `cntb:${cycle.id}:${chama.monthly_amount_cents}`,
            },
          ],
          [
            {
              text: '✏️ Custom amount',
              callback_data: `cntb:${cycle.id}:custom`,
            },
          ],
          [
            {
              text: '❌ Cancel',
              callback_data: 'cntb:cancel',
            },
          ],
        ],
      },
    }
  );
};
