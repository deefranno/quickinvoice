const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const auth = require('../middleware/auth');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_to_random_string';

router.post('/register', async (req, res) => {
  const { name, email, password, business_name } = req.body;

  try {
    const password_hash = await bcrypt.hash(password, 10);
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, business_name, plan)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, email, password_hash, business_name, 'free');

    const userId = result.lastInsertRowid;
    
    // Create initial subscription
    db.prepare(`
      INSERT INTO subscriptions (user_id, plan, status)
      VALUES (?, ?, ?)
    `).run(userId, 'free', 'active');

    const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
    const user = db.prepare('SELECT id, name, email, business_name, plan FROM users WHERE id = ?').get(userId);

    res.status(201).json({ token, user });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    const { password_hash, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', auth, (req, res) => {
  res.json(req.user);
});

module.exports = router;
