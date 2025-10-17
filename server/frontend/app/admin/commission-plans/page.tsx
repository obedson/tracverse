'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import PageHeader from '../../components/layout/PageHeader';
import ProtectedRoute from '../../../src/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '../../../src/components/ui/card';
import { Button } from '../../../src/components/ui/button';
import { Input } from '../../../src/components/ui/input';
import { Badge } from '../../../src/components/ui/badge';
import { Settings, Save, Plus, Edit, Trash2 } from 'lucide-react';

interface CommissionPlan {
  id: string;
  name: string;
  description: string;
  direct_commission: number;
  level_2_commission: number;
  level_3_commission: number;
  level_4_commission: number;
  level_5_commission: number;
  matching_bonus: number;
  leadership_bonus: number;
  active: boolean;
  created_at: string;
}

const mockCommissionPlans: CommissionPlan[] = [
  {
    id: '1',
    name: 'Standard Plan',
    description: 'Default commission structure for all members',
    direct_commission: 10,
    level_2_commission: 5,
    level_3_commission: 3,
    level_4_commission: 2,
    level_5_commission: 1,
    matching_bonus: 5,
    leadership_bonus: 3,
    active: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Premium Plan',
    description: 'Enhanced commission structure for premium members',
    direct_commission: 15,
    level_2_commission: 8,
    level_3_commission: 5,
    level_4_commission: 3,
    level_5_commission: 2,
    matching_bonus: 8,
    leadership_bonus: 5,
    active: false,
    created_at: '2024-01-01T00:00:00Z'
  }
];

export default function CommissionPlansPage() {
  const [plans, setPlans] = useState<CommissionPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<CommissionPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    direct_commission: 10,
    level_2_commission: 5,
    level_3_commission: 3,
    level_4_commission: 2,
    level_5_commission: 1,
    matching_bonus: 5,
    leadership_bonus: 3
  });

  useEffect(() => {
    fetchCommissionPlans();
  }, []);

  const fetchCommissionPlans = async () => {
    try {
      const response = await fetch('/api/admin/commission-plans');
      const data = await response.json();
      setPlans(data.plans || mockCommissionPlans);
    } catch (error) {
      console.error('Failed to fetch commission plans:', error);
      setPlans(mockCommissionPlans);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const url = editingPlan 
        ? `/api/admin/commission-plans/${editingPlan.id}`
        : '/api/admin/commission-plans';
      
      const method = editingPlan ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchCommissionPlans();
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save commission plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this commission plan?')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/commission-plans/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchCommissionPlans();
      }
    } catch (error) {
      console.error('Failed to delete commission plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: CommissionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      direct_commission: plan.direct_commission,
      level_2_commission: plan.level_2_commission,
      level_3_commission: plan.level_3_commission,
      level_4_commission: plan.level_4_commission,
      level_5_commission: plan.level_5_commission,
      matching_bonus: plan.matching_bonus,
      leadership_bonus: plan.leadership_bonus
    });
    setIsCreating(true);
  };

  const resetForm = () => {
    setEditingPlan(null);
    setIsCreating(false);
    setFormData({
      name: '',
      description: '',
      direct_commission: 10,
      level_2_commission: 5,
      level_3_commission: 3,
      level_4_commission: 2,
      level_5_commission: 1,
      matching_bonus: 5,
      leadership_bonus: 3
    });
  };

  const togglePlanStatus = async (id: string, active: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/commission-plans/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active })
      });

      if (response.ok) {
        fetchCommissionPlans();
      }
    } catch (error) {
      console.error('Failed to toggle plan status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && plans.length === 0) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex pb-16 lg:pb-0">
          <Sidebar />
          <div className="flex-1 lg:ml-64 p-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map(i => (
                  <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
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
            title="Commission Plans" 
            description="Manage MLM commission structures and rates"
          />

          <div className="p-4 lg:p-8 space-y-6">
            {/* Create/Edit Form */}
            {isCreating && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    {editingPlan ? 'Edit Commission Plan' : 'Create New Commission Plan'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Plan Name</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g., Standard Plan"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Plan description"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Direct Commission (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.direct_commission}
                        onChange={(e) => setFormData({...formData, direct_commission: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Level 2 (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.level_2_commission}
                        onChange={(e) => setFormData({...formData, level_2_commission: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Level 3 (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.level_3_commission}
                        onChange={(e) => setFormData({...formData, level_3_commission: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Level 4 (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.level_4_commission}
                        onChange={(e) => setFormData({...formData, level_4_commission: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Level 5 (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.level_5_commission}
                        onChange={(e) => setFormData({...formData, level_5_commission: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Matching Bonus (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.matching_bonus}
                        onChange={(e) => setFormData({...formData, matching_bonus: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Leadership Bonus (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.leadership_bonus}
                        onChange={(e) => setFormData({...formData, leadership_bonus: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      {editingPlan ? 'Update Plan' : 'Create Plan'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Button */}
            {!isCreating && (
              <div className="flex justify-end">
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Plan
                </Button>
              </div>
            )}

            {/* Commission Plans List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {plans.map((plan) => (
                <Card key={plan.id} className={`${plan.active ? 'border-green-200' : 'border-gray-200'}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        {plan.name}
                        {plan.active && (
                          <Badge className="ml-2 bg-green-100 text-green-800">Active</Badge>
                        )}
                      </CardTitle>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(plan)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(plan.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Direct:</span> {plan.direct_commission}%
                        </div>
                        <div>
                          <span className="font-medium">Level 2:</span> {plan.level_2_commission}%
                        </div>
                        <div>
                          <span className="font-medium">Level 3:</span> {plan.level_3_commission}%
                        </div>
                        <div>
                          <span className="font-medium">Level 4:</span> {plan.level_4_commission}%
                        </div>
                        <div>
                          <span className="font-medium">Level 5:</span> {plan.level_5_commission}%
                        </div>
                        <div>
                          <span className="font-medium">Matching:</span> {plan.matching_bonus}%
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            Leadership Bonus: {plan.leadership_bonus}%
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => togglePlanStatus(plan.id, plan.active)}
                            className={plan.active ? 'text-red-600' : 'text-green-600'}
                          >
                            {plan.active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
