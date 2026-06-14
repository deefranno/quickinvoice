module.exports = {
  createCheckoutSession: async () => ({ payment_url: '#' }),
  cancelSubscription: async () => ({ success: true })
};
