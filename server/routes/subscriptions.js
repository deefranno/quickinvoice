const express = require('express');
const db = require('../db/database');
const auth = require('../middleware/auth');
const PLANS = require('../config/plans');
const router = express.Router();

// Get plans (public)
router.get('/plans', (req, res) => {
  res.json(PLANS);
});

// Get current user subscription + payment history
router.get('/current', auth, (req, res) => {
  try {
    const subscription = db.prepare(
      'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(req.user.id);
    const payments = db.prepare(
      'SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
    ).all(req.user.id);
    const user = db.prepare('SELECT plan FROM users WHERE id = ?').get(req.user.id);
    res.json({ subscription, payments, current_plan: user.plan });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create payment link / initiate subscription
router.post('/create-payment-link', auth, (req, res) => {
  const { plan, billing_cycle, gateway } = req.body;
  if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' });
  if (!['stripe', 'wipay', 'ezee'].includes(gateway)) return res.status(400).json({ error: 'Invalid gateway' });

  const amount = billing_cycle === 'annual'
    ? PLANS[plan].price_annual_usd
    : PLANS[plan].price_monthly_usd;

  // For now, return a mock payment URL — replace with real gateway calls when keys are set
  const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;
  const hasWiPayKey = !!process.env.WIPAY_API_KEY;

  if (gateway === 'stripe' && hasStripeKey) {
    // Real Stripe integration would go here
    return res.json({ payment_url: `/subscribe?plan=${plan}&cycle=${billing_cycle}&gateway=stripe` });
  }

  if (gateway === 'wipay' && hasWiPayKey) {
    return res.json({ payment_url: `/subscribe?plan=${plan}&cycle=${billing_cycle}&gateway=wipay` });
  }

  // Demo mode
  res.json({
    payment_url: `/subscription/success?plan=${plan}&cycle=${billing_cycle}&gateway=${gateway}&amount=${amount}`,
    demo: true,
    message: 'Gateway not configured — using demo mode'
  });
});

// Webhook / manual activation (called after successful payment)
router.post('/activate', auth, (req, res) => {
  const { plan, billing_cycle, gateway, gateway_payment_id, amount } = req.body;
  if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' });

  try {
    const now = new Date();
    const periodEnd = new Date(now);
    if (billing_cycle === 'annual') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Cancel any existing active subscription
    db.prepare(
      "UPDATE subscriptions SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP WHERE user_id = ? AND status = 'active'"
    ).run(req.user.id);

    // Create new subscription
    const sub = db.prepare(`
      INSERT INTO subscriptions (user_id, plan, status, payment_gateway, gateway_payment_id, amount, currency, billing_cycle, current_period_start, current_period_end)
      VALUES (?, ?, 'active', ?, ?, ?, 'USD', ?, CURRENT_TIMESTAMP, ?)
    `).run(req.user.id, plan, gateway || 'manual', gateway_payment_id || null, amount || PLANS[plan].price_monthly_usd, billing_cycle || 'monthly', periodEnd.toISOString());

    // Log payment
    db.prepare(`
      INSERT INTO payments (user_id, subscription_id, amount, currency, status, payment_gateway, gateway_payment_id, description)
      VALUES (?, ?, ?, 'USD', 'succeeded', ?, ?, ?)
    `).run(req.user.id, sub.lastInsertRowid, amount || PLANS[plan].price_monthly_usd, gateway || 'manual', gateway_payment_id || null, `${PLANS[plan].name} Plan - ${billing_cycle}`);

    // Update user plan
    db.prepare('UPDATE users SET plan = ? WHERE id = ?').run(plan, req.user.id);

    res.json({ success: true, plan, period_end: periodEnd.toISOString() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel subscription
router.put('/cancel', auth, (req, res) => {
  try {
    db.prepare(
      "UPDATE subscriptions SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP WHERE user_id = ? AND status = 'active'"
    ).run(req.user.id);
    db.prepare("UPDATE users SET plan = 'free' WHERE id = ?").run(req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
