'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import PageHeader from '../components/layout/PageHeader';
import ProtectedRoute from '../../src/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/card';
import { Button } from '../../src/components/ui/button';
import { Badge } from '../../src/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../src/components/ui/tabs';
import { Progress } from '../../src/components/ui/progress';
import { Wallet, Clock, TrendingUp, Download, Filter, Calendar } from 'lucide-react';
import PPAnalyticsCard from '../../src/components/wallet/PPAnalyticsCard';

interface PPBalance {
  total_pp: number;
  available_pp: number;
  pending_pp: number;
  purchased_pp: number;
  earned_pp: number;
}

interface Transaction {
  id: string;
  type: 'membership_purchase' | 'task_completion' | 'referral_bonus' | 'task_promotion' | 'withdrawal' | 'verification_earning' | 'platform_fee';
  amount: number;
  status: 'completed' | 'pending' | 'processing';
  description: string;
  created_at: string;
  release_date?: string;
  days_remaining?: number;
}

interface PendingRelease {
  date: string;
  amount: number;
  transactions: Transaction[];
}

const mockBalance: PPBalance = {
  total_pp: 58000,
  available_pp: 35000,
  pending_pp: 23000,
  purchased_pp: 35000,
  earned_pp: 23000
};

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'membership_purchase',
    amount: 25000,
    status: 'completed',
    description: 'Silver I Membership Purchase',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    type: 'task_completion',
    amount: 150,
    status: 'pending',
    description: 'YouTube Subscribe Task',
    created_at: '2024-01-16T14:30:00Z',
    release_date: '2024-02-15T14:30:00Z',
    days_remaining: 12
  },
  {
    id: '3',
    type: 'verification_earning',
    amount: 75,
    status: 'pending',
    description: 'Task Verification Reward',
    created_at: '2024-01-16T16:45:00Z',
    release_date: '2024-02-15T16:45:00Z',
    days_remaining: 12
  }
];

export default function WalletPage() {
  const [balance, setBalance] = useState<PPBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingReleases, setPendingReleases] = useState<PendingRelease[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        fetch('/api/pp-wallet/balance'),
        fetch('/api/pp-wallet/transactions')
      ]);
      
      const balanceData = await balanceRes.json();
      const transactionsData = await transactionsRes.json();
      
      setBalance(balanceData || mockBalance);
      setTransactions(transactionsData.transactions || mockTransactions);
      
      // Group pending transactions by release date
      const pending = (transactionsData.transactions || mockTransactions)
        .filter((t: Transaction) => t.status === 'pending' && t.release_date)
        .reduce((acc: { [key: string]: PendingRelease }, transaction: Transaction) => {
          const date = transaction.release_date!.split('T')[0];
          if (!acc[date]) {
            acc[date] = { date, amount: 0, transactions: [] };
          }
          acc[date].amount += transaction.amount;
          acc[date].transactions.push(transaction);
          return acc;
        }, {});
      
      setPendingReleases(Object.values(pending));
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
      setBalance(mockBalance);
      setTransactions(mockTransactions);
    }
  };

  const getTransactionColor = (type: string) => {
    const colors = {
      'membership_purchase': 'text-blue-600',
      'task_completion': 'text-green-600',
      'referral_bonus': 'text-purple-600',
      'task_promotion': 'text-orange-600',
      'withdrawal': 'text-red-600',
      'verification_earning': 'text-indigo-600',
      'platform_fee': 'text-gray-600'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'completed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const formatTransactionType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (!balance) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex pb-16 lg:pb-0">
          <Sidebar />
          <div className="flex-1 lg:ml-64 p-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex pb-16 lg:pb-0">
        <Sidebar />
        
        <div className="flex-1 lg:ml-64">
          <PageHeader 
            title="PP Wallet" 
            description="Manage your Platform Points and track transactions"
          />

          <div className="p-4 lg:p-8 space-y-6">
            {/* Triple Balance Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              <Card className="border-2 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Wallet className="h-5 w-5 mr-2 text-blue-600" />
                    Total PP Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {balance.total_pp.toLocaleString()} PP
                  </div>
                  <div className="text-sm text-gray-600">
                    All Platform Points
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                    Available PP
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {balance.available_pp.toLocaleString()} PP
                  </div>
                  <div className="text-sm text-gray-600">
                    Ready for use/withdrawal
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-yellow-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-yellow-600" />
                    Pending PP
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {balance.pending_pp.toLocaleString()} PP
                  </div>
                  <div className="text-sm text-gray-600">
                    30-day hold period
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* PP Source Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>PP Source Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Purchased PP</span>
                      <span className="text-sm text-blue-600">{balance.purchased_pp.toLocaleString()} PP</span>
                    </div>
                    <Progress 
                      value={(balance.purchased_pp / balance.total_pp) * 100} 
                      className="h-2 mb-1"
                    />
                    <p className="text-xs text-gray-500">Available immediately</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Earned PP</span>
                      <span className="text-sm text-yellow-600">{balance.earned_pp.toLocaleString()} PP</span>
                    </div>
                    <Progress 
                      value={(balance.earned_pp / balance.total_pp) * 100} 
                      className="h-2 mb-1"
                    />
                    <p className="text-xs text-gray-500">30-day hold period</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for different views */}
            <Tabs defaultValue="transactions" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="transactions">All Transactions</TabsTrigger>
                <TabsTrigger value="pending">Pending Releases</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="transactions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Transaction History</CardTitle>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                                {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} PP
                              </div>
                              <Badge className={getStatusBadge(transaction.status)}>
                                {transaction.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
                            <p className="text-xs text-gray-500">
                              {formatTransactionType(transaction.type)} • {new Date(transaction.created_at).toLocaleDateString()}
                            </p>
                            {transaction.days_remaining && (
                              <p className="text-xs text-yellow-600 mt-1">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {transaction.days_remaining} days remaining
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pending" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Pending PP Release Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pendingReleases.map((release, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold">
                              {new Date(release.date).toLocaleDateString()}
                            </h4>
                            <div className="text-lg font-bold text-green-600">
                              +{release.amount.toLocaleString()} PP
                            </div>
                          </div>
                          <div className="space-y-2">
                            {release.transactions.map((transaction) => (
                              <div key={transaction.id} className="text-sm text-gray-600 flex justify-between">
                                <span>{transaction.description}</span>
                                <span>+{transaction.amount} PP</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <PPAnalyticsCard />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
