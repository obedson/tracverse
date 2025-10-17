'use client';

import { useState, useEffect } from 'react';
import { 
  CheckIcon,
  SparklesIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../../src/stores/authStore';
import paymentService from '../../../src/lib/paymentService';
import api from '../../../src/lib/api';

interface MembershipPlan {
  id: number;
  name: string;
  tier_level: number;
  pp_allocation: number;
  price_naira: number;
}

export default function MembershipPlans() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<number | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    loadPlans();
    paymentService.loadPaystackScript();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await api.getMembershipPlans();
      const plansData = Array.isArray(response) ? response : (response?.data || []);
      setPlans(plansData);
    } catch (error) {
      console.error('Failed to load membership plans:', error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (plan: MembershipPlan) => {
    if (!user?.email) {
      alert('Please log in to purchase a membership plan');
      return;
    }

    setProcessingPayment(plan.id);
    
    try {
      await paymentService.initializePayment({
        email: user.email,
        amount: plan.price_naira,
        planName: plan.name,
        planId: plan.id,
        ppAllocation: plan.pp_allocation
      });
      
      // Payment successful
      alert(`Successfully purchased ${plan.name} plan! ${plan.pp_allocation} PP has been added to your wallet.`);
      
      // Refresh user data or redirect
      window.location.href = '/wallet';
      
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setProcessingPayment(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(price);
  };

  const formatPP = (pp: number) => {
    return new Intl.NumberFormat('en-NG').format(pp);
  };

  const getTierColor = (tierLevel: number) => {
    if (tierLevel <= 3) return 'from-amber-400 to-amber-600';
    if (tierLevel <= 6) return 'from-gray-400 to-gray-600';
    if (tierLevel <= 9) return 'from-yellow-400 to-yellow-600';
    if (tierLevel <= 12) return 'from-blue-400 to-blue-600';
    return 'from-purple-400 to-purple-600';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-4 lg:p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {Array.isArray(plans) && plans.map((plan) => (
        <div
          key={plan.id}
          className="relative bg-white rounded-lg shadow-sm border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-4 lg:p-6"
        >
          {/* Tier Badge */}
          <div className={`absolute -top-3 left-4 px-3 py-1 rounded-full text-white text-sm font-medium bg-gradient-to-r ${getTierColor(plan.tier_level)}`}>
            {plan.name}
          </div>

          <div className="pt-4">
            {/* Price */}
            <div className="text-center mb-4 lg:mb-6">
              <div className="text-2xl lg:text-3xl font-bold text-gray-900">
                {formatPrice(plan.price_naira)}
              </div>
              <div className="text-xs lg:text-sm text-gray-600">One-time payment</div>
            </div>

            {/* PP Allocation */}
            <div className="bg-blue-50 rounded-lg p-3 lg:p-4 mb-4 lg:mb-6">
              <div className="flex items-center justify-center gap-2">
                <SparklesIcon className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
                <span className="font-semibold text-blue-900 text-sm lg:text-base">
                  {formatPP(plan.pp_allocation)} PP
                </span>
              </div>
              <div className="text-center text-xs lg:text-sm text-blue-700 mt-1">
                Platform Points Included
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2 lg:space-y-3 mb-4 lg:mb-6">
              <div className="flex items-center gap-2">
                <CheckIcon className="h-3 w-3 lg:h-4 lg:w-4 text-green-500 flex-shrink-0" />
                <span className="text-xs lg:text-sm text-gray-700">
                  {formatPP(plan.pp_allocation)} PP for promotions
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="h-3 w-3 lg:h-4 lg:w-4 text-green-500 flex-shrink-0" />
                <span className="text-xs lg:text-sm text-gray-700">
                  Tier {plan.tier_level} benefits
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="h-3 w-3 lg:h-4 lg:w-4 text-green-500 flex-shrink-0" />
                <span className="text-xs lg:text-sm text-gray-700">
                  Task marketplace access
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="h-3 w-3 lg:h-4 lg:w-4 text-green-500 flex-shrink-0" />
                <span className="text-xs lg:text-sm text-gray-700">
                  Commission eligibility
                </span>
              </div>
            </div>

            {/* Purchase Button */}
            <button 
              onClick={() => handlePurchase(plan)}
              disabled={processingPayment === plan.id}
              className="w-full bg-blue-600 text-white py-2 lg:py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm lg:text-base min-h-[44px]"
            >
              {processingPayment === plan.id ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                'Purchase Plan'
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
