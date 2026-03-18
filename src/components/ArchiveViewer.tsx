import React, { useState, useMemo } from 'react';
import { usePackages } from '../store/PackageContext';
import { Package } from '../types';
import { Search, Archive, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import Papa from 'papaparse';

export const ArchiveViewer = () => {
  const { archivedPackages, archiveFileHandle, setArchiveFileHandle, archiveError, customFieldDefs } = usePackages();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredArchives = useMemo(() => {
    if (!searchTerm) return archivedPackages;
    const lowerSearch = searchTerm.toLowerCase();
    return archivedPackages.filter(pkg => 
      pkg.trackingNumber.toLowerCase().includes(lowerSearch) ||
      (pkg.rNumberIdNumber && pkg.rNumberIdNumber.toLowerCase().includes(lowerSearch)) ||
      (pkg.notes && pkg.notes.toLowerCase().includes(lowerSearch))
    );
  }, [archivedPackages, searchTerm]);

  const handleExportCsv = () => {
    if (filteredArchives.length === 0) return;

    const exportData = filteredArchives.map(pkg => {
      const customFieldData: Record<string, any> = {};
      if (pkg.customFields) {
        Object.entries(pkg.customFields).forEach(([id, value]) => {
          const def = customFieldDefs.find(d => d.id === id);
          if (def) {
            customFieldData[`Custom: ${def.name}`] = value;
          }
        });
      }

      return {
        'Tracking Number': pkg.trackingNumber,
        'R Number': pkg.rNumberIdNumber || '',
        'Status': pkg.status,
        'Tags': pkg.tags?.join(', ') || '',
        'Notes': pkg.notes || '',
        'Created At': new Date(pkg.createdAt).toLocaleString(),
        'Updated At': new Date(pkg.updatedAt).toLocaleString(),
        'Archived At': pkg.archivedAt ? new Date(pkg.archivedAt).toLocaleString() : '',
        ...customFieldData
      };
    });

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `archived_packages_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConnectArchive = async () => {
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [{
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] },
        }],
      });
      setArchiveFileHandle(handle);
    } catch (error) {
      console.error('Error selecting archive file:', error);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Archive className="text-zinc-500" />
            Archived Packages
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            View and search packages that have been automatically archived.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            disabled={filteredArchives.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet size={16} />
            Export CSV
          </button>
          {!archiveFileHandle && (
            <button
              onClick={handleConnectArchive}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Archive size={16} />
              Connect Archive File
            </button>
          )}
        </div>
      </div>

      {archiveError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3 text-red-800 dark:text-red-400">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <div>
            <h3 className="font-medium">Archive Sync Error</h3>
            <p className="text-sm mt-1 opacity-90">{archiveError}</p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Search archived packages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-all dark:text-zinc-100"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {filteredArchives.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400 p-8 text-center">
              <Archive size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">No archived packages found</p>
              <p className="text-sm max-w-md">
                {searchTerm 
                  ? "No packages match your search criteria." 
                  : "Packages that are 'Bond & Released' and older than 24 hours will automatically appear here."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-700">Tracking Number</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-700">R Number</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-700">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-700">Archived Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredArchives.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {pkg.trackingNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                      {pkg.rNumberIdNumber || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                        {pkg.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {pkg.archivedAt ? format(new Date(pkg.archivedAt), 'MMM d, yyyy HH:mm') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
