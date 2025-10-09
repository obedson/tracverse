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

  async getTreeStats(userId) {
    if (!userId) throw new Error('User ID required');

    try {
      // Get direct referrals with proper validation
      const { data: directReferrals, error: directError } = await this.supabase
        .from('users')
        .select('id, active_status, personal_volume, created_at')
        .eq('sponsor_id', userId);

      if (directError) throw directError;

      // Calculate real statistics
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
