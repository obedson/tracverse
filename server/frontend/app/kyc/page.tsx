'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import PageHeader from '../components/layout/PageHeader';
import ProtectedRoute from '../../src/components/auth/ProtectedRoute';
import ComplianceStatus from '../../src/components/compliance/ComplianceStatus';
import DocumentUpload from '../../src/components/kyc/DocumentUpload';
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/card';
import { Button } from '../../src/components/ui/button';
import { Input } from '../../src/components/ui/input';
import { Shield, FileText, User, CreditCard, MapPin } from 'lucide-react';
import { useAuthStore } from '../../src/stores/authStore';

interface DocumentStatus {
  [key: string]: 'pending' | 'uploaded' | 'verified' | 'rejected';
}

const requiredDocuments = [
  { type: 'National ID', icon: CreditCard, description: 'Government issued ID card' },
  { type: 'Passport Photo', icon: User, description: 'Clear passport-style photograph' },
  { type: 'Proof of Address', icon: MapPin, description: 'Utility bill or bank statement' },
  { type: 'Bank Statement', icon: FileText, description: 'Recent bank statement (3 months)' }
];

export default function KYCPage() {
  const { user } = useAuthStore();
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    dateOfBirth: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria'
  });
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setPersonalInfo(prev => ({
        ...prev,
        fullName: user.full_name || '',
        phoneNumber: user.phone || ''
      }));
    }
    loadDocumentStatus();
  }, [user]);

  const loadDocumentStatus = async () => {
    try {
      const response = await fetch('/api/kyc/documents', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDocumentStatus(data.documents || {});
      }
    } catch (error) {
      console.error('Failed to load document status:', error);
    }
  };

  const handleDocumentUpload = async (file: File, documentType: string) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', documentType);

    const response = await fetch('/api/kyc/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    // Update status
    setDocumentStatus(prev => ({
      ...prev,
      [documentType]: 'uploaded'
    }));
  };

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/kyc/personal-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(personalInfo)
      });

      if (response.ok) {
        alert('Personal information updated successfully');
      } else {
        throw new Error('Failed to update personal information');
      }
    } catch (error) {
      console.error('Failed to update personal info:', error);
      alert('Failed to update personal information');
    } finally {
      setLoading(false);
    }
  };

  const completedDocuments = Object.values(documentStatus).filter(status => 
    status === 'uploaded' || status === 'verified'
  ).length;

  const verifiedDocuments = Object.values(documentStatus).filter(status => 
    status === 'verified'
  ).length;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex pb-16 lg:pb-0">
        <Sidebar />
        
        <div className="flex-1 lg:ml-64">
          <PageHeader 
            title="KYC Verification" 
            description="Complete your identity verification to unlock all features"
          />

          <div className="p-4 lg:p-8 space-y-6">
            {/* Compliance Status */}
            <ComplianceStatus 
              kycStatus={verifiedDocuments === requiredDocuments.length ? 'verified' : 
                       completedDocuments > 0 ? 'pending' : 'pending'}
              documentsUploaded={completedDocuments}
              totalDocuments={requiredDocuments.length}
              complianceScore={Math.round((verifiedDocuments / requiredDocuments.length) * 100)}
            />

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePersonalInfoSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Full Name</label>
                      <Input
                        value={personalInfo.fullName}
                        onChange={(e) => setPersonalInfo(prev => ({...prev, fullName: e.target.value}))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Date of Birth</label>
                      <Input
                        type="date"
                        value={personalInfo.dateOfBirth}
                        onChange={(e) => setPersonalInfo(prev => ({...prev, dateOfBirth: e.target.value}))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone Number</label>
                      <Input
                        value={personalInfo.phoneNumber}
                        onChange={(e) => setPersonalInfo(prev => ({...prev, phoneNumber: e.target.value}))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Country</label>
                      <Input
                        value={personalInfo.country}
                        onChange={(e) => setPersonalInfo(prev => ({...prev, country: e.target.value}))}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <Input
                      value={personalInfo.address}
                      onChange={(e) => setPersonalInfo(prev => ({...prev, address: e.target.value}))}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">City</label>
                      <Input
                        value={personalInfo.city}
                        onChange={(e) => setPersonalInfo(prev => ({...prev, city: e.target.value}))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">State</label>
                      <Input
                        value={personalInfo.state}
                        onChange={(e) => setPersonalInfo(prev => ({...prev, state: e.target.value}))}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Personal Information'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Document Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Required Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requiredDocuments.map((doc) => (
                    <DocumentUpload
                      key={doc.type}
                      documentType={doc.type}
                      onUpload={handleDocumentUpload}
                      status={documentStatus[doc.type] || 'pending'}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Verification Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Verification Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Documents Uploaded</span>
                    <span>{completedDocuments}/{requiredDocuments.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(completedDocuments / requiredDocuments.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    {completedDocuments === requiredDocuments.length 
                      ? 'All documents uploaded. Verification in progress...'
                      : `${requiredDocuments.length - completedDocuments} documents remaining`
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
