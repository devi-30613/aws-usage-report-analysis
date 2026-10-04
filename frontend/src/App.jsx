import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import CostAnalysis from './pages/CostAnalysis';
import UsageAnalysis from './pages/UsageAnalysis';
import Services from './pages/Services';
import Reports from './pages/Reports';
import AwsData from './pages/AwsData';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="cost-analysis" element={<CostAnalysis />} />
          <Route path="usage-analysis" element={<UsageAnalysis />} />
          <Route path="services" element={<Services />} />
          <Route path="reports" element={<Reports />} />
          <Route path="aws-data" element={<AwsData />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
