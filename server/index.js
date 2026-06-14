require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const runMigrations = require('./db/migrations');
const seed = require('./db/seed');
const startJobs = require('./jobs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Initialize DB
runMigrations();
seed();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/announcements', require('./routes/announcements'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), version: '1.0.0' });
});

// Production setup
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    }
  });
}

// Start jobs
startJobs();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
