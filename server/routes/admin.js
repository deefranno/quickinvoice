const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const adminAuth = require('../middleware/adminAuth');
const PLANS = require('../config/plans');
const router = express.Router();

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'change_this_different_string';

// ─── Auth ───────────────────────────────────────────
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
    if (!admin) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    if (admin.must_change_password) {
      const tempToken = jwt.sign({ id: admin.id, temp: true }, ADMIN_JWT_SECRET, { expiresIn: '15m' });
      return res.json({ must_change_password: true, temp_token: tempToken });
    }

    const token = jwt.sign({ id: admin.id }, ADMIN_JWT_SECRET, { expiresIn: '8h' });
    db.prepare('UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(admin.id);
    res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/auth/change-password', async (req, res) => {
  const { temp_token, new_password } = req.body;
  try {
    const decoded = jwt.verify(temp_token, ADMIN_JWT_SECRET);
    if (!decoded.temp) throw new Error('Not a temp token');
    const password_hash = await bcrypt.hash(new_password, 10);
    db.prepare('UPDATE admins SET password_hash = ?, must_change_password = 0 WHERE id = ?').run(password_hash, decoded.id);
    const token = jwt.sign({ id: decoded.id }, ADMIN_JWT_SECRET, { expiresIn: '8h' });
    res.json({ token });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// ─── Stats ──────────────────────────────────────────
router.get('/stats', adminAuth, (req, res) => {
  try {
    const total_users = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const pro_users = db.prepare("SELECT COUNT(*) as count FROM users WHERE plan = 'pro'").get().count;
    const free_users = db.prepare("SELECT COUNT(*) as count FROM users WHERE plan = 'free'").get().count;
    const active_subscriptions = db.prepare("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'").get().count;

    const revenue_this_month = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as amount FROM payments
      WHERE status = 'succeeded'
      AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `).get().amount;

    const revenue_total = db.prepare(
      "SELECT COALESCE(SUM(amount), 0) as amount FROM payments WHERE status = 'succeeded'"
    ).get().amount;

    const mrr = pro_users * 29.99;

    const recent_signups = db.prepare(
      'SELECT id, name, email, plan, created_at FROM users ORDER BY created_at DESC LIMIT 10'
    ).all();

    const recent_payments = db.prepare(`
      SELECT p.*, u.name as user_name, u.email as user_email
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC LIMIT 10
    `).all();

    const gateway_breakdown = db.prepare(`
      SELECT payment_gateway,
        COUNT(*) as transactions,
        COALESCE(SUM(amount), 0) as revenue
      FROM payments WHERE status = 'succeeded'
      GROUP BY payment_gateway
    `).all();

    res.json({
      total_users, pro_users, free_users,
      active_subscriptions,
      mrr,
      revenue_this_month,
      revenue_total,
      recent_signups,
      recent_payments,
      gateway_breakdown
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Users ──────────────────────────────────────────
router.get('/users', adminAuth, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT u.*,
        (SELECT COUNT(*) FROM invoices WHERE user_id = u.id) as invoice_count,
        s.status as subscription_status,
        s.payment_gateway,
        s.billing_cycle,
        s.current_period_end,
        s.amount as sub_amount
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Upgrade/downgrade user plan manually
router.put('/users/:id/plan', adminAuth, (req, res) => {
  const { plan, note } = req.body;
  if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' });
  try {
    db.prepare('UPDATE users SET plan = ? WHERE id = ?').run(plan, req.params.id);

    if (plan === 'free') {
      db.prepare(
        "UPDATE subscriptions SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP WHERE user_id = ? AND status = 'active'"
      ).run(req.params.id);
    } else {
      // Create manual subscription record
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      db.prepare(
        "UPDATE subscriptions SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP WHERE user_id = ? AND status = 'active'"
      ).run(req.params.id);
      db.prepare(`
        INSERT INTO subscriptions (user_id, plan, status, payment_gateway, amount, currency, billing_cycle, current_period_start, current_period_end)
        VALUES (?, ?, 'active', 'manual', ?, 'USD', 'monthly', CURRENT_TIMESTAMP, ?)
      `).run(req.params.id, plan, PLANS[plan].price_monthly_usd, periodEnd.toISOString());
    }

    // Log the action
    db.prepare(`
      INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
      VALUES (?, 'plan_change', 'user', ?, ?)
    `).run(req.admin.id, req.params.id, JSON.stringify({ plan, note: note || 'Manual admin change' }));

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Subscriptions ──────────────────────────────────
router.get('/subscriptions', adminAuth, (req, res) => {
  try {
    const subscriptions = db.prepare(`
      SELECT s.*, u.name as user_name, u.email as user_email
      FROM subscriptions s
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
      LIMIT 100
    `).all();
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel a specific subscription
router.put('/subscriptions/:id/cancel', adminAuth, (req, res) => {
  try {
    const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(req.params.id);
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });

    db.prepare(
      "UPDATE subscriptions SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(req.params.id);
    db.prepare("UPDATE users SET plan = 'free' WHERE id = ?").run(sub.user_id);

    db.prepare(`
      INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
      VALUES (?, 'cancel_subscription', 'subscription', ?, ?)
    `).run(req.admin.id, req.params.id, JSON.stringify({ user_id: sub.user_id }));

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Payments ───────────────────────────────────────
router.get('/payments', adminAuth, (req, res) => {
  try {
    const payments = db.prepare(`
      SELECT p.*, u.name as user_name, u.email as user_email
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 100
    `).all();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Manual refund (marks as refunded, no gateway call)
router.put('/payments/:id/refund', adminAuth, (req, res) => {
  try {
    db.prepare("UPDATE payments SET status = 'refunded' WHERE id = ?").run(req.params.id);
    db.prepare(`
      INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
      VALUES (?, 'refund', 'payment', ?, ?)
    `).run(req.admin.id, req.params.id, JSON.stringify({ note: req.body.note || '' }));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Settings ───────────────────────────────────────
router.get('/settings', adminAuth, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM platform_settings').all();
    const settings = {};
    rows.forEach(r => settings[r.key] = r.value);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/settings', adminAuth, (req, res) => {
  try {
    const stmt = db.prepare(
      "INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP"
    );
    const updateMany = db.transaction((entries) => {
      for (const [key, value] of entries) stmt.run(key, String(value));
    });
    updateMany(Object.entries(req.body));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Announcements (admin) ──────────────────────────
router.get('/announcements', adminAuth, (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM announcements ORDER BY created_at DESC').all());
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/announcements', adminAuth, (req, res) => {
  const { title, message, type, target, show_from, show_until } = req.body;
  try {
    db.prepare(`
      INSERT INTO announcements (title, message, type, target, show_from, show_until)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(title, message, type || 'info', target || 'all', show_from || null, show_until || null);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/announcements/:id', adminAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
