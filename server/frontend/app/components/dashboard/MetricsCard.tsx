'use client';

interface MetricsCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}

export default function MetricsCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  loading = false
}: MetricsCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-16 lg:w-20"></div>
            <div className="h-5 w-5 lg:h-6 lg:w-6 bg-gray-200 rounded"></div>
          </div>
          <div className="h-6 lg:h-8 bg-gray-200 rounded w-20 lg:w-24 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-24 lg:w-32"></div>
        </div>
      </div>
    );
  }

  const changeColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  }[changeType];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs lg:text-sm font-medium text-gray-600 truncate">{title}</h3>
        <Icon className="h-5 w-5 lg:h-6 lg:w-6 text-gray-400 flex-shrink-0" />
      </div>
      <div className="mb-2">
        <p className="text-lg lg:text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <p className={`text-xs lg:text-sm ${changeColor}`}>
        {change}
      </p>
    </div>
  );
}
