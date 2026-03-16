import React, { useMemo, useState } from 'react';
import { usePackages } from '../store/PackageContext';
import { Search, RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { Modal } from './ui/Modal';

export const DeletedPackages = () => {
  const { deletedPackages, restorePackage, hardDeletePackage } = usePackages();
  const [searchQuery, setSearchQuery] = useState('');
  const [packageToHardDelete, setPackageToHardDelete] = useState<string | null>(null);

  const filteredPackages = useMemo(() => {
    return deletedPackages.filter(pkg => {
      return pkg.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pkg.rNumberIdNumber && pkg.rNumberIdNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    });
  }, [deletedPackages, searchQuery]);

  const confirmHardDelete = () => {
    if (packageToHardDelete) {
      hardDeletePackage(packageToHardDelete);
      setPackageToHardDelete(null);
    }
  };

  const getDaysLeft = (deletedAt?: string) => {
    if (!deletedAt) return 0;
    const deletedTime = new Date(deletedAt).getTime();
    const now = new Date().getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const timeLeft = sevenDays - (now - deletedTime);
    return Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Search Deleted Packages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-zinc-100"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Identifiers</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status Before Deletion</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Time Left</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                    No deleted packages found.
                  </td>
                </tr>
              ) : (
                filteredPackages.map(pkg => {
                  const daysLeft = getDaysLeft(pkg.deletedAt);
                  return (
                    <tr key={pkg.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{pkg.rNumberIdNumber || 'No R/ID Number'}</span>
                          <span className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">{pkg.trackingNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                          {pkg.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={clsx(
                          "text-sm font-medium",
                          daysLeft <= 1 ? "text-rose-600" : "text-amber-600"
                        )}>
                          {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => restorePackage(pkg.id)}
                            className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Restore"
                          >
                            <RotateCcw size={16} />
                          </button>
                          <button
                            onClick={() => setPackageToHardDelete(pkg.id)}
                            className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Permanently Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={!!packageToHardDelete}
        onClose={() => setPackageToHardDelete(null)}
        title="Permanently Delete"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-rose-600 bg-rose-50 p-4 rounded-lg border border-rose-200">
            <AlertTriangle size={24} />
            <p className="text-sm font-medium">This action cannot be undone.</p>
          </div>
          <p className="text-sm text-zinc-600">
            Are you sure you want to permanently delete this package? It will be removed from the system forever.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setPackageToHardDelete(null)}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmHardDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-rose-600 border border-transparent rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
            >
              Permanently Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
