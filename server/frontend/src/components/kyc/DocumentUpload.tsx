'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';

interface DocumentUploadProps {
  documentType: string;
  onUpload: (file: File, type: string) => Promise<void>;
  status?: 'pending' | 'uploaded' | 'verified' | 'rejected';
}

export default function DocumentUpload({ documentType, onUpload, status = 'pending' }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size must be less than 5MB');
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      alert('Only JPEG, PNG, and PDF files are allowed');
      return;
    }
    
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    try {
      await onUpload(file, documentType);
      setFile(null);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'uploaded': return <FileText className="h-5 w-5 text-blue-600" />;
      case 'verified': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected': return <AlertCircle className="h-5 w-5 text-red-600" />;
      default: return <Upload className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'uploaded': return 'border-blue-200 bg-blue-50';
      case 'verified': return 'border-green-200 bg-green-50';
      case 'rejected': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200';
    }
  };

  return (
    <Card className={`${getStatusColor()}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>{documentType}</span>
          {getStatusIcon()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'pending' || status === 'rejected' ? (
          <>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-2">
                  <FileText className="h-8 w-8 text-blue-600 mx-auto" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFile(null)}
                    className="mt-2"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">Drop file here or click to browse</p>
                  <p className="text-xs text-gray-500">JPEG, PNG, PDF (max 5MB)</p>
                </div>
              )}
            </div>

            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
              id={`file-${documentType}`}
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => document.getElementById(`file-${documentType}`)?.click()}
                className="flex-1"
              >
                Choose File
              </Button>
              {file && (
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm font-medium text-gray-900">
              {status === 'uploaded' && 'Document uploaded - Under review'}
              {status === 'verified' && 'Document verified ✓'}
              {status === 'rejected' && 'Document rejected - Please reupload'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
