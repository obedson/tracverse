'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Award, DollarSign } from 'lucide-react';

interface CommissionData {
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  total_commissions: number;
}

interface CommissionCardProps {
  data: CommissionData;
}

export default function CommissionCard({ data }: CommissionCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Commission Earnings</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">₦{data.total_earnings.toLocaleString()}</div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="text-sm font-medium">₦{data.paid_earnings.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Award className="h-4 w-4 text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-sm font-medium">₦{data.pending_earnings.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          {data.total_commissions} total commissions
        </div>
      </CardContent>
    </Card>
  );
}
