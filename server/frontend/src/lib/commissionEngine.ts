export interface Commission {
  id: string;
  user_id: string;
  from_user_id: string;
  amount: number;
  type: 'direct' | 'override' | 'leadership' | 'matching' | 'bonus';
  level: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
}

export interface CommissionRates {
  direct: number;
  override: number[];
  leadership: { [rank: string]: number };
  matching: number;
}

export const MLM_RATES: CommissionRates = {
  direct: 0.10, // 10% direct commission
  override: [0.05, 0.03, 0.02, 0.01, 0.01], // Levels 1-5
  leadership: {
    'Silver': 0.02,
    'Gold': 0.03,
    'Platinum': 0.05,
    'Diamond': 0.07
  },
  matching: 0.25 // 25% matching bonus
};

export class CommissionEngine {
  static calculateDirect(saleAmount: number): number {
    return saleAmount * MLM_RATES.direct;
  }

  static calculateOverride(level: number, volume: number): number {
    const rate = MLM_RATES.override[level - 1] || 0;
    return volume * rate;
  }

  static calculateLeadership(rank: string, teamVolume: number): number {
    const rate = MLM_RATES.leadership[rank] || 0;
    return teamVolume * rate;
  }

  static calculateMatching(directCommission: number): number {
    return directCommission * MLM_RATES.matching;
  }

  static getTotalCommissions(commissions: Commission[]): {
    total: number;
    pending: number;
    paid: number;
    byType: { [key: string]: number };
  } {
    const result = {
      total: 0,
      pending: 0,
      paid: 0,
      byType: {
        direct: 0,
        override: 0,
        leadership: 0,
        matching: 0,
        bonus: 0
      }
    };

    commissions.forEach(commission => {
      result.total += commission.amount;
      
      if (commission.status === 'pending') {
        result.pending += commission.amount;
      } else if (commission.status === 'paid') {
        result.paid += commission.amount;
      }
      
      result.byType[commission.type] += commission.amount;
    });

    return result;
  }
}
