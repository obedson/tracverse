const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth-enterprise');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Verify Paystack payment
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { reference, planId, ppAllocation } = req.body;
    const userId = req.user.id;

    // Verify payment with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const paymentData = await paystackResponse.json();

    if (!paymentData.status || paymentData.data.status !== 'success') {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // Check if payment already processed
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('reference', reference)
      .single();

    if (existingPayment) {
      return res.status(400).json({ error: 'Payment already processed' });
    }

    // Record payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        reference: reference,
        amount: paymentData.data.amount / 100, // Convert from kobo
        status: 'completed',
        plan_id: planId,
        pp_allocated: ppAllocation,
        payment_method: 'paystack',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment record error:', paymentError);
      return res.status(500).json({ error: 'Failed to record payment' });
    }

    // Add PP to user wallet (simplified - you may need to create this table)
    const { error: ppError } = await supabase
      .from('pp_transactions')
      .insert({
        user_id: userId,
        amount: ppAllocation,
        type: 'membership_purchase',
        description: `Membership purchase - ${ppAllocation} PP`,
        reference: reference,
        status: 'completed',
        created_at: new Date().toISOString()
      });

    if (ppError) {
      console.error('PP allocation error:', ppError);
    }

    // Update user membership tier
    const { error: membershipError } = await supabase
      .from('users')
      .update({ 
        membership_tier: planId,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (membershipError) {
      console.error('Membership update error:', membershipError);
    }

    res.json({
      status: 'success',
      message: 'Payment verified and processed successfully',
      payment_id: payment.id,
      pp_allocated: ppAllocation
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Get user payment history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        id,
        reference,
        amount,
        status,
        plan_id,
        pp_allocated,
        payment_method,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Payment history error:', error);
      return res.status(500).json({ error: 'Failed to fetch payment history' });
    }

    res.json({ payments });

  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

module.exports = router;
