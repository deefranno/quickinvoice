const express = require('express');
const db = require('../db/database');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/active', auth, (req, res) => {
  try {
    const announcement = db.prepare(`
      SELECT * FROM announcements 
      WHERE active = 1 
      AND (target = 'all' OR target = ?)
      AND (show_from IS NULL OR show_from <= CURRENT_TIMESTAMP)
      AND (show_until IS NULL OR show_until >= CURRENT_TIMESTAMP)
      ORDER BY created_at DESC LIMIT 1
    `).get(req.user.plan);
    res.json(announcement || null);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
