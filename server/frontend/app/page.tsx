'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../src/stores/authStore';

export default function HomePage() {
  const { isAuthenticated, isLoading, validateToken } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const isValid = await validateToken();
      
      if (isValid) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    };

    checkAuthAndRedirect();
  }, [validateToken, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
