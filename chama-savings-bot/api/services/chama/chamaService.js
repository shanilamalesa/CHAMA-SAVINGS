const repo = require('./chamaRepo');
const mpesaService = require('../mpesa/daraja.service');

// ============ CHAMA CRUD ============

async function create({ chatId, name, monthlyAmountCents, cycleDay, treasurerUserId }) {
  return repo.createChama({ chatId, name, monthlyAmountCents, cycleDay, treasurerUserId });
}

async function findByChatId(chatId) {
  return repo.findByChatId(chatId);
}

// ============ MEMBER MANAGEMENT ============

async function findMember(chamaId, userId) {
  return repo.findMember(chamaId, userId);
}

async function joinChama({ chamaId, userId, name, phone }) {
  return repo.addMember({ chamaId, userId, name, phone });
}

async function startMemberOnboarding(userId, chamaId) {
  return repo.startMemberOnboarding(userId, chamaId);
}

async function getMemberOnboarding(userId) {
  return repo.getMemberOnboarding(userId);
}

async function completeMemberOnboarding({ userId, chamaId, name, phone }) {
  await repo.addMember({ chamaId, userId, name, phone });
  await repo.completeMemberOnboarding(userId);
}

async function getMemberCount(chamaId) {
  return repo.getMemberCount(chamaId);
}

async function getMembers(chamaId) {
  return repo.getMembers(chamaId);
}

// ============ CYCLES ============

async function getOpenCycle(chamaId) {
  return repo.getOpenCycle(chamaId);
}

async function getCycle(cycleId) {
  return repo.getCycle(cycleId);
}

// ============ CONTRIBUTIONS ============

async function initiateContribution({ userId, cycleId, amountCents }) {
  // Load cycle and chama
  const cycle = await repo.getCycle(cycleId);
  if (!cycle || cycle.status !== 'open') {
    throw new Error('Cycle not open');
  }

  const chama = await repo.findByChatId(cycle.chama_id);
  const member = await repo.findMember(cycle.chama_id, userId);
  if (!member) {
    throw new Error('Not a member of this chama');
  }

  // Create contribution row
  const contribution = await repo.createContribution({
    cycleId,
    chamaId: cycle.chama_id,
    memberUserId: userId,
    amountCents,
    status: 'pending',
  });

  try {
    const phone = member.phone ? member.phone.replace(/^\+?/, '') : null;
    if (!phone) {
      throw new Error('Member has no phone number');
    }

    const stkResult = await mpesaService.initiateSTKPush({
      phone,
      amountCents,
      accountRef: `Chama-${cycle.id}`,
      transactionDesc: 'Chama Contribution',
    });

    return {
      contributionId: contribution.id,
      chamaId: cycle.chama_id,
      amountCents,
      stkResult,
    };
  } catch (err) {
    await repo.updateContribution(contribution.id, { status: 'failed' });
    throw err;
  }
}

async function confirmContribution(contributionId) {
  return repo.confirmContribution(contributionId);
}

// ============ BALANCES & STATS ============

async function getMemberBalance(chamaId, userId) {
  return repo.getMemberBalance(chamaId, userId);
}

async function getGroupStats(chamaId) {
  return repo.getGroupStats(chamaId);
}

async function getMemberStatusList(chamaId) {
  return repo.getMemberStatusList(chamaId);
}

// ============ OUTBOX ============

async function writeEvent({ eventType, payload }) {
  return repo.writeToOutbox({ eventType, payload });
}

async function getUnprocessedEvents(limit = 10) {
  return repo.getUnprocessedOutbox(limit);
}

async function markEventProcessed(outboxId) {
  return repo.markOutboxProcessed(outboxId);
}

module.exports = {
  create,
  findByChatId,
  findMember,
  joinChama,
  startMemberOnboarding,
  getMemberOnboarding,
  completeMemberOnboarding,
  getMemberCount,
  getMembers,
  getOpenCycle,
  getCycle,
  initiateContribution,
  confirmContribution,
  getMemberBalance,
  getGroupStats,
  getMemberStatusList,
  writeEvent,
  getUnprocessedEvents,
  markEventProcessed,
};
