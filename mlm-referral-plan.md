# Tracverse MLM Referral System Development Plan

## Project Overview
Transform Tracverse into a Multi-Level Marketing (MLM) referral system where users earn commissions from their downline's activities and task completions.

## Phase 1: MLM Foundation (4-5 weeks)

### 1.1 Referral Tree Structure
- [ ] Binary/unilevel tree implementation
- [ ] Sponsor-downline relationships
- [ ] Genealogy tracking system
- [ ] Tree visualization component

### 1.2 User Hierarchy Management
- [ ] Referral code generation
- [ ] Upline/downline assignment
- [ ] Level depth tracking
- [ ] Spillover logic (if binary)

### 1.3 Commission Structure
- [ ] Direct referral bonuses
- [ ] Level-based commissions (5-10 levels)
- [ ] Matching bonuses
- [ ] Rank advancement bonuses

## Phase 2: Compensation Plan (3-4 weeks)

### 2.1 Commission Types
- [ ] **Direct Commission**: 10-20% of downline task earnings
- [ ] **Level Commission**: Decreasing % per level (5%, 3%, 2%, 1%...)
- [ ] **Matching Bonus**: 10-50% of direct referrals' commissions
- [ ] **Rank Bonus**: Monthly bonuses based on team performance

### 2.2 Qualification Requirements
- [ ] Personal volume requirements
- [ ] Team volume requirements
- [ ] Active downline requirements
- [ ] Monthly maintenance criteria

### 2.3 Payout System
- [ ] Weekly/monthly commission runs
- [ ] Minimum payout thresholds
- [ ] Payment processing integration
- [ ] Tax reporting (1099 generation)

## Phase 3: Rank & Recognition System (3-4 weeks)

### 3.1 Rank Structure
```
Bronze (0-2 active referrals)
Silver (3-5 active referrals + $500 team volume)
Gold (6-10 active referrals + $2000 team volume)
Platinum (11-20 active referrals + $5000 team volume)
Diamond (21+ active referrals + $15000 team volume)
```

### 3.2 Rank Benefits
- [ ] Higher commission percentages
- [ ] Exclusive task access
- [ ] Leadership bonuses
- [ ] Recognition rewards

### 3.3 Rank Maintenance
- [ ] Monthly qualification tracking
- [ ] Rank protection periods
- [ ] Re-qualification requirements
- [ ] Demotion handling

## Phase 4: Task Integration with MLM (4-5 weeks)

### 4.1 Task Commission Flow
- [ ] User completes task → earns points
- [ ] Upline receives commission on earnings
- [ ] Multi-level commission distribution
- [ ] Real-time commission tracking

### 4.2 Team Performance Tracking
- [ ] Personal task completion stats
- [ ] Team task completion volume
- [ ] Downline activity monitoring
- [ ] Performance leaderboards

### 4.3 Promotional Tools
- [ ] Custom referral landing pages
- [ ] Marketing material library
- [ ] Social sharing tools
- [ ] Referral link tracking

## Phase 5: MLM Analytics & Reports (3-4 weeks)

### 5.1 Genealogy Reports
- [ ] Visual tree representation
- [ ] Downline contact information
- [ ] Activity status indicators
- [ ] Placement tracking

### 5.2 Commission Reports
- [ ] Daily/weekly/monthly earnings
- [ ] Commission breakdown by type
- [ ] Historical earnings data
- [ ] Tax reporting documents

### 5.3 Team Analytics
- [ ] Team volume reports
- [ ] Rank progression tracking
- [ ] Performance comparisons
- [ ] Growth projections

## Database Schema (MLM Specific)

```sql
-- Referral Tree
referral_tree (
  id, user_id, sponsor_id, upline_id, 
  position, level, placement_date
)

-- Commissions
commissions (
  id, user_id, from_user_id, amount, 
  commission_type, level, task_id, period, status
)

-- Ranks
user_ranks (
  id, user_id, rank, achieved_date, 
  personal_volume, team_volume, active_downlines
)

-- Qualifications
rank_qualifications (
  id, user_id, period, personal_volume, 
  team_volume, active_referrals, qualified
)

-- Payouts
payouts (
  id, user_id, amount, period, 
  payment_method, status, processed_date
)
```

## MLM Business Logic

### Commission Calculation Algorithm
```javascript
function calculateCommissions(taskCompletion) {
  const user = taskCompletion.user;
  const earnings = taskCompletion.points_earned;
  
  // Get upline chain (5-10 levels)
  const uplineChain = getUplineChain(user.id, 10);
  
  uplineChain.forEach((uplineUser, level) => {
    if (uplineUser.isQualified(level)) {
      const commissionRate = getCommissionRate(level, uplineUser.rank);
      const commission = earnings * commissionRate;
      
      createCommission({
        user_id: uplineUser.id,
        from_user_id: user.id,
        amount: commission,
        level: level + 1,
        type: 'level_commission'
      });
    }
  });
}
```

### Rank Advancement Logic
```javascript
function checkRankAdvancement(userId, period) {
  const stats = getUserStats(userId, period);
  const currentRank = getUserRank(userId);
  
  const qualifications = {
    personal_volume: stats.personal_task_earnings,
    team_volume: stats.team_task_earnings,
    active_referrals: stats.active_downlines,
    direct_referrals: stats.direct_referrals
  };
  
  const newRank = calculateEligibleRank(qualifications);
  
  if (newRank > currentRank) {
    promoteUser(userId, newRank);
    triggerRankBonus(userId, newRank);
  }
}
```

## API Endpoints (MLM Specific)

```
Referrals:
GET /api/referrals/tree
POST /api/referrals/register
GET /api/referrals/downline
GET /api/referrals/stats

Commissions:
GET /api/commissions/earnings
GET /api/commissions/breakdown
POST /api/commissions/withdraw
GET /api/commissions/history

Ranks:
GET /api/ranks/current
GET /api/ranks/requirements
GET /api/ranks/leaderboard
GET /api/ranks/history

MLM Tools:
GET /api/tools/referral-link
GET /api/tools/marketing-materials
GET /api/tools/landing-page
POST /api/tools/invite
```

## Compliance & Legal Considerations

### 1. MLM Regulations
- [ ] Product-based compensation (tasks as products)
- [ ] No pay-to-play schemes
- [ ] Retail customer requirements
- [ ] Income disclosure statements

### 2. Financial Compliance
- [ ] 1099 tax reporting
- [ ] Anti-money laundering (AML)
- [ ] Know Your Customer (KYC)
- [ ] State business registrations

### 3. Ethical Guidelines
- [ ] No misleading income claims
- [ ] Clear compensation disclosure
- [ ] Cooling-off periods
- [ ] Refund policies

## Success Metrics

- **Recruitment Rate**: New referrals per active user
- **Retention Rate**: Active users month-over-month
- **Commission Payout**: Total commissions vs. revenue
- **Rank Distribution**: Users per rank level
- **Team Depth**: Average genealogy depth

## Risk Mitigation

- **Legal Risk**: Regular compliance audits
- **Pyramid Scheme Risk**: Focus on task completion value
- **Churn Risk**: Rank protection and re-qualification
- **Payment Risk**: Escrow and minimum thresholds

## Timeline: 17-22 weeks

**Phase 1-2**: MLM Foundation (7-9 weeks)
**Phase 3-4**: Ranks & Integration (7-9 weeks)  
**Phase 5**: Analytics & Launch (3-4 weeks)

## Revenue Model

- **Platform Fee**: 10-20% of all task payments
- **Membership Fees**: Monthly/annual subscriptions
- **Premium Tools**: Advanced analytics, marketing tools
- **Corporate Partnerships**: Brand task placements

This MLM system transforms task completion into a sustainable referral business model while maintaining compliance and ethical standards.
