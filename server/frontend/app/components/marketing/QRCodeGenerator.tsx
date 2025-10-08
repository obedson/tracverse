'use client';

import { useState } from 'react';
import { QrCodeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function QRCodeGenerator() {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [referralLink, setReferralLink] = useState('');

  const generateQRCode = () => {
    const link = referralLink || `${window.location.origin}/register?ref=REF123`;
    // Using QR Server API for QR code generation
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
    setQrCodeUrl(qrUrl);
  };

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = 'referral-qr-code.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">QR Code Generator</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Referral Link
          </label>
          <input
            type="url"
            value={referralLink}
            onChange={(e) => setReferralLink(e.target.value)}
            placeholder="Enter your referral link"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={generateQRCode}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
        >
          <QrCodeIcon className="w-5 h-5 mr-2" />
          Generate QR Code
        </button>

        {qrCodeUrl && (
          <div className="text-center space-y-4">
            <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Scan this QR code to access your referral link
              </p>
              <button
                onClick={downloadQRCode}
                className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors mx-auto"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Download QR Code
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
