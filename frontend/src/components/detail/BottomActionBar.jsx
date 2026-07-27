import React from 'react';

export default function BottomActionBar({ onSaveDraft, onApproveAndSend }) {
  return (
    <div className="fixed bottom-0 left-0 md:left-[280px] right-0 bg-white/90 backdrop-blur-md border-t border-outline-variant p-4 flex justify-between items-center z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <button 
        onClick={onSaveDraft}
        className="px-6 py-2.5 rounded-lg border border-secondary-fixed bg-transparent hover:bg-surface-variant font-label-md text-label-md text-on-surface transition-colors"
      >
        Save as Draft
      </button>
      <button 
        onClick={onApproveAndSend}
        className="px-6 py-2.5 rounded-lg bg-primary-container hover:bg-primary text-white font-label-md text-label-md transition-colors shadow-[0_4px_12px_rgba(37,99,235,0.2)] flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-[18px]">send</span>
        Approve & Send
      </button>
    </div>
  );
}
