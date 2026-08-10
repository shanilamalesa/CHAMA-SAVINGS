const chamaService = require('../chamaService');

module.exports = async function setup(bot, message, args) {
  const chatId = message.chat.id;

  // Setup must be in a group, not private
  if (message.chat.type === 'private') {
    await bot.sendMessage(chatId, '📢 Setup must be run inside the chama group chat.');
    return;
  }

  // Check if already set up
  const existing = await chamaService.findByChatId(chatId);
  if (existing) {
    await bot.sendMessage(
      chatId,
      `✓ This group is already set up as "${existing.name}".`
    );
    return;
  }

  // Only group admins can set up
  try {
    const member = await bot.getChatMember(chatId, message.from.id);
    if (member.status !== 'creator' && member.status !== 'administrator') {
      await bot.sendMessage(chatId, '⛔ Only a group admin can run /setup.');
      return;
    }
  } catch (err) {
    console.error('Failed to check admin status:', err.message);
    return;
  }

  // Validate arguments
  if (args.length < 3) {
    await bot.sendMessage(
      chatId,
      `⚙️ Usage: /setup <name> <monthly_amount_ksh> <cycle_day>

Example:
/setup "Kilimani Chama" 1000 1

Where:
- name: Group name (use quotes if multiple words)
- monthly_amount_ksh: How much each member contributes (e.g., 1000)
- cycle_day: Day of month cycle closes (1-28)`
    );
    return;
  }

  const monthlyKsh = parseInt(args[args.length - 2], 10);
  const cycleDay = parseInt(args[args.length - 1], 10);
  const name = args.slice(0, args.length - 2).join(' ').replace(/^"(.+)"$/, '$1');

  // Validate values
  if (isNaN(monthlyKsh) || monthlyKsh <= 0) {
    await bot.sendMessage(chatId, '❌ Invalid monthly amount. Must be a positive number.');
    return;
  }

  if (isNaN(cycleDay) || cycleDay < 1 || cycleDay > 28) {
    await bot.sendMessage(chatId, '❌ Cycle day must be between 1 and 28.');
    return;
  }

  try {
    await chamaService.create({
      chatId,
      name,
      monthlyAmountCents: monthlyKsh * 100,
      cycleDay,
      treasurerUserId: message.from.id,
    });

    await bot.sendMessage(
      chatId,
      `✅ "${name}" is now a chama!

📋 Configuration:
- Monthly contribution: KSh ${monthlyKsh.toLocaleString()}
- Cycle day: ${cycleDay}
- Treasurer: ${message.from.first_name}

👥 Members: type /join to register.
💰 To contribute: /contribute`
    );
  } catch (err) {
    console.error('Setup failed:', err.message);
    await bot.sendMessage(chatId, '❌ Setup failed. Please try again.');
  }
};
