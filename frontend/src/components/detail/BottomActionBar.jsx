import React from 'react';

export default function BottomActionBar({ onSaveDraft, onApproveAndSend, onDiscard, isSubmitting }) {
  return (
    <div className="fixed bottom-0 left-0 md:left-[280px] right-0 bg-white/90 backdrop-blur-md border-t border-outline-variant p-4 flex justify-between items-center z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex gap-4">
        <button 
          onClick={onDiscard}
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-lg border border-transparent text-error hover:bg-error/10 font-label-md text-label-md transition-colors disabled:opacity-50"
        >
          Discard
        </button>
      </div>
      <div className="flex gap-4">
        <button 
          onClick={onSaveDraft}
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-lg border border-secondary-fixed bg-transparent hover:bg-surface-variant font-label-md text-label-md text-on-surface transition-colors disabled:opacity-50"
        >
          Save as Draft
        </button>
        <button 
          onClick={onApproveAndSend}
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-lg bg-primary-container hover:bg-primary text-white font-label-md text-label-md transition-colors shadow-[0_4px_12px_rgba(37,99,235,0.2)] flex items-center gap-2 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
          Approve & Send
        </button>
      </div>
    </div>
  );
}
