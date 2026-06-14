const express = require('express');
const db = require('../db/database');
const auth = require('../middleware/auth');
const PLANS = require('../config/plans');
const router = express.Router();

router.get('/', auth, (req, res) => {
  const userId = req.user.id;
  try {
    const clients = db.prepare(`
      SELECT c.*, 
      (SELECT COUNT(*) FROM invoices WHERE client_id = c.id) as invoice_count,
      (SELECT SUM(ii.unit_price * ii.quantity) 
       FROM invoice_items ii 
       JOIN invoices i ON ii.invoice_id = i.id 
       WHERE i.client_id = c.id) as total_billed
      FROM clients c
      WHERE c.user_id = ?
    `).all(userId);
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, (req, res) => {
  const userId = req.user.id;
  const { name, email, phone, country, address } = req.body;
  const plan = PLANS[req.user.plan];

  try {
    const currentCount = db.prepare('SELECT COUNT(*) as count FROM clients WHERE user_id = ?').get(userId).count;
    
    if (plan.client_limit !== null && currentCount >= plan.client_limit) {
      return res.status(403).json({ error: 'PLAN_LIMIT_REACHED', message: 'Upgrade to create more clients' });
    }

    const result = db.prepare(`
      INSERT INTO clients (user_id, name, email, phone, country, address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, name, email, phone, country, address);

    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', auth, (req, res) => {
  try {
    const client = db.prepare('SELECT * FROM clients WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', auth, (req, res) => {
  const { name, email, phone, country, address } = req.body;
  try {
    const result = db.prepare(`
      UPDATE clients SET name = ?, email = ?, phone = ?, country = ?, address = ?
      WHERE id = ? AND user_id = ?
    `).run(name, email, phone, country, address, req.params.id, req.user.id);

    if (result.changes === 0) return res.status(404).json({ error: 'Client not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', auth, (req, res) => {
  try {
    const invoiceCount = db.prepare('SELECT COUNT(*) as count FROM invoices WHERE client_id = ?').get(req.params.id).count;
    if (invoiceCount > 0) {
      return res.status(400).json({ error: 'Cannot delete client with existing invoices' });
    }

    const result = db.prepare('DELETE FROM clients WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Client not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
