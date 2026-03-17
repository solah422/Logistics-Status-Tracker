import React from 'react';
import { usePackages } from '../store/PackageContext';
import { Cloud, FileJson, ArrowRight } from 'lucide-react';
import { set } from 'idb-keyval';

export const FirstLaunch = ({ onComplete }: { onComplete: () => void }) => {
  const { setFileHandle, setSyncError, importPackages } = usePackages();

  const handleSelectSyncFile = async () => {
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }]
      });
      await set('logistics_sync_handle', handle);
      setFileHandle(handle);
      setSyncError(null);
      
      // Read and merge
      const file = await handle.getFile();
      const text = await file.text();
      if (text) {
        const data = JSON.parse(text);
        importPackages(data, false);
      }
      onComplete();
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        setSyncError('Failed to select or read sync file.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center space-y-8">
        <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto">
          <Cloud className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Welcome to LogiTrack Pro</h1>
            <p className="text-zinc-600 dark:text-zinc-300">
              Your ultimate command center for modern logistics. Seamlessly track packages, manage workflows with interactive Kanban boards, and generate real-time analytics and PDF reports.
            </p>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            It looks like this is your first time here. Would you like to link an existing database file from Google Drive (or your local computer) to sync your packages?
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleSelectSyncFile}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium shadow-sm"
          >
            <FileJson size={20} />
            Link Existing Database
          </button>
          
          <button
            onClick={onComplete}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-xl transition-colors font-medium"
          >
            Start Fresh
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
