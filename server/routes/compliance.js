// routes/compliance.js
const express = require('express');
const router = express.Router();
const mlmService = require('../services/mlmService');

/**
 * GET /api/compliance/cooling-off/:userId
 * Get cooling-off period status for user
 */
router.get('/cooling-off/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const status = await mlmService.handleCoolingOffPeriod(userId);

    res.json(status);

  } catch (error) {
    console.error('Cooling-off Status Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch cooling-off status',
      message: error.message 
    });
  }
});

/**
 * POST /api/compliance/cancel-cooling-off
 * Process cooling-off period cancellation
 */
router.post('/cancel-cooling-off', async (req, res) => {
  try {
    const { user_id, reason = 'user_request' } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const cancellation = await mlmService.processCoolingOffCancellation(user_id, reason);

    res.json({
      message: 'Cooling-off cancellation processed',
      cancellation
    });

  } catch (error) {
    console.error('Cooling-off Cancellation Error:', error);
    res.status(500).json({ 
      error: 'Failed to process cooling-off cancellation',
      message: error.message 
    });
  }
});

/**
 * POST /api/compliance/refund-request
 * Process refund request
 */
router.post('/refund-request', async (req, res) => {
  try {
    const { user_id, refund_data } = req.body;

    if (!user_id || !refund_data) {
      return res.status(400).json({ error: 'User ID and refund data are required' });
    }

    const result = await mlmService.processRefundRequest(user_id, refund_data);

    res.json({
      message: 'Refund request processed',
      status: result.status,
      approved_amount: result.approved_amount,
      net_refund: result.net_refund,
      result
    });

  } catch (error) {
    console.error('Refund Request Error:', error);
    res.status(500).json({ 
      error: 'Failed to process refund request',
      message: error.message 
    });
  }
});

/**
 * POST /api/compliance/kyc-verify
 * Perform KYC verification for user
 */
router.post('/kyc-verify', async (req, res) => {
  try {
    const { user_id, kyc_data } = req.body;

    if (!user_id || !kyc_data) {
      return res.status(400).json({ error: 'User ID and KYC data are required' });
    }

    const result = await mlmService.performKYCVerification(user_id, kyc_data);

    res.json({
      message: 'KYC verification completed',
      status: result.status,
      verification_score: result.verification_score,
      result
    });

  } catch (error) {
    console.error('KYC Verification Error:', error);
    res.status(500).json({ 
      error: 'Failed to perform KYC verification',
      message: error.message 
    });
  }
});

/**
 * POST /api/compliance/aml-screen
 * Perform AML screening for user
 */
router.post('/aml-screen', async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const result = await mlmService.performAMLScreening(user_id);

    res.json({
      message: 'AML screening completed',
      risk_level: result.risk_level,
      requires_review: result.requires_review,
      result
    });

  } catch (error) {
    console.error('AML Screening Error:', error);
    res.status(500).json({ 
      error: 'Failed to perform AML screening',
      message: error.message 
    });
  }
});

/**
 * GET /api/compliance/1099-forms
 * Generate 1099 tax forms
 */
router.get('/1099-forms', async (req, res) => {
  try {
    const { tax_year, threshold = 600 } = req.query;
    const year = tax_year || new Date().getFullYear().toString();
    
    const forms = await mlmService.generate1099Forms(year, parseFloat(threshold));

    res.json({
      tax_year: year,
      threshold,
      forms_generated: forms.length,
      total_reportable_income: forms.reduce((sum, f) => sum + f.total_earnings, 0),
      forms
    });

  } catch (error) {
    console.error('1099 Forms Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate 1099 forms',
      message: error.message 
    });
  }
});

/**
 * GET /api/compliance/income-disclosure
 * Generate income disclosure statement
 */
router.get('/income-disclosure', async (req, res) => {
  try {
    const { period } = req.query;
    
    const disclosure = await mlmService.generateIncomeDisclosure(period);

    res.json(disclosure);

  } catch (error) {
    console.error('Income Disclosure Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate income disclosure',
      message: error.message 
    });
  }
});

module.exports = router;
