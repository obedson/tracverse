import { CommissionEngine, Commission, MLM_RATES } from '../lib/commissionEngine';

describe('CommissionEngine', () => {
  const mockCommissions: Commission[] = [
    {
      id: '1',
      user_id: 'user1',
      from_user_id: 'user2',
      amount: 100,
      type: 'direct',
      level: 1,
      status: 'paid',
      created_at: '2024-01-01'
    },
    {
      id: '2',
      user_id: 'user1',
      from_user_id: 'user3',
      amount: 50,
      type: 'override',
      level: 2,
      status: 'pending',
      created_at: '2024-01-02'
    },
    {
      id: '3',
      user_id: 'user1',
      from_user_id: 'user4',
      amount: 75,
      type: 'leadership',
      level: 1,
      status: 'paid',
      created_at: '2024-01-03'
    }
  ];

  describe('calculateDirect', () => {
    it('calculates 10% direct commission correctly', () => {
      expect(CommissionEngine.calculateDirect(1000)).toBe(100);
      expect(CommissionEngine.calculateDirect(500)).toBe(50);
    });
  });

  describe('calculateOverride', () => {
    it('calculates override commissions by level', () => {
      expect(CommissionEngine.calculateOverride(1, 1000)).toBe(50); // 5%
      expect(CommissionEngine.calculateOverride(2, 1000)).toBe(30); // 3%
      expect(CommissionEngine.calculateOverride(3, 1000)).toBe(20); // 2%
      expect(CommissionEngine.calculateOverride(6, 1000)).toBe(0);  // Beyond level 5
    });
  });

  describe('calculateLeadership', () => {
    it('calculates leadership bonuses by rank', () => {
      expect(CommissionEngine.calculateLeadership('Silver', 1000)).toBe(20);   // 2%
      expect(CommissionEngine.calculateLeadership('Gold', 1000)).toBe(30);     // 3%
      expect(CommissionEngine.calculateLeadership('Platinum', 1000)).toBe(50); // 5%
      expect(CommissionEngine.calculateLeadership('Bronze', 1000)).toBe(0);    // No bonus
    });
  });

  describe('calculateMatching', () => {
    it('calculates 25% matching bonus', () => {
      expect(CommissionEngine.calculateMatching(100)).toBe(25);
      expect(CommissionEngine.calculateMatching(200)).toBe(50);
    });
  });

  describe('getTotalCommissions', () => {
    it('calculates totals correctly', () => {
      const result = CommissionEngine.getTotalCommissions(mockCommissions);
      
      expect(result.total).toBe(225);
      expect(result.paid).toBe(175);
      expect(result.pending).toBe(50);
      expect(result.byType.direct).toBe(100);
      expect(result.byType.override).toBe(50);
      expect(result.byType.leadership).toBe(75);
    });

    it('handles empty commission array', () => {
      const result = CommissionEngine.getTotalCommissions([]);
      
      expect(result.total).toBe(0);
      expect(result.paid).toBe(0);
      expect(result.pending).toBe(0);
    });
  });

  describe('MLM_RATES', () => {
    it('has correct commission rates', () => {
      expect(MLM_RATES.direct).toBe(0.10);
      expect(MLM_RATES.override).toEqual([0.05, 0.03, 0.02, 0.01, 0.01]);
      expect(MLM_RATES.leadership.Silver).toBe(0.02);
      expect(MLM_RATES.matching).toBe(0.25);
    });
  });
});
