import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, FileText, Tag, X } from 'lucide-react';
import { usePackages } from '../store/PackageContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPackage: (id: string) => void;
}

export const CommandPalette = ({ isOpen, onClose, onSelectPackage }: CommandPaletteProps) => {
  const { packages } = usePackages();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  const filteredPackages = query.trim() === '' ? [] : packages.filter(p => {
    const searchLower = query.toLowerCase();
    return (
      p.trackingNumber.toLowerCase().includes(searchLower) ||
      p.rNumberIdNumber?.toLowerCase().includes(searchLower) ||
      p.notes?.toLowerCase().includes(searchLower) ||
      Object.values(p.customFields || {}).some(val => 
        String(val).toLowerCase().includes(searchLower)
      )
    );
  }).slice(0, 10); // Limit to 10 results

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredPackages.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + Math.max(1, filteredPackages.length)) % Math.max(1, filteredPackages.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredPackages[selectedIndex]) {
          onSelectPackage(filteredPackages[selectedIndex].id);
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredPackages, selectedIndex, onClose, onSelectPackage]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[20vh] px-4">
      <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <Search className="text-zinc-400 shrink-0" size={20} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none px-3 py-1 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400"
            placeholder="Search tracking numbers, notes, custom fields..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1">
            <X size={20} />
          </button>
        </div>

        {query.trim() !== '' && (
          <div className="overflow-y-auto p-2">
            {filteredPackages.length === 0 ? (
              <div className="py-14 text-center text-zinc-500 dark:text-zinc-400">
                No results found for "{query}"
              </div>
            ) : (
              <div className="space-y-1">
                {filteredPackages.map((pkg, index) => (
                  <button
                    key={pkg.id}
                    onClick={() => {
                      onSelectPackage(pkg.id);
                      onClose();
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-start gap-3 transition-colors ${
                      index === selectedIndex 
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-100' 
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className={`p-2 rounded-md shrink-0 ${
                      index === selectedIndex 
                        ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' 
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                    }`}>
                      <Package size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">{pkg.trackingNumber}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 shrink-0">
                          {pkg.status}
                        </span>
                      </div>
                      <div className="text-sm opacity-70 truncate mt-0.5">
                        {pkg.rNumberIdNumber && <span className="mr-3">R#: {pkg.rNumberIdNumber}</span>}
                        {pkg.notes && <span>{pkg.notes}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-4">
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-zinc-600 dark:text-zinc-300 font-sans">↑</kbd> <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-zinc-600 dark:text-zinc-300 font-sans">↓</kbd> to navigate</span>
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-zinc-600 dark:text-zinc-300 font-sans">Enter</kbd> to select</span>
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-zinc-600 dark:text-zinc-300 font-sans">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
};
