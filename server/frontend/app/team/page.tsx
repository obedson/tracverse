'use client';

import Sidebar from '../components/layout/Sidebar';
import PageHeader from '../components/layout/PageHeader';

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 lg:ml-64">
        <PageHeader 
          title="Team Management" 
          description="Manage your team and track their performance"
        />

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray-600">Team management features coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
