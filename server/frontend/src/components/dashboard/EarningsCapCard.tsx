'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp } from 'lucide-react';

interface EarningsCapProps {
  currentEarnings: number;
  earningsCap: number;
  membershipTier: string;
}

export default function EarningsCapCard({ currentEarnings, earningsCap, membershipTier }: EarningsCapProps) {
  const percentage = (currentEarnings / earningsCap) * 100;
  const isNearCap = percentage > 80;
  const isAtCap = percentage >= 100;

  return (
    <Card className={isNearCap ? 'border-yellow-500' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Earnings Progress</CardTitle>
        {isNearCap && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
        {!isNearCap && <TrendingUp className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Current: ₦{currentEarnings.toLocaleString()}</span>
            <span>Cap: ₦{earningsCap.toLocaleString()}</span>
          </div>
          <Progress value={Math.min(percentage, 100)} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {isAtCap ? (
              <span className="text-red-500 font-medium">
                Earnings cap reached! Upgrade to {membershipTier} to continue earning.
              </span>
            ) : isNearCap ? (
              <span className="text-yellow-600">
                {(100 - percentage).toFixed(1)}% remaining before cap
              </span>
            ) : (
              <span>
                {percentage.toFixed(1)}% of earnings cap used
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
