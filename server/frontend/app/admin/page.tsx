'use client';

import { useState } from 'react';
import api from '../../src/lib/api';

export default function AdminPage() {
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState('');

  const handleMigrateAll = async () => {
    if (!confirm('Migrate all users to Supabase Auth? This cannot be undone.')) return;
    
    setMigrating(true);
    try {
      const response = await api.migrateAllUsers();
      setResult(`✅ ${response.message}`);
    } catch (error: any) {
      setResult(`❌ Migration failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Admin Panel</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">User Migration</h2>
          
          <button
            onClick={handleMigrateAll}
            disabled={migrating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium min-h-[44px]"
          >
            {migrating ? 'Migrating...' : 'Migrate All Users to Auth'}
          </button>
          
          {result && (
            <div className="mt-4 p-3 bg-gray-50 rounded border">
              <pre className="text-sm">{result}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
