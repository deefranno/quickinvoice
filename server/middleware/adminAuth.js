const jwt = require('jsonwebtoken');
const db = require('../db/database');

const adminAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || 'change_this_different_string');
    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(decoded.id);

    if (!admin) {
      throw new Error();
    }

    req.admin = admin;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid admin token' });
  }
};

module.exports = adminAuth;
