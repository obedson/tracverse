const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with error handling
let supabase;
try {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase environment variables');
    throw new Error('Supabase configuration missing');
  }
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
} catch (error) {
  console.error('Supabase client initialization failed:', error);
}

// Membership plan earning caps (percentage of plan price)
const EARNING_CAPS = {
  // Non-membership users
  'none': { percentage: 150, basePrice: 25000 }, // 150% of Bronze I
  
  // Bronze tier (200%)
  'Bronze I': { percentage: 200, basePrice: 25000 },
  'Bronze II': { percentage: 200, basePrice: 62500 },
  'Bronze III': { percentage: 200, basePrice: 125000 },
  
  // Silver tier (250%)
  'Silver I': { percentage: 250, basePrice: 250000 },
  'Silver II': { percentage: 250, basePrice: 500000 },
  'Silver III': { percentage: 250, basePrice: 1000000 },
  
  // Gold tier (300%)
  'Gold I': { percentage: 300, basePrice: 1875000 },
  'Gold II': { percentage: 300, basePrice: 3750000 },
  'Gold III': { percentage: 300, basePrice: 7500000 },
  
  // Platinum tier (400%)
  'Platinum I': { percentage: 400, basePrice: 12500000 },
  'Platinum II': { percentage: 400, basePrice: 25000000 },
  'Platinum III': { percentage: 400, basePrice: 50000000 },
  
  // Diamond tier (500% / Unlimited)
  'Diamond I': { percentage: 500, basePrice: 87500000 },
  'Diamond II': { percentage: 500, basePrice: 175000000 },
  'Diamond III': { percentage: 'unlimited', basePrice: 375000000 }
};

// Check if user can receive referral rewards
async function checkEarningsCap(userId) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('current_membership_plan, current_plan_earnings, earnings_cap_reached')
      .eq('user_id', userId)
      .single();

    if (error || !user) {
      return { canEarn: true, reason: 'User not found' };
    }

    // If already capped, return false
    if (user.earnings_cap_reached) {
      return { canEarn: false, reason: 'Earnings cap reached' };
    }

    const membershipPlan = user.current_membership_plan || 'none';
    const capConfig = EARNING_CAPS[membershipPlan];

    if (!capConfig) {
      return { canEarn: true, reason: 'No cap configuration' };
    }

    // Diamond III has unlimited earnings
    if (capConfig.percentage === 'unlimited') {
      return { canEarn: true, reason: 'Unlimited earnings' };
    }

    // Calculate earning limit
    const earningLimit = (capConfig.basePrice * capConfig.percentage) / 100;
    const currentEarnings = parseFloat(user.current_plan_earnings || 0);

    return {
      canEarn: currentEarnings < earningLimit,
      currentEarnings,
      earningLimit,
      percentage: (currentEarnings / earningLimit) * 100,
      membershipPlan
    };

  } catch (error) {
    console.error('Earnings cap check error:', error);
    return { canEarn: true, reason: 'Error checking cap' };
  }
}

// Add referral earnings to user
async function addReferralEarnings(userId, amount) {
  try {
    // Check if user can earn
    const capCheck = await checkEarningsCap(userId);
    
    if (!capCheck.canEarn) {
      return { success: false, reason: capCheck.reason };
    }

    // Add earnings
    const { error } = await supabase.rpc('add_referral_earnings', {
      user_id: userId,
      earning_amount: amount
    });

    if (error) {
      // Fallback: manual update
      const { data: user } = await supabase
        .from('users')
        .select('total_referral_earnings, current_plan_earnings')
        .eq('user_id', userId)
        .single();

      if (user) {
        await supabase
          .from('users')
          .update({
            total_referral_earnings: (parseFloat(user.total_referral_earnings) || 0) + amount,
            current_plan_earnings: (parseFloat(user.current_plan_earnings) || 0) + amount
          })
          .eq('user_id', userId);
      }
    }

    // Check if cap reached after adding earnings
    const newCapCheck = await checkEarningsCap(userId);
    
    // Send warning at 90%
    if (newCapCheck.percentage >= 90 && newCapCheck.percentage < 100) {
      await sendCapWarning(userId, newCapCheck);
    }
    
    // Suspend at 100%
    if (newCapCheck.percentage >= 100) {
      await suspendEarnings(userId);
    }

    return { success: true, newStatus: newCapCheck };

  } catch (error) {
    console.error('Add referral earnings error:', error);
    return { success: false, reason: 'Database error' };
  }
}

// Send cap warning
async function sendCapWarning(userId, capStatus) {
  try {
    await supabase
      .from('users')
      .update({ cap_warning_sent: true })
      .eq('user_id', userId);

    // TODO: Send notification/email to user
    console.log(`Cap warning sent to user ${userId}: ${capStatus.percentage.toFixed(1)}% of limit reached`);
  } catch (error) {
    console.error('Send cap warning error:', error);
  }
}

// Suspend earnings
async function suspendEarnings(userId) {
  try {
    await supabase
      .from('users')
      .update({ earnings_cap_reached: true })
      .eq('user_id', userId);

    console.log(`Earnings suspended for user ${userId}: Cap reached`);
  } catch (error) {
    console.error('Suspend earnings error:', error);
  }
}

module.exports = {
  checkEarningsCap,
  addReferralEarnings,
  EARNING_CAPS
};
