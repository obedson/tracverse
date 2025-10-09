'use client';

import { useState } from 'react';
import { 
  ClipboardDocumentIcon, 
  CheckIcon,
  ShareIcon 
} from '@heroicons/react/24/outline';

interface ReferralCodeCardProps {
  referralCode: string;
  totalClicks?: number;
  conversions?: number;
  loading?: boolean;
}

export default function ReferralCodeCard({
  referralCode,
  totalClicks = 0,
  conversions = 0,
  loading = false
}: ReferralCodeCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    const referralUrl = `${window.location.origin}/register?ref=${referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Tracverse MLM',
          text: 'Join my team and start earning!',
          url: referralUrl,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(referralUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy URL:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-sm p-4 lg:p-6 text-white">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-3 bg-blue-300 rounded w-24"></div>
            <div className="h-4 w-4 bg-blue-300 rounded"></div>
          </div>
          <div className="h-4 bg-blue-300 rounded w-20 mb-3"></div>
          <div className="h-8 bg-blue-300 rounded w-full"></div>
        </div>
      </div>
    );
  }

  const conversionRate = totalClicks > 0 ? ((conversions / totalClicks) * 100).toFixed(1) : '0';

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-sm p-4 lg:p-6 text-white hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm lg:text-base font-medium opacity-90">Your Referral Code</h3>
        <ShareIcon className="h-5 w-5 lg:h-6 lg:w-6 opacity-75 flex-shrink-0" />
      </div>
      
      <div className="mb-4">
        <div className="mb-3">
          <p className="text-lg lg:text-xl font-bold text-center">{referralCode}</p>
          <div className="flex justify-center mt-2">
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Copy referral code"
            >
              {copied ? (
                <CheckIcon className="h-5 w-5 text-green-300" />
              ) : (
                <ClipboardDocumentIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center text-sm lg:text-base opacity-90">
          <div className="space-y-1">
            <div className="font-semibold">{totalClicks}</div>
            <div className="text-xs opacity-75">clicks</div>
          </div>
          <div className="space-y-1">
            <div className="font-semibold">{conversions}</div>
            <div className="text-xs opacity-75">conversions</div>
          </div>
          <div className="space-y-1">
            <div className="font-semibold">{conversionRate}%</div>
            <div className="text-xs opacity-75">rate</div>
          </div>
        </div>
      </div>

      <button
        onClick={handleShare}
        className="w-full bg-white/20 hover:bg-white/30 text-white py-3 px-4 rounded-lg font-medium transition-colors text-sm lg:text-base min-h-[44px]"
      >
        Share Referral Link
      </button>
    </div>
  );
}
