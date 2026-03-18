import React, { useState } from 'react';
import { PackageSearch, LayoutDashboard, Settings, FileSpreadsheet, BarChart3, Menu, X, Trash2, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Info, Sun, Moon, Monitor, Cloud } from 'lucide-react';
import { clsx } from 'clsx';
import { usePackages } from '../store/PackageContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout = ({ children, activeTab, setActiveTab }: LayoutProps) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { sidebarCollapsed, setSidebarCollapsed, toasts, removeToast, theme, setTheme, fileHandle, forceSync } = usePackages();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'packages', label: 'Packages', icon: PackageSearch },
    { id: 'import-export', label: 'Import / Export', icon: FileSpreadsheet },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'deleted', label: 'Deleted Items', icon: Trash2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="h-screen overflow-hidden bg-zinc-50 dark:bg-[#121212] flex transition-colors duration-200">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        "fixed lg:static inset-y-0 left-0 z-50 bg-zinc-900 dark:bg-[#1a1a1a] text-zinc-300 transition-all duration-300 ease-in-out flex flex-col print:hidden",
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        sidebarCollapsed ? "w-20" : "w-64"
      )}>
        <div className="h-16 flex items-center justify-between px-4 bg-zinc-950 dark:bg-[#111]">
          {!sidebarCollapsed && <span className="text-white font-semibold text-lg tracking-tight truncate">LogiTrack Pro</span>}
          {sidebarCollapsed && <PackageSearch className="text-white mx-auto" size={24} />}
          <button className="lg:hidden text-zinc-400 hover:text-white" onClick={() => setMobileSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileSidebarOpen(false);
                }}
                title={sidebarCollapsed ? item.label : undefined}
                className={clsx(
                  "w-full flex items-center gap-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  sidebarCollapsed ? "justify-center px-0" : "px-3",
                  isActive 
                    ? "bg-red-600 text-white" 
                    : "hover:bg-zinc-800 dark:hover:bg-zinc-800/50 hover:text-white"
                )}
              >
                <Icon size={18} className="shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-4 border-t border-zinc-800 hidden lg:block">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative print:overflow-visible">
        <header className="h-16 flex items-center px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#1e1e1e] border-b border-zinc-200 dark:border-zinc-800 transition-colors duration-200 print:hidden">
          <button 
            className="lg:hidden mr-4 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
            {navItems.find(i => i.id === activeTab)?.label}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            {fileHandle && (
              <button
                onClick={() => forceSync()}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors mr-2"
                title="Force Sync Now"
              >
                <Cloud size={16} />
                <span className="hidden sm:inline">Sync</span>
              </button>
            )}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
              className="p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title={`Theme: ${theme}`}
            >
              {theme === 'dark' ? <Moon size={20} /> : theme === 'light' ? <Sun size={20} /> : <Monitor size={20} />}
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-hidden print:overflow-visible flex flex-col">
          {children}
        </div>

        {/* Toast Container */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none print:hidden">
          {toasts.map(toast => {
            const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertCircle : Info;
            return (
              <div 
                key={toast.id}
                className={clsx(
                  "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-right-8 fade-in duration-300",
                  toast.type === 'success' ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300" :
                  toast.type === 'error' ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300" :
                  "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300"
                )}
              >
                <Icon size={20} className="shrink-0" />
                <p className="text-sm font-medium">{toast.message}</p>
                <button 
                  onClick={() => removeToast(toast.id)}
                  className="ml-4 text-current opacity-50 hover:opacity-100"
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
