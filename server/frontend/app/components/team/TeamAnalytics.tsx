'use client';

import { useState, useEffect } from 'react';
import { ChartBarIcon, UsersIcon, TrophyIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  totalVolume: number;
  monthlyGrowth: number;
  topPerformers: Array<{
    name: string;
    volume: number;
    rank: string;
  }>;
  rankDistribution: Array<{
    rank: string;
    count: number;
    percentage: number;
  }>;
}

export default function TeamAnalytics() {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock analytics data
    setTimeout(() => {
      setStats({
        totalMembers: 24,
        activeMembers: 18,
        totalVolume: 45750,
        monthlyGrowth: 15.2,
        topPerformers: [
          { name: 'John Doe', volume: 2500, rank: 'Bronze' },
          { name: 'Jane Smith', volume: 1800, rank: 'Bronze' },
          { name: 'Sarah Wilson', volume: 1200, rank: 'Bronze' },
        ],
        rankDistribution: [
          { rank: 'Diamond', count: 0, percentage: 0 },
          { rank: 'Platinum', count: 0, percentage: 0 },
          { rank: 'Gold', count: 1, percentage: 4.2 },
          { rank: 'Silver', count: 1, percentage: 4.2 },
          { rank: 'Bronze', count: 6, percentage: 25 },
          { rank: 'Starter', count: 16, percentage: 66.6 },
        ],
      });
      setIsLoading(false);
    }, 800);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <UsersIcon className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active Members</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.activeMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Team Volume</p>
              <p className="text-2xl font-bold text-gray-900">${stats?.totalVolume.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <ChartBarIcon className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Monthly Growth</p>
              <p className="text-2xl font-bold text-gray-900">+{stats?.monthlyGrowth}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
        <div className="space-y-3">
          {stats?.topPerformers.map((performer, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">{performer.name}</p>
                  <p className="text-sm text-gray-600">{performer.rank}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">${performer.volume.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Volume</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rank Distribution */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rank Distribution</h3>
        <div className="space-y-3">
          {stats?.rankDistribution.map((rank) => (
            <div key={rank.rank} className="flex items-center justify-between">
              <div className="flex items-center">
                <TrophyIcon className="w-5 h-5 text-gray-400 mr-2" />
                <span className="font-medium text-gray-900">{rank.rank}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${rank.percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {rank.count} ({rank.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
