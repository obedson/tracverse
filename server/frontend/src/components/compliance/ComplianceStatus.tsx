'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Shield, CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react';

interface ComplianceStatusProps {
  kycStatus?: 'pending' | 'verified' | 'rejected';
  documentsUploaded?: number;
  totalDocuments?: number;
  complianceScore?: number;
  lastUpdated?: string;
}

export default function ComplianceStatus({
  kycStatus = 'pending',
  documentsUploaded = 3,
  totalDocuments = 5,
  complianceScore = 75,
  lastUpdated = '2024-01-15'
}: ComplianceStatusProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return CheckCircle;
      case 'rejected': return AlertCircle;
      default: return Clock;
    }
  };

  const getComplianceLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: 'text-green-600' };
    if (score >= 70) return { level: 'Good', color: 'text-blue-600' };
    if (score >= 50) return { level: 'Fair', color: 'text-yellow-600' };
    return { level: 'Needs Improvement', color: 'text-red-600' };
  };

  const StatusIcon = getStatusIcon(kycStatus);
  const complianceLevel = getComplianceLevel(complianceScore);
  const documentProgress = (documentsUploaded / totalDocuments) * 100;

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-600" />
            Compliance Status
          </div>
          <Badge className={getStatusColor(kycStatus)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KYC Status */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">KYC Verification</span>
            <StatusIcon className={`h-4 w-4 ${
              kycStatus === 'verified' ? 'text-green-600' : 
              kycStatus === 'rejected' ? 'text-red-600' : 'text-yellow-600'
            }`} />
          </div>
          <p className="text-xs text-gray-600">
            {kycStatus === 'verified' && 'Your identity has been verified'}
            {kycStatus === 'pending' && 'Verification in progress'}
            {kycStatus === 'rejected' && 'Please resubmit required documents'}
          </p>
        </div>

        {/* Document Upload Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Documents Uploaded</span>
            <span>{documentsUploaded}/{totalDocuments}</span>
          </div>
          <Progress value={documentProgress} className="h-3" />
          <p className="text-xs text-gray-500 mt-1">
            {totalDocuments - documentsUploaded} documents remaining
          </p>
        </div>

        {/* Compliance Score */}
        <div className="p-3 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Compliance Score</span>
            <span className={`font-bold text-lg ${complianceLevel.color}`}>
              {complianceScore}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <Progress value={complianceScore} className="h-2 flex-1 mr-3" />
            <Badge variant="outline" className={complianceLevel.color}>
              {complianceLevel.level}
            </Badge>
          </div>
        </div>

        {/* Required Actions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Required Actions</h4>
          <div className="space-y-2">
            {documentsUploaded < totalDocuments && (
              <div className="flex items-center p-2 bg-yellow-50 rounded text-sm">
                <FileText className="h-4 w-4 mr-2 text-yellow-600" />
                <span>Upload remaining {totalDocuments - documentsUploaded} documents</span>
              </div>
            )}
            
            {kycStatus === 'pending' && (
              <div className="flex items-center p-2 bg-blue-50 rounded text-sm">
                <Clock className="h-4 w-4 mr-2 text-blue-600" />
                <span>Awaiting verification (2-3 business days)</span>
              </div>
            )}
            
            {kycStatus === 'rejected' && (
              <div className="flex items-center p-2 bg-red-50 rounded text-sm">
                <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                <span>Resubmit rejected documents</span>
              </div>
            )}
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          Last updated: {new Date(lastUpdated).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}
