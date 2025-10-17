'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Star, Award, Clock, CheckCircle } from 'lucide-react';

interface VerifierStatsProps {
  level: string;
  reputation: number;
  totalVerifications: number;
  accuracyRate: number;
  earningsToday: number;
  dailyQuota: number;
  completedToday: number;
}

export default function VerifierStatsCard({
  level = 'Gold',
  reputation = 850,
  totalVerifications = 1247,
  accuracyRate = 94.2,
  earningsToday = 180,
  dailyQuota = 50,
  completedToday = 23
}: VerifierStatsProps) {
  const getLevelColor = (level: string) => {
    const colors = {
      'Bronze': 'text-amber-600 bg-amber-100',
      'Silver': 'text-gray-600 bg-gray-100',
      'Gold': 'text-yellow-600 bg-yellow-100',
      'Diamond': 'text-purple-600 bg-purple-100'
    };
    return colors[level as keyof typeof colors] || colors.Gold;
  };

  const getEarningRate = (level: string) => {
    const rates = {
      'Bronze': 5,
      'Silver': 7,
      'Gold': 10,
      'Diamond': 15
    };
    return rates[level as keyof typeof rates] || 10;
  };

  const progressPercentage = (completedToday / dailyQuota) * 100;

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Award className="h-5 w-5 mr-2 text-yellow-500" />
            Verifier Stats
          </div>
          <Badge className={getLevelColor(level)}>
            {level} Verifier
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Earnings Today */}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div>
            <p className="text-sm text-green-700">Today's Earnings</p>
            <p className="text-2xl font-bold text-green-600">₦{earningsToday}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-green-600">₦{getEarningRate(level)} per verification</p>
            <p className="text-xs text-green-500">{completedToday} completed</p>
          </div>
        </div>

        {/* Daily Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Daily Quota Progress</span>
            <span>{completedToday}/{dailyQuota}</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <p className="text-xs text-gray-500 mt-1">
            {dailyQuota - completedToday} verifications remaining
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Star className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="font-bold text-lg">{reputation}</span>
            </div>
            <p className="text-xs text-gray-600">Reputation</p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <CheckCircle className="h-4 w-4 text-blue-500 mr-1" />
              <span className="font-bold text-lg">{accuracyRate}%</span>
            </div>
            <p className="text-xs text-gray-600">Accuracy</p>
          </div>
        </div>

        {/* Total Verifications */}
        <div className="text-center p-3 border rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Clock className="h-4 w-4 text-purple-500 mr-1" />
            <span className="font-bold text-xl text-purple-600">{totalVerifications.toLocaleString()}</span>
          </div>
          <p className="text-sm text-gray-600">Total Verifications</p>
        </div>

        {/* Next Level Progress */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-900 mb-2">Progress to {level === 'Diamond' ? 'Master' : 'Diamond'}</p>
          <Progress value={75} className="h-2" />
          <p className="text-xs text-blue-700 mt-1">
            {level === 'Diamond' ? '750/1000 reputation' : '150 more verifications needed'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
