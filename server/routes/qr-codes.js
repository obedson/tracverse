// routes/qr-codes.js - QR Code Management API
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const QRCode = require('qrcode');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

/**
 * GET /api/qr-codes/:referralCode
 * Get existing QR code for referral code
 */
router.get('/:referralCode', async (req, res) => {
  try {
    const { referralCode } = req.params;

    // Generate QR code on-the-fly
    const referralUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=${referralCode}`;
    const qrCodeDataURL = await QRCode.toDataURL(referralUrl);

    res.json({
      referral_code: referralCode,
      qr_code_url: qrCodeDataURL,
      referral_url: referralUrl
    });
  } catch (error) {
    console.error('QR code retrieval error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

/**
 * POST /api/qr-codes/generate
 * Generate QR code for referral link
 */
router.post('/generate', async (req, res) => {
  try {
    const { referral_code, campaign = 'qr_code' } = req.body;

    if (!referral_code) {
      return res.status(400).json({ error: 'Referral code is required' });
    }

    // Generate referral URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const referralUrl = `${baseUrl}/register?ref=${referral_code}&utm_source=qr&utm_medium=qr_code&utm_campaign=${campaign}`;

    // Generate QR code
    const qrCodeData = await QRCode.toDataURL(referralUrl);

    res.json({
      success: true,
      message: 'QR code generated successfully',
      qr_code: {
        referral_code,
        referral_url: referralUrl,
        qr_code_data: qrCodeData
      }
    });

  } catch (error) {
    console.error('QR code generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
