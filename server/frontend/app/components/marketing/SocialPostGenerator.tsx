'use client';

import { useState } from 'react';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';

const postTemplates = {
  success: "🎉 Just hit a new milestone in my MLM journey! The opportunities are endless when you have the right system. Ready to start your own success story? Join me: [LINK]",
  opportunity: "💼 Looking for a way to earn extra income? I've found an amazing opportunity that's changing lives. Let me show you how: [LINK]",
  lifestyle: "🌟 Living life on my own terms thanks to this incredible business opportunity. Financial freedom is possible! Learn more: [LINK]",
  team: "👥 Building an amazing team of like-minded entrepreneurs. If you're ready to take control of your financial future, let's connect: [LINK]"
};

export default function SocialPostGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof postTemplates>('success');
  const [customPost, setCustomPost] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);

  const generatePost = () => {
    const template = postTemplates[selectedTemplate];
    const link = referralLink || 'https://tracverse.com/register?ref=REF123';
    const post = template.replace('[LINK]', link);
    setCustomPost(post);
  };

  const copyPost = async () => {
    try {
      await navigator.clipboard.writeText(customPost);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareToSocial = (platform: string) => {
    const encodedPost = encodeURIComponent(customPost);
    let url = '';

    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodedPost}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedPost}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`;
        break;
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Media Posts</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Post Template
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value as keyof typeof postTemplates)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="success">Success Story</option>
            <option value="opportunity">Business Opportunity</option>
            <option value="lifestyle">Lifestyle Freedom</option>
            <option value="team">Team Building</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Referral Link (Optional)
          </label>
          <input
            type="url"
            value={referralLink}
            onChange={(e) => setReferralLink(e.target.value)}
            placeholder="https://tracverse.com/register?ref=YOUR_CODE"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={generatePost}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
        >
          Generate Post
        </button>

        {customPost && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generated Post
              </label>
              <textarea
                value={customPost}
                onChange={(e) => setCustomPost(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={copyPost}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {copied ? (
                  <CheckIcon className="w-4 h-4 text-green-600 mr-2" />
                ) : (
                  <ClipboardIcon className="w-4 h-4 text-gray-600 mr-2" />
                )}
                {copied ? 'Copied!' : 'Copy'}
              </button>

              <div className="flex space-x-2">
                <button
                  onClick={() => shareToSocial('facebook')}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Facebook
                </button>
                <button
                  onClick={() => shareToSocial('twitter')}
                  className="px-3 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm"
                >
                  Twitter
                </button>
                <button
                  onClick={() => shareToSocial('linkedin')}
                  className="px-3 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm"
                >
                  LinkedIn
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
