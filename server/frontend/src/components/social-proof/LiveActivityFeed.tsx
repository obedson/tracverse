'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'earning' | 'signup' | 'task_completion' | 'milestone';
  message: string;
  amount?: number;
  timestamp: string;
  user?: string;
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'earning',
    message: 'earned ₦500 from YouTube tasks',
    amount: 500,
    timestamp: '2 minutes ago',
    user: 'John D.'
  },
  {
    id: '2',
    type: 'signup',
    message: 'joined the platform',
    timestamp: '5 minutes ago',
    user: 'Sarah M.'
  },
  {
    id: '3',
    type: 'milestone',
    message: 'reached Gold level',
    timestamp: '8 minutes ago',
    user: 'Mike K.'
  }
];

export default function LiveActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 15420,
    totalPaidOut: 2500000,
    activeNow: 234
  });

  useEffect(() => {
    setActivities(mockActivities);
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        activeNow: prev.activeNow + Math.floor(Math.random() * 10) - 5
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'earning': return DollarSign;
      case 'signup': return Users;
      case 'milestone': return TrendingUp;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'earning': return 'text-green-600';
      case 'signup': return 'text-blue-600';
      case 'milestone': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Live Platform Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Platform Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{stats.totalUsers.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Total Users</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">₦{(stats.totalPaidOut / 1000000).toFixed(1)}M</div>
            <div className="text-xs text-gray-600">Paid Out</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">{stats.activeNow}</div>
            <div className="text-xs text-gray-600">Active Now</div>
          </div>
        </div>

        {/* Live Activity */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Recent Activity</h4>
          {activities.map((activity) => {
            const IconComponent = getActivityIcon(activity.type);
            return (
              <div key={activity.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                <div className={`p-1 rounded-full bg-gray-100 ${getActivityColor(activity.type)}`}>
                  <IconComponent className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span> {activity.message}
                  </p>
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
                {activity.amount && (
                  <Badge variant="outline" className="text-green-600">
                    +₦{activity.amount}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
