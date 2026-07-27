import React, { useState } from 'react';

export default function QualityScoresPanel({ scores, overallScore }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-secondary-fixed shadow-[0_4px_12px_rgba(0,0,0,0.04)] p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-label-md text-label-md text-on-surface-variant font-bold tracking-widest uppercase">
          Quality Scores - {overallScore}/100
        </h3>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-secondary hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {scores.map((scoreItem, idx) => (
          <div key={idx} className="flex flex-col gap-2 relative group cursor-pointer" onClick={() => setExpanded(!expanded)}>
            <div className="flex justify-between font-label-sm text-label-sm">
              <span className="text-on-surface">{scoreItem.name}</span>
              <span className="text-primary font-bold">{scoreItem.value}%</span>
            </div>
            <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${scoreItem.value}%` }}></div>
            </div>
            {/* Expandable Justification */}
            {expanded && (
              <div className="mt-2 text-xs text-on-surface-variant bg-surface-container-low p-2 rounded border border-outline-variant/30 animate-modal-in">
                {scoreItem.justification || 'Score is well within the acceptable range for this criterion.'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
