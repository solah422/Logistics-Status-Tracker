import React, { useState, useRef, DragEvent } from 'react';
import { usePackages } from '../store/PackageContext';
import { Download, Upload, FileJson, FileSpreadsheet, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { Package } from '../types';

export const ImportExport = () => {
  const { packages, importPackages, exportPackages } = usePackages();
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingCsv, setIsDraggingCsv] = useState(false);
  const [isDraggingJson, setIsDraggingJson] = useState(false);

  const handleDownloadSample = () => {
    const sampleData = [
      {
        trackingNumber: '1Z9999999999999999',
        rNumberIdNumber: 'R123456789',
        dateSubmitted: '2023-10-27',
        dateReleased: '',
        status: 'Info Needed',
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
        try {
          const newPackages: Package[] = results.data.map((row: any) => ({
            id: crypto.randomUUID(),
            trackingNumber: row.trackingNumber || '',
            rNumberIdNumber: row.rNumberIdNumber || '',
            dateSubmitted: row.dateSubmitted || '',
            dateReleased: row.dateReleased || '',
            status: row.status || 'Info Needed',
            documentsUploaded: String(row.documentsUploaded).toLowerCase() === 'true',
            brokerFormStatus: row.brokerFormStatus || '',
            expectedDutyAmount: row.expectedDutyAmount ? Number(row.expectedDutyAmount) : undefined,
            clarificationDetails: row.clarificationDetails || '',
            cancellationReason: row.cancellationReason || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            history: [{ status: row.status || 'Info Needed', timestamp: new Date().toISOString() }]
          }));

          importPackages(newPackages, false);
          setImportStatus({ type: 'success', message: `Successfully imported ${newPackages.length} packages from CSV.` });
        } catch (error) {
          setImportStatus({ type: 'error', message: 'Failed to parse CSV. Please check the format.' });
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (error) => {
        setImportStatus({ type: 'error', message: `CSV Error: ${error.message}` });
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
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
    </div>
    </div>
  );
};
