'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  HomeIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ShareIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  UsersIcon as UsersIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  ShareIcon as ShareIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid
} from '@heroicons/react/24/solid';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  iconSolid: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: HomeIcon,
    iconSolid: HomeIconSolid
  },
  {
    id: 'team',
    label: 'Team',
    path: '/team',
    icon: UsersIcon,
    iconSolid: UsersIconSolid
  },
  {
    id: 'earnings',
    label: 'Earnings',
    path: '/earnings',
    icon: CurrencyDollarIcon,
    iconSolid: CurrencyDollarIconSolid
  },
  {
    id: 'marketing',
    label: 'Marketing',
    path: '/marketing',
    icon: ShareIcon,
    iconSolid: ShareIconSolid
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: Cog6ToothIcon,
    iconSolid: Cog6ToothIconSolid
  }
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-50">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const IconComponent = isActive ? item.iconSolid : item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`
                flex flex-col items-center justify-center min-h-[44px] min-w-[44px] 
                transition-colors duration-200 active:bg-gray-100
                ${isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
              aria-label={item.label}
            >
              <IconComponent className="w-6 h-6 mb-1" />
              <span className={`text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
