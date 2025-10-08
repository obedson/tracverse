import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import api from '../lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  validateToken: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false
      }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      logout: () => {
        localStorage.removeItem('auth_token');
        set({ 
          user: null, 
          isAuthenticated: false,
          isLoading: false
        });
      },

      validateToken: async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          set({ isLoading: false, isAuthenticated: false, user: null });
          return false;
        }

        try {
          const userData = await api.getProfile();
          set({ 
            user: userData, 
            isAuthenticated: true, 
            isLoading: false 
          });
          return true;
        } catch (error) {
          localStorage.removeItem('auth_token');
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
