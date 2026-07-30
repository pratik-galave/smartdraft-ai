import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function AIDraftCard({ drafts, onRegenerate, isRegenerating, onDraftChange }) {
  const [activeTab, setActiveTab] = useState(drafts.length - 1);
  const [customInstructions, setCustomInstructions] = useState('');
  
  // Safe fallback if drafts is empty
  const currentDraft = drafts[activeTab] || { text: '', note: '' };

  const handleRegenerate = () => {
    onRegenerate(customInstructions);
    setCustomInstructions('');
  };

  const handleCopy = () => {
    if (currentDraft.text) {
      navigator.clipboard.writeText(currentDraft.text);
      toast.success('Draft copied to clipboard!');
    }
  };

  return (
    <div className="bg-[#F0F7FF] rounded-xl border border-primary/20 shadow-[0_10px_25px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col h-full relative group">
      {/* Gradient border effect on focus/hover */}
      <div 
        className="absolute inset-0 border-2 border-transparent bg-gradient-to-br from-primary/30 to-tertiary-container/30 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
        style={{ WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude" }}
      ></div>
      
      <div className="p-4 border-b border-primary/10 flex justify-between items-center bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <span className="font-label-md text-label-md text-primary font-bold">AI Generated Draft</span>
        </div>
        <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">cloud_done</span>
          Draft Saved
        </span>
      </div>
      
      <div className="px-4 py-2 border-b border-primary/10 flex items-center justify-between bg-white/30">
        <div className="flex gap-1">
          {drafts.map((draft, idx) => (
            <button 
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`px-3 py-1 rounded-md font-label-sm text-label-sm transition-colors ${activeTab === idx ? 'bg-white shadow-sm text-primary font-bold border border-primary/20' : 'text-secondary hover:bg-white/50'}`}
            >
              v{idx + 1}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className="font-body-sm text-body-sm text-secondary italic">
            {currentDraft.note || `v${activeTab + 1}`}
          </span>
          <button 
            onClick={handleCopy}
            className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-1.5 rounded hover:bg-white"
            title="Copy draft"
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
          </button>
        </div>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        {isRegenerating ? (
          <div className="flex-1 flex items-center justify-center text-primary animate-pulse">
            <span className="material-symbols-outlined mr-2 animate-spin">progress_activity</span>
            Regenerating...
          </div>
        ) : (
          <textarea 
            className="w-full flex-1 bg-transparent border-none p-0 focus:ring-0 font-body-md text-body-md text-on-surface resize-none leading-relaxed" 
            placeholder="Type your reply here..."
            value={currentDraft.text}
            onChange={(e) => onDraftChange(activeTab, e.target.value)}
          />
        )}
      </div>
      
      <div className="p-4 bg-white/60 backdrop-blur-sm border-t border-primary/10">
        <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Custom Instructions</label>
        <div className="flex gap-2">
          <input 
            className="flex-1 bg-white border border-secondary-fixed rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm px-3 py-2" 
            placeholder="e.g., Make it more formal..." 
            type="text"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRegenerate()}
          />
          <button 
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="bg-surface-variant hover:bg-surface-dim text-on-surface px-3 py-2 rounded-lg transition-colors border border-secondary-fixed flex items-center justify-center shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}
