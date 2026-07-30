import React from 'react';

export default function FilterBar({ searchQuery, onSearchChange, onFilterClick }) {
  return (
    <div className="flex items-center gap-3 w-full lg:w-auto">
      <div className="relative w-full lg:w-64">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
        <input 
          className="w-full bg-surface border border-outline-variant rounded-md py-1.5 pl-9 pr-3 font-body-sm text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
          placeholder="Filter current view..." 
          type="text" 
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <button onClick={onFilterClick} className="bg-surface border border-outline-variant text-on-surface-variant font-label-sm text-label-sm px-3 py-1.5 rounded-md flex items-center gap-1 hover:bg-surface-container-low transition-colors">
        <span className="material-symbols-outlined text-sm">filter_list</span>
        Filter
      </button>
    </div>
  );
}
