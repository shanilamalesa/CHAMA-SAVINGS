const express = require('express');
const router = express.Router();
const { query, pool } = require('../config/db');
const mpesaService = require('../services/mpesa/daraja.service');

router.post('/', express.json(), async (req, res) => {
  const payload = req.body;

  try {
    const resultCode = payload.Body?.stkCallback?.ResultCode;
    const resultDesc = payload.Body?.stkCallback?.ResultDesc;
    const checkoutRequestId = payload.Body?.stkCallback?.CheckoutRequestID;

    const callbackMetadata = payload.Body?.stkCallback?.CallbackMetadata?.Item || [];
    const getItemValue = (name) => {
      const item = callbackMetadata.find((i) => i.Name === name);
      return item?.Value ?? null;
    };

    const amount = getItemValue('Amount');
    const mpesaReceiptNumber = getItemValue('MpesaReceiptNumber');
    const transactionDate = getItemValue('TransactionDate');
    const phoneNumber = getItemValue('PhoneNumber');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (resultCode === 0) {
        const normalizedPhone = phoneNumber ? String(phoneNumber).replace(/^\+?/, '') : null;
        const amountCents = amount ? Math.round(Number(amount) * 100) : null;

        const memberResult = await client.query(
          `SELECT cm.user_id, cm.chama_id, c.id AS cycle_id
           FROM chama_members cm
           JOIN cycles c ON c.chama_id = cm.chama_id AND c.status = 'open'
           WHERE REPLACE(cm.phone, '+', '') = $1
           LIMIT 1`,
          [normalizedPhone]
        );

        const member = memberResult.rows[0];

        if (member && amountCents) {
          await client.query(
            `UPDATE contributions
             SET status = 'confirmed',
                 mpesa_reference = $1,
                 confirmed_at = TO_TIMESTAMP($2::text, 'YYYYMMDDHH24MISS')
             WHERE id = (
               SELECT c2.id
               FROM contributions c2
               WHERE c2.chama_id = $3
                 AND c2.member_user_id = $4
                 AND c2.amount_cents = $5
                 AND c2.status = 'pending'
               ORDER BY c2.created_at ASC
               LIMIT 1
             )`,
            [mpesaReceiptNumber, String(transactionDate), member.chama_id, member.user_id, amountCents]
          );
        }
      } else {
        const normalizedPhone = phoneNumber ? String(phoneNumber).replace(/^\+?/, '') : null;
        const amountCents = amount ? Math.round(Number(amount) * 100) : null;

        if (normalizedPhone && amountCents) {
          await client.query(
            `UPDATE contributions
             SET status = 'failed'
             WHERE id = (
               SELECT c2.id
               FROM contributions c2
               JOIN chama_members cm ON cm.chama_id = c2.chama_id AND cm.user_id = c2.member_user_id
               WHERE REPLACE(cm.phone, '+', '') = $1
                 AND c2.amount_cents = $2
                 AND c2.status = 'pending'
               ORDER BY c2.created_at ASC
               LIMIT 1
             )`
          );
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('M-Pesa webhook error:', err);
    return res.json({ ResultCode: 1, ResultDesc: 'Failed' });
  }
});

router.post('/contribute', async (req, res) => {
  try {
    const { userId, cycleId, amountCents } = req.body;

    if (!userId || !cycleId || !amountCents) {
      return res.status(400).json({ error: 'userId, cycleId and amountCents are required' });
    }

    const memberResult = await query(
      `SELECT cm.phone, c.chama_id
       FROM chama_members cm
       JOIN cycles c ON c.id = $1
       WHERE cm.user_id = $2 AND cm.chama_id = c.chama_id AND cm.left_at IS NULL`,
      [cycleId, userId]
    );

    const member = memberResult.rows[0];
    if (!member) {
      return res.status(404).json({ error: 'Member not found for this cycle' });
    }

    const phone = member.phone.replace(/^\+?/, '');
    if (!/^\d{9,13}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid member phone number' });
    }

    const result = await mpesaService.initiateSTKPush({
      phone,
      amountCents,
      accountRef: `Cycle-${cycleId}`,
      transactionDesc: 'Chama Contribution',
    });

    return res.json(result);
  } catch (err) {
    console.error('M-Pesa contribute error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Failed to initiate STK push' });
  }
});

module.exports = router;
