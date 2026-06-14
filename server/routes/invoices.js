const express = require('express');
const db = require('../db/database');
const auth = require('../middleware/auth');
const PLANS = require('../config/plans');
const router = express.Router();

router.get('/', auth, (req, res) => {
  const { status, currency, search } = req.query;
  const userId = req.user.id;
  
  let query = `
    SELECT i.*, c.name as client_name, c.country as client_country,
    (SELECT SUM(unit_price * quantity) FROM invoice_items WHERE invoice_id = i.id) as subtotal
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE i.user_id = ?
  `;
  const params = [userId];

  if (status && status !== 'all') {
    query += ' AND i.status = ?';
    params.push(status);
  }
  if (currency) {
    query += ' AND i.currency = ?';
    params.push(currency);
  }
  if (search) {
    query += ' AND (c.name LIKE ? OR i.invoice_number LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY i.created_at DESC';

  try {
    const invoices = db.prepare(query).all(...params).map(inv => ({
      ...inv,
      total: (inv.subtotal || 0) * (1 + (inv.gct_enabled * 0.15))
    }));
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, (req, res) => {
  const userId = req.user.id;
  const { client_id, currency, issue_date, due_date, notes, gct_enabled, whatsapp_reminder, items } = req.body;
  const plan = PLANS[req.user.plan];

  try {
    const currentCount = db.prepare('SELECT COUNT(*) as count FROM invoices WHERE user_id = ?').get(userId).count;
    if (plan.invoice_limit !== null && currentCount >= plan.invoice_limit) {
      return res.status(403).json({ error: 'PLAN_LIMIT_REACHED', message: 'Upgrade to create more invoices' });
    }

    const year = new Date().getFullYear();
    const countResult = db.prepare("SELECT COUNT(*) as count FROM invoices WHERE user_id = ? AND strftime('%Y', created_at) = ?").get(userId, year.toString());
    const invoice_number = `INV-${year}-${(countResult.count + 1).toString().padStart(4, '0')}`;

    const transaction = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO invoices (user_id, client_id, invoice_number, currency, issue_date, due_date, notes, gct_enabled, whatsapp_reminder, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, client_id, invoice_number, currency, issue_date, due_date, notes, gct_enabled, whatsapp_reminder, 'pending');

      const invoiceId = result.lastInsertRowid;
      const stmt = db.prepare('INSERT INTO invoice_items (invoice_id, description, quantity, unit_price) VALUES (?, ?, ?, ?)');
      for (const item of items) {
        stmt.run(invoiceId, item.description, item.quantity || 1, item.unit_price);
      }
      return invoiceId;
    });

    const invoiceId = transaction();
    res.status(201).json({ id: invoiceId, invoice_number });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', auth, (req, res) => {
  try {
    const invoice = db.prepare(`
      SELECT i.*, c.name as client_name, c.email as client_email, c.phone as client_phone, c.country as client_country, c.address as client_address
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      WHERE i.id = ? AND i.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(req.params.id);
    const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const total = subtotal * (1 + (invoice.gct_enabled * 0.15));

    res.json({ ...invoice, items, subtotal, total });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', auth, (req, res) => {
  const { client_id, currency, issue_date, due_date, notes, gct_enabled, whatsapp_reminder, items, status } = req.body;
  
  try {
    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE invoices SET client_id = ?, currency = ?, issue_date = ?, due_date = ?, notes = ?, gct_enabled = ?, whatsapp_reminder = ?, status = ?
        WHERE id = ? AND user_id = ?
      `).run(client_id, currency, issue_date, due_date, notes, gct_enabled, whatsapp_reminder, status || 'pending', req.params.id, req.user.id);

      db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(req.params.id);
      
      const stmt = db.prepare('INSERT INTO invoice_items (invoice_id, description, quantity, unit_price) VALUES (?, ?, ?, ?)');
      for (const item of items) {
        stmt.run(req.params.id, item.description, item.quantity || 1, item.unit_price);
      }
    });

    transaction();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', auth, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM invoices WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/status', auth, (req, res) => {
  const { status } = req.body;
  try {
    const result = db.prepare('UPDATE invoices SET status = ? WHERE id = ? AND user_id = ?').run(status, req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
