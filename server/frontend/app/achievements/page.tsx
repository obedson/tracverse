'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import PageHeader from '../components/layout/PageHeader';
import ProtectedRoute from '../../src/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/card';
import { Badge } from '../../src/components/ui/badge';
import { Progress } from '../../src/components/ui/progress';
import { Trophy, Star, Target, Users, Zap, Award, Gift, Crown } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  progress: number;
  max_progress: number;
  completed: boolean;
  reward_pp: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked_at?: string;
}

interface UserLevel {
  current_level: number;
  current_xp: number;
  xp_to_next: number;
  total_achievements: number;
  completed_achievements: number;
}

const mockAchievements: Achievement[] = [
  {
    id: '1',
    title: 'First Steps',
    description: 'Complete your first task',
    category: 'Tasks',
    icon: 'target',
    progress: 1,
    max_progress: 1,
    completed: true,
    reward_pp: 100,
    rarity: 'common',
    unlocked_at: '2024-01-10T10:00:00Z'
  },
  {
    id: '2',
    title: 'Task Master',
    description: 'Complete 100 tasks',
    category: 'Tasks',
    icon: 'trophy',
    progress: 67,
    max_progress: 100,
    completed: false,
    reward_pp: 1000,
    rarity: 'rare'
  },
  {
    id: '3',
    title: 'Verification Expert',
    description: 'Complete 500 verifications',
    category: 'Verification',
    icon: 'star',
    progress: 234,
    max_progress: 500,
    completed: false,
    reward_pp: 2500,
    rarity: 'epic'
  },
  {
    id: '4',
    title: 'Team Builder',
    description: 'Refer 10 active members',
    category: 'Referrals',
    icon: 'users',
    progress: 3,
    max_progress: 10,
    completed: false,
    reward_pp: 5000,
    rarity: 'legendary'
  }
];

const mockUserLevel: UserLevel = {
  current_level: 12,
  current_xp: 2450,
  xp_to_next: 3000,
  total_achievements: 25,
  completed_achievements: 18
};

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
    fetchUserLevel();
  }, []);

  const fetchAchievements = async () => {
    try {
      const response = await fetch('/api/achievements');
      const data = await response.json();
      setAchievements(data.achievements || mockAchievements);
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
      setAchievements(mockAchievements);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLevel = async () => {
    try {
      const response = await fetch('/api/achievements/level');
      const data = await response.json();
      setUserLevel(data || mockUserLevel);
    } catch (error) {
      console.error('Failed to fetch user level:', error);
      setUserLevel(mockUserLevel);
    }
  };

  const getIcon = (iconName: string) => {
    const icons = {
      trophy: Trophy,
      star: Star,
      target: Target,
      users: Users,
      zap: Zap,
      award: Award,
      gift: Gift,
      crown: Crown
    };
    return icons[iconName as keyof typeof icons] || Trophy;
  };

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'border-gray-300 bg-gray-50',
      rare: 'border-blue-300 bg-blue-50',
      epic: 'border-purple-300 bg-purple-50',
      legendary: 'border-yellow-300 bg-yellow-50'
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  const getRarityBadge = (rarity: string) => {
    const badges = {
      common: 'bg-gray-100 text-gray-800',
      rare: 'bg-blue-100 text-blue-800',
      epic: 'bg-purple-100 text-purple-800',
      legendary: 'bg-yellow-100 text-yellow-800'
    };
    return badges[rarity as keyof typeof badges] || badges.common;
  };

  const categories = ['all', 'Tasks', 'Verification', 'Referrals', 'Social', 'Milestones'];

  const filteredAchievements = achievements.filter(achievement => 
    selectedCategory === 'all' || achievement.category === selectedCategory
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex pb-16 lg:pb-0">
          <Sidebar />
          <div className="flex-1 lg:ml-64 p-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
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
            title="Achievements" 
            description="Track your progress and earn rewards"
          />

          <div className="p-4 lg:p-8 space-y-6">
            {/* User Level Card */}
            {userLevel && (
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Crown className="h-6 w-6 mr-2 text-yellow-500" />
                    Level {userLevel.current_level}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>XP Progress</span>
                        <span>{userLevel.current_xp} / {userLevel.xp_to_next}</span>
                      </div>
                      <Progress 
                        value={(userLevel.current_xp / userLevel.xp_to_next) * 100} 
                        className="h-3"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{userLevel.completed_achievements}</p>
                        <p className="text-sm text-gray-600">Completed</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-600">{userLevel.total_achievements}</p>
                        <p className="text-sm text-gray-600">Total</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors min-h-[44px] ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {category === 'all' ? 'All' : category}
                </button>
              ))}
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {filteredAchievements.map((achievement) => {
                const IconComponent = getIcon(achievement.icon);
                const progressPercentage = (achievement.progress / achievement.max_progress) * 100;
                
                return (
                  <Card
                    key={achievement.id}
                    className={`relative transition-all hover:shadow-md ${
                      achievement.completed 
                        ? 'border-green-300 bg-green-50' 
                        : getRarityColor(achievement.rarity)
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg ${
                            achievement.completed ? 'bg-green-100' : 'bg-white'
                          }`}>
                            <IconComponent className={`h-6 w-6 ${
                              achievement.completed ? 'text-green-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div className="ml-3">
                            <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                            <Badge className={getRarityBadge(achievement.rarity)}>
                              {achievement.rarity}
                            </Badge>
                          </div>
                        </div>
                        {achievement.completed && (
                          <div className="absolute -top-2 -right-2">
                            <div className="bg-green-500 text-white rounded-full p-1">
                              <Trophy className="h-4 w-4" />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{achievement.progress} / {achievement.max_progress}</span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-blue-600">
                            <Gift className="h-4 w-4 mr-1" />
                            {achievement.reward_pp} PP
                          </div>
                          {achievement.completed && achievement.unlocked_at && (
                            <div className="text-xs text-green-600">
                              Completed {new Date(achievement.unlocked_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
