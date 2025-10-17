'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import PageHeader from '../components/layout/PageHeader';
import ProtectedRoute from '../../src/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/card';
import { Button } from '../../src/components/ui/button';
import { Input } from '../../src/components/ui/input';
import { Badge } from '../../src/components/ui/badge';
import { 
  ArrowRight, 
  ArrowLeft, 
  Target, 
  DollarSign, 
  Calendar,
  Search,
  Filter,
  Play,
  Heart,
  MessageCircle,
  Share,
  UserPlus,
  Eye
} from 'lucide-react';

interface TaskData {
  type: string;
  platform: string;
  content_url: string;
  age_groups: string[];
  countries: string[];
  devices: string[];
  pp_rate: number;
  total_budget: number;
  duration_days: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  platform: string;
  task_type: string;
  pp_reward: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimated_time: number;
  promoter_name: string;
  completion_rate: number;
  created_at: string;
}

const taskTypes = [
  { id: 'subscribe', name: 'Subscribe', icon: '📺', description: 'Get channel subscriptions' },
  { id: 'like', name: 'Like', icon: '👍', description: 'Get likes on content' },
  { id: 'comment', name: 'Comment', icon: '💬', description: 'Get comments on posts' },
  { id: 'share', name: 'Share', icon: '🔄', description: 'Get content shares' },
  { id: 'follow', name: 'Follow', icon: '👥', description: 'Get profile follows' },
  { id: 'watch', name: 'Watch', icon: '▶️', description: 'Get video views' }
];

const platforms = [
  { id: 'youtube', name: 'YouTube', icon: '🎥' },
  { id: 'instagram', name: 'Instagram', icon: '📸' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵' },
  { id: 'facebook', name: 'Facebook', icon: '📘' },
  { id: 'twitter', name: 'Twitter', icon: '🐦' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' }
];

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Subscribe to Tech Channel',
    description: 'Subscribe to our technology YouTube channel',
    platform: 'YouTube',
    task_type: 'subscribe',
    pp_reward: 50,
    difficulty: 'Easy',
    estimated_time: 2,
    promoter_name: 'TechGuru',
    completion_rate: 95,
    created_at: '2024-01-15T10:00:00Z'
  }
];

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<'browse' | 'create'>('browse');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (activeTab === 'browse') {
      setTasks(mockTasks);
    }
  }, [activeTab]);

  const getTaskIcon = (type: string) => {
    const icons = {
      subscribe: UserPlus,
      like: Heart,
      comment: MessageCircle,
      share: Share,
      watch: Play,
      follow: Eye
    };
    return icons[type as keyof typeof icons] || Target;
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex pb-16 lg:pb-0">
        <Sidebar />
        
        <div className="flex-1 lg:ml-64">
          <PageHeader 
            title="Task Marketplace" 
            description="Browse tasks or create campaigns to promote your content"
          />

          <div className="p-4 lg:p-8">
            {/* Tab Navigation */}
            <div className="flex mb-6">
              <button
                onClick={() => setActiveTab('browse')}
                className={`px-4 py-2 lg:px-6 lg:py-3 rounded-l-lg font-medium transition-colors min-h-[44px] ${
                  activeTab === 'browse'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Browse Tasks
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2 lg:px-6 lg:py-3 rounded-r-lg font-medium transition-colors min-h-[44px] ${
                  activeTab === 'create'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Create Campaign
              </button>
            </div>

            {activeTab === 'browse' ? (
              <div className="space-y-6">
                {/* Search */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search tasks..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Button variant="outline">
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Tasks Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                  {filteredTasks.map((task) => {
                    const IconComponent = getTaskIcon(task.task_type);
                    return (
                      <Card key={task.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                <IconComponent className="h-4 w-4 text-blue-600" />
                              </div>
                              <Badge variant="outline">{task.platform}</Badge>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">{task.pp_reward} PP</div>
                              <div className="text-xs text-gray-500">{task.estimated_time} min</div>
                            </div>
                          </div>
                          
                          <h3 className="font-semibold mb-2">{task.title}</h3>
                          <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                            <span>by {task.promoter_name}</span>
                            <span>{task.completion_rate}% completion rate</span>
                          </div>
                          
                          <Button className="w-full" size="sm">
                            Accept Task
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Task Creation</h3>
                  <p className="text-gray-600 mb-6">Advanced task creation wizard coming soon</p>
                  <Button disabled>Coming Soon</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
