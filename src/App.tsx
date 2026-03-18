/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PackageProvider } from './store/PackageContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { PackageList } from './components/PackageList';
import { ImportExport } from './components/ImportExport';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { DeletedPackages } from './components/DeletedPackages';
import { ArchiveViewer } from './components/ArchiveViewer';
import { FirstLaunch } from './components/FirstLaunch';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFirstLaunch, setIsFirstLaunch] = useState(() => {
    return localStorage.getItem('logistics_first_launch_completed') !== 'true';
  });

  const handleFirstLaunchComplete = () => {
    localStorage.setItem('logistics_first_launch_completed', 'true');
    setIsFirstLaunch(false);
  };

  if (isFirstLaunch) {
    return <FirstLaunch onComplete={handleFirstLaunchComplete} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'packages':
        return <PackageList />;
      case 'import-export':
        return <ImportExport />;
      case 'reports':
        return <Reports />;
      case 'deleted':
        return <DeletedPackages />;
      case 'archive':
        return <ArchiveViewer />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default function App() {
  return (
    <PackageProvider>
      <AppContent />
    </PackageProvider>
  );
}
