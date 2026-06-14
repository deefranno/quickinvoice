const PLANS = require('../config/plans');

const planGate = (feature) => {
  return (req, res, next) => {
    const userPlan = PLANS[req.user.plan];
    
    if (feature === 'reports' && !userPlan.reports) {
      return res.status(403).json({ error: 'PLAN_UPGRADE_REQUIRED', message: 'Upgrade to access reports' });
    }
    
    if (feature === 'multi_currency' && !userPlan.multi_currency) {
      return res.status(403).json({ error: 'PLAN_UPGRADE_REQUIRED', message: 'Upgrade for multi-currency support' });
    }

    next();
  };
};

module.exports = planGate;
