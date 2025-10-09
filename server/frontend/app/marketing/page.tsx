'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import PageHeader from '../components/layout/PageHeader';
import ProtectedRoute from '../../src/components/auth/ProtectedRoute';
import { useAuthStore } from '../../src/stores/authStore';
import {
  QrCodeIcon,
  ChartBarIcon,
  LinkIcon,
  ShareIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  UserPlusIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import api from '../../src/lib/api';

export default function MarketingPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('qr-generator');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaign, setCampaign] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [referralStats, setReferralStats] = useState<any>(null);
  const [copied, setCopied] = useState('');
  
  // Editable template states
  const [template1, setTemplate1] = useState('');
  const [template2, setTemplate2] = useState('');
  const [template3, setTemplate3] = useState('');
  const [emailTemplate, setEmailTemplate] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const referralCode = user?.referral_code || 'No Code';

  useEffect(() => {
    if (referralCode !== 'No Code') {
      loadReferralStats();
      // Initialize templates with referral code
      setTemplate1(`🚀 Ready to transform your financial future? Join my team and discover the power of network marketing! Use my referral code: ${referralCode} #MLM #NetworkMarketing #FinancialFreedom`);
      setTemplate2(`💰 Earning passive income has never been easier! Join thousands who are building wealth through our proven system. Start today with code: ${referralCode} #PassiveIncome #WealthBuilding #Success`);
      setTemplate3(`🎯 Looking for a side hustle that actually works? I've found the perfect opportunity! Join me using referral code: ${referralCode} #SideHustle #Entrepreneur #ExtraIncome`);
      
      // Initialize email template
      setEmailSubject('Exclusive Invitation - Transform Your Financial Future');
      setEmailTemplate(`Hi [Name],

I hope this email finds you well! I wanted to reach out because I've discovered an incredible opportunity that I believe could be perfect for you.

I've been part of an amazing network marketing community that has completely transformed my financial situation, and I'd love to share this opportunity with you.

Here's what makes this special:
• Proven system with real results
• Comprehensive training and support
• Flexible schedule that works around your life
• Unlimited earning potential

If you're interested in learning more, you can get started using my personal referral code: ${referralCode}

Simply visit: ${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralCode}

I'd be happy to answer any questions you might have. Feel free to reply to this email or give me a call.

To your success,
[Your Name]`);
    }
  }, [referralCode]);

  const sendEmail = async () => {
    if (!recipientEmail || !emailSubject || !emailTemplate) {
      alert('Please fill in all email fields');
      return;
    }

    try {
      setIsSendingEmail(true);
      // Create mailto link for now - can be enhanced with actual email service
      const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailTemplate)}`;
      window.location.href = mailtoLink;
      
      // Clear recipient email after sending
      setRecipientEmail('');
    } catch (error) {
      console.error('Email send failed:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const shareTemplate = async (template: string, platform?: string) => {
    const referralUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralCode}`;
    const shareText = `${template}\n\nJoin here: ${referralUrl}`;
    
    if (navigator.share && !platform) {
      try {
        await navigator.share({
          title: 'Join My MLM Team',
          text: shareText,
        });
      } catch (err) {
        console.error('Share failed:', err);
        copyToClipboard(shareText, 'share');
      }
    } else if (platform) {
      let shareUrl = '';
      const encodedText = encodeURIComponent(shareText);
      
      switch (platform) {
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}&quote=${encodedText}`;
          break;
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
          break;
        case 'linkedin':
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}&summary=${encodedText}`;
          break;
        case 'whatsapp':
          shareUrl = `https://wa.me/?text=${encodedText}`;
          break;
      }
      
      if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
      }
    } else {
      copyToClipboard(shareText, 'share');
    }
  };

  const loadReferralStats = async () => {
    try {
      const stats = await api.getReferralLiveStats(referralCode);
      setReferralStats(stats);
    } catch (error) {
      console.error('Failed to load referral stats:', error);
    }
  };

  const generateAdvancedQR = async () => {
    if (!campaign.trim()) {
      alert('Please enter a campaign name');
      return;
    }

    try {
      setIsGenerating(true);
      const qrData = await api.generateQRCode(referralCode, campaign);
      setQrCodeData(qrData.qr_code?.qr_code_data || qrData.qr_code_data);
    } catch (error) {
      console.error('QR generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateUTMLink = () => {
    const baseUrl = `${window.location.origin}/register?ref=${referralCode}`;
    const params = new URLSearchParams();
    
    if (utmSource) params.append('utm_source', utmSource);
    if (utmMedium) params.append('utm_medium', utmMedium);
    if (campaign) params.append('utm_campaign', campaign);
    
    return `${baseUrl}&${params.toString()}`;
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const tabs = [
    { id: 'qr-generator', name: 'QR Generator', icon: QrCodeIcon },
    { id: 'utm-builder', name: 'UTM Builder', icon: LinkIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
    { id: 'materials', name: 'Materials', icon: ShareIcon }
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex max-w-full overflow-hidden">
        <Sidebar />

        <div className="flex-1 lg:ml-64 max-w-full overflow-hidden relative z-10">
          <PageHeader 
            title="Marketing Tools" 
            description="Advanced referral tools and campaign analytics"
          />

          <div className="p-4 sm:p-6 lg:p-8 pb-20 max-w-full overflow-hidden w-full">
            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden sm:inline">{tab.name}</span>
                      <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* QR Generator Tab */}
            {activeTab === 'qr-generator' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                  <h3 className="text-lg font-semibold mb-4">Advanced QR Code Generator</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Campaign Name
                      </label>
                      <input
                        type="text"
                        value={campaign}
                        onChange={(e) => setCampaign(e.target.value)}
                        placeholder="e.g., social-media, email-blast"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <button
                      onClick={generateAdvancedQR}
                      disabled={isGenerating || !campaign.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 min-h-[44px]"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <QrCodeIcon className="h-5 w-5" />
                          Generate Campaign QR
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {qrCodeData && (
                  <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6 text-center">
                    <h3 className="text-lg font-semibold mb-4">Generated QR Code</h3>
                    <img 
                      src={qrCodeData} 
                      alt="Campaign QR Code"
                      className="mx-auto w-48 h-48 border border-gray-200 rounded-lg mb-4"
                    />
                    <p className="text-sm text-gray-600 mb-4">Campaign: {campaign}</p>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = qrCodeData;
                        link.download = `${referralCode}-${campaign}-qr.png`;
                        link.click();
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 min-h-[44px]"
                    >
                      Download QR Code
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* UTM Builder Tab */}
            {activeTab === 'utm-builder' && (
              <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                <h3 className="text-lg font-semibold mb-4">UTM Link Builder</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      UTM Source
                    </label>
                    <input
                      type="text"
                      value={utmSource}
                      onChange={(e) => setUtmSource(e.target.value)}
                      placeholder="facebook, google, email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      UTM Medium
                    </label>
                    <input
                      type="text"
                      value={utmMedium}
                      onChange={(e) => setUtmMedium(e.target.value)}
                      placeholder="social, cpc, email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign
                    </label>
                    <input
                      type="text"
                      value={campaign}
                      onChange={(e) => setCampaign(e.target.value)}
                      placeholder="summer-promo"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Generated UTM Link
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={generateUTMLink()}
                      readOnly
                      className="flex-1 max-w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono break-all overflow-hidden"
                    />
                    <button
                      onClick={() => copyToClipboard(generateUTMLink(), 'utm')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-[44px] whitespace-nowrap flex-shrink-0"
                    >
                      {copied === 'utm' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-4 lg:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <EyeIcon className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {referralStats?.all_time?.clicks || 0}
                        </p>
                        <p className="text-sm text-gray-600">Total Clicks</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <UserPlusIcon className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {referralStats?.all_time?.conversions || 0}
                        </p>
                        <p className="text-sm text-gray-600">Conversions</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <CursorArrowRaysIcon className="h-8 w-8 text-purple-600" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {referralStats?.all_time?.conversion_rate || '0.0'}%
                        </p>
                        <p className="text-sm text-gray-600">Conversion Rate</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Campaign Performance Table */}
                <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                  <h3 className="text-lg font-semibold mb-4">Campaign Performance</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Campaign
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Clicks
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Conversions
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rate
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            social-media
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {referralStats?.campaigns?.['social-media']?.clicks || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {referralStats?.campaigns?.['social-media']?.conversions || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {referralStats?.campaigns?.['social-media']?.conversion_rate || '0.0'}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            email-blast
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {referralStats?.campaigns?.['email-blast']?.clicks || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {referralStats?.campaigns?.['email-blast']?.conversions || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {referralStats?.campaigns?.['email-blast']?.conversion_rate || '0.0'}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Active
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Traffic Sources */}
                <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                  <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Direct</span>
                        <span className="text-sm font-medium">45%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: '45%'}}></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Social Media</span>
                        <span className="text-sm font-medium">30%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{width: '30%'}}></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Email</span>
                        <span className="text-sm font-medium">15%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{width: '15%'}}></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">QR Code</span>
                        <span className="text-sm font-medium">10%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-600 h-2 rounded-full" style={{width: '10%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Materials Tab */}
            {activeTab === 'materials' && (
              <div className="space-y-4 lg:space-y-6">
                {/* Social Media Templates */}
                <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                  <h3 className="text-lg font-semibold mb-4">Social Media Templates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                    
                    {/* Template 1 */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Financial Freedom Template</h4>
                      <textarea
                        value={template1}
                        onChange={(e) => setTemplate1(e.target.value)}
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Edit your template..."
                      />
                      <div className="mt-3 flex flex-col gap-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(template1, 'template1')}
                            className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                          >
                            {copied === 'template1' ? 'Copied!' : 'Copy'}
                          </button>
                          <button
                            onClick={() => shareTemplate(template1)}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          >
                            Share
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          <button
                            onClick={() => shareTemplate(template1, 'facebook')}
                            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                          >
                            FB
                          </button>
                          <button
                            onClick={() => shareTemplate(template1, 'twitter')}
                            className="px-2 py-1 bg-sky-500 text-white rounded text-xs hover:bg-sky-600"
                          >
                            X
                          </button>
                          <button
                            onClick={() => shareTemplate(template1, 'linkedin')}
                            className="px-2 py-1 bg-blue-700 text-white rounded text-xs hover:bg-blue-800"
                          >
                            LI
                          </button>
                          <button
                            onClick={() => shareTemplate(template1, 'whatsapp')}
                            className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                          >
                            WA
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Template 2 */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Passive Income Template</h4>
                      <textarea
                        value={template2}
                        onChange={(e) => setTemplate2(e.target.value)}
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Edit your template..."
                      />
                      <div className="mt-3 flex flex-col gap-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(template2, 'template2')}
                            className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                          >
                            {copied === 'template2' ? 'Copied!' : 'Copy'}
                          </button>
                          <button
                            onClick={() => shareTemplate(template2)}
                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          >
                            Share
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          <button
                            onClick={() => shareTemplate(template2, 'facebook')}
                            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                          >
                            FB
                          </button>
                          <button
                            onClick={() => shareTemplate(template2, 'twitter')}
                            className="px-2 py-1 bg-sky-500 text-white rounded text-xs hover:bg-sky-600"
                          >
                            X
                          </button>
                          <button
                            onClick={() => shareTemplate(template2, 'linkedin')}
                            className="px-2 py-1 bg-blue-700 text-white rounded text-xs hover:bg-blue-800"
                          >
                            LI
                          </button>
                          <button
                            onClick={() => shareTemplate(template2, 'whatsapp')}
                            className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                          >
                            WA
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Template 3 */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Side Hustle Template</h4>
                      <textarea
                        value={template3}
                        onChange={(e) => setTemplate3(e.target.value)}
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Edit your template..."
                      />
                      <div className="mt-3 flex flex-col gap-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(template3, 'template3')}
                            className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                          >
                            {copied === 'template3' ? 'Copied!' : 'Copy'}
                          </button>
                          <button
                            onClick={() => shareTemplate(template3)}
                            className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                          >
                            Share
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          <button
                            onClick={() => shareTemplate(template3, 'facebook')}
                            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                          >
                            FB
                          </button>
                          <button
                            onClick={() => shareTemplate(template3, 'twitter')}
                            className="px-2 py-1 bg-sky-500 text-white rounded text-xs hover:bg-sky-600"
                          >
                            X
                          </button>
                          <button
                            onClick={() => shareTemplate(template3, 'linkedin')}
                            className="px-2 py-1 bg-blue-700 text-white rounded text-xs hover:bg-blue-800"
                          >
                            LI
                          </button>
                          <button
                            onClick={() => shareTemplate(template3, 'whatsapp')}
                            className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                          >
                            WA
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Templates */}
                <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                  <h3 className="text-lg font-semibold mb-4">Email Templates</h3>
                  <div className="space-y-4 lg:space-y-6">
                    <div className="border border-gray-200 rounded-lg p-4 lg:p-6">
                      <h4 className="font-medium text-gray-900 mb-4">Welcome Email Template</h4>
                      
                      {/* Email Subject */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Subject
                        </label>
                        <input
                          type="text"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter email subject..."
                        />
                      </div>

                      {/* Email Body */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Content
                        </label>
                        <textarea
                          value={emailTemplate}
                          onChange={(e) => setEmailTemplate(e.target.value)}
                          rows={12}
                          className="w-full max-w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono overflow-hidden"
                          placeholder="Your email template will appear here automatically when you load the page..."
                        />
                      </div>

                      {/* Send Email Section */}
                      <div className="border-t border-gray-200 pt-4">
                        <h5 className="font-medium text-gray-900 mb-3">Send Email</h5>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="email"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            placeholder="recipient@example.com"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            onClick={sendEmail}
                            disabled={isSendingEmail || !recipientEmail || !emailSubject || !emailTemplate}
                            className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2 text-sm sm:text-base"
                          >
                            {isSendingEmail ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Sending...
                              </>
                            ) : (
                              <>
                                <EnvelopeIcon className="h-4 w-4" />
                                Send Email
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          This will open your default email client with the template pre-filled
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 mt-4">
                        <button
                          onClick={() => copyToClipboard(`Subject: ${emailSubject}\n\n${emailTemplate}`, 'email')}
                          className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm min-h-[44px]"
                        >
                          {copied === 'email' ? 'Copied!' : 'Copy Template'}
                        </button>
                        <button
                          onClick={() => {
                            const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailTemplate)}`;
                            window.location.href = mailtoLink;
                          }}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm min-h-[44px]"
                        >
                          Open in Email Client
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Share Links</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Standard Referral Link
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralCode}`}
                          readOnly
                          className="flex-1 max-w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono break-all overflow-hidden"
                        />
                        <button
                          onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralCode}`, 'standard')}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm flex-shrink-0"
                        >
                          {copied === 'standard' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Social Media Link
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralCode}&utm_source=social&utm_medium=social_media`}
                          readOnly
                          className="flex-1 max-w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono break-all overflow-hidden"
                        />
                        <button
                          onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralCode}&utm_source=social&utm_medium=social_media`, 'social')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex-shrink-0"
                        >
                          {copied === 'social' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
