import React, { useState, useRef, DragEvent } from 'react';
import { usePackages } from '../store/PackageContext';
import { Download, Upload, FileJson, FileSpreadsheet, AlertCircle, ArrowRight, Check } from 'lucide-react';
import Papa from 'papaparse';
import { Package } from '../types';

const PACKAGE_FIELDS = [
  { key: 'trackingNumber', label: 'Tracking Number', required: true },
  { key: 'rNumberIdNumber', label: 'R Number / ID Number' },
  { key: 'dateSubmitted', label: 'Date Submitted (YYYY-MM-DD)' },
  { key: 'dateReleased', label: 'Date Released (YYYY-MM-DD)' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority (low, medium, high, urgent)' },
  { key: 'documentsUploaded', label: 'Documents Uploaded (true/false)' },
  { key: 'readySystemStatusUpdated', label: 'Ready System Updated (true/false)' },
  { key: 'brokerFormStatus', label: 'Broker Form Status' },
  { key: 'expectedDutyAmount', label: 'Expected Duty Amount' },
  { key: 'clarificationDetails', label: 'Clarification Details' },
  { key: 'cancellationReason', label: 'Cancellation Reason' },
  { key: 'notes', label: 'Notes' }
];

export const ImportExport = () => {
  const { packages, importPackages, exportPackages } = usePackages();
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingCsv, setIsDraggingCsv] = useState(false);
  const [isDraggingJson, setIsDraggingJson] = useState(false);

  // Mapping Tool State
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [showMapping, setShowMapping] = useState(false);

  const handleDownloadSample = () => {
    const sampleData = [
      {
        trackingNumber: '1Z9999999999999999',
        rNumberIdNumber: 'R123456789',
        dateSubmitted: '2023-10-27',
        dateReleased: '',
        status: 'Pending',
        documentsUploaded: 'false',
        brokerFormStatus: '',
        expectedDutyAmount: '',
        clarificationDetails: '',
        cancellationReason: ''
      }
    ];
    
    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_import.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processCsvFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const headers = Object.keys(results.data[0] as object);
          setCsvHeaders(headers);
          setCsvData(results.data);
          
          // Auto-map fields with exact or similar names
          const initialMapping: Record<string, string> = {};
          PACKAGE_FIELDS.forEach(field => {
            const exactMatch = headers.find(h => h.toLowerCase() === field.key.toLowerCase());
            if (exactMatch) {
              initialMapping[field.key] = exactMatch;
            } else {
              // Try to find a partial match
              const partialMatch = headers.find(h => h.toLowerCase().includes(field.key.toLowerCase().replace(/([A-Z])/g, ' $1').trim()));
              if (partialMatch) {
                initialMapping[field.key] = partialMatch;
              }
            }
          });
          setFieldMapping(initialMapping);
          setShowMapping(true);
        } else {
          setImportStatus({ type: 'error', message: 'CSV file appears to be empty.' });
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (error) => {
        setImportStatus({ type: 'error', message: `CSV Error: ${error.message}` });
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  const handleConfirmMapping = () => {
    try {
      const newPackages: Package[] = csvData.map((row: any) => {
        const getMappedValue = (key: string) => {
          const csvCol = fieldMapping[key];
          return csvCol ? row[csvCol] : undefined;
        };

        return {
          id: crypto.randomUUID(),
          trackingNumber: getMappedValue('trackingNumber') || '',
          rNumberIdNumber: getMappedValue('rNumberIdNumber') || '',
          dateSubmitted: getMappedValue('dateSubmitted') || '',
          dateReleased: getMappedValue('dateReleased') || '',
          status: getMappedValue('status') || 'Pending',
          priority: getMappedValue('priority') || 'medium',
          documentsUploaded: String(getMappedValue('documentsUploaded')).toLowerCase() === 'true',
          readySystemStatusUpdated: String(getMappedValue('readySystemStatusUpdated')).toLowerCase() === 'true',
          brokerFormStatus: getMappedValue('brokerFormStatus') || '',
          expectedDutyAmount: getMappedValue('expectedDutyAmount') ? Number(getMappedValue('expectedDutyAmount')) : undefined,
          clarificationDetails: getMappedValue('clarificationDetails') || '',
          cancellationReason: getMappedValue('cancellationReason') || '',
          notes: getMappedValue('notes') || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          history: [{ status: getMappedValue('status') || 'Pending', timestamp: new Date().toISOString() }]
        };
      });

      // Filter out rows without tracking numbers if it's required
      const validPackages = newPackages.filter(p => p.trackingNumber.trim() !== '');

      importPackages(validPackages, false);
      setImportStatus({ type: 'success', message: `Successfully imported ${validPackages.length} packages from CSV.` });
      setShowMapping(false);
      setCsvData([]);
      setCsvHeaders([]);
    } catch (error) {
      setImportStatus({ type: 'error', message: 'Failed to process mapped data.' });
    }
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processCsvFile(file);
  };

  const handleJsonExport = () => {
    const json = exportPackages();
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `logistics_export_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processJsonFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json);
        if (Array.isArray(data)) {
          importPackages(data, false);
          setImportStatus({ type: 'success', message: `Successfully merged ${data.length} packages from JSON.` });
        } else {
          throw new Error("Invalid JSON format. Expected an array of packages.");
        }
      } catch (error) {
        setImportStatus({ type: 'error', message: 'Failed to parse JSON file.' });
      }
      if (jsonInputRef.current) jsonInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processJsonFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, type: 'csv' | 'json') => {
    e.preventDefault();
    if (type === 'csv') setIsDraggingCsv(true);
    else setIsDraggingJson(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>, type: 'csv' | 'json') => {
    e.preventDefault();
    if (type === 'csv') setIsDraggingCsv(false);
    else setIsDraggingJson(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, type: 'csv' | 'json') => {
    e.preventDefault();
    if (type === 'csv') setIsDraggingCsv(false);
    else setIsDraggingJson(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (type === 'csv' && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      processCsvFile(file);
    } else if (type === 'json' && (file.type === 'application/json' || file.name.endsWith('.json'))) {
      processJsonFile(file);
    } else {
      setImportStatus({ type: 'error', message: `Invalid file type. Please upload a ${type.toUpperCase()} file.` });
    }
  };

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-6 max-w-4xl mx-auto">
        {importStatus && (
        <div className={`p-4 rounded-lg flex items-start gap-3 ${
          importStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' :
          importStatus.type === 'error' ? 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800' :
          'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
        }`}>
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{importStatus.message}</p>
        </div>
      )}

      {showMapping ? (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Map CSV Columns</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Match the columns from your CSV file to the application's data fields.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowMapping(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMapping}
                disabled={!fieldMapping['trackingNumber']}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check size={16} />
                Import {csvData.length} Packages
              </button>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-200 dark:border-zinc-700 font-medium text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-100/50 dark:bg-zinc-800">
              <div className="col-span-5">App Field</div>
              <div className="col-span-2 flex justify-center"></div>
              <div className="col-span-5">CSV Column</div>
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-700 max-h-[60vh] overflow-y-auto">
              {PACKAGE_FIELDS.map(field => (
                <div key={field.key} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="col-span-5">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {field.label}
                      {field.required && <span className="text-rose-500 ml-1">*</span>}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-center text-zinc-400">
                    <ArrowRight size={16} />
                  </div>
                  <div className="col-span-5">
                    <select
                      value={fieldMapping[field.key] || ''}
                      onChange={(e) => setFieldMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className={`w-full px-3 py-2 bg-white dark:bg-zinc-900 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors dark:text-zinc-100 ${
                        field.required && !fieldMapping[field.key] 
                          ? 'border-rose-300 dark:border-rose-700 focus:border-rose-500' 
                          : 'border-zinc-300 dark:border-zinc-700 focus:border-indigo-500'
                      }`}
                    >
                      <option value="">-- Ignore this field --</option>
                      {csvHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Import Section */}
        <div 
          className={`bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border flex flex-col transition-colors ${
            isDraggingCsv ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-zinc-200 dark:border-zinc-800'
          }`}
          onDragOver={(e) => handleDragOver(e, 'csv')}
          onDragLeave={(e) => handleDragLeave(e, 'csv')}
          onDrop={(e) => handleDrop(e, 'csv')}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <FileSpreadsheet size={24} />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Bulk CSV Import</h2>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 flex-1">
            Import bulk data from older systems using a CSV file. Download the sample file to see the required format. Or drag and drop a file here.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleDownloadSample}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors font-medium text-sm"
            >
              <Download size={18} />
              Download Sample CSV
            </button>
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvImport}
                ref={fileInputRef}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm shadow-sm">
                <Upload size={18} />
                Upload CSV File
              </button>
            </div>
          </div>
        </div>

        {/* JSON Sync Section */}
        <div 
          className={`bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border flex flex-col transition-colors ${
            isDraggingJson ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : 'border-zinc-200 dark:border-zinc-800'
          }`}
          onDragOver={(e) => handleDragOver(e, 'json')}
          onDragLeave={(e) => handleDragLeave(e, 'json')}
          onDrop={(e) => handleDrop(e, 'json')}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <FileJson size={24} />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Daily Sync (JSON)</h2>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 flex-1">
            Export your current data to transfer to another system, or import a daily update file to merge changes. Or drag and drop a file here.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleJsonExport}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors font-medium text-sm"
            >
              <Download size={18} />
              Export All to JSON
            </button>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleJsonImport}
                ref={jsonInputRef}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm">
                <Upload size={18} />
                Import & Merge JSON
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
      </div>
    </div>
  );
};
