'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import PageHeader from '../components/layout/PageHeader';
import ProtectedRoute from '../../src/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/card';
import { Button } from '../../src/components/ui/button';
import { Badge } from '../../src/components/ui/badge';
import { Star, Eye, CheckCircle, XCircle, Clock, Award } from 'lucide-react';

interface VerificationTask {
  id: string;
  task_type: string;
  platform: string;
  evidence_url: string;
  evidence_type: 'image' | 'video';
  reward: number;
  submitted_by: string;
  submitted_at: string;
  requirements: string;
}

interface VerifierStats {
  level: string;
  reputation: number;
  total_verifications: number;
  accuracy_rate: number;
  earnings_today: number;
  daily_quota: number;
  completed_today: number;
}

const mockVerificationTasks: VerificationTask[] = [
  {
    id: '1',
    task_type: 'subscribe',
    platform: 'youtube',
    evidence_url: '/api/placeholder/400/300',
    evidence_type: 'image',
    reward: 15,
    submitted_by: 'user123',
    submitted_at: '2024-01-15T10:30:00Z',
    requirements: 'Screenshot showing successful subscription to channel'
  },
  {
    id: '2',
    task_type: 'like',
    platform: 'instagram',
    evidence_url: '/api/placeholder/400/300',
    evidence_type: 'image',
    reward: 10,
    submitted_by: 'user456',
    submitted_at: '2024-01-15T11:15:00Z',
    requirements: 'Screenshot showing liked post with heart icon visible'
  }
];

const mockVerifierStats: VerifierStats = {
  level: 'Gold',
  reputation: 850,
  total_verifications: 1247,
  accuracy_rate: 94.2,
  earnings_today: 180,
  daily_quota: 50,
  completed_today: 23
};

export default function VerificationCenterPage() {
  const [verificationQueue, setVerificationQueue] = useState<VerificationTask[]>([]);
  const [currentTask, setCurrentTask] = useState<VerificationTask | null>(null);
  const [verifierStats, setVerifierStats] = useState<VerifierStats | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVerificationQueue();
    fetchVerifierStats();
  }, []);

  const fetchVerificationQueue = async () => {
    try {
      const response = await fetch('/api/verification/queue');
      const data = await response.json();
      setVerificationQueue(data.tasks || mockVerificationTasks);
    } catch (error) {
      console.error('Failed to fetch verification queue:', error);
      setVerificationQueue(mockVerificationTasks);
    }
  };

  const fetchVerifierStats = async () => {
    try {
      const response = await fetch('/api/verification/stats');
      const data = await response.json();
      setVerifierStats(data || mockVerifierStats);
    } catch (error) {
      console.error('Failed to fetch verifier stats:', error);
      setVerifierStats(mockVerifierStats);
    }
  };

  const submitVerification = async (approved: boolean) => {
    if (!currentTask) return;
    
    setLoading(true);
    try {
      await fetch(`/api/verification/${currentTask.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved,
          rating,
          feedback
        })
      });
      
      setCurrentTask(null);
      setRating(0);
      setFeedback('');
      fetchVerificationQueue();
      fetchVerifierStats();
    } catch (error) {
      console.error('Failed to submit verification:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    const colors = {
      'Bronze': 'text-amber-600 bg-amber-100',
      'Silver': 'text-gray-600 bg-gray-100',
      'Gold': 'text-yellow-600 bg-yellow-100',
      'Diamond': 'text-purple-600 bg-purple-100'
    };
    return colors[level as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex pb-16 lg:pb-0">
        <Sidebar />
        
        <div className="flex-1 lg:ml-64">
          <PageHeader 
            title="Verification Center" 
            description="Verify task completions and earn ₦5-15 per verification"
          />

          <div className="p-4 lg:p-8 space-y-6">
            {/* Verifier Stats */}
            {verifierStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Verifier Level</p>
                        <Badge className={getLevelColor(verifierStats.level)}>
                          {verifierStats.level}
                        </Badge>
                      </div>
                      <Award className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Today's Earnings</p>
                        <p className="text-2xl font-bold text-green-600">₦{verifierStats.earnings_today}</p>
                      </div>
                      <Clock className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Daily Progress</p>
                        <p className="text-2xl font-bold">{verifierStats.completed_today}/{verifierStats.daily_quota}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Accuracy Rate</p>
                        <p className="text-2xl font-bold text-purple-600">{verifierStats.accuracy_rate}%</p>
                      </div>
                      <Star className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Verification Queue */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Task Queue */}
              <Card>
                <CardHeader>
                  <CardTitle>Verification Queue</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {verificationQueue.map((task) => (
                    <div
                      key={task.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        currentTask?.id === task.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setCurrentTask(task)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{task.platform}</Badge>
                        <span className="text-green-600 font-semibold">₦{task.reward}</span>
                      </div>
                      <p className="text-sm text-gray-600 capitalize">{task.task_type} verification</p>
                      <p className="text-xs text-gray-500">Submitted by {task.submitted_by}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Evidence Review */}
              <Card>
                <CardHeader>
                  <CardTitle>Evidence Review</CardTitle>
                </CardHeader>
                <CardContent>
                  {currentTask ? (
                    <div className="space-y-4">
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <img
                          src={currentTask.evidence_url}
                          alt="Evidence"
                          className="max-w-full max-h-full object-contain rounded-lg"
                        />
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Requirements:</h4>
                        <p className="text-sm text-gray-600">{currentTask.requirements}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Quality Rating:</h4>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-6 w-6 cursor-pointer ${
                                star <= rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                              }`}
                              onClick={() => setRating(star)}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Feedback (Optional):</h4>
                        <textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          className="w-full p-2 border rounded-lg text-sm"
                          rows={3}
                          placeholder="Provide feedback for the submitter..."
                        />
                      </div>

                      <div className="flex space-x-3">
                        <Button
                          onClick={() => submitVerification(true)}
                          disabled={loading || rating === 0}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => submitVerification(false)}
                          disabled={loading}
                          variant="outline"
                          className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Select a task from the queue to start verification</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
