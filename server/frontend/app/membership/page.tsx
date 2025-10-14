'use client';

import Sidebar from '../components/layout/Sidebar';
import PageHeader from '../components/layout/PageHeader';
import MembershipPlans from '../components/membership/MembershipPlans';
import ProtectedRoute from '../../src/components/auth/ProtectedRoute';

export default function MembershipPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex pb-16 lg:pb-0">
        <Sidebar />

        {/* Main content */}
        <div className="flex-1 lg:ml-64">
          <PageHeader 
            title="Membership Plans" 
            description="Choose your plan and get Platform Points for promotions"
          />

          {/* Content */}
          <div className="p-4 lg:p-8">
            <MembershipPlans />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
