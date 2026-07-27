import React from 'react';

export default function Pagination({ totalCount, currentPage, pageSize }) {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="bg-surface border-t border-outline-variant p-4 flex justify-between items-center">
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Showing {totalCount > 0 ? start : 0}-{end} of {totalCount} emails
      </p>
      <div className="flex items-center gap-2">
        <button 
          className="p-1 rounded text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50" 
          disabled={currentPage === 1}
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
        </button>
        <button 
          className="p-1 rounded text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
          disabled={end >= totalCount}
        >
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
