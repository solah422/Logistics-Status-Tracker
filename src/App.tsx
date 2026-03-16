/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PackageProvider } from './store/PackageContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { PackageList } from './components/PackageList';
import { ImportExport } from './components/ImportExport';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { DeletedPackages } from './components/DeletedPackages';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

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
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <PackageProvider>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
    </PackageProvider>
  );
}
