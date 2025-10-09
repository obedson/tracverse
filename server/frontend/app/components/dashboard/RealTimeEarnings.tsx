'use client';

import { useState, useEffect } from 'react';
import { CurrencyDollarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../../src/stores/authStore';
import api from '../../../src/lib/api';

interface EarningsUpdate {
  amount: number;
  type: string;
  timestamp: string;
  source: string;
}

interface RealTimeEarningsProps {
  onEarningsUpdate?: (update: EarningsUpdate) => void;
}

export default function RealTimeEarnings({ onEarningsUpdate }: RealTimeEarningsProps) {
  const [currentEarnings, setCurrentEarnings] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [recentUpdate, setRecentUpdate] = useState<EarningsUpdate | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    loadInitialEarnings();
    const interval = setInterval(checkForUpdates, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  const loadInitialEarnings = async () => {
    try {
      const commissions = await api.getCommissions();
      const total = Array.isArray(commissions) 
        ? commissions.reduce((sum, c) => sum + (c.status === 'paid' ? c.amount : 0), 0)
        : 0;
      
      const today = new Date().toDateString();
      const todayTotal = Array.isArray(commissions)
        ? commissions
            .filter(c => new Date(c.created_at).toDateString() === today)
            .reduce((sum, c) => sum + c.amount, 0)
        : 0;

      setCurrentEarnings(total);
      setTodayEarnings(todayTotal);
    } catch (error) {
      console.error('Failed to load earnings:', error);
    }
  };

  const checkForUpdates = async () => {
    try {
      // Simulate real-time update - replace with actual WebSocket/polling
      const hasUpdate = Math.random() > 0.8; // 20% chance of update
      
      if (hasUpdate) {
        const updateAmount = Math.random() * 50 + 10; // $10-60
        const update: EarningsUpdate = {
          amount: updateAmount,
          type: 'direct',
          timestamp: new Date().toISOString(),
          source: 'New team member signup'
        };

        setCurrentEarnings(prev => prev + updateAmount);
        setTodayEarnings(prev => prev + updateAmount);
        setRecentUpdate(update);
        setIsAnimating(true);

        // Trigger parent callback
        onEarningsUpdate?.(update);

        // Reset animation after 3 seconds
        setTimeout(() => {
          setIsAnimating(false);
          setRecentUpdate(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  };

  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-sm p-4 lg:p-6 text-white relative overflow-hidden">
      {/* Animated background pulse */}
      {isAnimating && (
        <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
      )}
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm lg:text-base font-medium opacity-90">Live Earnings</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
            <span className="text-xs opacity-75">LIVE</span>
          </div>
        </div>

        <div className="mb-4">
          <div className={`text-2xl lg:text-3xl font-bold transition-all duration-500 ${
            isAnimating ? 'scale-110 text-yellow-200' : ''
          }`}>
            ${currentEarnings.toFixed(2)}
          </div>
          <div className="text-sm opacity-75">Total Earnings</div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">${todayEarnings.toFixed(2)}</div>
            <div className="text-xs opacity-75">Today</div>
          </div>
          
          {recentUpdate && (
            <div className="text-right animate-bounce">
              <div className="flex items-center gap-1 text-yellow-200">
                <ArrowTrendingUpIcon className="h-4 w-4" />
                <span className="text-sm font-medium">+${recentUpdate.amount.toFixed(2)}</span>
              </div>
              <div className="text-xs opacity-75">{recentUpdate.source}</div>
            </div>
          )}
        </div>

        {/* Progress indicator */}
        <div className="mt-4 bg-white/20 rounded-full h-2">
          <div 
            className="bg-white h-2 rounded-full transition-all duration-1000"
            style={{ width: `${Math.min((todayEarnings / 100) * 100, 100)}%` }}
          ></div>
        </div>
        <div className="text-xs opacity-75 mt-1">Daily Goal: $100</div>
      </div>
    </div>
  );
}
