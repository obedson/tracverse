const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const earningsCap = async (req, res, next) => {
  try {
    const { userId, amount } = req.body;
    
    if (!userId || !amount) {
      return next();
    }

    const { data: user } = await supabase
      .from('users')
      .select('total_earnings, membership_price')
      .eq('id', userId)
      .single();

    const membershipPrice = user?.membership_price || 25000;
    const cap = membershipPrice * 1.5; // 150% cap
    const currentEarnings = user?.total_earnings || 0;

    if (currentEarnings + amount > cap) {
      return res.status(400).json({
        error: 'Earnings cap exceeded',
        cap,
        current: currentEarnings,
        attempted: amount,
        message: 'Upgrade membership to increase earnings limit'
      });
    }

    next();
  } catch (error) {
    console.error('Earnings cap check error:', error);
    next();
  }
};

module.exports = earningsCap;
