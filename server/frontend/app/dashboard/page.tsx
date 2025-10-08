'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/layout/Sidebar';
import MetricsCard from '../components/dashboard/MetricsCard';
import ProtectedRoute from '../../src/components/auth/ProtectedRoute';
import { useAuthStore } from '../../src/stores/authStore';
import api from '../../src/lib/api';
import {
  CurrencyDollarIcon,
  TrophyIcon,
  UsersIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface DashboardData {
  totalEarnings: number;
  currentRank: string;
  teamSize: number;
  monthlyVolume: number;
  pendingCommissions: number;
  recentActivity: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Load dashboard data from backend
        const [commissionsResponse, referralsResponse] = await Promise.all([
          api.getCommissions(),
          api.getReferrals()
        ]);

        // Handle empty responses
        const commissions = Array.isArray(commissionsResponse) ? commissionsResponse : [];
        const referrals = Array.isArray(referralsResponse) ? referralsResponse : [];

        // Process the data
        const totalEarnings = commissions.reduce((sum: number, commission: any) => 
          sum + (commission.status === 'paid' ? parseFloat(commission.amount) || 0 : 0), 0
        );

        const pendingCommissions = commissions.reduce((sum: number, commission: any) => 
          sum + (commission.status === 'pending' ? parseFloat(commission.amount) || 0 : 0), 0
        );

        setDashboardData({
          totalEarnings,
          currentRank: user?.rank || 'Bronze',
          teamSize: referrals.length || 0,
          monthlyVolume: 0, // Will be calculated from actual data later
          pendingCommissions,
          recentActivity: [
            {
              type: 'team',
              message: referrals.length > 0 ? `${referrals.length} team members` : 'No team members yet',
              timestamp: '1h ago'
            },
            {
              type: 'commission',
              message: pendingCommissions > 0 ? `$${pendingCommissions.toFixed(2)} pending commissions` : 'No pending commissions',
              timestamp: '2h ago'
            },
            {
              type: 'rank',
              message: `Current rank: ${user?.rank || 'Bronze'}`,
              timestamp: '1d ago'
            }
          ]
        });

      } catch (err: any) {
        console.error('Dashboard load error:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/login');
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
      <div className="min-h-screen bg-gray-50 flex pb-16 lg:pb-0">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Main content */}
        <div className="flex-1 lg:ml-64">
          {/* Mobile Header */}
          <div className="bg-white shadow-sm border-b px-4 py-4 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm lg:text-base text-gray-600">Welcome back, {user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-2 lg:px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm min-h-[44px]"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 lg:p-8">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
              <MetricsCard
                title="Total Earnings"
                value={`$${dashboardData?.totalEarnings.toFixed(2) || '0.00'}`}
                change="+12.5% from last month"
                changeType="positive"
                icon={CurrencyDollarIcon}
                loading={isLoading}
              />
              <MetricsCard
                title="Current Rank"
                value={dashboardData?.currentRank || 'Loading...'}
                change="Next: Silver (75% complete)"
                changeType="neutral"
                icon={TrophyIcon}
                loading={isLoading}
              />
              <MetricsCard
                title="Team Size"
                value={dashboardData?.teamSize || 0}
                change="+3 new members this week"
                changeType="positive"
                icon={UsersIcon}
                loading={isLoading}
              />
              <MetricsCard
                title="Pending Commissions"
                value={`$${dashboardData?.pendingCommissions.toFixed(2) || '0.00'}`}
                change="Available for payout"
                changeType="positive"
                icon={ChartBarIcon}
                loading={isLoading}
              />
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <button 
                    onClick={() => router.push('/marketing')}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors min-h-[44px]"
                  >
                    <div className="font-medium text-gray-900">Generate Referral Link</div>
                    <div className="text-sm text-gray-600">Share your unique link to earn commissions</div>
                  </button>
                  <button 
                    onClick={() => router.push('/team')}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors min-h-[44px]"
                  >
                    <div className="font-medium text-gray-900">View Team Tree</div>
                    <div className="text-sm text-gray-600">See your downline structure and performance</div>
                  </button>
                  <button 
                    onClick={() => router.push('/earnings')}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors min-h-[44px]"
                  >
                    <div className="font-medium text-gray-900">Request Payout</div>
                    <div className="text-sm text-gray-600">Withdraw your available earnings</div>
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    dashboardData?.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">
                            {activity.type === 'team' ? 'Team Update' : 
                             activity.type === 'commission' ? 'Commission Update' : 'Rank Update'}
                          </div>
                          <div className="text-sm text-gray-600">{activity.message}</div>
                        </div>
                        <div className="text-sm text-gray-500">{activity.timestamp}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
