'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/layout/Sidebar';
import MetricsCard from '../components/dashboard/MetricsCard';
import ReferralCodeCard from '../components/dashboard/ReferralCodeCard';
import QRCodeSection from '../components/dashboard/QRCodeSection';
import NotificationCenter from '../components/dashboard/NotificationCenter';
import RealTimeEarnings from '../components/dashboard/RealTimeEarnings';
import PPWalletCard from '../components/dashboard/PPWalletCard';
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
  referralStats?: {
    total_clicks: number;
    conversions: number;
    conversion_rate: number;
  };
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
  const [showEarningsNotification, setShowEarningsNotification] = useState(false);
  
  const { user, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Load dashboard data from backend
        const [commissionsResponse, referralsResponse, referralStatsResponse] = await Promise.all([
          api.getCommissions(),
          api.getReferrals(),
          // Get referral stats if user has referral code
          user?.referral_code ? api.getReferralLiveStats(user.referral_code).catch(() => null) : Promise.resolve(null)
        ]);

        console.log('Dashboard data loaded:', {
          user,
          commissionsResponse,
          referralsResponse,
          referralStatsResponse
        });

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
          referralStats: referralStatsResponse ? {
            total_clicks: referralStatsResponse.all_time?.clicks || 0,
            conversions: referralStatsResponse.all_time?.conversions || 0,
            conversion_rate: parseFloat(referralStatsResponse.all_time?.conversion_rate || '0')
          } : undefined,
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

  const handleEarningsUpdate = (update: any) => {
    // Update dashboard data with new earnings
    setDashboardData(prev => prev ? {
      ...prev,
      totalEarnings: prev.totalEarnings + update.amount
    } : null);
    
    // Show notification
    setShowEarningsNotification(true);
    setTimeout(() => setShowEarningsNotification(false), 3000);
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
        <Sidebar />

        {/* Main content */}
        <div className="flex-1 lg:ml-64">
          {/* Mobile Header */}
          <div className="bg-white shadow-sm border-b px-4 py-4 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm lg:text-base text-gray-600">Welcome back, {user?.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <NotificationCenter />
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 lg:px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm min-h-[44px]"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 lg:p-8">
            {/* Metrics Grid - Final responsive breakpoints */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
              {/* PP Wallet Card - First priority for MLM */}
              <PPWalletCard loading={isLoading} />
              
              {/* Referral Code Card - Always takes full width on mobile, 1 card on tablet/desktop */}
              <ReferralCodeCard
                referralCode={user?.referral_code || 'No Code'}
                totalClicks={dashboardData?.referralStats?.total_clicks || 0}
                conversions={dashboardData?.referralStats?.conversions || 0}
                loading={isLoading}
              />
              
              {/* Real-time Earnings Card */}
              <RealTimeEarnings onEarningsUpdate={handleEarningsUpdate} />
              
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

            {/* QR Code Section - Below metrics, above quick actions */}
            <div className="mb-6 lg:mb-8">
              <QRCodeSection 
                referralCode={user?.referral_code || 'No Code'}
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

        {/* Earnings Update Notification */}
        {showEarningsNotification && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
            <div className="flex items-center gap-2">
              <CurrencyDollarIcon className="h-5 w-5" />
              <span className="font-medium">New earnings received!</span>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
