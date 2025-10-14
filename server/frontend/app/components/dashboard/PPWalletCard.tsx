'use client';

import { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import api from '../../../src/lib/api';

interface PPWalletCardProps {
  loading?: boolean;
}

export default function PPWalletCard({ loading = false }: PPWalletCardProps) {
  const [ppData, setPPData] = useState({
    totalPP: 0,
    availablePP: 0,
    pendingPP: 0,
    conversionRate: 25
  });
  const [capStatus, setCapStatus] = useState({
    canEarn: true,
    percentage: 0,
    membershipPlan: 'none'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPPBalance();
    loadCapStatus();
  }, []);

  const loadCapStatus = async () => {
    try {
      const response = await api.getEarningsCapStatus();
      setCapStatus({
        canEarn: response.canEarn || true,
        percentage: response.percentage || 0,
        membershipPlan: response.membershipPlan || 'none'
      });
    } catch (error) {
      console.error('Cap status error:', error);
    }
  };

  const loadPPBalance = async () => {
    try {
      const response = await api.getPPBalance();
      setPPData({
        totalPP: response.totalPP || 0,
        availablePP: response.availablePP || 0,
        pendingPP: response.pendingPP || 0,
        conversionRate: response.conversionRate || 25
      });
    } catch (error) {
      console.error('PP Balance error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-16 lg:w-20"></div>
            <div className="h-5 w-5 lg:h-6 lg:w-6 bg-gray-200 rounded"></div>
          </div>
          <div className="h-6 lg:h-8 bg-gray-200 rounded w-20 lg:w-24 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-24 lg:w-32"></div>
        </div>
      </div>
    );
  }

  const formatPP = (amount: number) => {
    return new Intl.NumberFormat('en-NG').format(amount);
  };

  const formatNaira = (ppAmount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(ppAmount * ppData.conversionRate);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs lg:text-sm font-medium text-gray-600 truncate">PP Wallet</h3>
        <CurrencyDollarIcon className="h-5 w-5 lg:h-6 lg:w-6 text-gray-400 flex-shrink-0" />
      </div>
      
      <div className="mb-2">
        <p className="text-lg lg:text-2xl font-bold text-gray-900">
          {formatPP(ppData.totalPP)} PP
        </p>
      </div>
      
      <p className="text-xs lg:text-sm text-gray-600 mb-3">
        ≈ {formatNaira(ppData.totalPP)}
      </p>

      {/* Balance Breakdown */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
        <div className="flex items-center gap-1">
          <CheckCircleIcon className="h-3 w-3 text-green-500" />
          <span className="text-gray-600">Available: {formatPP(ppData.availablePP)}</span>
        </div>
        <div className="flex items-center gap-1">
          <ClockIcon className="h-3 w-3 text-yellow-500" />
          <span className="text-gray-600">Pending: {formatPP(ppData.pendingPP)}</span>
        </div>
      </div>

      {/* Earnings Cap Status */}
      {capStatus.percentage > 0 && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-600">Referral Cap:</span>
            <span className={`font-medium ${capStatus.percentage >= 90 ? 'text-red-600' : 'text-gray-700'}`}>
              {capStatus.percentage.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className={`h-1 rounded-full ${
                capStatus.percentage >= 90 ? 'bg-red-500' : 
                capStatus.percentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(capStatus.percentage, 100)}%` }}
            ></div>
          </div>
          {!capStatus.canEarn && (
            <p className="text-red-600 mt-1 text-xs">Upgrade to earn more</p>
          )}
        </div>
      )}
    </div>
  );
}
