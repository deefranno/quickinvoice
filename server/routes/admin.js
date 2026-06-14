const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'change_this_different_string';

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
    if (!decoded.temp) throw new Error();

    const password_hash = await bcrypt.hash(new_password, 10);
    db.prepare('UPDATE admins SET password_hash = ?, must_change_password = 0 WHERE id = ?').run(password_hash, decoded.id);

    const token = jwt.sign({ id: decoded.id }, ADMIN_JWT_SECRET, { expiresIn: '8h' });
    res.json({ token });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired temporary token' });
  }
});

router.get('/stats', adminAuth, (req, res) => {
  try {
    const total_users = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const active_subscriptions = db.prepare("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'").get().count;
    const revenue_this_month = db.prepare(`
      SELECT SUM(amount) as amount FROM payments 
      WHERE status = 'succeeded' 
      AND strftime('%m', created_at) = strftime('%m', 'now')
    `).get().amount || 0;

    res.json({
      total_users,
      active_subscriptions,
      mrr: active_subscriptions * 15, // Simplified MRR
      revenue_this_month,
      failed_payments: 0,
      gateway_breakdown: {
        stripe: { subscribers: active_subscriptions, revenue: revenue_this_month },
        wipay: { subscribers: 0, revenue: 0 },
        ezee: { subscribers: 0, revenue: 0 }
      },
      recent_signups: db.prepare('SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 10').all(),
      recent_payments: db.prepare('SELECT * FROM payments ORDER BY created_at DESC LIMIT 10').all()
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/users', adminAuth, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT u.*, 
      (SELECT COUNT(*) FROM invoices WHERE user_id = u.id) as invoice_count,
      s.status as subscription_status
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      GROUP BY u.id
    `).all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/settings', adminAuth, (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM platform_settings').all();
    const settingsObj = {};
    settings.forEach(s => settingsObj[s.key] = s.value);
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
