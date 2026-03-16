import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Package, Status, DEFAULT_STATUSES, CustomFieldDef, SavedFilter, DEFAULT_STATUS_COLORS, FINAL_STATUSES } from '../types';
import { get, set } from 'idb-keyval';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface PackageContextType {
  packages: Package[];
  activePackages: Package[];
  deletedPackages: Package[];
  archivedPackages: Package[];
  statuses: Status[];
  isLoading: boolean;
  addPackage: (pkg: Omit<Package, 'id' | 'createdAt' | 'updatedAt' | 'history'>) => void;
  updatePackage: (id: string, updates: Partial<Package>) => void;
  deletePackage: (id: string) => void;
  restorePackage: (id: string) => void;
  hardDeletePackage: (id: string) => void;
  addStatus: (status: string) => void;
  importPackages: (newPackages: Package[], overwrite?: boolean) => void;
  exportPackages: (selectedIds?: string[]) => string;
  
  fileHandle: any;
  setFileHandle: (handle: any) => void;
  syncError: string | null;
  setSyncError: (error: string | null) => void;
  
  customFieldDefs: CustomFieldDef[];
  addCustomFieldDef: (def: CustomFieldDef) => void;
  removeCustomFieldDef: (id: string) => void;
  
  statusColors: Record<string, string>;
  updateStatusColor: (status: string, colorClass: string) => void;
  
  savedFilters: SavedFilter[];
  addSavedFilter: (filter: SavedFilter) => void;
  removeSavedFilter: (id: string) => void;
  
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  tableDensity: 'comfortable' | 'compact';
  setTableDensity: (density: 'comfortable' | 'compact') => void;
  
  toasts: Toast[];
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const PackageContext = createContext<PackageContextType | undefined>(undefined);

export const PackageProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [packages, setPackages] = useState<Package[]>(() => {
    const saved = localStorage.getItem('logistics_packages');
    return saved ? JSON.parse(saved) : [];
  });

  const [statuses, setStatuses] = useState<Status[]>(() => {
    const saved = localStorage.getItem('logistics_statuses');
    return saved ? JSON.parse(saved) : DEFAULT_STATUSES;
  });

  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDef[]>(() => {
    const saved = localStorage.getItem('logistics_custom_fields');
    return saved ? JSON.parse(saved) : [];
  });

  const [statusColors, setStatusColors] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('logistics_status_colors');
    return saved ? JSON.parse(saved) : DEFAULT_STATUS_COLORS;
  });

  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    const saved = localStorage.getItem('logistics_saved_filters');
    return saved ? JSON.parse(saved) : [];
  });

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('logistics_theme');
    return (saved as any) || 'system';
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('logistics_sidebar_collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const [tableDensity, setTableDensity] = useState<'comfortable' | 'compact'>(() => {
    const saved = localStorage.getItem('logistics_table_density');
    return (saved as any) || 'comfortable';
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  const [fileHandle, setFileHandle] = useState<any>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Simulate initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Theme effect
  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = () => {
      root.classList.remove('light', 'dark');
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }
    };

    applyTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Load file handle on mount
  useEffect(() => {
    get('logistics_sync_handle').then(handle => {
      if (handle) setFileHandle(handle);
    });
  }, []);

  // Cleanup deleted items older than 7 days
  useEffect(() => {
    const now = new Date().getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    let changed = false;
    
    const cleaned = packages.filter(p => {
      if (p.deletedAt) {
        const deletedTime = new Date(p.deletedAt).getTime();
        if (now - deletedTime > sevenDays) {
          changed = true;
          return false;
        }
      }
      return true;
    });
    
    if (changed) {
      setPackages(cleaned);
    }
  }, []);

  // Auto-archive completed/cancelled items older than 1 day
  useEffect(() => {
    const now = new Date().getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    let changed = false;
    
    const updatedPackages = packages.map(p => {
      if (!p.archivedAt && !p.deletedAt && FINAL_STATUSES.includes(p.status)) {
        const lastUpdated = new Date(p.updatedAt).getTime();
        if (now - lastUpdated > oneDay) {
          changed = true;
          return { ...p, archivedAt: new Date().toISOString() };
        }
      }
      return p;
    });
    
    if (changed) {
      setPackages(updatedPackages);
    }
  }, [packages]);

  // Sync to file and localStorage
  useEffect(() => {
    localStorage.setItem('logistics_packages', JSON.stringify(packages));
    
    const syncToFile = async () => {
      if (fileHandle && packages.length > 0) {
        try {
          // Check permission
          const permission = await fileHandle.queryPermission({ mode: 'readwrite' });
          if (permission === 'granted') {
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(packages, null, 2));
            await writable.close();
            setSyncError(null);
          } else {
            setSyncError('Permission required to sync with Google Drive JSON file.');
          }
        } catch (error) {
          console.error('Failed to sync to file:', error);
          setSyncError('Failed to write to sync file.');
        }
      }
    };
    
    syncToFile();
  }, [packages, fileHandle]);

  useEffect(() => {
    localStorage.setItem('logistics_statuses', JSON.stringify(statuses));
  }, [statuses]);

  useEffect(() => {
    localStorage.setItem('logistics_custom_fields', JSON.stringify(customFieldDefs));
  }, [customFieldDefs]);

  useEffect(() => {
    localStorage.setItem('logistics_status_colors', JSON.stringify(statusColors));
  }, [statusColors]);

  useEffect(() => {
    localStorage.setItem('logistics_saved_filters', JSON.stringify(savedFilters));
  }, [savedFilters]);

  useEffect(() => {
    localStorage.setItem('logistics_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('logistics_sidebar_collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('logistics_table_density', tableDensity);
  }, [tableDensity]);

  const activePackages = packages.filter(p => !p.deletedAt && !p.archivedAt);
  const deletedPackages = packages.filter(p => p.deletedAt);
  const archivedPackages = packages.filter(p => p.archivedAt && !p.deletedAt);

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

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
    addToast('Package added successfully', 'success');
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
    addToast('Package updated successfully', 'success');
  };

  const deletePackage = (id: string) => {
    setPackages(prev => prev.map(pkg => 
      pkg.id === id ? { ...pkg, deletedAt: new Date().toISOString() } : pkg
    ));
    addToast('Package moved to trash', 'info');
  };

  const restorePackage = (id: string) => {
    setPackages(prev => prev.map(pkg => {
      if (pkg.id === id) {
        const { deletedAt, ...rest } = pkg;
        return rest;
      }
      return pkg;
    }));
    addToast('Package restored', 'success');
  };

  const hardDeletePackage = (id: string) => {
    setPackages(prev => prev.filter(pkg => pkg.id !== id));
    addToast('Package permanently deleted', 'info');
  };

  const addStatus = (status: string) => {
    if (!statuses.includes(status)) {
      setStatuses(prev => [...prev, status]);
      addToast('Status added', 'success');
    }
  };

  const addCustomFieldDef = (def: CustomFieldDef) => {
    setCustomFieldDefs(prev => [...prev, def]);
    addToast('Custom field added', 'success');
  };

  const removeCustomFieldDef = (id: string) => {
    setCustomFieldDefs(prev => prev.filter(f => f.id !== id));
    addToast('Custom field removed', 'info');
  };

  const updateStatusColor = (status: string, colorClass: string) => {
    setStatusColors(prev => ({ ...prev, [status]: colorClass }));
  };

  const addSavedFilter = (filter: SavedFilter) => {
    setSavedFilters(prev => [...prev, filter]);
    addToast('Filter saved', 'success');
  };

  const removeSavedFilter = (id: string) => {
    setSavedFilters(prev => prev.filter(f => f.id !== id));
    addToast('Filter removed', 'info');
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
    addToast(`Imported ${newPackages.length} packages`, 'success');
  };

  const exportPackages = (selectedIds?: string[]) => {
    const toExport = selectedIds && selectedIds.length > 0
      ? packages.filter(p => selectedIds.includes(p.id))
      : packages;
    return JSON.stringify(toExport, null, 2);
  };

  return (
    <PackageContext.Provider value={{ 
      packages, activePackages, deletedPackages, archivedPackages, statuses, isLoading,
      addPackage, updatePackage, deletePackage, restorePackage, hardDeletePackage,
      addStatus, importPackages, exportPackages,
      fileHandle, setFileHandle, syncError, setSyncError,
      customFieldDefs, addCustomFieldDef, removeCustomFieldDef,
      statusColors, updateStatusColor,
      savedFilters, addSavedFilter, removeSavedFilter,
      theme, setTheme,
      sidebarCollapsed, setSidebarCollapsed,
      tableDensity, setTableDensity,
      toasts, addToast, removeToast
    }}>
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
