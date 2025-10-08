'use client';

import { useState } from 'react';
import { ClipboardIcon, CheckIcon, ShareIcon } from '@heroicons/react/24/outline';

export default function ReferralLinkGenerator() {
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [campaign, setCampaign] = useState('default');

  const generateLink = () => {
    const baseUrl = window.location.origin;
    const userCode = 'REF123'; // In production, get from user data
    const link = `${baseUrl}/register?ref=${userCode}&campaign=${campaign}`;
    setReferralLink(link);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Tracverse',
          text: 'Start your MLM journey with me!',
          url: referralLink,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Referral Link</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Name
          </label>
          <select
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="default">Default Campaign</option>
            <option value="social">Social Media</option>
            <option value="email">Email Campaign</option>
            <option value="website">Website</option>
          </select>
        </div>

        <button
          onClick={generateLink}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Generate Link
        </button>

        {referralLink && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {copied ? (
                  <CheckIcon className="w-5 h-5 text-green-600" />
                ) : (
                  <ClipboardIcon className="w-5 h-5 text-gray-600" />
                )}
              </button>
              <button
                onClick={shareLink}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ShareIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            {copied && (
              <p className="text-sm text-green-600">Link copied to clipboard!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
