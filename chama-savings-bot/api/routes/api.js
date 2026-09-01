const express = require('express');
const router = express.Router();

const chamaService = require('../services/chama/chamaService');

// ============ CHAMA ENDPOINTS ============

// Get chama details
router.get('/chamas/:chatId', async (req, res) => {
  try {
    const chatId = BigInt(req.params.chatId);
    const chama = await chamaService.findByChatId(chatId);

    if (!chama) {
      return res.status(404).json({ error: 'Chama not found' });
    }

    res.json(chama);
  } catch (err) {
    console.error('Error fetching chama:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get chama statistics
router.get('/chamas/:chatId/stats', async (req, res) => {
  try {
    const chatId = BigInt(req.params.chatId);
    const stats = await chamaService.getGroupStats(chatId);
    res.json(stats);
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get chama members
router.get('/chamas/:chatId/members', async (req, res) => {
  try {
    const chatId = BigInt(req.params.chatId);
    const members = await chamaService.getMembers(chatId);
    res.json(members);
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ MEMBER ENDPOINTS ============

// Get member balance
router.get('/members/:userId/balance/:chamaId', async (req, res) => {
  try {
    const userId = BigInt(req.params.userId);
    const chamaId = BigInt(req.params.chamaId);

    const balance = await chamaService.getMemberBalance(chamaId, userId);
    if (!balance) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json(balance);
  } catch (err) {
    console.error('Error fetching balance:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ HEALTH ============

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'chama-api' });
});

module.exports = router;
