const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// GET /api/pp-wallet/balance - Get user's PP balance breakdown
router.get('/balance', async (req, res) => {
  try {
    const userId = req.user?.userId || 'anonymous';

    // Get all PP transactions for user
    const { data: transactions } = await supabase
      .from('pp_transactions')
      .select('*')
      .eq('user_id', userId);

    // Calculate balances
    const now = new Date();
    let total_pp = 0;
    let available_pp = 0;
    let pending_pp = 0;
    let purchased_pp = 0;
    let earned_pp = 0;

    transactions?.forEach(tx => {
      total_pp += tx.amount;
      
      // Check if transaction is available (past 30-day hold)
      const releaseDate = new Date(tx.created_at);
      releaseDate.setDate(releaseDate.getDate() + 30);
      
      if (tx.status === 'completed' && now >= releaseDate) {
        available_pp += tx.amount;
      } else if (tx.status === 'pending' || now < releaseDate) {
        pending_pp += tx.amount;
      }

      // Categorize by source
      if (tx.category === 'membership_purchase') {
        purchased_pp += tx.amount;
      } else if (['task_completion', 'referral_bonus', 'verification_earning'].includes(tx.category)) {
        earned_pp += tx.amount;
      }
    });

    const balance = {
      total_pp: Math.max(0, total_pp),
      available_pp: Math.max(0, available_pp),
      pending_pp: Math.max(0, pending_pp),
      purchased_pp: Math.max(0, purchased_pp),
      earned_pp: Math.max(0, earned_pp)
    };

    res.json({ balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pp-wallet/transactions - Get user's transaction history
router.get('/transactions', async (req, res) => {
  try {
    const userId = req.user?.userId || 'anonymous';
    const { category, status, page = 1, limit = 50 } = req.query;

    let query = supabase
      .from('pp_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: transactions } = await query;

    // Add calculated fields
    const enhancedTransactions = transactions?.map(tx => {
      const releaseDate = new Date(tx.created_at);
      releaseDate.setDate(releaseDate.getDate() + 30);
      
      const daysRemaining = Math.ceil((releaseDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        id: tx.id,
        type: tx.category,
        amount: tx.amount,
        status: tx.status,
        description: tx.description || getTransactionDescription(tx.category, tx.amount),
        created_at: tx.created_at,
        release_date: releaseDate.toISOString(),
        days_remaining: Math.max(0, daysRemaining)
      };
    }) || [];

    res.json({ transactions: enhancedTransactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/pp-wallet/withdraw - Request PP withdrawal
router.post('/withdraw', async (req, res) => {
  try {
    const userId = req.user?.userId || 'anonymous';
    const { amount, withdrawal_method } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid withdrawal amount' });
    }

    // Check available balance
    const balanceRes = await fetch('/api/pp-wallet/balance');
    const { balance } = await balanceRes.json();

    if (amount > balance.available_pp) {
      return res.status(400).json({ error: 'Insufficient available balance' });
    }

    // Create withdrawal transaction
    const { data: withdrawal } = await supabase
      .from('pp_transactions')
      .insert({
        user_id: userId,
        category: 'withdrawal',
        amount: -amount,
        status: 'processing',
        description: `Withdrawal via ${withdrawal_method}`,
        metadata: { withdrawal_method }
      })
      .select()
      .single();

    res.json({ 
      message: 'Withdrawal request submitted',
      withdrawal,
      processing_time: '1-3 business days'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pp-wallet/analytics - Get PP analytics and insights
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.user?.userId || 'anonymous';
    const { period = '30d' } = req.query;

    const { data: transactions } = await supabase
      .from('pp_transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', getDateRange(period));

    // Calculate analytics
    const analytics = {
      total_earned: transactions?.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0) || 0,
      total_spent: Math.abs(transactions?.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + tx.amount, 0) || 0),
      earning_velocity: calculateEarningVelocity(transactions || []),
      top_earning_category: getTopEarningCategory(transactions || []),
      monthly_trend: calculateMonthlyTrend(transactions || [])
    };

    res.json({ analytics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function getTransactionDescription(category, amount) {
  const descriptions = {
    'membership_purchase': `Membership Purchase (+${amount} PP)`,
    'task_completion': `Task Completed (+${amount} PP)`,
    'referral_bonus': `Referral Commission (+${amount} PP)`,
    'verification_earning': `Verification Reward (+${amount} PP)`,
    'task_promotion': `Task Campaign (${amount} PP)`,
    'withdrawal': `Withdrawal (${amount} PP)`,
    'platform_fee': `Platform Fee (${amount} PP)`
  };
  return descriptions[category] || `Transaction (${amount} PP)`;
}

function getDateRange(period) {
  const now = new Date();
  switch (period) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }
}

function calculateEarningVelocity(transactions) {
  const earnings = transactions.filter(tx => tx.amount > 0);
  const days = 30; // Last 30 days
  return earnings.reduce((sum, tx) => sum + tx.amount, 0) / days;
}

function getTopEarningCategory(transactions) {
  const categories = transactions.reduce((acc, tx) => {
    if (tx.amount > 0) {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    }
    return acc;
  }, {});
  
  return Object.entries(categories).sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';
}

function calculateMonthlyTrend(transactions) {
  // Simple trend calculation - could be enhanced
  const thisMonth = transactions.filter(tx => {
    const txDate = new Date(tx.created_at);
    const now = new Date();
    return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
  });
  
  return thisMonth.reduce((sum, tx) => sum + (tx.amount > 0 ? tx.amount : 0), 0);
}

module.exports = router;
