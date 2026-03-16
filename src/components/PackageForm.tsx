import React, { useState, useEffect } from 'react';
import { Package, Status } from '../types';
import { usePackages } from '../store/PackageContext';

interface PackageFormProps {
  initialData?: Package;
  onClose: () => void;
}

export const PackageForm = ({ initialData, onClose }: PackageFormProps) => {
  const { statuses, addPackage, updatePackage } = usePackages();
  
  const [formData, setFormData] = useState<Partial<Package>>({
    trackingNumber: '',
    rNumberIdNumber: '',
    dateSubmitted: '',
    dateReleased: '',
    status: 'Pending',
    documentsUploaded: false,
    brokerFormStatus: '',
    expectedDutyAmount: undefined,
    clarificationDetails: '',
    cancellationReason: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value ? Number(value) : undefined }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialData?.id) {
      updatePackage(initialData.id, formData);
    } else {
      addPackage(formData as Omit<Package, 'id' | 'createdAt' | 'updatedAt' | 'history'>);
    }
    onClose();
  };

  const currentStatus = formData.status;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identifiers */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700">Tracking Number <span className="text-rose-500">*</span></label>
          <input
            type="text"
            name="trackingNumber"
            required
            value={formData.trackingNumber || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="e.g. 1Z9999999999999999"
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700">R Number / ID Number</label>
          <input
            type="text"
            name="rNumberIdNumber"
            value={formData.rNumberIdNumber || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="Primary Identifier"
          />
        </div>

        {/* Dates */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700">Date Submitted</label>
          <input
            type="date"
            name="dateSubmitted"
            value={formData.dateSubmitted || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700">Date Released</label>
          <input
            type="date"
            name="dateReleased"
            value={formData.dateReleased || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        {/* Status */}
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-zinc-700">Status <span className="text-rose-500">*</span></label>
          <select
            name="status"
            required
            value={formData.status || 'Pending'}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
          >
            {statuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Conditional Fields based on Status */}
        {currentStatus === 'Customs Processed' && (
          <div className="space-y-2 md:col-span-2 animate-in fade-in slide-in-from-top-2">
            <label className="block text-sm font-medium text-zinc-700">Expected Duty Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-zinc-500">$</span>
              <input
                type="number"
                step="0.01"
                name="expectedDutyAmount"
                value={formData.expectedDutyAmount || ''}
                onChange={handleChange}
                className="w-full pl-8 pr-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="0.00"
              />
            </div>
          </div>
        )}

        {currentStatus === 'Clarification Required' && (
          <div className="space-y-2 md:col-span-2 animate-in fade-in slide-in-from-top-2">
            <label className="block text-sm font-medium text-zinc-700">Details Customs Needed</label>
            <textarea
              name="clarificationDetails"
              value={formData.clarificationDetails || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
              placeholder="Enter clarification details..."
            />
          </div>
        )}

        {currentStatus === 'Submitted to Cancel' && (
          <div className="space-y-2 md:col-span-2 animate-in fade-in slide-in-from-top-2">
            <label className="block text-sm font-medium text-zinc-700">Reason for Cancellation</label>
            <textarea
              name="cancellationReason"
              value={formData.cancellationReason || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
              placeholder="Enter reason..."
            />
          </div>
        )}

        {/* Other Fields */}
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-zinc-700">Broker Form Status</label>
          <input
            type="text"
            name="brokerFormStatus"
            value={formData.brokerFormStatus || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="e.g. Submitted, Pending..."
          />
        </div>

        <div className="flex items-center gap-3 md:col-span-2 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
          <input
            type="checkbox"
            id="documentsUploaded"
            name="documentsUploaded"
            checked={formData.documentsUploaded || false}
            onChange={handleChange}
            className="w-5 h-5 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="documentsUploaded" className="text-sm font-medium text-zinc-900 cursor-pointer select-none">
            Documents Uploaded to Portal
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm"
        >
          {initialData?.id ? 'Save Changes' : 'Add Package'}
        </button>
      </div>
    </form>
  );
};
