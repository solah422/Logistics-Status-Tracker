import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Package, Status, DEFAULT_STATUSES } from '../types';

interface PackageContextType {
  packages: Package[];
  statuses: Status[];
  addPackage: (pkg: Omit<Package, 'id' | 'createdAt' | 'updatedAt' | 'history'>) => void;
  updatePackage: (id: string, updates: Partial<Package>) => void;
  deletePackage: (id: string) => void;
  addStatus: (status: string) => void;
  importPackages: (newPackages: Package[], overwrite?: boolean) => void;
  exportPackages: (selectedIds?: string[]) => string;
}

const PackageContext = createContext<PackageContextType | undefined>(undefined);

export const PackageProvider = ({ children }: { children: ReactNode }) => {
  const [packages, setPackages] = useState<Package[]>(() => {
    const saved = localStorage.getItem('logistics_packages');
    return saved ? JSON.parse(saved) : [];
  });

  const [statuses, setStatuses] = useState<Status[]>(() => {
    const saved = localStorage.getItem('logistics_statuses');
    return saved ? JSON.parse(saved) : DEFAULT_STATUSES;
  });

  useEffect(() => {
    localStorage.setItem('logistics_packages', JSON.stringify(packages));
  }, [packages]);

  useEffect(() => {
    localStorage.setItem('logistics_statuses', JSON.stringify(statuses));
  }, [statuses]);

  const addPackage = (pkgData: Omit<Package, 'id' | 'createdAt' | 'updatedAt' | 'history'>) => {
    const now = new Date().toISOString();
    const newPackage: Package = {
      ...pkgData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      history: [{ status: pkgData.status, timestamp: now }]
    };
    setPackages(prev => [newPackage, ...prev]);
  };

  const updatePackage = (id: string, updates: Partial<Package>) => {
    setPackages(prev => prev.map(pkg => {
      if (pkg.id === id) {
        const now = new Date().toISOString();
        const updatedPkg = { ...pkg, ...updates, updatedAt: now };
        
        // If status changed, add to history
        if (updates.status && updates.status !== pkg.status) {
          updatedPkg.history = [...pkg.history, { status: updates.status, timestamp: now }];
        }
        
        return updatedPkg;
      }
      return pkg;
    }));
  };

  const deletePackage = (id: string) => {
    setPackages(prev => prev.filter(pkg => pkg.id !== id));
  };

  const addStatus = (status: string) => {
    if (!statuses.includes(status)) {
      setStatuses(prev => [...prev, status]);
    }
  };

  const importPackages = (newPackages: Package[], overwrite = false) => {
    if (overwrite) {
      setPackages(newPackages);
    } else {
      // Merge by ID or Tracking Number
      setPackages(prev => {
        const merged = [...prev];
        newPackages.forEach(newPkg => {
          const existingIndex = merged.findIndex(p => p.id === newPkg.id || p.trackingNumber === newPkg.trackingNumber);
          if (existingIndex >= 0) {
            merged[existingIndex] = { ...merged[existingIndex], ...newPkg, updatedAt: new Date().toISOString() };
          } else {
            merged.push({
              ...newPkg,
              id: newPkg.id || crypto.randomUUID(),
              createdAt: newPkg.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              history: newPkg.history || [{ status: newPkg.status, timestamp: new Date().toISOString() }]
            });
          }
        });
        return merged;
      });
    }
  };

  const exportPackages = (selectedIds?: string[]) => {
    const toExport = selectedIds && selectedIds.length > 0
      ? packages.filter(p => selectedIds.includes(p.id))
      : packages;
    return JSON.stringify(toExport, null, 2);
  };

  return (
    <PackageContext.Provider value={{ packages, statuses, addPackage, updatePackage, deletePackage, addStatus, importPackages, exportPackages }}>
      {children}
    </PackageContext.Provider>
  );
};

export const usePackages = () => {
  const context = useContext(PackageContext);
  if (context === undefined) {
    throw new Error('usePackages must be used within a PackageProvider');
  }
  return context;
};
