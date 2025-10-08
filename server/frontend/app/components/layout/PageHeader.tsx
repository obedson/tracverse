'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../src/stores/authStore';

interface PageHeaderProps {
  title: string;
  description?: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="bg-white shadow-sm border-b px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div className="ml-16 lg:ml-0 flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{title}</h1>
          {description && (
            <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">{description}</p>
          )}
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          {user && (
            <span className="hidden sm:block text-sm text-gray-600 truncate max-w-32">
              {user.email}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="px-3 py-2 sm:px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
