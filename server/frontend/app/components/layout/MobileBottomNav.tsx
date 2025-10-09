'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  UsersIcon,
  CurrencyDollarIcon,
  MegaphoneIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  UsersIcon as UsersIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  MegaphoneIcon as MegaphoneIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
} from '@heroicons/react/24/solid';

const navigation = [
  { 
    name: 'Home', 
    href: '/dashboard', 
    icon: HomeIcon, 
    activeIcon: HomeIconSolid 
  },
  { 
    name: 'Team', 
    href: '/team', 
    icon: UsersIcon, 
    activeIcon: UsersIconSolid 
  },
  { 
    name: 'Earnings', 
    href: '/earnings', 
    icon: CurrencyDollarIcon, 
    activeIcon: CurrencyDollarIconSolid 
  },
  { 
    name: 'Marketing', 
    href: '/marketing', 
    icon: MegaphoneIcon, 
    activeIcon: MegaphoneIconSolid 
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: Cog6ToothIcon, 
    activeIcon: Cog6ToothIconSolid 
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <nav className="flex">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = isActive ? item.activeIcon : item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 min-h-[60px] transition-colors ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
