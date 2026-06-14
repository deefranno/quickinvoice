module.exports = {
  free: {
    name: 'Free',
    price_monthly_usd: 0,
    price_annual_usd: 0,
    invoice_limit: 5,      // per month
    client_limit: 5,
    currencies: ['JMD', 'USD', 'TTD', 'BBD'],
    whatsapp_reminders: false,
    pdf_export: true,
    reports: false,
    multi_currency: true
  },
  pro: {
    name: 'Pro',
    price_monthly_usd: 29.99,
    price_annual_usd: 287.90,  // 20% off
    invoice_limit: null,       // unlimited
    client_limit: null,
    currencies: ['JMD', 'USD', 'TTD', 'BBD', 'GYD', 'XCD'],
    whatsapp_reminders: true,
    pdf_export: true,
    reports: true,
    multi_currency: true
  }
};
