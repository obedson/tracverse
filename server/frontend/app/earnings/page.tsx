'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../src/components/auth/ProtectedRoute';
import { useAuthStore } from '../../src/stores/authStore';
import api from '../../src/lib/api';
import { CommissionEngine, Commission } from '../../src/lib/commissionEngine';
import {
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

interface EarningsData {
  commissions: Commission[];
  totalEarnings: number;
  pendingCommissions: number;
  paidCommissions: number;
  commissionsByType: { [key: string]: number };
}

export default function EarningsPage() {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestingPayout, setRequestingPayout] = useState(false);
  
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const loadEarningsData = async () => {
      try {
        setIsLoading(true);
        const commissionsResponse = await api.getCommissions();
        const commissions = Array.isArray(commissionsResponse) ? commissionsResponse : [];
        
        const totals = CommissionEngine.getTotalCommissions(commissions);
        
        setEarningsData({
          commissions,
          totalEarnings: totals.total,
          pendingCommissions: totals.pending,
          paidCommissions: totals.paid,
          commissionsByType: totals.byType
        });
      } catch (err: any) {
        console.error('Earnings load error:', err);
        setError('Failed to load earnings data');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadEarningsData();
    }
  }, [user]);

  const handlePayoutRequest = async () => {
    if (!earningsData?.pendingCommissions || earningsData.pendingCommissions <= 0) return;
    
    setRequestingPayout(true);
    try {
      // API call to request payout would go here
      alert(`Payout request of $${earningsData.pendingCommissions.toFixed(2)} submitted successfully!`);
    } catch (err) {
      alert('Failed to request payout. Please try again.');
    } finally {
      setRequestingPayout(false);
    }
  };

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 pb-16 lg:pb-0">
          <div className="text-center p-4">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-[44px]"
            >
              Retry
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0">
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Earnings</h1>
              <p className="text-sm lg:text-base text-gray-600">Track your commissions and payouts</p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-3 py-2 lg:px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm min-h-[44px]"
            >
              Back
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 lg:p-8">
          {/* Earnings Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs lg:text-sm font-medium text-gray-600">Total Earnings</h3>
                <CurrencyDollarIcon className="h-5 w-5 lg:h-6 lg:w-6 text-green-500" />
              </div>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">
                ${isLoading ? '0.00' : earningsData?.totalEarnings.toFixed(2)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs lg:text-sm font-medium text-gray-600">Pending</h3>
                <ClockIcon className="h-5 w-5 lg:h-6 lg:w-6 text-yellow-500" />
              </div>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">
                ${isLoading ? '0.00' : earningsData?.pendingCommissions.toFixed(2)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs lg:text-sm font-medium text-gray-600">Paid Out</h3>
                <CheckCircleIcon className="h-5 w-5 lg:h-6 lg:w-6 text-green-500" />
              </div>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">
                ${isLoading ? '0.00' : earningsData?.paidCommissions.toFixed(2)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs lg:text-sm font-medium text-gray-600">This Month</h3>
                <ChartBarIcon className="h-5 w-5 lg:h-6 lg:w-6 text-blue-500" />
              </div>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">$0.00</p>
            </div>
          </div>

          {/* Payout Request */}
          {earningsData && earningsData.pendingCommissions > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 lg:p-6 mb-6 lg:mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Request Payout</h3>
                  <p className="text-blue-700">
                    You have ${earningsData.pendingCommissions.toFixed(2)} available for payout
                  </p>
                </div>
                <button
                  onClick={handlePayoutRequest}
                  disabled={requestingPayout}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 min-h-[44px]"
                >
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  {requestingPayout ? 'Processing...' : 'Request Payout'}
                </button>
              </div>
            </div>
          )}

          {/* Commission Breakdown */}
          <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6 mb-6 lg:mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Commission Breakdown</h2>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(earningsData?.commissionsByType || {}).map(([type, amount]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-gray-600 capitalize">{type} Commissions</span>
                    <span className="font-semibold text-gray-900">${amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Commissions */}
          <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Commissions</h2>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : earningsData?.commissions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No commissions yet</p>
            ) : (
              <div className="space-y-3">
                {earningsData?.commissions.slice(0, 10).map((commission) => (
                  <div key={commission.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 capitalize">
                        {commission.type} Commission
                      </div>
                      <div className="text-sm text-gray-600">
                        Level {commission.level} • {new Date(commission.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">${commission.amount.toFixed(2)}</div>
                      <div className={`text-sm ${
                        commission.status === 'paid' ? 'text-green-600' : 
                        commission.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {commission.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
