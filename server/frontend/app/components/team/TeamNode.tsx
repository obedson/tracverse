'use client';

import { Handle, Position } from 'reactflow';
import { UserIcon } from '@heroicons/react/24/solid';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  rank: string;
  volume: number;
  joinDate: string;
  status: 'active' | 'inactive';
  level: number;
}

interface TeamNodeProps {
  data: {
    member: TeamMember;
    onClick: (memberId: string) => void;
  };
}

const rankColors = {
  Starter: 'bg-gray-100 text-gray-800 border-gray-300',
  Bronze: 'bg-orange-100 text-orange-800 border-orange-300',
  Silver: 'bg-gray-200 text-gray-800 border-gray-400',
  Gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Platinum: 'bg-purple-100 text-purple-800 border-purple-300',
  Diamond: 'bg-blue-100 text-blue-800 border-blue-300',
};

export default function TeamNode({ data }: TeamNodeProps) {
  const { member, onClick } = data;
  const isActive = member.status === 'active';

  return (
    <div
      className={`
        relative bg-white border-2 rounded-lg p-3 shadow-sm cursor-pointer transition-all hover:shadow-md
        ${isActive ? 'border-green-300' : 'border-red-300'}
        min-w-[200px]
      `}
      onClick={() => onClick(member.id)}
    >
      {/* Top handle for incoming connections */}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      {/* Member info */}
      <div className="flex items-center space-x-2 mb-2">
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center
          ${isActive ? 'bg-green-100' : 'bg-red-100'}
        `}>
          <UserIcon className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-red-600'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
          <p className="text-xs text-gray-500 truncate">{member.email}</p>
        </div>
      </div>

      {/* Rank badge */}
      <div className={`
        inline-flex px-2 py-1 text-xs font-semibold rounded-full border
        ${rankColors[member.rank as keyof typeof rankColors] || rankColors.Starter}
      `}>
        {member.rank}
      </div>

      {/* Volume */}
      <div className="mt-2 text-xs text-gray-600">
        Volume: ${member.volume.toLocaleString()}
      </div>

      {/* Status indicator */}
      <div className="absolute top-2 right-2">
        <div className={`
          w-2 h-2 rounded-full
          ${isActive ? 'bg-green-400' : 'bg-red-400'}
        `} />
      </div>

      {/* Bottom handle for outgoing connections */}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
