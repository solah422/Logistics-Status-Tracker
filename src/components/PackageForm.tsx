import React, { useState, useEffect } from 'react';
import { Package, Status, Tag } from '../types';
import { usePackages } from '../store/PackageContext';
import { MessageSquarePlus, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';

interface PackageFormProps {
  initialData?: Package;
  onClose: () => void;
}

export const PackageForm = ({ initialData, onClose }: PackageFormProps) => {
  const { statuses, addPackage, updatePackage, customFieldDefs, tags } = usePackages();
  
  const [formData, setFormData] = useState<Partial<Package>>({
    trackingNumber: '',
    rNumberIdNumber: '',
    dateSubmitted: '',
    dateReleased: '',
    status: 'Pending',
    priority: 'medium',
    documentsUploaded: false,
    readySystemStatusUpdated: false,
    brokerFormStatus: '',
    expectedDutyAmount: undefined,
    clarificationDetails: '',
    cancellationReason: '',
    notes: '',
    tags: [],
    customFields: {}
  });

  const [showNotes, setShowNotes] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{ type: 'tracking' | 'rNumber', value: string } | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        customFields: initialData.customFields || {}
      });
      if (initialData.notes || initialData.status === 'Info Needed') {
        setShowNotes(true);
      }
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
    if (formData.status === 'Info Needed') {
      setShowNotes(true);
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

  const { activePackages } = usePackages();

  const handleInitialSubmit = (e: React.FormEvent) => {
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

    // Duplicate Detection
    if (!initialData) {
      const tracking = formData.trackingNumber?.trim().toLowerCase();
      const rNumber = formData.rNumberIdNumber?.trim().toLowerCase();
      
      if (tracking) {
        const hasDuplicateTracking = activePackages.some(p => p.trackingNumber.toLowerCase() === tracking);
        if (hasDuplicateTracking) {
          setDuplicateWarning({ type: 'tracking', value: formData.trackingNumber! });
          return;
        }
      }
      
      if (rNumber && rNumber.startsWith('r')) {
        const hasDuplicateRNumber = activePackages.some(p => p.rNumberIdNumber?.toLowerCase() === rNumber);
        if (hasDuplicateRNumber) {
          setDuplicateWarning({ type: 'rNumber', value: formData.rNumberIdNumber! });
          return;
        }
      }
    }

    submitForm();
  };

  const submitForm = () => {
    if (initialData?.id) {
      updatePackage(initialData.id, formData);
    } else {
      addPackage(formData as Omit<Package, 'id' | 'createdAt' | 'updatedAt' | 'history'>);
    }
    onClose();
  };

  const currentStatus = formData.status;

  if (duplicateWarning) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Potential Duplicate Detected</h3>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          A package with the {duplicateWarning.type === 'tracking' ? 'Tracking Number' : 'R Number'} <span className="font-semibold text-zinc-900 dark:text-zinc-100">{duplicateWarning.value}</span> already exists in the system. Are you sure you want to save this entry?
        </p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => setDuplicateWarning(null)}
            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Go Back & Edit
          </button>
          <button
            type="button"
            onClick={() => {
              setDuplicateWarning(null);
              submitForm();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
          >
            Save Anyway
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleInitialSubmit} className="space-y-6">
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
          <DatePicker
            selected={formData.dateSubmitted ? new Date(formData.dateSubmitted) : null}
            onChange={(date: Date | null) => setFormData(prev => ({ ...prev, dateSubmitted: date ? date.toISOString().split('T')[0] : '' }))}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-zinc-100"
            dateFormat="yyyy-MM-dd"
            isClearable
            placeholderText="Select date"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Date Released</label>
          <DatePicker
            selected={formData.dateReleased ? new Date(formData.dateReleased) : null}
            onChange={(date: Date | null) => setFormData(prev => ({ ...prev, dateReleased: date ? date.toISOString().split('T')[0] : '' }))}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-zinc-100"
            dateFormat="yyyy-MM-dd"
            isClearable
            placeholderText="Select date"
          />
        </div>

        {/* Status */}
        <div className="space-y-2">
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

        {/* Priority */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Priority</label>
          <select
            name="priority"
            value={formData.priority || 'medium'}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-zinc-100"
          >
            <option value="low" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">Low</option>
            <option value="medium" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">Medium</option>
            <option value="high" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">High</option>
            <option value="urgent" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">Urgent</option>
          </select>
        </div>

        {/* Tags */}
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Tags</label>
          <Select
            isMulti
            options={tags.map(t => ({ value: t.id, label: t.name, color: t.color }))}
            value={tags.filter(t => formData.tags?.includes(t.id)).map(t => ({ value: t.id, label: t.name, color: t.color }))}
            onChange={(selected) => setFormData(prev => ({ ...prev, tags: selected.map(s => s.value) }))}
            className="react-select-container"
            classNamePrefix="react-select"
            styles={{
              control: (base) => {
                const isDark = document.documentElement.classList.contains('dark');
                return {
                  ...base,
                  backgroundColor: 'transparent',
                  borderColor: isDark ? '#3f3f46' : '#d4d4d8', // zinc-700 : zinc-300
                  borderRadius: '0.5rem',
                  padding: '2px',
                  boxShadow: 'none',
                  '&:hover': {
                    borderColor: isDark ? '#52525b' : '#a1a1aa' // zinc-600 : zinc-400
                  }
                };
              },
              menu: (base) => {
                const isDark = document.documentElement.classList.contains('dark');
                return {
                  ...base,
                  zIndex: 50,
                  backgroundColor: isDark ? '#18181b' : '#ffffff', // zinc-900 : white
                  border: `1px solid ${isDark ? '#27272a' : '#e4e4e7'}`, // zinc-800 : zinc-200
                };
              },
              option: (base, state) => {
                const isDark = document.documentElement.classList.contains('dark');
                return {
                  ...base,
                  backgroundColor: state.isFocused 
                    ? (isDark ? '#27272a' : '#f4f4f5') // zinc-800 : zinc-100
                    : 'transparent',
                  color: isDark ? '#f4f4f5' : '#18181b', // zinc-100 : zinc-900
                  '&:active': {
                    backgroundColor: isDark ? '#3f3f46' : '#e4e4e7' // zinc-700 : zinc-200
                  }
                };
              },
              multiValue: (base, state) => {
                const isDark = document.documentElement.classList.contains('dark');
                return {
                  ...base,
                  backgroundColor: isDark ? '#27272a' : '#f4f4f5', // zinc-800 : zinc-100
                  borderRadius: '9999px',
                  padding: '0 4px',
                };
              },
              multiValueLabel: (base) => {
                const isDark = document.documentElement.classList.contains('dark');
                return {
                  ...base,
                  color: isDark ? '#f4f4f5' : '#18181b', // zinc-100 : zinc-900
                };
              },
              multiValueRemove: (base) => {
                const isDark = document.documentElement.classList.contains('dark');
                return {
                  ...base,
                  color: isDark ? '#a1a1aa' : '#71717a', // zinc-400 : zinc-500
                  '&:hover': {
                    backgroundColor: isDark ? '#3f3f46' : '#e4e4e7', // zinc-700 : zinc-200
                    color: isDark ? '#f87171' : '#ef4444', // red-400 : red-500
                  }
                };
              },
              input: (base) => {
                const isDark = document.documentElement.classList.contains('dark');
                return {
                  ...base,
                  color: isDark ? '#f4f4f5' : '#18181b', // zinc-100 : zinc-900
                };
              }
            }}
          />
        </div>

        {/* Advanced Options Toggle */}
        <div className="md:col-span-2 pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </button>
        </div>

        {/* Advanced Fields */}
        {showAdvanced && (
          <>
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

        {/* Notes Field */}
        <div className="md:col-span-2">
          {!showNotes && currentStatus !== 'Info Needed' ? (
            <button
              type="button"
              onClick={() => setShowNotes(true)}
              className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              <MessageSquarePlus size={16} />
              Add Notes / Info Needed
            </button>
          ) : (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Notes / Info Needed Details
              </label>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none dark:text-zinc-100"
                placeholder="Enter any additional notes or information needed..."
              />
            </div>
          )}
        </div>

        {/* Custom Fields */}
        {showAdvanced && customFieldDefs.length > 0 && (
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
          </>
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
