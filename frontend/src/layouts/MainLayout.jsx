import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { fetchAwsStatus, fetchDashboard } from '../services/api';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [awsStatus, setAwsStatus] = useState(null);
  const [insights, setInsights] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const location = useLocation();

  const loadGlobalStatus = async () => {
    try {
      setIsRefreshing(true);
      const [statusRes, dashRes] = await Promise.allSettled([
        fetchAwsStatus(),
        fetchDashboard()
      ]);
      if (statusRes.status === 'fulfilled') {
        setAwsStatus(statusRes.value);
      }
      if (dashRes.status === 'fulfilled') {
        setInsights(dashRes.value?.insights || []);
      }
    } catch (err) {
      console.error('Failed to load global status:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadGlobalStatus();
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        dataSource={awsStatus?.data_source || 'mock'}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64">
        {/* Top Navbar */}
        <Navbar
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onRefresh={loadGlobalStatus}
          isRefreshing={isRefreshing}
          dataSource={awsStatus?.data_source || 'mock'}
          insights={insights}
        />

        {/* Page Body */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ awsStatus, refreshGlobal: loadGlobalStatus }} />
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 px-6 py-4 text-center text-xs text-slate-400 bg-slate-950/60">
          <p>
            AWS Usage & Report Analysis Platform &bull; Powered by Amazon S3 & Amazon Athena &bull; FastAPI + React
          </p>
        </footer>
      </div>
    </div>
  );
}
