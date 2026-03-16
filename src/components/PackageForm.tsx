import React, { useState, useEffect } from 'react';
import { Package, Status } from '../types';
import { usePackages } from '../store/PackageContext';

interface PackageFormProps {
  initialData?: Package;
  onClose: () => void;
}

export const PackageForm = ({ initialData, onClose }: PackageFormProps) => {
  const { statuses, addPackage, updatePackage, customFieldDefs } = usePackages();
  
  const [formData, setFormData] = useState<Partial<Package>>({
    trackingNumber: '',
    rNumberIdNumber: '',
    dateSubmitted: '',
    dateReleased: '',
    status: 'Pending',
    documentsUploaded: false,
    readySystemStatusUpdated: false,
    brokerFormStatus: '',
    expectedDutyAmount: undefined,
    clarificationDetails: '',
    cancellationReason: '',
    customFields: {}
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        customFields: initialData.customFields || {}
      });
    }
  }, [initialData]);

  // Auto-set release date
  useEffect(() => {
    if (
      (formData.status === 'Bond & Released' || formData.status === 'Allowance Given') &&
      !formData.dateReleased
    ) {
      setFormData(prev => ({
        ...prev,
        dateReleased: new Date().toISOString().split('T')[0]
      }));
    }
  }, [formData.status]);

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

  const handleCustomFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      customFields: {
        ...(prev.customFields || {}),
        [fieldId]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (
      (formData.status === 'Submitted for Valuation' || formData.status === 'Customs Checking') &&
      !formData.readySystemStatusUpdated
    ) {
      alert('You must tick "Ready System Status Updated" to set this status.');
      return;
    }

    // Validate required custom fields
    for (const def of customFieldDefs) {
      if (def.required && (!formData.customFields || formData.customFields[def.id] === undefined || formData.customFields[def.id] === '')) {
        alert(`Custom field "${def.name}" is required.`);
        return;
      }
    }

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
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Tracking Number <span className="text-rose-500">*</span></label>
          <input
            type="text"
            name="trackingNumber"
            required
            value={formData.trackingNumber || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-zinc-100"
            placeholder="e.g. 1Z9999999999999999"
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">R Number / ID Number</label>
          <input
            type="text"
            name="rNumberIdNumber"
            value={formData.rNumberIdNumber || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-zinc-100"
            placeholder="Primary Identifier"
          />
        </div>

        {/* Dates */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Date Submitted</label>
          <input
            type="date"
            name="dateSubmitted"
            value={formData.dateSubmitted || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-zinc-100"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Date Released</label>
          <input
            type="date"
            name="dateReleased"
            value={formData.dateReleased || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-zinc-100"
          />
        </div>

        {/* Status */}
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Status <span className="text-rose-500">*</span></label>
          <select
            name="status"
            required
            value={formData.status || 'Pending'}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-zinc-100"
          >
            {statuses.map(s => (
              <option key={s} value={s} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">{s}</option>
            ))}
          </select>
        </div>

        {/* Conditional Fields based on Status */}
        {currentStatus === 'Customs Processed' && (
          <div className="space-y-2 md:col-span-2 animate-in fade-in slide-in-from-top-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Expected Duty Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-zinc-500">$</span>
              <input
                type="number"
                step="0.01"
                name="expectedDutyAmount"
                value={formData.expectedDutyAmount || ''}
                onChange={handleChange}
                className="w-full pl-8 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-zinc-100"
                placeholder="0.00"
              />
            </div>
          </div>
        )}

        {currentStatus === 'Clarification Required' && (
          <div className="space-y-2 md:col-span-2 animate-in fade-in slide-in-from-top-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Details Customs Needed</label>
            <textarea
              name="clarificationDetails"
              value={formData.clarificationDetails || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none dark:text-zinc-100"
              placeholder="Enter clarification details..."
            />
          </div>
        )}

        {currentStatus === 'Submitted to Cancel' && (
          <div className="space-y-2 md:col-span-2 animate-in fade-in slide-in-from-top-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Reason for Cancellation</label>
            <textarea
              name="cancellationReason"
              value={formData.cancellationReason || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none dark:text-zinc-100"
              placeholder="Enter reason..."
            />
          </div>
        )}

        {/* Other Fields */}
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Broker Form Status</label>
          <input
            type="text"
            name="brokerFormStatus"
            value={formData.brokerFormStatus || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-zinc-100"
            placeholder="e.g. Submitted, Pending..."
          />
        </div>

        {/* Custom Fields */}
        {customFieldDefs.length > 0 && (
          <div className="md:col-span-2 space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Custom Fields</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {customFieldDefs.map(def => (
                <div key={def.id} className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {def.name} {def.required && <span className="text-rose-500">*</span>}
                  </label>
                  
                  {def.type === 'text' && (
                    <input
                      type="text"
                      required={def.required}
                      value={formData.customFields?.[def.id] || ''}
                      onChange={(e) => handleCustomFieldChange(def.id, e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-zinc-100"
                    />
                  )}
                  
                  {def.type === 'number' && (
                    <input
                      type="number"
                      required={def.required}
                      value={formData.customFields?.[def.id] || ''}
                      onChange={(e) => handleCustomFieldChange(def.id, Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-zinc-100"
                    />
                  )}
                  
                  {def.type === 'date' && (
                    <input
                      type="date"
                      required={def.required}
                      value={formData.customFields?.[def.id] || ''}
                      onChange={(e) => handleCustomFieldChange(def.id, e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-zinc-100"
                    />
                  )}
                  
                  {def.type === 'boolean' && (
                    <div className="flex items-center gap-3 pt-2">
                      <input
                        type="checkbox"
                        id={`custom-${def.id}`}
                        checked={formData.customFields?.[def.id] || false}
                        onChange={(e) => handleCustomFieldChange(def.id, e.target.checked)}
                        className="w-5 h-5 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500"
                      />
                      <label htmlFor={`custom-${def.id}`} className="text-sm font-medium text-zinc-900 dark:text-zinc-300 cursor-pointer select-none">
                        Yes
                      </label>
                    </div>
                  )}
                  
                  {def.type === 'select' && def.options && (
                    <select
                      required={def.required}
                      value={formData.customFields?.[def.id] || ''}
                      onChange={(e) => handleCustomFieldChange(def.id, e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-zinc-100"
                    >
                      <option value="" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">Select an option...</option>
                      {def.options.map(opt => (
                        <option key={opt} value={opt} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">{opt}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 md:col-span-2 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="documentsUploaded"
              name="documentsUploaded"
              checked={formData.documentsUploaded || false}
              onChange={handleChange}
              className="w-5 h-5 text-indigo-600 border-zinc-300 dark:border-zinc-600 rounded focus:ring-indigo-500 dark:bg-zinc-800"
            />
            <label htmlFor="documentsUploaded" className="text-sm font-medium text-zinc-900 dark:text-zinc-200 cursor-pointer select-none">
              Documents Uploaded to Portal
            </label>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="readySystemStatusUpdated"
              name="readySystemStatusUpdated"
              checked={formData.readySystemStatusUpdated || false}
              onChange={handleChange}
              className="w-5 h-5 text-indigo-600 border-zinc-300 dark:border-zinc-600 rounded focus:ring-indigo-500 dark:bg-zinc-800"
            />
            <label htmlFor="readySystemStatusUpdated" className="text-sm font-medium text-zinc-900 dark:text-zinc-200 cursor-pointer select-none">
              Ready System Status Updated
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
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
