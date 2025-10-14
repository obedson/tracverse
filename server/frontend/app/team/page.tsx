'use client';

import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

import Sidebar from '../components/layout/Sidebar';
import PageHeader from '../components/layout/PageHeader';
import ProtectedRoute from '../../src/components/auth/ProtectedRoute';
import { useAuthStore } from '../../src/stores/authStore';
import {
  UsersIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  UserIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapIcon,
  FunnelIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';
import api from '../../src/lib/api';

interface TeamMember {
  id: string;
  email: string;
  referral_code: string;
  rank?: string;
  level: number;
  personal_volume?: number;
  team_volume?: number;
  total_earnings?: number;
  active_status: boolean;
  created_at: string;
  children?: TeamMember[];
  sponsor_id?: string;
  position?: { x: number; y: number };
}

// Custom Node Component for MLM Tree
const MLMNode = ({ data }: { data: TeamMember & { onNodeClick: (member: TeamMember) => void } }) => {
  const isActive = data.active_status;
  const rankColor = {
    'Bronze': 'bg-amber-100 text-amber-800 border-amber-300',
    'Silver': 'bg-gray-100 text-gray-800 border-gray-300',
    'Gold': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Platinum': 'bg-blue-100 text-blue-800 border-blue-300',
    'Diamond': 'bg-purple-100 text-purple-800 border-purple-300'
  }[data.rank || 'Bronze'] || 'bg-gray-100 text-gray-800 border-gray-300';

  return (
    <div 
      className={`p-3 rounded-lg border-2 cursor-pointer hover:shadow-lg transition-all min-w-[200px] ${
        isActive ? 'bg-white border-green-400 shadow-md' : 'bg-gray-50 border-gray-300'
      }`}
      onClick={() => data.onNodeClick(data)}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
        }`}>
          <UserIcon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 truncate">{data.email}</p>
          <p className="text-xs text-gray-500">Level {data.level}</p>
        </div>
      </div>

      {/* Referral Code */}
      <div className="mb-2">
        <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-center">
          {data.referral_code}
        </p>
      </div>

      {/* Rank Badge */}
      <div className={`text-xs px-2 py-1 rounded-full text-center mb-2 ${rankColor}`}>
        {data.rank || 'Bronze'}
      </div>

      {/* Performance Metrics */}
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Volume:</span>
          <span className="font-medium">${data.personal_volume?.toFixed(0) || '0'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Earnings:</span>
          <span className="font-medium text-green-600">${data.total_earnings?.toFixed(0) || '0'}</span>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mt-2 text-center">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
          isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-1 ${
            isActive ? 'bg-green-400' : 'bg-red-400'
          }`}></div>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  );
};

const nodeTypes: NodeTypes = {
  mlmNode: MLMNode,
};

export default function TeamPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('tree');
  const [teamData, setTeamData] = useState<TeamMember[]>([]);
  const [teamStats, setTeamStats] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [rankData, setRankData] = useState<any>(null);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [activityTimeline, setActivityTimeline] = useState<any[]>([]);
  const [teamReports, setTeamReports] = useState<any[]>([]);
  const [performanceComparison, setPerformanceComparison] = useState<any[]>([]);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [filterRank, setFilterRank] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    loadTeamData();
    loadTeamStats();
    loadPerformanceData();
    loadRankData();
    loadTopPerformers();
    loadActivityTimeline();
    loadTeamReports();
    loadPerformanceComparison();
  }, []);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      const response = await api.getTeamTree();
      const data = Array.isArray(response) ? response : 
                   Array.isArray(response.referrals) ? response.referrals :
                   Array.isArray(response.data) ? response.data : [];
      setTeamData(data);
      generateFlowData(data);
    } catch (error) {
      console.error('Failed to load team data:', error);
      setTeamData([]);
      generateFlowData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamStats = async () => {
    try {
      const stats = await api.getTeamStats();
      setTeamStats(stats);
    } catch (error) {
      console.error('Failed to load team stats:', error);
      setTeamStats({
        total_downline: 0,
        direct_referrals: 0,
        active_members: 0,
        total_volume: 0
      });
    }
  };

  const loadPerformanceData = async () => {
    try {
      const performance = await api.getTeamPerformance();
      setPerformanceData(performance.data || performance);
    } catch (error: any) {
      console.error('Failed to load performance data:', error);
      // Handle missing endpoints gracefully
      setPerformanceData({ 
        isNotImplemented: true,
        message: 'Performance analytics coming soon'
      });
    }
  };

  const loadRankData = async () => {
    try {
      const ranks = await api.getRankDistribution();
      setRankData(ranks.data || ranks);
    } catch (error: any) {
      console.error('Failed to load rank data:', error);
      // Set empty data for missing endpoints
      setRankData({ distribution: [], monthly_progress: [] });
    }
  };

  const loadTopPerformers = async () => {
    try {
      const performers = await api.getTopPerformers();
      setTopPerformers(performers.data || performers || []);
    } catch (error: any) {
      console.error('Failed to load top performers:', error);
      setTopPerformers([]);
    }
  };

  const loadActivityTimeline = async () => {
    try {
      const timeline = await api.getActivityTimeline();
      setActivityTimeline(timeline.data || timeline || []);
    } catch (error: any) {
      console.error('Failed to load activity timeline:', error);
      setActivityTimeline([]);
    }
  };

  const loadTeamReports = async () => {
    try {
      const reports = await api.getTeamReports();
      setTeamReports(reports.data || reports || []);
    } catch (error: any) {
      console.error('Failed to load team reports:', error);
      setTeamReports([]);
    }
  };

  const loadPerformanceComparison = async () => {
    try {
      const comparison = await api.getPerformanceComparison();
      setPerformanceComparison(comparison.data || comparison || []);
    } catch (error) {
      console.error('Failed to load performance comparison:', error);
      // Set mock data for missing endpoint
      setPerformanceComparison([
        { rank: 'Bronze', members: 45, avgVolume: 1200, avgEarnings: 150 },
        { rank: 'Silver', members: 12, avgVolume: 3500, avgEarnings: 450 },
        { rank: 'Gold', members: 3, avgVolume: 8500, avgEarnings: 1200 }
      ]);
    }
  };

  // Sorting function
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedReports = React.useMemo(() => {
    if (!sortConfig) return teamReports;
    
    return [...teamReports].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number') {
        return sortConfig.direction === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
      
      return 0;
    });
  }, [teamReports, sortConfig]);

  // Generate React Flow nodes and edges from team data
  const generateFlowData = (data: TeamMember[]) => {
    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];
    
    const processNode = (member: TeamMember, level: number = 0, parentId?: string, index: number = 0) => {
      const nodeId = member.id;
      const x = level * 300;
      const y = index * 150;

      // Create node
      flowNodes.push({
        id: nodeId,
        type: 'mlmNode',
        position: { x, y },
        data: { 
          ...member, 
          onNodeClick: (clickedMember: TeamMember) => setSelectedMember(clickedMember)
        },
      });

      // Create edge to parent
      if (parentId) {
        flowEdges.push({
          id: `${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          type: 'smoothstep',
          animated: member.active_status,
          style: { 
            stroke: member.active_status ? '#10b981' : '#6b7280',
            strokeWidth: 2
          },
        });
      }

      // Process children
      if (member.children && member.children.length > 0) {
        member.children.forEach((child, childIndex) => {
          processNode(child, level + 1, nodeId, childIndex);
        });
      }
    };

    data.forEach((rootMember, index) => {
      processNode(rootMember, 0, undefined, index);
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Filter functions
  const filteredNodes = nodes.filter(node => {
    const member = node.data as TeamMember;
    const matchesSearch = member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.referral_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRank = filterRank === 'all' || member.rank === filterRank;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && member.active_status) ||
                         (filterStatus === 'inactive' && !member.active_status);
    
    return matchesSearch && matchesRank && matchesStatus;
  });

  const tabs = [
    { id: 'tree', name: 'Interactive Tree', icon: MapIcon },
    { id: 'analytics', name: 'Performance Analytics', icon: ChartBarIcon },
    { id: 'reports', name: 'Team Reports', icon: TrophyIcon }
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex pb-16 lg:pb-0">
        <Sidebar />

        <div className="flex-1 lg:ml-64 w-full max-w-full overflow-x-hidden">
          <PageHeader 
            title="Team Management & Genealogy" 
            description="Interactive MLM tree visualization and team analytics"
          />

          <div className="p-4 sm:p-6 lg:p-8 pb-20 max-w-full overflow-hidden w-full">
            {/* Team Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
              <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                <div className="flex items-center gap-3">
                  <UsersIcon className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {teamStats?.total_downline || 0}
                    </p>
                    <p className="text-sm text-gray-600">Total Team</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                <div className="flex items-center gap-3">
                  <UserIcon className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {teamStats?.direct_referrals || 0}
                    </p>
                    <p className="text-sm text-gray-600">Direct Referrals</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                <div className="flex items-center gap-3">
                  <CurrencyDollarIcon className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      ${teamStats?.total_volume?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-sm text-gray-600">Team Volume</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                <div className="flex items-center gap-3">
                  <EyeIcon className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {teamStats?.active_members || 0}
                    </p>
                    <p className="text-sm text-gray-600">Active Members</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden sm:inline">{tab.name}</span>
                      <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Interactive Tree Tab */}
            {activeTab === 'tree' && (
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 lg:gap-6">
                {/* Tree Visualization */}
                <div className="xl:col-span-3">
                  <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                      <h3 className="text-lg font-semibold">MLM Genealogy Tree</h3>
                      
                      {/* Controls */}
                      <div className="flex flex-wrap gap-2">
                        <div className="relative">
                          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search members..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-auto"
                          />
                        </div>
                        
                        <select
                          value={filterRank}
                          onChange={(e) => setFilterRank(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          <option value="all">All Ranks</option>
                          <option value="Bronze">Bronze</option>
                          <option value="Silver">Silver</option>
                          <option value="Gold">Gold</option>
                          <option value="Platinum">Platinum</option>
                          <option value="Diamond">Diamond</option>
                        </select>

                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          <option value="all">All Status</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    {/* React Flow Tree */}
                    <div className="h-96 lg:h-[600px] border border-gray-200 rounded-lg overflow-hidden w-full max-w-full">
                      {loading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : (
                        <ReactFlow
                          nodes={filteredNodes}
                          edges={edges}
                          onNodesChange={onNodesChange}
                          onEdgesChange={onEdgesChange}
                          onConnect={onConnect}
                          nodeTypes={nodeTypes}
                          fitView
                          attributionPosition="bottom-left"
                        >
                          <Controls />
                          <MiniMap 
                            nodeColor={(node) => {
                              const member = node.data as TeamMember;
                              return member.active_status ? '#10b981' : '#6b7280';
                            }}
                            className="bg-white border border-gray-300"
                          />
                          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                          <Panel position="top-right">
                            <div className="bg-white p-2 rounded-lg shadow-sm border text-xs">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                <span>Active Members</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                                <span>Inactive Members</span>
                              </div>
                            </div>
                          </Panel>
                        </ReactFlow>
                      )}
                    </div>
                  </div>
                </div>

                {/* Member Details Panel */}
                <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                  <h3 className="text-lg font-semibold mb-4">Member Details</h3>
                  
                  {selectedMember ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <UserIcon className="h-8 w-8 text-blue-600" />
                        </div>
                        <h4 className="font-medium text-gray-900">{selectedMember.email}</h4>
                        <p className="text-sm text-gray-600 font-mono">{selectedMember.referral_code}</p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Rank:</span>
                          <span className="text-sm font-medium">{selectedMember.rank || 'Bronze'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Level:</span>
                          <span className="text-sm font-medium">{selectedMember.level}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Personal Volume:</span>
                          <span className="text-sm font-medium">${selectedMember.personal_volume?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Team Volume:</span>
                          <span className="text-sm font-medium">${selectedMember.team_volume?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Earnings:</span>
                          <span className="text-sm font-medium text-green-600">${selectedMember.total_earnings?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Status:</span>
                          <span className={`text-sm font-medium ${
                            selectedMember.active_status ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {selectedMember.active_status ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Joined:</span>
                          <span className="text-sm font-medium">
                            {new Date(selectedMember.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex flex-col gap-2">
                          <button className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm min-h-[44px]">
                            <EnvelopeIcon className="h-4 w-4" />
                            Contact Member
                          </button>
                          <button className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm min-h-[44px]">
                            <EyeIcon className="h-4 w-4" />
                            View Full Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <UserIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>Click on a team member in the tree to view details</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Performance Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-4 lg:space-y-6">
                {performanceData?.isNotImplemented ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ChartBarIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Performance Analytics Coming Soon</h3>
                    <p className="text-blue-700">Advanced team performance analytics are currently under development.</p>
                  </div>
                ) : performanceData?.isError ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">Unable to Load Analytics</h3>
                    <p className="text-red-700">Please try refreshing the page or contact support if the issue persists.</p>
                  </div>
                ) : (
                  <>
                {/* Existing analytics content */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Team Growth Rate</p>
                        <p className="text-2xl font-bold text-green-600">
                          +{performanceData?.growth_rate?.toFixed(1) || '0.0'}%
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <TrophyIcon className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{width: `${Math.min((performanceData?.growth_rate || 0) * 3, 100)}%`}}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">vs last month</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg Performance</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {performanceData?.avg_performance?.toFixed(1) || '0.0'}%
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <ChartBarIcon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{width: `${performanceData?.avg_performance || 0}%`}}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">team average</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Rank Promotions</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {performanceData?.rank_promotions || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <ArrowsPointingOutIcon className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-green-600">
                        +{Math.floor((performanceData?.rank_promotions || 0) / 3)} this month
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Activity Score</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {performanceData?.activity_score?.toFixed(1) || '0.0'}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <EyeIcon className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full" 
                          style={{width: `${performanceData?.activity_score || 0}%`}}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">engagement level</p>
                    </div>
                  </div>
                </div>

                {/* Performance Heat Map */}
                <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                  <h3 className="text-lg font-semibold mb-4">Team Performance Heat Map</h3>
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {/* Heat map grid */}
                    {(performanceData?.heat_map || Array.from({ length: 35 }, () => Math.random())).map((intensity: number, i: number) => {
                      const getColor = (val: number) => {
                        if (val > 0.8) return 'bg-green-500';
                        if (val > 0.6) return 'bg-green-400';
                        if (val > 0.4) return 'bg-yellow-400';
                        if (val > 0.2) return 'bg-orange-400';
                        return 'bg-red-400';
                      };
                      
                      return (
                        <div
                          key={i}
                          className={`w-8 h-8 rounded ${getColor(intensity)} opacity-80 hover:opacity-100 cursor-pointer transition-opacity`}
                          title={`Performance: ${(intensity * 100).toFixed(1)}%`}
                        ></div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Low Performance</span>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-400 rounded"></div>
                      <div className="w-3 h-3 bg-orange-400 rounded"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                      <div className="w-3 h-3 bg-green-400 rounded"></div>
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                    </div>
                    <span>High Performance</span>
                  </div>
                </div>

                {/* Rank Progression Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                    <h3 className="text-lg font-semibold mb-4">Rank Progression Tracking</h3>
                    <div className="space-y-4">
                      {(rankData?.distribution || []).map((item: any) => {
                        const colors = {
                          'Diamond': 'bg-purple-500',
                          'Platinum': 'bg-blue-500', 
                          'Gold': 'bg-yellow-500',
                          'Silver': 'bg-gray-400',
                          'Bronze': 'bg-amber-600'
                        };
                        return (
                          <div key={item.rank} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded ${colors[item.rank as keyof typeof colors]}`}></div>
                              <span className="font-medium">{item.rank}</span>
                              <span className="text-sm text-gray-600">({item.count} members)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${colors[item.rank as keyof typeof colors]}`}
                                  style={{width: `${item.percentage * 2}%`}}
                                ></div>
                              </div>
                              <span className="text-sm font-medium w-8">{item.percentage}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                    <h3 className="text-lg font-semibold mb-4">Monthly Progress Tracking</h3>
                    <div className="space-y-3">
                      {(rankData?.monthly_progress || []).map((item: any) => {
                        const net = item.promotions - item.demotions;
                        return (
                          <div key={item.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-sm">{item.month}</p>
                              <p className="text-xs text-gray-600">
                                {item.promotions} promotions, {item.demotions} demotions
                              </p>
                            </div>
                            <div className={`px-2 py-1 rounded text-sm font-medium ${
                              net >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {net >= 0 ? '+' : ''}{net}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Individual Performance Comparison */}
                <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                  <h3 className="text-lg font-semibold mb-4">Top Performers This Month</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Member
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rank
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Volume
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Growth
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Performance
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {topPerformers.map((member: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {member.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                member.rank === 'Diamond' ? 'bg-purple-100 text-purple-800' :
                                member.rank === 'Platinum' ? 'bg-blue-100 text-blue-800' :
                                member.rank === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                                member.rank === 'Silver' ? 'bg-gray-100 text-gray-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {member.rank}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${member.volume?.toLocaleString() || '0'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                              +{member.growth}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-green-600 h-2 rounded-full" 
                                    style={{width: `${member.score}%`}}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">{member.score}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                  </>
                )}
              </div>
            )}

            {/* Team Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-4 lg:space-y-6">
                {/* Activity Timeline */}
                <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Team Activity</h3>
                  {activityTimeline.length > 0 ? (
                    <div className="space-y-4">
                      {activityTimeline.map((activity, index) => {
                        const getIcon = (type: string) => {
                          switch (type) {
                            case 'promotion': return <TrophyIcon className="h-5 w-5 text-yellow-600" />;
                            case 'signup': return <UserIcon className="h-5 w-5 text-green-600" />;
                            case 'achievement': return <EyeIcon className="h-5 w-5 text-blue-600" />;
                            default: return <UsersIcon className="h-5 w-5 text-gray-600" />;
                          }
                        };

                        const getBgColor = (type: string) => {
                          switch (type) {
                            case 'promotion': return 'bg-yellow-100';
                            case 'signup': return 'bg-green-100';
                            case 'achievement': return 'bg-blue-100';
                            default: return 'bg-gray-100';
                          }
                        };

                        return (
                          <div key={index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getBgColor(activity.type)}`}>
                              {getIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">{activity.member}</p>
                                <p className="text-xs text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <UsersIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>No recent team activity</p>
                    </div>
                  )}
                </div>

                {/* Performance Comparison Chart */}
                <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                  <h3 className="text-lg font-semibold mb-4">Performance Comparison by Rank</h3>
                  {performanceComparison.length > 0 ? (
                    <div className="space-y-4">
                      {performanceComparison.map((rank: any) => {
                        const colors = {
                          'Diamond': 'bg-purple-500',
                          'Platinum': 'bg-blue-500',
                          'Gold': 'bg-yellow-500', 
                          'Silver': 'bg-gray-400',
                          'Bronze': 'bg-amber-600'
                        };
                        const maxVolume = Math.max(...performanceComparison.map((r: any) => r.avgVolume || 0));
                        const maxEarnings = Math.max(...performanceComparison.map((r: any) => r.avgEarnings || 0));
                        
                        return (
                          <div key={rank.rank} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded ${colors[rank.rank as keyof typeof colors] || 'bg-gray-500'}`}></div>
                                <h4 className="font-medium text-gray-900">{rank.rank}</h4>
                                <span className="text-sm text-gray-600">({rank.members || 0} members)</span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Average Volume</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${colors[rank.rank as keyof typeof colors] || 'bg-gray-500'}`}
                                      style={{width: `${maxVolume > 0 ? ((rank.avgVolume || 0) / maxVolume) * 100 : 0}%`}}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium">${(rank.avgVolume || 0).toLocaleString()}</span>
                                </div>
                              </div>
                              
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Average Earnings</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${colors[rank.rank as keyof typeof colors] || 'bg-gray-500'}`}
                                      style={{width: `${maxEarnings > 0 ? ((rank.avgEarnings || 0) / maxEarnings) * 100 : 0}%`}}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium">${(rank.avgEarnings || 0).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ChartBarIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>No performance comparison data available</p>
                    </div>
                  )}
                </div>

                {/* Sortable Data Table */}
                <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                  <h3 className="text-lg font-semibold mb-4">Comprehensive Team Report</h3>
                  {sortedReports.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('email')}
                          >
                            <div className="flex items-center gap-1">
                              Member
                              {sortConfig?.key === 'email' && (
                                <span className="text-blue-600">
                                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('rank')}
                          >
                            <div className="flex items-center gap-1">
                              Rank
                              {sortConfig?.key === 'rank' && (
                                <span className="text-blue-600">
                                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('level')}
                          >
                            <div className="flex items-center gap-1">
                              Level
                              {sortConfig?.key === 'level' && (
                                <span className="text-blue-600">
                                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('volume')}
                          >
                            <div className="flex items-center gap-1">
                              Volume
                              {sortConfig?.key === 'volume' && (
                                <span className="text-blue-600">
                                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('earnings')}
                          >
                            <div className="flex items-center gap-1">
                              Earnings
                              {sortConfig?.key === 'earnings' && (
                                <span className="text-blue-600">
                                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('recruits')}
                          >
                            <div className="flex items-center gap-1">
                              Recruits
                              {sortConfig?.key === 'recruits' && (
                                <span className="text-blue-600">
                                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('lastActivity')}
                          >
                            <div className="flex items-center gap-1">
                              Last Activity
                              {sortConfig?.key === 'lastActivity' && (
                                <span className="text-blue-600">
                                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sortedReports.map((member) => (
                          <tr key={member.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {member.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                member.rank === 'Diamond' ? 'bg-purple-100 text-purple-800' :
                                member.rank === 'Platinum' ? 'bg-blue-100 text-blue-800' :
                                member.rank === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                                member.rank === 'Silver' ? 'bg-gray-100 text-gray-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {member.rank}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {member.level}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${member.volume.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                              ${member.earnings.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {member.recruits}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                member.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {member.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(member.lastActivity).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <TrophyIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>No team report data available</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
