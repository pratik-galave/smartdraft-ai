import React from 'react';

export default function BulkActionsBar({ selectedCount, onApprove, onArchive }) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3">
      <input 
        type="checkbox" 
        className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4" 
        checked={true} 
        readOnly 
      />
      <span className="font-label-sm text-label-sm text-primary font-semibold bg-primary/10 px-2 py-1 rounded">
        {selectedCount} Selected
      </span>
      <div className="h-4 w-px bg-outline-variant mx-1"></div>
      
      <button 
        onClick={onApprove}
        className="text-on-surface-variant hover:text-primary transition-colors font-label-sm text-label-sm flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-sm">done_all</span>
        Approve Selected
      </button>
      
      <button 
        onClick={onArchive}
        className="text-on-surface-variant hover:text-error transition-colors font-label-sm text-label-sm flex items-center gap-1 ml-2"
      >
        <span className="material-symbols-outlined text-sm">archive</span>
        Archive Selected
      </button>
    </div>
  );
}
