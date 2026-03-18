import React, { useState, useEffect } from 'react';
import { usePackages } from '../store/PackageContext';
import { Plus, Settings2, Trash2, Cloud, CloudOff, AlertCircle, Palette, ListPlus, X, Tags, Edit2, Check, Github } from 'lucide-react';
import { set } from 'idb-keyval';
import { CustomFieldType, Tag } from '../types';
import { clsx } from 'clsx';

export const Settings = () => {
  const { 
    statuses, addStatus, 
    fileHandle, setFileHandle, syncError, setSyncError, importPackages, forceSync,
    archiveFileHandle, setArchiveFileHandle, archiveError, setArchiveError, triggerArchive,
    statusColors, updateStatusColor,
    customFieldDefs, addCustomFieldDef, removeCustomFieldDef,
    tags, addTag, removeTag, updateTag,
    updateAvailable, checkUpdate
  } = usePackages();
  
  const [newStatus, setNewStatus] = useState('');
  
  // Tag Management State
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const [editTagColor, setEditTagColor] = useState('');
  
  // Custom Field Form State
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState('');

  const APP_VERSION = '5.1.2';
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const handleManualCheckUpdate = async () => {
    setCheckingUpdate(true);
    await checkUpdate(true);
    setCheckingUpdate(false);
  };

  const handleAddStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStatus.trim() && !statuses.includes(newStatus.trim())) {
      addStatus(newStatus.trim());
      setNewStatus('');
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    addTag({
      id: crypto.randomUUID(),
      name: newTagName.trim(),
      color: newTagColor
    });

    setNewTagName('');
    setNewTagColor('bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300');
  };

  const startEditTag = (tag: Tag) => {
    setEditingTagId(tag.id);
    setEditTagName(tag.name);
    setEditTagColor(tag.color);
  };

  const saveEditTag = () => {
    if (editingTagId && editTagName.trim()) {
      updateTag(editingTagId, {
        name: editTagName.trim(),
        color: editTagColor
      });
      setEditingTagId(null);
    }
  };

  const cancelEditTag = () => {
    setEditingTagId(null);
    setEditTagName('');
    setEditTagColor('');
  };

  const handleAddCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;

    const options = newFieldType === 'select' 
      ? newFieldOptions.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    addCustomFieldDef({
      id: crypto.randomUUID(),
      name: newFieldName.trim(),
      type: newFieldType,
      required: newFieldRequired,
      options
    });

    setNewFieldName('');
    setNewFieldType('text');
    setNewFieldRequired(false);
    setNewFieldOptions('');
  };

  const handleSelectSyncFile = async () => {
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }]
      });
      await set('logistics_sync_handle', handle);
      setFileHandle(handle);
      setSyncError(null);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        setSyncError('Failed to select or read sync file.');
      }
    }
  };

  const handleGrantPermission = async () => {
    if (fileHandle) {
      try {
        const permission = await fileHandle.requestPermission({ mode: 'readwrite' });
        if (permission === 'granted') {
          setSyncError(null);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSelectArchiveFile = async () => {
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }]
      });
      await set('logistics_archive_handle', handle);
      setArchiveFileHandle(handle);
      setArchiveError(null);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        setArchiveError('Failed to select archive file.');
      }
    }
  };

  const handleGrantArchivePermission = async () => {
    if (archiveFileHandle) {
      try {
        const permission = await archiveFileHandle.requestPermission({ mode: 'readwrite' });
        if (permission === 'granted') {
          setArchiveError(null);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const colorOptions = [
    { label: 'Gray', value: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300' },
    { label: 'Blue', value: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'Emerald', value: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { label: 'Amber', value: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
    { label: 'Rose', value: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' },
    { label: 'Purple', value: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  ];

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        {/* Status Management */}
      <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg">
            <Settings2 size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Custom Statuses</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage the list of available statuses for packages.</p>
          </div>
        </div>

        <form onSubmit={handleAddStatus} className="flex gap-3 mb-6">
          <input
            type="text"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            placeholder="Enter new status name..."
            className="flex-1 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={!newStatus.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
          >
            <Plus size={18} />
            Add Status
          </button>
        </form>
      </div>

      {/* Status Colors */}
      <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-lg">
            <Palette size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Status Colors</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Customize the visual appearance of each status.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {statuses.map((status) => (
            <div key={status} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <span className={clsx("px-2.5 py-1 rounded-full text-xs font-medium", statusColors[status] || colorOptions[0].value)}>
                {status}
              </span>
              <select
                value={statusColors[status] || colorOptions[0].value}
                onChange={(e) => updateStatusColor(status, e.target.value)}
                className="text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-2 py-1 dark:text-zinc-200"
              >
                {colorOptions.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">{opt.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Tag Management */}
      <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Tags size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Custom Tags</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Create and manage color-coded tags for packages.</p>
          </div>
        </div>

        <form onSubmit={handleAddTag} className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="New tag name (e.g., VIP, Fragile)"
            className="flex-1 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-zinc-100"
            required
          />
          <select
            value={newTagColor}
            onChange={(e) => setNewTagColor(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-zinc-100"
          >
            {colorOptions.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">{opt.label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!newTagName.trim()}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
          >
            <Plus size={18} />
            Add Tag
          </button>
        </form>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Active Tags</h3>
          {tags.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">No tags defined yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tags.map(tag => (
                <div key={tag.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                  {editingTagId === tag.id ? (
                    <div className="flex-1 flex items-center gap-2 mr-2">
                      <input
                        type="text"
                        value={editTagName}
                        onChange={(e) => setEditTagName(e.target.value)}
                        className="flex-1 min-w-0 px-2 py-1 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-zinc-100"
                        autoFocus
                      />
                      <select
                        value={editTagColor}
                        onChange={(e) => setEditTagColor(e.target.value)}
                        className="w-24 px-1 py-1 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-zinc-100"
                      >
                        {colorOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span className={clsx("px-2.5 py-1 rounded-full text-xs font-medium", tag.color)}>
                      {tag.name}
                    </span>
                  )}
                  
                  <div className="flex items-center gap-1 shrink-0">
                    {editingTagId === tag.id ? (
                      <>
                        <button onClick={saveEditTag} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition-colors" title="Save">
                          <Check size={16} />
                        </button>
                        <button onClick={cancelEditTag} className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-colors" title="Cancel">
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEditTag(tag)} className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors" title="Edit Tag">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => removeTag(tag.id)} className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors" title="Remove Tag">
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Custom Field Builder */}
      <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <ListPlus size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Custom Fields</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Add custom data fields to your packages.</p>
          </div>
        </div>

        <form onSubmit={handleAddCustomField} className="space-y-4 mb-8 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Field Name</label>
              <input
                type="text"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                placeholder="e.g., Courier Name"
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-zinc-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Field Type</label>
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value as CustomFieldType)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-zinc-100"
              >
                <option value="text" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">Text</option>
                <option value="number" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">Number</option>
                <option value="date" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">Date</option>
                <option value="boolean" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">Checkbox (Yes/No)</option>
                <option value="select" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">Dropdown</option>
              </select>
            </div>
          </div>
          
          {newFieldType === 'select' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Options (comma-separated)</label>
              <input
                type="text"
                value={newFieldOptions}
                onChange={(e) => setNewFieldOptions(e.target.value)}
                placeholder="Option 1, Option 2, Option 3"
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-zinc-100"
                required
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newFieldRequired}
                onChange={(e) => setNewFieldRequired(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Required Field</span>
            </label>
            <button
              type="submit"
              disabled={!newFieldName.trim() || (newFieldType === 'select' && !newFieldOptions.trim())}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              Add Field
            </button>
          </div>
        </form>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Active Custom Fields</h3>
          {customFieldDefs.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">No custom fields defined yet.</p>
          ) : (
            <div className="grid gap-3">
              {customFieldDefs.map(field => (
                <div key={field.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {field.name} {field.required && <span className="text-rose-500">*</span>}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Type: {field.type} {field.type === 'select' && `(${field.options?.join(', ')})`}
                    </p>
                  </div>
                  <button
                    onClick={() => removeCustomFieldDef(field.id)}
                    className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                    title="Remove Field"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Google Drive Sync */}
      <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Cloud size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Google Drive Sync</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Sync your database with a local JSON file (e.g., in your Google Drive folder).</p>
          </div>
        </div>

        {syncError && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3 text-amber-800 dark:text-amber-400">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">{syncError}</p>
              {syncError.includes('Permission required') && (
                <button 
                  onClick={handleGrantPermission}
                  className="mt-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  Grant Permission
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg gap-4">
          <div className="flex items-center gap-3">
            {fileHandle ? (
              <Cloud className="text-emerald-500 dark:text-emerald-400" size={20} />
            ) : (
              <CloudOff className="text-zinc-400 dark:text-zinc-500" size={20} />
            )}
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {fileHandle ? `Connected: ${fileHandle.name}` : 'Not Connected'}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {fileHandle ? 'Auto-syncing changes to file.' : 'Select a JSON file to start syncing.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {fileHandle && (
              <button
                onClick={() => forceSync()}
                className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors whitespace-nowrap"
              >
                Force Sync Now
              </button>
            )}
            <button
              onClick={handleSelectSyncFile}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors whitespace-nowrap"
            >
              {fileHandle ? 'Change File' : 'Select File'}
            </button>
          </div>
        </div>
      </div>

      {/* Completed Packages Archive */}
      <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Cloud size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Completed Packages Archive</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Link a secondary JSON file to automatically archive "Bond & Released" packages every 24 hours.</p>
          </div>
        </div>

        {archiveError && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3 text-amber-800 dark:text-amber-400">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">{archiveError}</p>
              {archiveError.includes('Permission required') && (
                <button 
                  onClick={handleGrantArchivePermission}
                  className="mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                >
                  Grant Permission
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg">
          <div className="flex items-center gap-3">
            {archiveFileHandle ? (
              <Cloud className="text-emerald-500 dark:text-emerald-400" size={20} />
            ) : (
              <CloudOff className="text-zinc-400 dark:text-zinc-500" size={20} />
            )}
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {archiveFileHandle ? `Connected: ${archiveFileHandle.name}` : 'Not Connected'}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {archiveFileHandle ? 'Auto-archiving every 24 hours.' : 'Select a JSON file to start archiving.'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {archiveFileHandle && (
              <button
                onClick={() => triggerArchive(true)}
                className="px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
              >
                Archive Now
              </button>
            )}
            <button
              onClick={handleSelectArchiveFile}
              className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              {archiveFileHandle ? 'Change File' : 'Select File'}
            </button>
          </div>
        </div>
      </div>

      {/* App Updates */}
      <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg">
            <Github size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">App Updates</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Check for the latest version of Logistics Status Tracker.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Current Version: <span className="font-mono bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded text-xs ml-1">{APP_VERSION}</span>
            </p>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
              Latest Version: 
              {checkingUpdate ? (
                <span className="text-zinc-500 italic text-xs">Checking...</span>
              ) : updateAvailable ? (
                <span className="font-mono px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  {updateAvailable}
                </span>
              ) : (
                <span className="font-mono px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {APP_VERSION}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleManualCheckUpdate}
              disabled={checkingUpdate}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors disabled:opacity-50"
            >
              Check for Updates
            </button>
            {updateAvailable && (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                Update Available
              </span>
            )}
            <a
              href="https://github.com/solah422/Logistics-Status-Tracker/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-white/90 transition-colors flex items-center gap-2"
            >
              <Github size={16} />
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};
