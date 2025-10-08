'use client';

import { useCallback, useEffect, useState } from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';
import TeamNode from './TeamNode';

const nodeTypes = {
  teamMember: TeamNode,
};

interface TeamMember {
  id: string;
  name: string;
  email: string;
  rank: string;
  volume: number;
  joinDate: string;
  status: 'active' | 'inactive';
  level: number;
  parentId?: string;
}

interface TeamTreeProps {
  userId: string;
}

export default function TeamTree({ userId }: TeamTreeProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  useEffect(() => {
    // Mock team data - in production, fetch from API
    const mockTeamData: TeamMember[] = [
      {
        id: '1',
        name: 'You',
        email: 'user@example.com',
        rank: 'Silver',
        volume: 5000,
        joinDate: '2023-01-15',
        status: 'active',
        level: 0,
      },
      {
        id: '2',
        name: 'John Doe',
        email: 'john@example.com',
        rank: 'Bronze',
        volume: 2500,
        joinDate: '2023-02-20',
        status: 'active',
        level: 1,
        parentId: '1',
      },
      {
        id: '3',
        name: 'Jane Smith',
        email: 'jane@example.com',
        rank: 'Bronze',
        volume: 1800,
        joinDate: '2023-03-10',
        status: 'active',
        level: 1,
        parentId: '1',
      },
      {
        id: '4',
        name: 'Mike Johnson',
        email: 'mike@example.com',
        rank: 'Starter',
        volume: 800,
        joinDate: '2023-04-05',
        status: 'inactive',
        level: 2,
        parentId: '2',
      },
      {
        id: '5',
        name: 'Sarah Wilson',
        email: 'sarah@example.com',
        rank: 'Bronze',
        volume: 1200,
        joinDate: '2023-03-25',
        status: 'active',
        level: 2,
        parentId: '3',
      },
    ];

    // Convert team data to ReactFlow nodes
    const flowNodes: Node[] = mockTeamData.map((member, index) => ({
      id: member.id,
      type: 'teamMember',
      position: {
        x: (member.level * 300) + (index % 2) * 150,
        y: member.level * 200 + (index % 3) * 50,
      },
      data: {
        member,
        onClick: (memberId: string) => {
          console.log('Clicked member:', memberId);
        },
      },
    }));

    // Create edges between parent and child nodes
    const flowEdges: Edge[] = mockTeamData
      .filter(member => member.parentId)
      .map(member => ({
        id: `${member.parentId}-${member.id}`,
        source: member.parentId!,
        target: member.id,
        type: 'smoothstep',
        style: { stroke: '#6366f1', strokeWidth: 2 },
      }));

    setNodes(flowNodes);
    setEdges(flowEdges);
    setIsLoading(false);
  }, [userId, setNodes, setEdges]);

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-96 bg-white rounded-lg border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
