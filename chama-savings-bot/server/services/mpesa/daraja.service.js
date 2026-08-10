const axios = require('axios');

const {
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_BUSINESS_SHORTCODE,
  MPESA_PASSKEY,
  MPESA_CALLBACK_URL,
} = process.env;

const DARAJA_BASE = 'https://sandbox.safaricom.co.ke';
const AUTH_PATH = '/oauth/v1/generate?grant_type=client_credentials';
const STK_PUSH_PATH = '/mpesa/stkpush/v1/processrequest';

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAuthToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');

  const response = await axios.get(`${DARAJA_BASE}${AUTH_PATH}`, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  cachedToken = response.data.access_token;
  tokenExpiresAt = Date.now() + (response.data.expires_in - 60) * 1000;

  return cachedToken;
}

function generatePassword(shortcode, passkey, timestamp) {
  const raw = `${shortcode}${passkey}${timestamp}`;
  return Buffer.from(raw).toString('base64');
}

function formatTimestamp(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

async function initiateSTKPush({ phone, amountCents, accountRef, transactionDesc }) {
  const token = await getAuthToken();
  const timestamp = formatTimestamp(new Date());
  const password = generatePassword(MPESA_BUSINESS_SHORTCODE, MPESA_PASSKEY, timestamp);

  const amountKsh = Math.round(amountCents / 100);

  const payload = {
    BusinessShortCode: MPESA_BUSINESS_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amountKsh,
    PartyA: phone,
    PartyB: MPESA_BUSINESS_SHORTCODE,
    PhoneNumber: phone,
      CallBackURL: MPESA_CALLBACK_URL,
    AccountReference: accountRef || 'Chama Contribution',
    TransactionDesc: transactionDesc || 'Chama Contribution',
  };

  const response = await axios.post(`${DARAJA_BASE}${STK_PUSH_PATH}`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
}

module.exports = {
  initiateSTKPush,
};
