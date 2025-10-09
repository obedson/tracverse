'use client';

import { useState, useEffect } from 'react';
import { 
  QrCodeIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import api from '../../../src/lib/api';

interface QRCodeSectionProps {
  referralCode: string;
  loading?: boolean;
}

export default function QRCodeSection({ referralCode, loading = false }: QRCodeSectionProps) {
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const referralUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralCode}`;

  const loadQRCode = async () => {
    try {
      setIsGenerating(true);
      setError('');
      
      const existingQR = await api.getQRCode(referralCode).catch(() => null);
      
      if (existingQR?.qr_code_url) {
        setQrCodeData(existingQR.qr_code_url);
      } else {
        const newQR = await api.generateQRCode(referralCode, 'dashboard');
        setQrCodeData(newQR.qr_code?.qr_code_data || newQR.qr_code_data);
      }
    } catch (err: any) {
      console.error('QR Code error:', err);
      setError('Failed to load QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    if (!qrCodeData) return;
    
    const link = document.createElement('a');
    link.href = qrCodeData;
    link.download = `${referralCode}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !referralCode || referralCode === 'No Code') {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
        <div className="flex items-center gap-2 mb-4">
          <QrCodeIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">QR Code</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
            <button 
              onClick={loadQRCode}
              className="mt-2 text-red-600 hover:text-red-700 text-sm underline"
            >
              Try again
            </button>
          </div>
        )}

        <div className="mt-4 space-y-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Referral Link</p>
            <p className="text-sm text-gray-700 break-all font-mono">{referralUrl}</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!qrCodeData && !isGenerating) {
                  loadQRCode();
                }
                setShowModal(true);
              }}
              disabled={isGenerating}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 min-h-[44px] text-sm font-medium"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <QrCodeIcon className="h-4 w-4" />
                  QR Code
                </>
              )}
            </button>

            <button
              onClick={handleCopyUrl}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors min-h-[44px] text-sm font-medium"
            >
              {copied ? <CheckIcon className="h-4 w-4" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>

      {showModal && qrCodeData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Scan QR Code</h3>
              <img 
                src={qrCodeData} 
                alt={`QR Code for ${referralCode}`}
                className="mx-auto w-64 h-64 border border-gray-200 rounded-lg mb-4"
              />
              <p className="text-sm text-gray-600 mb-4 break-all">{referralUrl}</p>
              
              <div className="flex gap-2 mb-4">
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors min-h-[44px]"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  <span>Download</span>
                </button>
              </div>
              
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors min-h-[44px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
