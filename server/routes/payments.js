// routes/payments.js
const express = require('express');
const router = express.Router();
const mlmService = require('../services/mlmService');

/**
 * POST /api/payments/process
 * Process payment for user
 */
router.post('/process', async (req, res) => {
  try {
    const { user_id, amount, method = 'bank_transfer' } = req.body;

    if (!user_id || !amount) {
      return res.status(400).json({ error: 'User ID and amount are required' });
    }

    if (amount < 10) {
      return res.status(400).json({ error: 'Minimum payment amount is $10' });
    }

    const payment = await mlmService.processPayment(user_id, amount, method);

    res.json({
      message: 'Payment processed',
      payment
    });

  } catch (error) {
    console.error('Payment Processing Error:', error);
    res.status(500).json({ 
      error: 'Failed to process payment',
      message: error.message 
    });
  }
});

/**
 * GET /api/payments/methods
 * Get available payment methods and fees
 */
router.get('/methods', async (req, res) => {
  try {
    const methods = {
      bank_transfer: {
        name: 'Bank Transfer (ACH)',
        fee_structure: 'Flat $2.50 fee',
        processing_time: '1-3 business days',
        minimum: 10,
        maximum: 10000
      },
      paypal: {
        name: 'PayPal',
        fee_structure: '2.9% + $0.30',
        processing_time: 'Instant',
        minimum: 10,
        maximum: 5000
      },
      crypto: {
        name: 'Cryptocurrency',
        fee_structure: '1% of amount',
        processing_time: '10-60 minutes',
        minimum: 25,
        maximum: 25000
      },
      check: {
        name: 'Paper Check',
        fee_structure: 'Flat $5.00 fee',
        processing_time: '5-10 business days',
        minimum: 50,
        maximum: 5000
      }
    };

    res.json({ methods });

  } catch (error) {
    console.error('Payment Methods Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payment methods',
      message: error.message 
    });
  }
});

module.exports = router;
