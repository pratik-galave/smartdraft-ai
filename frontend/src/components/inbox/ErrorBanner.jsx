import React from 'react';

export default function ErrorBanner({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="bg-error-container text-on-error-container border border-error/20 rounded-lg p-4 mb-6 flex items-start gap-3 relative shadow-sm">
      <span className="material-symbols-outlined text-error">error</span>
      <div className="flex-1">
        <p className="font-body-sm text-body-sm font-medium">{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-on-error-container hover:text-error transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
      )}
    </div>
  );
}
