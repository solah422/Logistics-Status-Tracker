import React, { useState, useMemo } from 'react';
import { usePackages } from '../store/PackageContext';
import { Package } from '../types';
import { Modal } from './ui/Modal';
import { PackageForm } from './PackageForm';
import { Plus, Search, Edit2, Trash2, Filter } from 'lucide-react';
import { clsx } from 'clsx';

export const PackageList = () => {
  const { packages, deletePackage, statuses } = usePackages();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | undefined>(undefined);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filteredPackages = useMemo(() => {
    return packages.filter(pkg => {
      const matchesSearch = 
        pkg.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pkg.rNumberIdNumber && pkg.rNumberIdNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'All' || pkg.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [packages, searchQuery, statusFilter]);

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingPackage(undefined);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      deletePackage(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-1 gap-4 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Search Tracking or R/ID Number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="relative w-48 hidden sm:block">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none transition-all"
            >
              <option value="All">All Statuses</option>
              {statuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium whitespace-nowrap w-full sm:w-auto justify-center"
        >
          <Plus size={18} />
          Add Package
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Identifiers</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Docs</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    No packages found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredPackages.map(pkg => (
                  <tr key={pkg.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-900">{pkg.rNumberIdNumber || 'No R/ID Number'}</span>
                        <span className="text-sm text-zinc-500 font-mono">{pkg.trackingNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                        pkg.status === 'Pending' ? "bg-amber-100 text-amber-800" :
                        pkg.status === 'Bond & Released' || pkg.status === 'Allowance Given' ? "bg-emerald-100 text-emerald-800" :
                        pkg.status === 'Cancelled' ? "bg-rose-100 text-rose-800" :
                        "bg-blue-100 text-blue-800"
                      )}>
                        {pkg.status}
                      </span>
                      {pkg.status === 'Customs Processed' && pkg.expectedDutyAmount && (
                        <div className="text-xs text-zinc-500 mt-1">Duty: ${pkg.expectedDutyAmount}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-sm">
                        <span className="text-zinc-600">Sub: {pkg.dateSubmitted ? new Date(pkg.dateSubmitted).toLocaleDateString() : '-'}</span>
                        <span className="text-zinc-600">Rel: {pkg.dateReleased ? new Date(pkg.dateReleased).toLocaleDateString() : '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "text-sm font-medium",
                        pkg.documentsUploaded ? "text-emerald-600" : "text-zinc-400"
                      )}>
                        {pkg.documentsUploaded ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(pkg)}
                          className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(pkg.id)}
                          className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPackage ? 'Edit Package' : 'Add New Package'}
      >
        <PackageForm
          initialData={editingPackage}
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
