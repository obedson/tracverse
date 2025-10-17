'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';

interface PPAnalyticsProps {
  weeklyEarning?: number;
  monthlyEarning?: number;
  averageDaily?: number;
  earningVelocity?: number;
  spendingPattern?: {
    taskPromotions: number;
    withdrawals: number;
    platformFees: number;
  };
}

export default function PPAnalyticsCard({
  weeklyEarning = 2450,
  monthlyEarning = 8750,
  averageDaily = 350,
  earningVelocity = 15.2,
  spendingPattern = {
    taskPromotions: 5200,
    withdrawals: 12000,
    platformFees: 850
  }
}: PPAnalyticsProps) {
  const totalSpending = spendingPattern.taskPromotions + spendingPattern.withdrawals + spendingPattern.platformFees;
  
  const getVelocityColor = (velocity: number) => {
    if (velocity > 10) return 'text-green-600';
    if (velocity > 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getVelocityIcon = (velocity: number) => {
    return velocity > 0 ? TrendingUp : TrendingDown;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Earning Velocity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            PP Earning Velocity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">This Week</span>
            <span className="font-semibold text-green-600">+{weeklyEarning.toLocaleString()} PP</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">This Month</span>
            <span className="font-semibold text-green-600">+{monthlyEarning.toLocaleString()} PP</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Average Daily</span>
            <span className="font-semibold text-blue-600">+{averageDaily} PP</span>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Growth Rate</span>
              <div className="flex items-center">
                {React.createElement(getVelocityIcon(earningVelocity), {
                  className: `h-4 w-4 mr-1 ${getVelocityColor(earningVelocity)}`
                })}
                <span className={`font-bold ${getVelocityColor(earningVelocity)}`}>
                  {earningVelocity > 0 ? '+' : ''}{earningVelocity}%
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-600">Compared to last month</p>
          </div>
        </CardContent>
      </Card>

      {/* PP Usage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-orange-600" />
            PP Usage Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Task Promotions</span>
                <span className="font-semibold text-orange-600">-{spendingPattern.taskPromotions.toLocaleString()} PP</span>
              </div>
              <Progress 
                value={(spendingPattern.taskPromotions / totalSpending) * 100} 
                className="h-2"
              />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Withdrawals</span>
                <span className="font-semibold text-red-600">-{spendingPattern.withdrawals.toLocaleString()} PP</span>
              </div>
              <Progress 
                value={(spendingPattern.withdrawals / totalSpending) * 100} 
                className="h-2"
              />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Platform Fees</span>
                <span className="font-semibold text-gray-600">-{spendingPattern.platformFees.toLocaleString()} PP</span>
              </div>
              <Progress 
                value={(spendingPattern.platformFees / totalSpending) * 100} 
                className="h-2"
              />
            </div>
          </div>

          <div className="p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-red-900">Total Spent</span>
              <span className="font-bold text-red-600">-{totalSpending.toLocaleString()} PP</span>
            </div>
            <p className="text-xs text-red-700 mt-1">This month</p>
          </div>
        </CardContent>
      </Card>

      {/* Projections */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-purple-600" />
            PP Projections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(averageDaily * 7).toLocaleString()} PP
              </div>
              <p className="text-sm text-purple-700">Next Week Projection</p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(averageDaily * 30).toLocaleString()} PP
              </div>
              <p className="text-sm text-blue-700">Next Month Projection</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ₦{Math.round((averageDaily * 30) * 0.8).toLocaleString()}
              </div>
              <p className="text-sm text-green-700">Potential Withdrawal</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
