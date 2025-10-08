// services/mlmService.js
const { supabase } = require('../config/supabase');
const crypto = require('crypto');

class MLMService {
  
  /**
   * Register a new user with referral tree placement
   * @param {Object} userData - User registration data
   * @param {string} sponsorCode - Sponsor's referral code
   * @returns {Object} Registration result
   */
  async registerWithReferral(userData, sponsorCode = null) {
    try {
      // Generate UUID and referral code
      const userId = crypto.randomUUID();
      const referralCode = this.generateReferralCode();

      // Create user with all required fields
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          user_id: userData.email, // Use email as user_id for compatibility
          email: userData.email,
          password: userData.password,
          referral_code: referralCode,
          active_status: true,
          joined_date: new Date().toISOString()
        })
        .select()
        .single();

      if (userError) throw userError;

      // If no sponsor, user becomes root
      if (!sponsorCode) {
        await this.createReferralTreeEntry(user.id, null, null, 1);
        return { user, placement: 'root' };
      }

      // Find sponsor
      const { data: sponsor, error: sponsorError } = await supabase
        .from('users')
        .select('id, referral_code')
        .eq('referral_code', sponsorCode)
        .single();

      if (sponsorError || !sponsor) {
        throw new Error('Invalid sponsor referral code');
      }

      // Place user in referral tree
      const placement = await this.placeInTree(user.id, sponsor.id);
      
      return { user, sponsor, placement };

    } catch (error) {
      console.error('MLM Registration Error:', error);
      throw error;
    }
  }

  /**
   * Generate referral code
   * @returns {string} Referral code
   */
  generateReferralCode() {
    return 'TRV' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  }

  /**
   * Place user in referral tree (Unilevel structure)
   * @param {string} userId - New user ID
   * @param {string} sponsorId - Sponsor user ID
   * @returns {Object} Placement details
   */
  async placeInTree(userId, sponsorId) {
    try {
      // Get sponsor's level
      const { data: sponsorTree } = await supabase
        .from('referral_tree')
        .select('level')
        .eq('user_id', sponsorId)
        .single();

      const newLevel = sponsorTree ? sponsorTree.level + 1 : 1;

      // Create referral tree entry
      const { data: treeEntry, error } = await supabase
        .from('referral_tree')
        .insert({
          user_id: userId,
          sponsor_id: sponsorId,
          upline_id: sponsorId, // In unilevel, upline = sponsor
          position: 'direct',
          level: newLevel
        })
        .select()
        .single();

      if (error) throw error;

      // Update sponsor's direct referral count
      await this.updateDirectReferralCount(sponsorId);

      return {
        level: newLevel,
        position: 'direct',
        sponsor_id: sponsorId
      };

    } catch (error) {
      console.error('Tree Placement Error:', error);
      throw error;
    }
  }

  /**
   * Create referral tree entry
   * @param {string} userId - User ID
   * @param {string} sponsorId - Sponsor ID (null for root)
   * @param {string} uplineId - Upline ID (null for root)
   * @param {number} level - Tree level
   */
  async createReferralTreeEntry(userId, sponsorId, uplineId, level) {
    const { error } = await supabase
      .from('referral_tree')
      .insert({
        user_id: userId,
        sponsor_id: sponsorId,
        upline_id: uplineId,
        position: sponsorId ? 'direct' : 'root',
        level: level
      });

    if (error) throw error;
  }

  /**
   * Get user's downline (direct referrals)
   * @param {string} userId - User ID
   * @param {number} levels - Number of levels to fetch (default: 1)
   * @returns {Array} Downline users
   */
  async getDownline(userId, levels = 1) {
    try {
      const { data, error } = await supabase
        .from('referral_tree')
        .select(`
          user_id,
          level,
          position,
          placement_date,
          users!referral_tree_user_id_fkey (
            id,
            email,
            referral_code,
            rank,
            personal_volume,
            active_status,
            joined_date
          )
        `)
        .eq('sponsor_id', userId)
        .lte('level', levels)
        .order('placement_date', { ascending: true });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Get Downline Error:', error);
      throw error;
    }
  }

  /**
   * Get user's upline chain
   * @param {string} userId - User ID
   * @param {number} levels - Number of levels up (default: 10)
   * @returns {Array} Upline users
   */
  async getUplineChain(userId, levels = 10) {
    try {
      const uplineChain = [];
      let currentUserId = userId;

      for (let i = 0; i < levels; i++) {
        const { data: treeData } = await supabase
          .from('referral_tree')
          .select(`
            sponsor_id,
            level,
            users!referral_tree_sponsor_id_fkey (
              id,
              email,
              referral_code,
              rank,
              active_status
            )
          `)
          .eq('user_id', currentUserId)
          .single();

        if (!treeData || !treeData.sponsor_id) break;

        uplineChain.push({
          level: i + 1,
          user: treeData.users,
          tree_level: treeData.level - 1
        });

        currentUserId = treeData.sponsor_id;
      }

      return uplineChain;

    } catch (error) {
      console.error('Get Upline Chain Error:', error);
      throw error;
    }
  }

  /**
   * Update direct referral count for user
   * @param {string} userId - User ID
   */
  async updateDirectReferralCount(userId) {
    try {
      const { count } = await supabase
        .from('referral_tree')
        .select('*', { count: 'exact', head: true })
        .eq('sponsor_id', userId);

      // Update user's direct referral count in qualifications
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM

      await supabase
        .from('rank_qualifications')
        .upsert({
          user_id: userId,
          period: currentPeriod,
          direct_referrals: count || 0
        }, {
          onConflict: 'user_id,period'
        });

    } catch (error) {
      console.error('Update Direct Referral Count Error:', error);
    }
  }

  /**
   * Get referral tree statistics for user
   * @param {string} userId - User ID
   * @returns {Object} Tree statistics
   */
  async getTreeStats(userId) {
    try {
      // Direct referrals
      const { count: directCount } = await supabase
        .from('referral_tree')
        .select('*', { count: 'exact', head: true })
        .eq('sponsor_id', userId);

      // Total team size (all levels)
      const downline = await this.getDownline(userId, 10);
      const totalTeamSize = downline.length;

      // Active team members
      const activeTeam = downline.filter(member => 
        member.users && member.users.active_status
      ).length;

      return {
        direct_referrals: directCount || 0,
        total_team_size: totalTeamSize,
        active_team_members: activeTeam,
        team_depth: downline.length > 0 ? Math.max(...downline.map(d => d.level)) : 0
      };

    } catch (error) {
      console.error('Get Tree Stats Error:', error);
      throw error;
    }
  }

  /**
   * Process payouts for eligible users
   * @param {string} period - YYYY-MM format
   */
  async processPayouts(period = null) {
    try {
      const targetPeriod = period || new Date().toISOString().slice(0, 7);
      
      // Get all pending commissions for the period
      const { data: commissions } = await supabase
        .from('commissions')
        .select('user_id, amount')
        .eq('status', 'pending')
        .eq('period', targetPeriod);

      // Group by user_id and sum amounts
      const userTotals = {};
      commissions?.forEach(comm => {
        if (!userTotals[comm.user_id]) userTotals[comm.user_id] = 0;
        userTotals[comm.user_id] += parseFloat(comm.amount);
      });

      const payouts = [];

      for (const [userId, totalPending] of Object.entries(userTotals)) {
        // Get user's payout settings
        const { data: settings } = await supabase
          .from('payout_settings')
          .select('*')
          .eq('user_id', userId)
          .single();

        const threshold = settings?.minimum_threshold || 50;
        
        if (totalPending >= threshold) {
          // Create payout record
          const { data: payout } = await supabase
            .from('payouts')
            .insert({
              user_id: userId,
              amount: totalPending,
              period: targetPeriod,
              payment_method: settings?.payment_method || 'bank_transfer',
              status: 'pending'
            })
            .select()
            .single();

          if (payout) {
            // Mark commissions as paid
            await supabase
              .from('commissions')
              .update({ status: 'paid' })
              .eq('user_id', userId)
              .eq('period', targetPeriod)
              .eq('status', 'pending');

            payouts.push(payout);
          }
        }
      }

      return payouts;
    } catch (error) {
      console.error('Payout Processing Error:', error);
      throw error;
    }
  }

  /**
   * Set user payout preferences
   * @param {string} userId - User ID
   * @param {Object} settings - Payout settings
   */
  async setPayoutSettings(userId, settings) {
    try {
      const { data } = await supabase
        .from('payout_settings')
        .upsert({
          user_id: userId,
          minimum_threshold: settings.minimum_threshold || 50,
          payment_method: settings.payment_method || 'bank_transfer',
          payment_details: settings.payment_details || {},
          auto_payout: settings.auto_payout || false,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      return data;
    } catch (error) {
      console.error('Payout Settings Error:', error);
      throw error;
    }
  }

  /**
   * Calculate monthly rank bonuses
   * @param {string} period - YYYY-MM format
   */
  async calculateRankBonuses(period = null) {
    try {
      const targetPeriod = period || new Date().toISOString().slice(0, 7);
      
      // Rank bonus amounts
      const rankBonuses = {
        bronze: 0,
        silver: 50,
        gold: 150,
        platinum: 500,
        diamond: 1500
      };

      // Get all qualified users for the period
      const { data: qualifiedUsers } = await supabase
        .from('users')
        .select('id, email, rank, personal_volume, team_volume')
        .neq('rank', 'bronze')
        .eq('active_status', true);

      const bonuses = [];

      for (const user of qualifiedUsers || []) {
        const bonusAmount = rankBonuses[user.rank] || 0;
        
        if (bonusAmount > 0) {
          const { data: bonus } = await supabase
            .from('commissions')
            .insert({
              user_id: user.id,
              from_user_id: user.id, // Self-referencing for rank bonus
              amount: bonusAmount,
              commission_type: 'rank_bonus',
              level: 0,
              period: targetPeriod
            })
            .select()
            .single();

          if (bonus) bonuses.push(bonus);
        }
      }

      return bonuses;
    } catch (error) {
      console.error('Rank Bonus Calculation Error:', error);
      throw error;
    }
  }

  /**
   * Calculate matching bonuses (10-50% of direct referrals' commissions)
   * @param {string} userId - User who earned commission
   * @param {number} commissionAmount - Amount of commission earned
   */
  async calculateMatchingBonuses(userId, commissionAmount) {
    try {
      // Get user's sponsor
      const { data: userTree } = await supabase
        .from('referral_tree')
        .select('sponsor_id')
        .eq('user_id', userId)
        .single();

      if (!userTree?.sponsor_id) return [];

      // Get sponsor's rank to determine matching percentage
      const { data: sponsor } = await supabase
        .from('users')
        .select('id, rank')
        .eq('id', userTree.sponsor_id)
        .single();

      if (!sponsor) return [];

      // Matching bonus percentages by rank
      const matchingRates = {
        bronze: 0.10,   // 10%
        silver: 0.20,   // 20%
        gold: 0.30,     // 30%
        platinum: 0.40, // 40%
        diamond: 0.50   // 50%
      };

      const matchingRate = matchingRates[sponsor.rank] || 0.10;
      const matchingBonus = commissionAmount * matchingRate;

      // Create matching bonus commission
      const { data: bonus } = await supabase
        .from('commissions')
        .insert({
          user_id: sponsor.id,
          from_user_id: userId,
          amount: matchingBonus,
          commission_type: 'matching',
          level: 1,
          period: new Date().toISOString().slice(0, 7)
        })
        .select()
        .single();

      return bonus ? [bonus] : [];
    } catch (error) {
      console.error('Matching Bonus Error:', error);
      return [];
    }
  }

  /**
   * Handle cooling-off period for new users
   * @param {string} userId - User ID
   * @returns {Object} Cooling-off period status
   */
  async handleCoolingOffPeriod(userId) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('id, email, joined_date, cooling_off_end, status')
        .eq('id', userId)
        .single();

      if (!user) throw new Error('User not found');

      const joinDate = new Date(user.joined_date);
      const coolingOffEnd = new Date(joinDate.getTime() + (14 * 24 * 60 * 60 * 1000)); // 14 days
      const now = new Date();

      const coolingOffStatus = {
        user_id: userId,
        join_date: user.joined_date,
        cooling_off_end: coolingOffEnd.toISOString(),
        days_remaining: Math.max(0, Math.ceil((coolingOffEnd - now) / (24 * 60 * 60 * 1000))),
        is_active: now < coolingOffEnd,
        can_cancel: now < coolingOffEnd,
        restrictions: {
          commission_earning: now < coolingOffEnd,
          team_building: false, // Can still recruit
          rank_advancement: now < coolingOffEnd,
          payout_requests: now < coolingOffEnd
        }
      };

      // Update user record if cooling-off period has ended
      if (!coolingOffStatus.is_active && user.status === 'cooling_off') {
        await supabase
          .from('users')
          .update({ 
            status: 'active',
            cooling_off_completed: new Date().toISOString()
          })
          .eq('id', userId);
      }

      return coolingOffStatus;
    } catch (error) {
      console.error('Cooling-off Period Error:', error);
      throw error;
    }
  }

  /**
   * Process cooling-off cancellation
   * @param {string} userId - User ID
   * @param {string} reason - Cancellation reason
   * @returns {Object} Cancellation result
   */
  async processCoolingOffCancellation(userId, reason = 'user_request') {
    try {
      const coolingOffStatus = await this.handleCoolingOffPeriod(userId);
      
      if (!coolingOffStatus.can_cancel) {
        throw new Error('Cooling-off period has expired - cancellation no longer available');
      }

      const { data: user } = await supabase
        .from('users')
        .select('email, personal_volume, referral_code')
        .eq('id', userId)
        .single();

      // Process full refund during cooling-off period
      const refundAmount = user.personal_volume || 0;
      
      const cancellation = {
        user_id: userId,
        email: user.email,
        referral_code: user.referral_code,
        cancellation_date: new Date().toISOString(),
        reason,
        refund_amount: refundAmount,
        cooling_off_days_used: 14 - coolingOffStatus.days_remaining,
        status: 'processed'
      };

      // Deactivate user account
      await supabase
        .from('users')
        .update({ 
          active_status: false,
          status: 'cancelled',
          cancellation_date: cancellation.cancellation_date,
          cancellation_reason: reason
        })
        .eq('id', userId);

      // Process refund if applicable
      if (refundAmount > 0) {
        const refund = await this.processRefundRequest(userId, {
          reason: 'cooling_off_cancellation',
          amount_requested: refundAmount,
          purchase_date: user.joined_date,
          product_type: 'membership_fee'
        });
        
        cancellation.refund_processed = refund.status === 'approved';
        cancellation.refund_details = refund;
      }

      return cancellation;
    } catch (error) {
      console.error('Cooling-off Cancellation Error:', error);
      throw error;
    }
  }

  /**
   * Process payment for user
   * @param {string} userId - User ID
   * @param {number} amount - Payment amount
   * @param {string} method - Payment method
   * @returns {Object} Payment result
   */
  async processPayment(userId, amount, method = 'bank_transfer') {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('email, payment_info')
        .eq('id', userId)
        .single();

      if (!user) throw new Error('User not found');

      // Validate payment method and details
      const paymentValidation = this.validatePaymentMethod(user.payment_info, method);
      if (!paymentValidation.valid) {
        throw new Error(`Invalid payment method: ${paymentValidation.reason}`);
      }

      // Create payment record
      const paymentId = `PAY_${Date.now()}_${userId.slice(-6)}`;
      const payment = {
        payment_id: paymentId,
        user_id: userId,
        amount: parseFloat(amount),
        method,
        status: 'processing',
        created_date: new Date().toISOString(),
        processing_fee: this.calculateProcessingFee(amount, method),
        net_amount: parseFloat(amount) - this.calculateProcessingFee(amount, method)
      };

      // Process based on payment method
      let processingResult;
      switch (method) {
        case 'bank_transfer':
          processingResult = await this.processBankTransfer(payment, user.payment_info);
          break;
        case 'paypal':
          processingResult = await this.processPayPal(payment, user.payment_info);
          break;
        case 'crypto':
          processingResult = await this.processCrypto(payment, user.payment_info);
          break;
        case 'check':
          processingResult = await this.processCheck(payment, user.payment_info);
          break;
        default:
          throw new Error('Unsupported payment method');
      }

      payment.status = processingResult.success ? 'completed' : 'failed';
      payment.transaction_id = processingResult.transaction_id;
      payment.completed_date = processingResult.success ? new Date().toISOString() : null;
      payment.error_message = processingResult.error || null;

      return payment;
    } catch (error) {
      console.error('Payment Processing Error:', error);
      throw error;
    }
  }

  validatePaymentMethod(paymentInfo, method) {
    if (!paymentInfo) {
      return { valid: false, reason: 'No payment information on file' };
    }

    const methodValidators = {
      bank_transfer: (info) => info.bank_account && info.routing_number,
      paypal: (info) => info.paypal_email,
      crypto: (info) => info.crypto_wallet,
      check: (info) => info.mailing_address
    };

    const validator = methodValidators[method];
    if (!validator || !validator(paymentInfo)) {
      return { valid: false, reason: `Missing ${method} information` };
    }

    return { valid: true };
  }

  calculateProcessingFee(amount, method) {
    const fees = {
      bank_transfer: 2.50, // Flat fee
      paypal: amount * 0.029 + 0.30, // 2.9% + $0.30
      crypto: amount * 0.01, // 1%
      check: 5.00 // Flat fee
    };

    return Math.round((fees[method] || 0) * 100) / 100;
  }

  async processBankTransfer(payment, paymentInfo) {
    // Mock bank transfer processing
    console.log(`Processing bank transfer of $${payment.net_amount} to account ${paymentInfo.bank_account}`);
    
    // Simulate processing delay and success rate
    await new Promise(resolve => setTimeout(resolve, 1000));
    const success = Math.random() > 0.02; // 98% success rate

    return {
      success,
      transaction_id: success ? `ACH_${Date.now()}` : null,
      error: success ? null : 'Bank transfer failed - insufficient funds or invalid account'
    };
  }

  async processPayPal(payment, paymentInfo) {
    console.log(`Processing PayPal payment of $${payment.net_amount} to ${paymentInfo.paypal_email}`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    const success = Math.random() > 0.01; // 99% success rate

    return {
      success,
      transaction_id: success ? `PP_${Date.now()}` : null,
      error: success ? null : 'PayPal payment failed - invalid email or account restricted'
    };
  }

  async processCrypto(payment, paymentInfo) {
    console.log(`Processing crypto payment of $${payment.net_amount} to wallet ${paymentInfo.crypto_wallet}`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    const success = Math.random() > 0.05; // 95% success rate

    return {
      success,
      transaction_id: success ? `BTC_${Date.now()}` : null,
      error: success ? null : 'Crypto payment failed - invalid wallet address or network congestion'
    };
  }

  async processCheck(payment, paymentInfo) {
    console.log(`Processing check payment of $${payment.net_amount} to ${paymentInfo.mailing_address}`);
    
    // Checks always succeed but take longer
    return {
      success: true,
      transaction_id: `CHK_${Date.now()}`,
      error: null
    };
  }

  /**
   * Execute commission run for period
   * @param {string} period - YYYY-MM format
   * @param {string} runType - 'weekly' or 'monthly'
   * @returns {Object} Commission run results
   */
  async executeCommissionRun(period, runType = 'monthly') {
    try {
      const runId = `${runType}_${period}_${Date.now()}`;
      
      // Get all active users
      const { data: users } = await supabase
        .from('users')
        .select('id, email, rank')
        .eq('active_status', true);

      const runResults = {
        run_id: runId,
        period,
        run_type: runType,
        start_time: new Date().toISOString(),
        users_processed: 0,
        total_commissions: 0,
        commission_breakdown: {
          level: 0,
          matching: 0,
          rank_bonus: 0,
          leadership: 0
        },
        errors: []
      };

      // Process each user
      for (const user of users || []) {
        try {
          // Calculate all commission types for the period
          const userCommissions = await this.calculateUserCommissions(user.id, period);
          
          runResults.users_processed++;
          runResults.total_commissions += userCommissions.total;
          
          // Update breakdown
          Object.keys(runResults.commission_breakdown).forEach(type => {
            runResults.commission_breakdown[type] += userCommissions[type] || 0;
          });

        } catch (error) {
          runResults.errors.push({
            user_id: user.id,
            error: error.message
          });
        }
      }

      // Calculate rank bonuses if monthly run
      if (runType === 'monthly') {
        const rankBonuses = await this.calculateRankBonuses(period);
        runResults.commission_breakdown.rank_bonus += rankBonuses.reduce((sum, b) => sum + parseFloat(b.amount), 0);
      }

      // Calculate leadership bonuses
      const leadershipBonuses = await this.calculateLeadershipBonuses(period);
      runResults.commission_breakdown.leadership += leadershipBonuses.reduce((sum, b) => sum + parseFloat(b.amount), 0);

      runResults.end_time = new Date().toISOString();
      runResults.duration_seconds = Math.floor((new Date(runResults.end_time) - new Date(runResults.start_time)) / 1000);

      return runResults;
    } catch (error) {
      console.error('Commission Run Error:', error);
      throw error;
    }
  }

  /**
   * Calculate all commissions for a user in a period
   */
  async calculateUserCommissions(userId, period) {
    const commissions = {
      level: 0,
      matching: 0,
      rank_bonus: 0,
      leadership: 0,
      total: 0
    };

    // Get existing commissions for period
    const { data: existingCommissions } = await supabase
      .from('commissions')
      .select('amount, commission_type')
      .eq('user_id', userId)
      .eq('period', period);

    existingCommissions?.forEach(comm => {
      const type = comm.commission_type;
      if (commissions.hasOwnProperty(type)) {
        commissions[type] += parseFloat(comm.amount);
      }
    });

    commissions.total = Object.values(commissions).reduce((sum, val) => sum + val, 0) - commissions.total;
    return commissions;
  }

  /**
   * Get performance comparisons for user
   * @param {string} userId - User ID
   * @returns {Object} Performance comparison data
   */
  async getPerformanceComparisons(userId) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('rank, personal_volume, joined_date')
        .eq('id', userId)
        .single();

      if (!user) throw new Error('User not found');

      const userStats = await this.getTreeStats(userId);
      const userRank = user.rank || 'bronze';

      // Get peer comparisons (same rank)
      const peerComparison = await this.getPeerComparison(userId, userRank);
      
      // Get rank-based benchmarks
      const rankBenchmarks = this.getRankBenchmarks(userRank);
      
      // Calculate percentile rankings
      const percentileRankings = this.calculatePercentileRankings(user, userStats, userRank);

      // Historical performance trends
      const performanceTrends = await this.getPerformanceTrends(userId);

      return {
        user_performance: {
          rank: userRank,
          personal_volume: user.personal_volume || 0,
          direct_referrals: userStats.direct_referrals,
          team_size: userStats.total_team_size,
          join_date: user.joined_date
        },
        peer_comparison: peerComparison,
        rank_benchmarks: rankBenchmarks,
        percentile_rankings: percentileRankings,
        performance_trends: performanceTrends,
        improvement_suggestions: this.generateImprovementSuggestions(user, userStats, peerComparison)
      };
    } catch (error) {
      console.error('Performance Comparisons Error:', error);
      throw error;
    }
  }

  async getPeerComparison(userId, userRank) {
    // Mock peer data - in production would query database
    const peerData = {
      bronze: { avg_volume: 250, avg_referrals: 1.5, avg_team_size: 3 },
      silver: { avg_volume: 800, avg_referrals: 4.2, avg_team_size: 8 },
      gold: { avg_volume: 2800, avg_referrals: 7.5, avg_team_size: 18 },
      platinum: { avg_volume: 6200, avg_referrals: 13.2, avg_team_size: 35 },
      diamond: { avg_volume: 18500, avg_referrals: 28.5, avg_team_size: 75 }
    };

    return {
      rank: userRank,
      peer_averages: peerData[userRank],
      total_peers: Math.floor(Math.random() * 500) + 100 // Mock peer count
    };
  }

  getRankBenchmarks(userRank) {
    const benchmarks = {
      bronze: { top_10_percent: { volume: 500, referrals: 3 }, top_25_percent: { volume: 300, referrals: 2 } },
      silver: { top_10_percent: { volume: 1500, referrals: 8 }, top_25_percent: { volume: 1000, referrals: 6 } },
      gold: { top_10_percent: { volume: 4500, referrals: 12 }, top_25_percent: { volume: 3500, referrals: 9 } },
      platinum: { top_10_percent: { volume: 9000, referrals: 18 }, top_25_percent: { volume: 7500, referrals: 15 } },
      diamond: { top_10_percent: { volume: 25000, referrals: 40 }, top_25_percent: { volume: 22000, referrals: 35 } }
    };

    return benchmarks[userRank] || benchmarks.bronze;
  }

  calculatePercentileRankings(user, stats, rank) {
    // Mock percentile calculations
    const volumePercentile = Math.min(95, Math.max(5, (user.personal_volume || 0) / 100));
    const referralPercentile = Math.min(95, Math.max(5, stats.direct_referrals * 15));
    const teamPercentile = Math.min(95, Math.max(5, stats.total_team_size * 8));

    return {
      personal_volume: Math.floor(volumePercentile),
      direct_referrals: Math.floor(referralPercentile),
      team_size: Math.floor(teamPercentile),
      overall_score: Math.floor((volumePercentile + referralPercentile + teamPercentile) / 3)
    };
  }

  async getPerformanceTrends(userId) {
    // Mock trend data
    return {
      last_6_months: [
        { month: '2024-05', volume: 800, referrals: 2, team_growth: 5 },
        { month: '2024-06', volume: 1200, referrals: 3, team_growth: 8 },
        { month: '2024-07', volume: 1500, referrals: 4, team_growth: 12 },
        { month: '2024-08', volume: 1800, referrals: 5, team_growth: 15 },
        { month: '2024-09', volume: 2200, referrals: 6, team_growth: 18 },
        { month: '2024-10', volume: 2500, referrals: 7, team_growth: 22 }
      ],
      growth_rate: {
        volume: 25.2, // % growth
        referrals: 18.5,
        team: 31.8
      }
    };
  }

  generateImprovementSuggestions(user, stats, peerComparison) {
    const suggestions = [];
    const userVolume = user.personal_volume || 0;
    const peerAvg = peerComparison.peer_averages;

    if (userVolume < peerAvg.avg_volume) {
      suggestions.push({
        area: 'Personal Volume',
        suggestion: `Increase personal volume by $${Math.ceil(peerAvg.avg_volume - userVolume)} to reach peer average`,
        priority: 'high'
      });
    }

    if (stats.direct_referrals < peerAvg.avg_referrals) {
      suggestions.push({
        area: 'Direct Referrals',
        suggestion: `Focus on recruiting ${Math.ceil(peerAvg.avg_referrals - stats.direct_referrals)} more direct referrals`,
        priority: 'medium'
      });
    }

    if (stats.total_team_size < peerAvg.avg_team_size) {
      suggestions.push({
        area: 'Team Building',
        suggestion: 'Support your team members in their recruitment efforts',
        priority: 'medium'
      });
    }

    return suggestions;
  }

  /**
   * Track rank progression for user
   * @param {string} userId - User ID
   * @returns {Object} Rank progression data
   */
  async getRankProgression(userId) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('rank, personal_volume, joined_date')
        .eq('id', userId)
        .single();

      if (!user) throw new Error('User not found');

      const currentStats = await this.getTreeStats(userId);
      const currentRank = user.rank || 'bronze';

      // Rank requirements
      const rankRequirements = {
        bronze: { direct: 0, volume: 0 },
        silver: { direct: 3, volume: 500 },
        gold: { direct: 6, volume: 2000 },
        platinum: { direct: 11, volume: 5000 },
        diamond: { direct: 21, volume: 15000 }
      };

      const rankHierarchy = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
      const currentRankIndex = rankHierarchy.indexOf(currentRank);
      const nextRank = rankHierarchy[currentRankIndex + 1];

      // Calculate progress to next rank
      let nextRankProgress = null;
      if (nextRank) {
        const nextRequirements = rankRequirements[nextRank];
        const directProgress = Math.min(currentStats.direct_referrals / nextRequirements.direct, 1);
        const volumeProgress = Math.min((user.personal_volume || 0) / nextRequirements.volume, 1);
        
        nextRankProgress = {
          target_rank: nextRank,
          overall_progress: Math.min((directProgress + volumeProgress) / 2, 1),
          requirements: {
            direct_referrals: {
              current: currentStats.direct_referrals,
              required: nextRequirements.direct,
              remaining: Math.max(0, nextRequirements.direct - currentStats.direct_referrals),
              progress: directProgress
            },
            personal_volume: {
              current: user.personal_volume || 0,
              required: nextRequirements.volume,
              remaining: Math.max(0, nextRequirements.volume - (user.personal_volume || 0)),
              progress: volumeProgress
            }
          }
        };
      }

      // Get rank history (mock data)
      const rankHistory = [
        { rank: 'bronze', achieved_date: user.joined_date, days_to_achieve: 0 },
        ...(currentRankIndex >= 1 ? [{ rank: 'silver', achieved_date: '2024-08-15', days_to_achieve: 45 }] : []),
        ...(currentRankIndex >= 2 ? [{ rank: 'gold', achieved_date: '2024-09-30', days_to_achieve: 91 }] : []),
        ...(currentRankIndex >= 3 ? [{ rank: 'platinum', achieved_date: '2024-10-15', days_to_achieve: 106 }] : [])
      ];

      return {
        current_rank: currentRank,
        next_rank: nextRank,
        progression: nextRankProgress,
        rank_history: rankHistory,
        achievements: {
          total_ranks_achieved: rankHistory.length,
          fastest_promotion: rankHistory.length > 1 ? Math.min(...rankHistory.slice(1).map(r => r.days_to_achieve)) : null,
          time_in_current_rank: this.calculateTimeInRank(rankHistory[rankHistory.length - 1]?.achieved_date)
        }
      };
    } catch (error) {
      console.error('Rank Progression Error:', error);
      throw error;
    }
  }

  calculateTimeInRank(achievedDate) {
    if (!achievedDate) return 0;
    return Math.floor((Date.now() - new Date(achievedDate).getTime()) / (24 * 60 * 60 * 1000));
  }

  /**
   * Get marketing materials library
   * @param {string} userId - User ID
   * @param {string} category - Material category filter
   * @returns {Object} Marketing materials
   */
  async getMarketingLibrary(userId, category = null) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('rank')
        .eq('id', userId)
        .single();

      const userRank = user?.rank || 'bronze';

      // Materials organized by category and rank access
      const materials = {
        banners: [
          { id: 1, title: 'Join Tracverse Banner', size: '728x90', url: '/assets/banners/join-banner.png', min_rank: 'bronze' },
          { id: 2, title: 'Earn Money Banner', size: '300x250', url: '/assets/banners/earn-banner.png', min_rank: 'bronze' },
          { id: 3, title: 'Success Stories Banner', size: '468x60', url: '/assets/banners/success-banner.png', min_rank: 'silver' },
          { id: 4, title: 'Premium Team Banner', size: '728x90', url: '/assets/banners/premium-banner.png', min_rank: 'gold' }
        ],
        videos: [
          { id: 1, title: 'How Tracverse Works', duration: '2:30', url: '/assets/videos/how-it-works.mp4', min_rank: 'bronze' },
          { id: 2, title: 'Success Stories', duration: '3:45', url: '/assets/videos/testimonials.mp4', min_rank: 'bronze' },
          { id: 3, title: 'Advanced Training', duration: '15:20', url: '/assets/videos/advanced-training.mp4', min_rank: 'silver' },
          { id: 4, title: 'Leadership Masterclass', duration: '25:10', url: '/assets/videos/leadership.mp4', min_rank: 'gold' }
        ],
        images: [
          { id: 1, title: 'Income Potential Chart', description: 'Shows earning possibilities', url: '/assets/images/income-chart.jpg', min_rank: 'bronze' },
          { id: 2, title: 'Team Success Photo', description: 'Happy team members', url: '/assets/images/team-success.jpg', min_rank: 'bronze' },
          { id: 3, title: 'Lifestyle Images', description: 'Success lifestyle photos', url: '/assets/images/lifestyle.jpg', min_rank: 'silver' },
          { id: 4, title: 'Executive Photos', description: 'Professional headshots', url: '/assets/images/executive.jpg', min_rank: 'platinum' }
        ],
        templates: [
          { id: 1, title: 'Welcome Email', type: 'email', content: 'Welcome to our amazing opportunity...', min_rank: 'bronze' },
          { id: 2, title: 'Social Media Post', type: 'social', content: '🚀 Just hit my monthly goal...', min_rank: 'bronze' },
          { id: 3, title: 'Follow-up Sequence', type: 'email_series', content: 'Day 1: Thank you for joining...', min_rank: 'silver' },
          { id: 4, title: 'Presentation Script', type: 'script', content: 'Hi [NAME], I have something exciting...', min_rank: 'gold' }
        ],
        documents: [
          { id: 1, title: 'Getting Started Guide', type: 'pdf', url: '/assets/docs/getting-started.pdf', min_rank: 'bronze' },
          { id: 2, title: 'Compensation Plan', type: 'pdf', url: '/assets/docs/comp-plan.pdf', min_rank: 'bronze' },
          { id: 3, title: 'Advanced Strategies', type: 'pdf', url: '/assets/docs/advanced-strategies.pdf', min_rank: 'silver' },
          { id: 4, title: 'Leadership Manual', type: 'pdf', url: '/assets/docs/leadership-manual.pdf', min_rank: 'gold' }
        ]
      };

      // Filter by user rank access
      const rankHierarchy = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
      const userRankIndex = rankHierarchy.indexOf(userRank);

      const filteredMaterials = {};
      Object.entries(materials).forEach(([cat, items]) => {
        if (!category || category === cat) {
          filteredMaterials[cat] = items.filter(item => {
            const itemRankIndex = rankHierarchy.indexOf(item.min_rank);
            return userRankIndex >= itemRankIndex;
          });
        }
      });

      return {
        user_rank: userRank,
        materials: filteredMaterials,
        total_items: Object.values(filteredMaterials).reduce((sum, arr) => sum + arr.length, 0)
      };
    } catch (error) {
      console.error('Marketing Library Error:', error);
      throw error;
    }
  }

  /**
   * Create custom referral landing page
   * @param {string} userId - User ID
   * @param {Object} pageData - Landing page configuration
   * @returns {Object} Landing page result
   */
  async createReferralLandingPage(userId, pageData) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('referral_code, email, rank')
        .eq('id', userId)
        .single();

      if (!user) throw new Error('User not found');

      const {
        template_id = 'default',
        headline,
        description,
        call_to_action = 'Join My Team',
        background_color = '#ffffff',
        accent_color = '#007bff',
        show_earnings = false,
        show_testimonials = true,
        custom_message
      } = pageData;

      // Generate landing page content
      const landingPage = {
        user_id: userId,
        referral_code: user.referral_code,
        url_slug: `join-${user.referral_code.toLowerCase()}`,
        template_id,
        content: {
          headline: headline || `Join ${user.email.split('@')[0]}'s Successful Team`,
          description: description || 'Start earning money by completing simple tasks and building your network.',
          call_to_action,
          sponsor_info: {
            name: user.email.split('@')[0],
            rank: user.rank,
            referral_code: user.referral_code
          },
          custom_message: custom_message || `Hi! I'm excited to share this opportunity with you. Join my team and let's build success together!`
        },
        styling: {
          background_color,
          accent_color,
          font_family: 'Arial, sans-serif',
          layout: template_id
        },
        features: {
          show_earnings,
          show_testimonials,
          show_rank_benefits: true,
          show_success_stories: true,
          contact_form: true
        },
        analytics: {
          views: 0,
          conversions: 0,
          conversion_rate: 0
        },
        created_date: new Date().toISOString(),
        is_active: true
      };

      // Generate full URL
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      landingPage.full_url = `${baseUrl}/join/${landingPage.url_slug}`;

      return landingPage;
    } catch (error) {
      console.error('Landing Page Creation Error:', error);
      throw error;
    }
  }

  /**
   * Get landing page analytics
   * @param {string} userId - User ID
   * @returns {Object} Analytics data
   */
  async getLandingPageAnalytics(userId) {
    try {
      // Mock analytics data - in production would come from tracking
      const analytics = {
        total_views: 245,
        total_conversions: 18,
        conversion_rate: 7.3,
        traffic_sources: {
          social_media: 45,
          direct_link: 30,
          email: 15,
          other: 10
        },
        daily_stats: [
          { date: '2024-10-25', views: 12, conversions: 1 },
          { date: '2024-10-26', views: 18, conversions: 2 },
          { date: '2024-10-27', views: 15, conversions: 0 },
          { date: '2024-10-28', views: 22, conversions: 3 }
        ]
      };

      return analytics;
    } catch (error) {
      console.error('Landing Page Analytics Error:', error);
      throw error;
    }
  }

  /**
   * Handle rank demotion process
   * @param {string} userId - User ID
   * @param {string} newRank - New rank after demotion
   * @param {string} reason - Reason for demotion
   * @returns {Object} Demotion result
   */
  async handleRankDemotion(userId, newRank, reason = 'qualification_failure') {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('id, email, rank, rank_achieved_date')
        .eq('id', userId)
        .single();

      if (!user) throw new Error('User not found');

      const previousRank = user.rank;
      const demotionDate = new Date().toISOString();

      // Update user rank
      await supabase
        .from('users')
        .update({ 
          rank: newRank,
          previous_rank: previousRank,
          rank_changed_date: demotionDate,
          protection_periods_used: 0 // Reset protection periods on demotion
        })
        .eq('id', userId);

      // Create demotion record
      const demotionRecord = {
        user_id: userId,
        previous_rank: previousRank,
        new_rank: newRank,
        reason,
        demotion_date: demotionDate,
        grace_period_end: this.calculateGracePeriodEnd(demotionDate),
        benefits_retained: this.getRetainedBenefits(previousRank, newRank)
      };

      // Adjust commission rates for future earnings
      await this.adjustCommissionRates(userId, newRank);

      // Send notification (in production)
      await this.sendDemotionNotification(userId, demotionRecord);

      return demotionRecord;
    } catch (error) {
      console.error('Demotion Handling Error:', error);
      throw error;
    }
  }

  /**
   * Calculate grace period end date (30 days from demotion)
   */
  calculateGracePeriodEnd(demotionDate) {
    const gracePeriod = new Date(demotionDate);
    gracePeriod.setDate(gracePeriod.getDate() + 30);
    return gracePeriod.toISOString();
  }

  /**
   * Get benefits retained during grace period
   */
  getRetainedBenefits(previousRank, newRank) {
    const benefits = {
      commission_rates: 'reduced_gradually', // Gradual reduction over 30 days
      exclusive_tasks: 'previous_rank_access', // Keep access for 30 days
      leadership_bonuses: 'prorated', // Reduced based on new rank
      marketing_materials: 'full_access' // Keep all materials
    };

    return benefits;
  }

  /**
   * Adjust commission rates for demoted user
   */
  async adjustCommissionRates(userId, newRank) {
    // This would update the user's commission calculation logic
    // For now, just log the change
    console.log(`Adjusting commission rates for user ${userId} to ${newRank} level`);
    return { success: true };
  }

  /**
   * Send demotion notification
   */
  async sendDemotionNotification(userId, demotionRecord) {
    // In production, this would send email/SMS notification
    console.log(`Sending demotion notification to user ${userId}`);
    
    const notification = {
      type: 'rank_demotion',
      user_id: userId,
      message: `Your rank has been adjusted from ${demotionRecord.previous_rank} to ${demotionRecord.new_rank}`,
      grace_period_info: `You have until ${demotionRecord.grace_period_end} to re-qualify`,
      support_resources: [
        'Contact your sponsor for guidance',
        'Review qualification requirements',
        'Access training materials'
      ]
    };

    return notification;
  }

  /**
   * Apply rank protection for users
   * @param {string} userId - User ID
   * @param {string} period - YYYY-MM format
   * @returns {Object} Rank protection result
   */
  async applyRankProtection(userId, period = null) {
    try {
      const targetPeriod = period || new Date().toISOString().slice(0, 7);
      
      const { data: user } = await supabase
        .from('users')
        .select('id, rank, rank_achieved_date, protection_periods_used')
        .eq('id', userId)
        .single();

      if (!user) throw new Error('User not found');

      // Get current qualification
      const currentQualification = await this.updateMonthlyQualifications(userId, targetPeriod);
      const qualifiedRank = currentQualification.rank_achieved;
      const currentRank = user.rank;

      // Check if demotion would occur
      const rankHierarchy = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
      const currentRankIndex = rankHierarchy.indexOf(currentRank);
      const qualifiedRankIndex = rankHierarchy.indexOf(qualifiedRank);

      if (qualifiedRankIndex < currentRankIndex) {
        // User would be demoted - check protection eligibility
        const protectionUsed = user.protection_periods_used || 0;
        const maxProtections = this.getMaxProtectionPeriods(currentRank);
        
        if (protectionUsed < maxProtections) {
          // Apply protection
          await supabase
            .from('users')
            .update({ 
              protection_periods_used: protectionUsed + 1,
              last_protection_used: targetPeriod
            })
            .eq('id', userId);

          return {
            protected: true,
            maintained_rank: currentRank,
            qualified_rank: qualifiedRank,
            protection_periods_remaining: maxProtections - protectionUsed - 1,
            period: targetPeriod
          };
        } else {
          // No protection available - proceed with demotion
          await supabase
            .from('users')
            .update({ rank: qualifiedRank })
            .eq('id', userId);

          return {
            protected: false,
            demoted_to: qualifiedRank,
            previous_rank: currentRank,
            reason: 'protection_exhausted',
            period: targetPeriod
          };
        }
      }

      return {
        protected: false,
        maintained_rank: currentRank,
        qualified_rank: qualifiedRank,
        no_demotion_needed: true,
        period: targetPeriod
      };
    } catch (error) {
      console.error('Rank Protection Error:', error);
      throw error;
    }
  }

  /**
   * Get maximum protection periods by rank
   */
  getMaxProtectionPeriods(rank) {
    const protectionLimits = {
      bronze: 0,
      silver: 1,
      gold: 2,
      platinum: 3,
      diamond: 4
    };
    return protectionLimits[rank] || 0;
  }

  /**
   * Process refund request
   * @param {string} userId - User ID requesting refund
   * @param {Object} refundData - Refund request data
   * @returns {Object} Refund processing result
   */
  async processRefundRequest(userId, refundData) {
    try {
      const { reason, amount_requested, purchase_date, product_type } = refundData;
      
      // Get user data
      const { data: user } = await supabase
        .from('users')
        .select('email, joined_date, personal_volume')
        .eq('id', userId)
        .single();

      if (!user) throw new Error('User not found');

      // Validate refund eligibility
      const eligibility = this.validateRefundEligibility(user, refundData);
      
      const refundRequest = {
        user_id: userId,
        email: user.email,
        reason,
        amount_requested: parseFloat(amount_requested),
        purchase_date,
        product_type,
        eligibility_check: eligibility,
        status: eligibility.eligible ? 'approved' : 'rejected',
        approved_amount: eligibility.eligible ? eligibility.approved_amount : 0,
        processing_fee: eligibility.processing_fee || 0,
        net_refund: eligibility.eligible ? eligibility.approved_amount - (eligibility.processing_fee || 0) : 0,
        created_date: new Date().toISOString(),
        policy_version: '1.0'
      };

      // If approved, process the refund
      if (refundRequest.status === 'approved') {
        await this.executeRefund(userId, refundRequest);
      }

      return refundRequest;
    } catch (error) {
      console.error('Refund Processing Error:', error);
      throw error;
    }
  }

  /**
   * Validate refund eligibility based on company policies
   */
  validateRefundEligibility(user, refundData) {
    const { amount_requested, purchase_date, product_type, reason } = refundData;
    const purchaseAge = (Date.now() - new Date(purchase_date).getTime()) / (24 * 60 * 60 * 1000); // days
    
    const policies = {
      membership_fee: { refund_period: 30, full_refund: true, processing_fee: 0 },
      training_materials: { refund_period: 14, full_refund: false, max_refund: 0.8, processing_fee: 25 },
      marketing_tools: { refund_period: 7, full_refund: false, max_refund: 0.5, processing_fee: 15 }
    };

    const policy = policies[product_type] || policies.membership_fee;
    
    // Check time eligibility
    const timeEligible = purchaseAge <= policy.refund_period;
    
    // Calculate approved amount
    let approvedAmount = 0;
    if (timeEligible) {
      if (policy.full_refund) {
        approvedAmount = parseFloat(amount_requested);
      } else {
        approvedAmount = parseFloat(amount_requested) * policy.max_refund;
      }
    }

    // Special conditions
    const specialConditions = {
      dissatisfaction: timeEligible && purchaseAge <= 30,
      technical_issues: timeEligible,
      billing_error: true, // Always eligible
      duplicate_charge: true // Always eligible
    };

    const conditionMet = specialConditions[reason] || false;
    
    return {
      eligible: timeEligible && conditionMet,
      approved_amount: conditionMet ? approvedAmount : 0,
      processing_fee: policy.processing_fee || 0,
      reason_code: timeEligible ? (conditionMet ? 'APPROVED' : 'INVALID_REASON') : 'TIME_EXPIRED',
      policy_applied: product_type
    };
  }

  /**
   * Execute approved refund
   */
  async executeRefund(userId, refundRequest) {
    try {
      // In production, this would integrate with payment processor
      console.log(`Processing refund of $${refundRequest.net_refund} for user ${userId}`);
      
      // Update user's purchase history or volume if needed
      if (refundRequest.product_type === 'membership_fee') {
        await supabase
          .from('users')
          .update({ 
            personal_volume: Math.max(0, (user.personal_volume || 0) - refundRequest.approved_amount)
          })
          .eq('id', userId);
      }

      return { success: true, transaction_id: `REF_${Date.now()}` };
    } catch (error) {
      console.error('Refund Execution Error:', error);
      throw error;
    }
  }

  /**
   * Perform KYC (Know Your Customer) verification
   * @param {string} userId - User ID
   * @param {Object} kycData - KYC verification data
   * @returns {Object} KYC verification result
   */
  async performKYCVerification(userId, kycData) {
    try {
      const { full_name, date_of_birth, ssn_last4, address, phone, identity_document } = kycData;
      
      // Basic validation
      const validationResults = {
        name_valid: this.validateName(full_name),
        dob_valid: this.validateDateOfBirth(date_of_birth),
        ssn_valid: this.validateSSN(ssn_last4),
        address_valid: this.validateAddress(address),
        phone_valid: this.validatePhone(phone),
        document_valid: this.validateDocument(identity_document)
      };

      const overallScore = Object.values(validationResults).filter(v => v).length / Object.keys(validationResults).length;
      const kycStatus = overallScore >= 0.8 ? 'approved' : overallScore >= 0.6 ? 'pending' : 'rejected';

      // Store KYC record
      const kycRecord = {
        user_id: userId,
        status: kycStatus,
        verification_score: overallScore,
        validation_results: validationResults,
        submitted_data: {
          full_name,
          date_of_birth,
          address,
          phone,
          document_type: identity_document?.type
        },
        verified_date: kycStatus === 'approved' ? new Date().toISOString() : null,
        created_at: new Date().toISOString()
      };

      // Update user KYC status
      await supabase
        .from('users')
        .update({ 
          kyc_status: kycStatus,
          kyc_verified_date: kycRecord.verified_date
        })
        .eq('id', userId);

      return kycRecord;
    } catch (error) {
      console.error('KYC Verification Error:', error);
      throw error;
    }
  }

  /**
   * Perform AML (Anti-Money Laundering) screening
   * @param {string} userId - User ID
   * @returns {Object} AML screening result
   */
  async performAMLScreening(userId) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('email, kyc_status, personal_volume, team_volume, joined_date')
        .eq('id', userId)
        .single();

      if (!user) throw new Error('User not found');

      // AML risk factors
      const riskFactors = {
        high_volume_transactions: (user.personal_volume || 0) > 10000,
        rapid_team_growth: (user.team_volume || 0) > 50000,
        new_account: new Date(user.joined_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        kyc_incomplete: user.kyc_status !== 'approved',
        suspicious_patterns: false // Would integrate with transaction monitoring
      };

      const riskScore = Object.values(riskFactors).filter(f => f).length / Object.keys(riskFactors).length;
      const riskLevel = riskScore >= 0.6 ? 'high' : riskScore >= 0.3 ? 'medium' : 'low';

      const amlRecord = {
        user_id: userId,
        risk_level: riskLevel,
        risk_score: riskScore,
        risk_factors: riskFactors,
        screening_date: new Date().toISOString(),
        requires_review: riskLevel === 'high'
      };

      return amlRecord;
    } catch (error) {
      console.error('AML Screening Error:', error);
      throw error;
    }
  }

  // Validation helper methods
  validateName(name) {
    return name && name.length >= 2 && /^[a-zA-Z\s]+$/.test(name);
  }

  validateDateOfBirth(dob) {
    const date = new Date(dob);
    const age = (Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return age >= 18 && age <= 120;
  }

  validateSSN(ssn) {
    return ssn && /^\d{4}$/.test(ssn);
  }

  validateAddress(address) {
    return address && address.street && address.city && address.state && address.zip;
  }

  validatePhone(phone) {
    return phone && /^\+?[\d\s\-\(\)]{10,}$/.test(phone);
  }

  validateDocument(doc) {
    return doc && doc.type && doc.number && ['drivers_license', 'passport', 'state_id'].includes(doc.type);
  }

  /**
   * Generate 1099 tax forms for users
   * @param {string} taxYear - Tax year (YYYY)
   * @param {number} threshold - Minimum earnings threshold ($600)
   * @returns {Array} 1099 forms data
   */
  async generate1099Forms(taxYear, threshold = 600) {
    try {
      // Get users with earnings above threshold
      const { data: users } = await supabase
        .from('users')
        .select('id, email, referral_code, tax_info')
        .eq('active_status', true);

      const forms = [];

      for (const user of users || []) {
        // Calculate total earnings for tax year
        const { data: commissions } = await supabase
          .from('commissions')
          .select('amount, commission_type')
          .eq('user_id', user.id)
          .like('period', `${taxYear}%`)
          .eq('status', 'paid');

        const totalEarnings = commissions?.reduce((sum, c) => sum + parseFloat(c.amount), 0) || 0;

        if (totalEarnings >= threshold) {
          // Breakdown by commission type
          const breakdown = {
            level_commissions: 0,
            matching_bonuses: 0,
            rank_bonuses: 0,
            leadership_bonuses: 0
          };

          commissions?.forEach(c => {
            const type = c.commission_type;
            if (breakdown.hasOwnProperty(`${type}_commissions`) || breakdown.hasOwnProperty(`${type}_bonuses`)) {
              breakdown[`${type}_commissions`] = (breakdown[`${type}_commissions`] || 0) + parseFloat(c.amount);
              breakdown[`${type}_bonuses`] = (breakdown[`${type}_bonuses`] || 0) + parseFloat(c.amount);
            }
          });

          forms.push({
            user_id: user.id,
            email: user.email,
            referral_code: user.referral_code,
            tax_year: taxYear,
            total_earnings: totalEarnings,
            breakdown,
            form_1099_data: {
              payer: 'Tracverse LLC',
              recipient: user.email,
              box_7_nonemployee_compensation: totalEarnings,
              federal_tax_withheld: 0,
              state_tax_withheld: 0
            },
            generated_date: new Date().toISOString()
          });
        }
      }

      return forms;
    } catch (error) {
      console.error('1099 Generation Error:', error);
      throw error;
    }
  }

  /**
   * Generate income disclosure statement
   * @param {string} period - YYYY or YYYY-MM format
   * @returns {Object} Income disclosure data
   */
  async generateIncomeDisclosure(period = null) {
    try {
      const targetYear = period ? period.slice(0, 4) : new Date().getFullYear().toString();
      
      // Get all users and their earnings for the period
      const { data: users } = await supabase
        .from('users')
        .select('id, email, rank, joined_date')
        .eq('active_status', true);

      const disclosureData = {
        period: targetYear,
        total_participants: users?.length || 0,
        earnings_by_rank: {},
        percentile_breakdown: {},
        disclaimers: [
          'These figures represent gross earnings before expenses',
          'Individual results may vary based on effort and market conditions',
          'Past performance does not guarantee future results',
          'Most participants earn modest amounts or no income'
        ]
      };

      // Calculate earnings by rank
      for (const user of users || []) {
        const { data: commissions } = await supabase
          .from('commissions')
          .select('amount')
          .eq('user_id', user.id)
          .like('period', `${targetYear}%`)
          .eq('status', 'paid');

        const totalEarnings = commissions?.reduce((sum, c) => sum + parseFloat(c.amount), 0) || 0;
        const rank = user.rank || 'bronze';

        if (!disclosureData.earnings_by_rank[rank]) {
          disclosureData.earnings_by_rank[rank] = {
            count: 0,
            total_earnings: 0,
            average_earnings: 0,
            median_earnings: 0,
            top_10_percent: 0,
            earnings_list: []
          };
        }

        disclosureData.earnings_by_rank[rank].count++;
        disclosureData.earnings_by_rank[rank].total_earnings += totalEarnings;
        disclosureData.earnings_by_rank[rank].earnings_list.push(totalEarnings);
      }

      // Calculate statistics for each rank
      Object.keys(disclosureData.earnings_by_rank).forEach(rank => {
        const rankData = disclosureData.earnings_by_rank[rank];
        const earnings = rankData.earnings_list.sort((a, b) => b - a);
        
        rankData.average_earnings = rankData.count > 0 ? rankData.total_earnings / rankData.count : 0;
        rankData.median_earnings = this.calculateMedian(earnings);
        rankData.top_10_percent = this.calculatePercentile(earnings, 90);
        
        delete rankData.earnings_list; // Remove raw data
      });

      // Overall percentile breakdown
      const allEarnings = [];
      Object.values(disclosureData.earnings_by_rank).forEach(rank => {
        for (let i = 0; i < rank.count; i++) {
          allEarnings.push(rank.average_earnings); // Simplified
        }
      });

      disclosureData.percentile_breakdown = {
        top_1_percent: this.calculatePercentile(allEarnings, 99),
        top_5_percent: this.calculatePercentile(allEarnings, 95),
        top_10_percent: this.calculatePercentile(allEarnings, 90),
        median: this.calculateMedian(allEarnings),
        bottom_50_percent: this.calculatePercentile(allEarnings, 50)
      };

      return disclosureData;
    } catch (error) {
      console.error('Income Disclosure Error:', error);
      throw error;
    }
  }

  calculateMedian(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  calculatePercentile(arr, percentile) {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] || 0;
  }

  /**
   * Generate growth projections for user
   * @param {string} userId - User ID
   * @param {number} months - Months to project
   * @returns {Object} Growth projections
   */
  async getGrowthProjections(userId, months = 6) {
    try {
      // Get historical data for trend analysis
      const history = await this.getHistoricalEarnings(userId, 6);
      const currentStats = await this.getTreeStats(userId);
      
      // Calculate growth trends
      const earningsHistory = history.history;
      const avgGrowthRate = this.calculateGrowthRate(earningsHistory);
      const avgReferralRate = 1.2; // Assume 20% monthly referral growth
      
      const projections = [];
      let currentEarnings = earningsHistory[0]?.total || 0;
      let currentReferrals = currentStats.direct_referrals;
      let currentTeamSize = currentStats.total_team_size;

      for (let i = 1; i <= months; i++) {
        const projectedDate = new Date();
        projectedDate.setMonth(projectedDate.getMonth() + i);
        const period = projectedDate.toISOString().slice(0, 7);

        // Project earnings with growth rate
        currentEarnings *= (1 + avgGrowthRate);
        currentReferrals = Math.floor(currentReferrals * avgReferralRate);
        currentTeamSize = Math.floor(currentTeamSize * 1.15); // 15% team growth

        projections.push({
          period,
          projected_earnings: Math.round(currentEarnings * 100) / 100,
          projected_referrals: currentReferrals,
          projected_team_size: currentTeamSize,
          confidence: Math.max(0.9 - (i * 0.1), 0.3) // Decreasing confidence
        });
      }

      return {
        projections,
        assumptions: {
          earnings_growth_rate: (avgGrowthRate * 100).toFixed(1) + '%',
          referral_growth_rate: '20%',
          team_growth_rate: '15%',
          base_period: earningsHistory[0]?.period || 'current'
        }
      };
    } catch (error) {
      console.error('Growth Projections Error:', error);
      throw error;
    }
  }

  /**
   * Calculate average growth rate from historical data
   */
  calculateGrowthRate(history) {
    if (history.length < 2) return 0.1; // Default 10% growth
    
    const growthRates = [];
    for (let i = 1; i < history.length; i++) {
      const current = history[i-1].total;
      const previous = history[i].total;
      if (previous > 0) {
        growthRates.push((current - previous) / previous);
      }
    }
    
    return growthRates.length > 0 ? 
      growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length : 0.1;
  }

  /**
   * Get historical earnings data for user
   * @param {string} userId - User ID
   * @param {number} months - Number of months to fetch
   * @returns {Object} Historical earnings
   */
  async getHistoricalEarnings(userId, months = 12) {
    try {
      const { data: commissions } = await supabase
        .from('commissions')
        .select('amount, commission_type, period, created_at')
        .eq('user_id', userId)
        .order('period', { ascending: false })
        .limit(months * 50); // Approximate limit

      // Group by period
      const monthlyData = {};
      commissions?.forEach(comm => {
        const period = comm.period;
        if (!monthlyData[period]) {
          monthlyData[period] = {
            period,
            total: 0,
            level: 0,
            matching: 0,
            rank_bonus: 0,
            leadership: 0,
            count: 0
          };
        }
        
        monthlyData[period].total += parseFloat(comm.amount);
        monthlyData[period][comm.commission_type] += parseFloat(comm.amount);
        monthlyData[period].count++;
      });

      const history = Object.values(monthlyData)
        .sort((a, b) => b.period.localeCompare(a.period))
        .slice(0, months);

      return {
        history,
        summary: {
          total_periods: history.length,
          total_earnings: history.reduce((sum, h) => sum + h.total, 0),
          average_monthly: history.length > 0 ? history.reduce((sum, h) => sum + h.total, 0) / history.length : 0,
          best_month: history.reduce((best, h) => h.total > (best?.total || 0) ? h : best, null)
        }
      };
    } catch (error) {
      console.error('Historical Earnings Error:', error);
      throw error;
    }
  }

  /**
   * Get team volume reports
   * @param {string} userId - User ID
   * @param {string} period - YYYY-MM format
   * @returns {Object} Volume report
   */
  async getTeamVolumeReport(userId, period = null) {
    try {
      const targetPeriod = period || new Date().toISOString().slice(0, 7);
      
      // Get user's downline
      const downline = await this.getDownline(userId, 10);
      
      // Calculate volume metrics
      const report = {
        period: targetPeriod,
        personal_volume: 0,
        team_volume: 0,
        level_volumes: {},
        top_performers: [],
        growth_metrics: {}
      };

      // Get user's personal volume
      const { data: user } = await supabase
        .from('users')
        .select('personal_volume, team_volume')
        .eq('id', userId)
        .single();

      report.personal_volume = user?.personal_volume || 0;
      report.team_volume = user?.team_volume || 0;

      // Calculate level-wise volumes
      for (const member of downline) {
        const level = member.level;
        const volume = member.users?.personal_volume || 0;
        
        if (!report.level_volumes[level]) {
          report.level_volumes[level] = { count: 0, total_volume: 0 };
        }
        
        report.level_volumes[level].count++;
        report.level_volumes[level].total_volume += volume;
      }

      // Get top performers
      report.top_performers = downline
        .filter(m => m.users?.personal_volume > 0)
        .sort((a, b) => (b.users?.personal_volume || 0) - (a.users?.personal_volume || 0))
        .slice(0, 5)
        .map(m => ({
          email: m.users.email,
          referral_code: m.users.referral_code,
          rank: m.users.rank,
          volume: m.users.personal_volume,
          level: m.level
        }));

      return report;
    } catch (error) {
      console.error('Team Volume Report Error:', error);
      throw error;
    }
  }

  /**
   * Get performance leaderboards
   * @param {string} type - Leaderboard type ('earnings', 'referrals', 'volume')
   * @param {string} period - Time period ('monthly', 'weekly', 'all-time')
   * @param {number} limit - Number of results
   * @returns {Array} Leaderboard data
   */
  async getLeaderboard(type = 'earnings', period = 'monthly', limit = 10) {
    try {
      let leaderboard = [];

      switch (type) {
        case 'earnings':
          leaderboard = await this.getEarningsLeaderboard(period, limit);
          break;
        case 'referrals':
          leaderboard = await this.getReferralsLeaderboard(limit);
          break;
        case 'volume':
          leaderboard = await this.getVolumeLeaderboard(limit);
          break;
        default:
          throw new Error('Invalid leaderboard type');
      }

      return leaderboard;
    } catch (error) {
      console.error('Leaderboard Error:', error);
      throw error;
    }
  }

  /**
   * Get earnings leaderboard
   */
  async getEarningsLeaderboard(period, limit) {
    const { data: commissions } = await supabase
      .from('commissions')
      .select('user_id, amount, users!commissions_user_id_fkey(email, referral_code, rank)')
      .eq('status', 'paid');

    // Group by user and sum earnings
    const userEarnings = {};
    commissions?.forEach(comm => {
      if (!userEarnings[comm.user_id]) {
        userEarnings[comm.user_id] = {
          user: comm.users,
          total_earnings: 0
        };
      }
      userEarnings[comm.user_id].total_earnings += parseFloat(comm.amount);
    });

    return Object.values(userEarnings)
      .sort((a, b) => b.total_earnings - a.total_earnings)
      .slice(0, limit);
  }

  /**
   * Get referrals leaderboard
   */
  async getReferralsLeaderboard(limit) {
    const { data: users } = await supabase
      .from('users')
      .select('id, email, referral_code, rank')
      .eq('active_status', true);

    const leaderboard = [];

    for (const user of users || []) {
      const stats = await this.getTreeStats(user.id);
      leaderboard.push({
        user,
        direct_referrals: stats.direct_referrals,
        total_team_size: stats.total_team_size
      });
    }

    return leaderboard
      .sort((a, b) => b.direct_referrals - a.direct_referrals)
      .slice(0, limit);
  }

  /**
   * Get volume leaderboard
   */
  async getVolumeLeaderboard(limit) {
    const { data: users } = await supabase
      .from('users')
      .select('email, referral_code, rank, personal_volume, team_volume')
      .eq('active_status', true)
      .order('personal_volume', { ascending: false })
      .limit(limit);

    return users?.map(user => ({
      user,
      personal_volume: user.personal_volume || 0,
      team_volume: user.team_volume || 0
    })) || [];
  }

  /**
   * Get visual tree structure for user
   * @param {string} userId - Root user ID
   * @param {number} depth - Tree depth to fetch
   * @returns {Object} Tree structure
   */
  async getVisualTree(userId, depth = 3) {
    try {
      const { data: rootUser } = await supabase
        .from('users')
        .select('id, email, referral_code, rank, personal_volume, active_status, joined_date')
        .eq('id', userId)
        .single();

      if (!rootUser) throw new Error('User not found');

      const tree = await this.buildTreeNode(rootUser, depth);
      return tree;
    } catch (error) {
      console.error('Visual Tree Error:', error);
      throw error;
    }
  }

  /**
   * Build tree node recursively
   * @param {Object} user - User data
   * @param {number} remainingDepth - Remaining depth to fetch
   * @returns {Object} Tree node
   */
  async buildTreeNode(user, remainingDepth) {
    const node = {
      id: user.id,
      email: user.email,
      referral_code: user.referral_code,
      rank: user.rank || 'bronze',
      personal_volume: user.personal_volume || 0,
      active_status: user.active_status,
      joined_date: user.joined_date,
      children: []
    };

    if (remainingDepth > 0) {
      // Get direct downline
      const { data: downline } = await supabase
        .from('referral_tree')
        .select(`
          users!referral_tree_user_id_fkey (
            id, email, referral_code, rank, personal_volume, active_status, joined_date
          )
        `)
        .eq('sponsor_id', user.id)
        .order('placement_date', { ascending: true });

      for (const member of downline || []) {
        if (member.users) {
          const childNode = await this.buildTreeNode(member.users, remainingDepth - 1);
          node.children.push(childNode);
        }
      }
    }

    return node;
  }

  /**
   * Update monthly qualifications for user
   * @param {string} userId - User ID
   * @param {string} period - YYYY-MM format
   */
  async updateMonthlyQualifications(userId, period = null) {
    try {
      const targetPeriod = period || new Date().toISOString().slice(0, 7);
      
      // Get user's current stats
      const { data: user } = await supabase
        .from('users')
        .select('personal_volume, team_volume')
        .eq('id', userId)
        .single();

      const stats = await this.getTreeStats(userId);

      // Check qualification status
      const rankRequirements = {
        bronze: { direct: 0, volume: 0 },
        silver: { direct: 3, volume: 500 },
        gold: { direct: 6, volume: 2000 },
        platinum: { direct: 11, volume: 5000 },
        diamond: { direct: 21, volume: 15000 }
      };

      let qualifiedRank = 'bronze';
      for (const [rank, requirements] of Object.entries(rankRequirements)) {
        if (stats.direct_referrals >= requirements.direct && 
            (user?.personal_volume || 0) >= requirements.volume) {
          qualifiedRank = rank;
        }
      }

      // Update qualification record
      const { data: qualification } = await supabase
        .from('rank_qualifications')
        .upsert({
          user_id: userId,
          period: targetPeriod,
          personal_volume: user?.personal_volume || 0,
          team_volume: user?.team_volume || 0,
          active_referrals: stats.active_team_members,
          direct_referrals: stats.direct_referrals,
          qualified: true,
          rank_achieved: qualifiedRank
        }, {
          onConflict: 'user_id,period'
        })
        .select()
        .single();

      return qualification;
    } catch (error) {
      console.error('Monthly Qualification Error:', error);
      throw error;
    }
  }

  /**
   * Process monthly qualification run for all users
   * @param {string} period - YYYY-MM format
   */
  async processMonthlyQualifications(period = null) {
    try {
      const targetPeriod = period || new Date().toISOString().slice(0, 7);
      
      // Get all active users
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('active_status', true);

      const qualifications = [];

      for (const user of users || []) {
        const qualification = await this.updateMonthlyQualifications(user.id, targetPeriod);
        if (qualification) qualifications.push(qualification);
      }

      return qualifications;
    } catch (error) {
      console.error('Monthly Qualifications Processing Error:', error);
      throw error;
    }
  }

  /**
   * Calculate leadership bonuses for team builders
   * @param {string} period - YYYY-MM format
   */
  async calculateLeadershipBonuses(period = null) {
    try {
      const targetPeriod = period || new Date().toISOString().slice(0, 7);
      
      // Get users with significant teams (5+ active downlines)
      const { data: users } = await supabase
        .from('users')
        .select('id, email, rank')
        .eq('active_status', true);

      const bonuses = [];

      for (const user of users || []) {
        const stats = await this.getTreeStats(user.id);
        
        // Leadership bonus criteria
        if (stats.active_team_members >= 5) {
          // Calculate bonus based on team size and rank
          const baseBonus = Math.min(stats.active_team_members * 10, 500); // $10 per active member, max $500
          
          const rankMultipliers = {
            bronze: 0.5,
            silver: 1.0,
            gold: 1.5,
            platinum: 2.0,
            diamond: 3.0
          };

          const multiplier = rankMultipliers[user.rank] || 0.5;
          const leadershipBonus = baseBonus * multiplier;

          const { data: bonus } = await supabase
            .from('commissions')
            .insert({
              user_id: user.id,
              from_user_id: user.id,
              amount: leadershipBonus,
              commission_type: 'leadership',
              level: 0,
              period: targetPeriod
            })
            .select()
            .single();

          if (bonus) bonuses.push(bonus);
        }
      }

      return bonuses;
    } catch (error) {
      console.error('Leadership Bonus Error:', error);
      throw error;
    }
  }

  /**
   * Get available exclusive tasks for user based on rank
   * @param {string} userId - User ID
   * @returns {Array} Available exclusive tasks
   */
  async getExclusiveTasks(userId) {
    try {
      // Get user's rank
      const { data: user } = await supabase
        .from('users')
        .select('rank')
        .eq('id', userId)
        .single();

      const userRank = user?.rank || 'bronze';
      
      // Rank hierarchy for access control
      const rankHierarchy = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
      const userRankIndex = rankHierarchy.indexOf(userRank);

      // Get tasks user can access (their rank and below)
      const accessibleRanks = rankHierarchy.slice(0, userRankIndex + 1);
      
      const { data: tasks } = await supabase
        .from('exclusive_tasks')
        .select('*')
        .in('minimum_rank', accessibleRanks)
        .eq('is_active', true)
        .order('points_reward', { ascending: false });

      return tasks || [];
    } catch (error) {
      console.error('Exclusive Tasks Error:', error);
      throw error;
    }
  }

  /**
   * Complete exclusive task and process rewards
   * @param {string} userId - User ID
   * @param {string} taskId - Task ID
   * @returns {Object} Task completion result
   */
  async completeExclusiveTask(userId, taskId) {
    try {
      // Get task details
      const { data: task } = await supabase
        .from('exclusive_tasks')
        .select('*')
        .eq('id', taskId)
        .eq('is_active', true)
        .single();

      if (!task) throw new Error('Task not found or inactive');

      // Check user rank eligibility
      const { data: user } = await supabase
        .from('users')
        .select('rank')
        .eq('id', userId)
        .single();

      const rankHierarchy = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
      const userRankIndex = rankHierarchy.indexOf(user?.rank || 'bronze');
      const taskRankIndex = rankHierarchy.indexOf(task.minimum_rank);

      if (userRankIndex < taskRankIndex) {
        throw new Error(`Insufficient rank. Required: ${task.minimum_rank}, Current: ${user?.rank || 'bronze'}`);
      }

      // Process task completion with bonus points
      const result = await this.processTaskCompletion(userId, task.points_reward);

      return {
        task,
        points_earned: task.points_reward,
        commissions: result.commissions
      };
    } catch (error) {
      console.error('Exclusive Task Completion Error:', error);
      throw error;
    }
  }

  /**
   * Get commission rates based on user rank
   * @param {string} rank - User rank
   * @returns {Array} Commission rates by level
   */
  getCommissionRatesByRank(rank) {
    const baseRates = [0.10, 0.05, 0.03, 0.02, 0.01]; // Bronze rates
    
    const rankMultipliers = {
      bronze: 1.0,
      silver: 1.2,   // 20% bonus
      gold: 1.5,     // 50% bonus
      platinum: 1.8, // 80% bonus
      diamond: 2.0   // 100% bonus
    };

    const multiplier = rankMultipliers[rank] || 1.0;
    return baseRates.map(rate => rate * multiplier);
  }

  /**
   * Calculate and distribute commissions from task completion
   * @param {Object} taskCompletion - Task completion data
   * @returns {Array} Created commissions
   */
  async calculateCommissions(taskCompletion) {
    try {
      const { user_id, points_earned } = taskCompletion;
      const uplineChain = await this.getUplineChain(user_id, 5);
      const commissions = [];

      for (let i = 0; i < uplineChain.length && i < 5; i++) {
        const uplineUser = uplineChain[i];
        
        // Get user's rank-based commission rates
        const commissionRates = this.getCommissionRatesByRank(uplineUser.user.rank || 'bronze');
        const commission = points_earned * commissionRates[i];
        
        const { data: newCommission } = await supabase
          .from('commissions')
          .insert({
            user_id: uplineUser.user.id,
            from_user_id: user_id,
            amount: commission,
            commission_type: 'level',
            level: i + 1,
            period: new Date().toISOString().slice(0, 7)
          })
          .select()
          .single();

        if (newCommission) {
          commissions.push(newCommission);
          
          // Calculate matching bonus for this commission
          const matchingBonuses = await this.calculateMatchingBonuses(uplineUser.user.id, commission);
          commissions.push(...matchingBonuses);
        }
      }

      return commissions;
    } catch (error) {
      console.error('Commission Calculation Error:', error);
      throw error;
    }
  }

  /**
   * Update user's personal volume and trigger commission calculation
   * @param {string} userId - User ID
   * @param {number} points - Points earned
   */
  async processTaskCompletion(userId, points) {
    try {
      // Update personal volume
      const { data: currentUser } = await supabase
        .from('users')
        .select('personal_volume')
        .eq('id', userId)
        .single();
      
      await supabase
        .from('users')
        .update({ 
          personal_volume: (currentUser?.personal_volume || 0) + points
        })
        .eq('id', userId);

      // Calculate commissions
      const commissions = await this.calculateCommissions({ user_id: userId, points_earned: points });

      // Check rank advancement
      await this.checkRankAdvancement(userId);

      return { commissions, points_added: points };
    } catch (error) {
      console.error('Task Processing Error:', error);
      throw error;
    }
  }

  /**
   * Check and process rank advancement
   * @param {string} userId - User ID
   */
  async checkRankAdvancement(userId) {
    try {
      const stats = await this.getTreeStats(userId);
      const { data: user } = await supabase
        .from('users')
        .select('rank, personal_volume, team_volume')
        .eq('id', userId)
        .single();

      const rankRequirements = {
        bronze: { direct: 0, volume: 0 },
        silver: { direct: 3, volume: 500 },
        gold: { direct: 6, volume: 2000 },
        platinum: { direct: 11, volume: 5000 },
        diamond: { direct: 21, volume: 15000 }
      };

      const currentRank = user?.rank || 'bronze';
      let newRank = currentRank;

      for (const [rank, requirements] of Object.entries(rankRequirements)) {
        if (stats.direct_referrals >= requirements.direct && 
            (user?.personal_volume || 0) >= requirements.volume) {
          newRank = rank;
        }
      }

      if (newRank !== currentRank) {
        await supabase
          .from('users')
          .update({ rank: newRank })
          .eq('id', userId);

        await supabase
          .from('user_ranks')
          .insert({
            user_id: userId,
            rank: newRank,
            personal_volume: user?.personal_volume || 0,
            team_volume: user?.team_volume || 0,
            active_downlines: stats.active_team_members,
            direct_referrals: stats.direct_referrals
          });

        return { promoted: true, from: currentRank, to: newRank };
      }

      return { promoted: false, current_rank: currentRank };
    } catch (error) {
      console.error('Rank Check Error:', error);
      throw error;
    }
  }

  /**
   * Validate referral code
   * @param {string} referralCode - Referral code to validate
   * @returns {Object} Validation result
   */
  async validateReferralCode(referralCode) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, referral_code, active_status')
        .eq('referral_code', referralCode)
        .eq('active_status', true)
        .single();

      if (error || !user) {
        return { valid: false, message: 'Invalid or inactive referral code' };
      }

      return { 
        valid: true, 
        sponsor: user,
        message: 'Valid referral code' 
      };

    } catch (error) {
      return { valid: false, message: 'Error validating referral code' };
    }
  }
}

module.exports = new MLMService();
