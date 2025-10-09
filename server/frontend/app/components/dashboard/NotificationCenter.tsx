'use client';

import { useState, useEffect } from 'react';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../../src/stores/authStore';
import api from '../../../src/lib/api';

interface Notification {
  id: string;
  type: 'commission' | 'team' | 'rank' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuthStore();

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      // Mock notifications for now - replace with actual API
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'commission',
          title: 'New Commission Earned',
          message: 'You earned $25.00 from John Doe\'s signup',
          timestamp: new Date().toISOString(),
          read: false
        },
        {
          id: '2', 
          type: 'team',
          title: 'Team Member Joined',
          message: 'Sarah Smith joined your team',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: false
        }
      ];
      
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const getIcon = (type: string) => {
    const colors = {
      commission: 'text-green-600 bg-green-100',
      team: 'text-blue-600 bg-blue-100', 
      rank: 'text-purple-600 bg-purple-100',
      system: 'text-gray-600 bg-gray-100'
    };
    return colors[type as keyof typeof colors] || colors.system;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getIcon(notification.type)}`}>
                        <BellIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
