const express = require('express');
const db = require('../db/database');
const auth = require('../middleware/auth');
const PLANS = require('../config/plans');
const router = express.Router();

router.get('/current', auth, (req, res) => {
  try {
    const subscription = db.prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(req.user.id);
    const payments = db.prepare('SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(req.user.id);
    res.json({ subscription, payments });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/create-payment-link', auth, (req, res) => {
  const { plan, billing_cycle, gateway } = req.body;
  // This is a mock implementation as per the prompt's gateway instructions
  // In a real app, we'd call the specific gateway module
  res.json({ payment_url: `/subscription/success?plan=${plan}&gateway=${gateway}` });
});

router.put('/cancel', auth, (req, res) => {
  try {
    db.prepare("UPDATE subscriptions SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP WHERE user_id = ? AND status = 'active'").run(req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/plans', (req, res) => {
  res.json(PLANS);
});

module.exports = router;
