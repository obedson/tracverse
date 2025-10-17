const { createClient } = require('@supabase/supabase-js');

class MLMService {
  constructor() {
    this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  }

  async validateReferralCode(code) {
    if (!code || typeof code !== 'string') {
      return { valid: false, message: 'Invalid referral code format' };
    }

    try {
      const { data: sponsor } = await this.supabase
        .from('users')
        .select('id, email, referral_code, active_status')
        .eq('referral_code', code.trim())
        .single();

      if (!sponsor) {
        return { valid: false, message: 'Referral code not found' };
      }

      if (!sponsor.active_status) {
        return { valid: false, message: 'Sponsor account is inactive' };
      }

      return { 
        valid: true, 
        message: 'Valid referral code',
        sponsor: {
          id: sponsor.id,
          email: sponsor.email,
          referral_code: sponsor.referral_code
        }
      };
    } catch (error) {
      console.error('Referral validation error:', error);
      return { valid: false, message: 'Validation service unavailable' };
    }
  }

  async getCommissionPlan(membershipTier) {
    const { data: plan } = await this.supabase
      .from('commission_plans')
      .select('level, commission_rate')
      .eq('membership_tier', membershipTier)
      .eq('is_active', true)
      .order('level');

    return plan || [];
  }

  async processTaskCompletion(userId, pointsEarned) {
    // Check compliance status first
    const { data: user } = await this.supabase
      .from('users')
      .select('rank, can_earn_commissions, cooling_off_end, kyc_status')
      .eq('id', userId)
      .single();

    // Block commission processing if not compliant
    if (!user?.can_earn_commissions || user?.kyc_status !== 'approved') {
      return { 
        points_added: pointsEarned, 
        commissions: [],
        blocked_reason: 'User not eligible for commissions - compliance required'
      };
    }

    // Check cooling-off period
    if (user.cooling_off_end && new Date() < new Date(user.cooling_off_end)) {
      return { 
        points_added: pointsEarned, 
        commissions: [],
        blocked_reason: 'User in cooling-off period'
      };
    }

    const membershipTier = user?.rank || 'Bronze';
    const commissionPlan = await this.getCommissionPlan(membershipTier);
    const upline = await this.getUplineChain(userId, commissionPlan.length);
    const commissions = [];

    for (let i = 0; i < upline.length && i < commissionPlan.length; i++) {
      const sponsor = upline[i];
      const rate = commissionPlan[i].commission_rate;
      const amount = pointsEarned * rate;

      if (await this.checkEarningsCap(sponsor.id, amount)) {
        const { data: commission } = await this.supabase
          .from('commissions')
          .insert({
            user_id: sponsor.id,
            from_user_id: userId,
            amount,
            type: 'unilevel',
            level: i + 1,
            status: 'pending'
          })
          .select()
          .single();

        commissions.push(commission);
      }
    }

    return { points_added: pointsEarned, commissions };
  }

  async checkEarningsCap(userId, newAmount) {
    const { data: user } = await this.supabase
      .from('users')
      .select('total_earnings, membership_price')
      .eq('id', userId)
      .single();

    const cap = (user?.membership_price || 25000) * 1.5; // 150% cap
    return (user?.total_earnings || 0) + newAmount <= cap;
  }

  async getUplineChain(userId, levels = 4) {
    const upline = [];
    let currentUserId = userId;

    for (let i = 0; i < levels; i++) {
      const { data: user } = await this.supabase
        .from('users')
        .select('id, sponsor_id, email, active_status')
        .eq('id', currentUserId)
        .single();

      if (!user?.sponsor_id) break;

      const { data: sponsor } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', user.sponsor_id)
        .single();

      if (sponsor?.active_status) {
        upline.push(sponsor);
      }
      currentUserId = user.sponsor_id;
    }

    return upline;
  }

  async executeCommissionRun(period, runType = 'monthly') {
    const { data: pendingCommissions } = await this.supabase
      .from('commissions')
      .select('*')
      .eq('status', 'pending');

    let processed = 0;
    for (const commission of pendingCommissions || []) {
      await this.supabase
        .from('commissions')
        .update({ status: 'approved' })
        .eq('id', commission.id);
      processed++;
    }

    return { processed, period, run_type: runType };
  }

  async calculateLeadershipBonuses(period) {
    const { data: leaders } = await this.supabase
      .from('users')
      .select('*')
      .gte('team_volume', 100000); // Leadership threshold

    const bonuses = [];
    for (const leader of leaders || []) {
      const bonus = leader.team_volume * 0.01; // 1% leadership bonus
      const { data: commission } = await this.supabase
        .from('commissions')
        .insert({
          user_id: leader.id,
          amount: bonus,
          type: 'leadership',
          status: 'pending'
        })
        .select()
        .single();

      bonuses.push(commission);
    }

    return bonuses;
  }

  async calculateRankBonuses(period) {
    const rankBonuses = {
      'Silver': 5000,
      'Gold': 15000,
      'Platinum': 50000,
      'Diamond': 150000
    };

    const bonuses = [];
    for (const [rank, amount] of Object.entries(rankBonuses)) {
      const { data: users } = await this.supabase
        .from('users')
        .select('*')
        .eq('rank', rank);

      for (const user of users || []) {
        const { data: commission } = await this.supabase
          .from('commissions')
          .insert({
            user_id: user.id,
            amount,
            type: 'rank_bonus',
            status: 'pending'
          })
          .select()
          .single();

        bonuses.push(commission);
      }
    }

    return bonuses;
  }

  async registerWithReferral(userData, sponsorCode) {
    let sponsorId = null;
    
    if (sponsorCode) {
      const validation = await this.validateReferralCode(sponsorCode);
      if (validation.valid) {
        sponsorId = validation.sponsor.id;
      }
    }

    const referralCode = Math.random().toString(36).substring(2, 14).toUpperCase();
    
    const { data: user } = await this.supabase
      .from('users')
      .insert({
        ...userData,
        sponsor_id: sponsorId,
        referral_code: referralCode
      })
      .select()
      .single();

    return { user, sponsor: sponsorId ? { id: sponsorId } : null };
  }

  async getDownline(userId, levels = 1) {
    const { data: downline } = await this.supabase
      .from('users')
      .select('*')
      .eq('sponsor_id', userId);

    return downline || [];
  }

  async getTreeStats(userId) {
    if (!userId) throw new Error('User ID required');

    try {
      const { data: directReferrals, error: directError } = await this.supabase
        .from('users')
        .select('id, active_status, personal_volume, created_at')
        .eq('sponsor_id', userId);

      if (directError) throw directError;

      const activeCount = directReferrals?.filter(u => u.active_status).length || 0;
      const totalVolume = directReferrals?.reduce((sum, u) => sum + (u.personal_volume || 0), 0) || 0;

      return {
        total_downline: directReferrals?.length || 0,
        direct_referrals: directReferrals?.length || 0,
        active_members: activeCount,
        total_volume: totalVolume,
        calculated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Tree stats error:', error);
      throw new Error('Unable to calculate team statistics');
    }
  }
}

module.exports = new MLMService();
