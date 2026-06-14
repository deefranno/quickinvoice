const express = require('express');
const db = require('../db/database');
const router = express.Router();

router.post('/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  // Stripe webhook logic would go here
  res.json({ received: true });
});

router.post('/wipay', (req, res) => {
  // WiPay return/webhook logic
  res.json({ success: true });
});

router.post('/ezee', (req, res) => {
  // Ezee return/webhook logic
  res.json({ success: true });
});

module.exports = router;
