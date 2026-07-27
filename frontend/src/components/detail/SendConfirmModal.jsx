import React from 'react';

export default function SendConfirmModal({ isOpen, onClose, onConfirm, recipient, draftText }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" id="send-modal">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm" 
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div className="bg-white rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.12)] border border-secondary-fixed w-[90%] max-w-md relative z-10 animate-modal-in">
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
          </div>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface mb-2">Confirm Send</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-4">
            Send this reply to <span className="font-bold text-on-surface">{recipient || 'the sender'}</span>?
          </p>
          <div className="bg-surface-container rounded-lg p-3 border border-secondary-fixed mb-6 max-h-32 overflow-y-auto">
            <p className="font-body-sm text-body-sm text-secondary italic whitespace-pre-wrap">
              "{draftText}"
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={onClose}
              className="px-5 py-2 rounded-lg border border-secondary-fixed hover:bg-surface-variant font-label-md text-label-md text-on-surface transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              className="px-5 py-2 rounded-lg bg-primary-container hover:bg-primary text-white font-label-md text-label-md transition-colors shadow-md"
            >
              Confirm & Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
