import React from 'react';

export default function OriginalEmailCard({ senderName, senderEmail, date, content, attachments = [] }) {
  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length > 1) return parts[0][0] + parts[1][0];
    return name[0];
  };

  return (
    <div className="bg-white rounded-xl border border-secondary-fixed shadow-[0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-secondary-fixed bg-surface-container-lowest">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-label-md font-bold">
              {getInitials(senderName)}
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface">{senderName} &lt;{senderEmail}&gt;</span>
              <span className="font-body-sm text-body-sm text-secondary">To: Me</span>
            </div>
          </div>
          <span className="font-body-sm text-body-sm text-secondary">{date}</span>
        </div>
      </div>
      <div className="p-6 font-body-md text-body-md text-on-surface whitespace-pre-line leading-relaxed flex-1">
        {content}
      </div>
      
      {attachments.length > 0 && (
        <div className="p-4 border-t border-secondary-fixed bg-surface-container-low flex flex-wrap gap-2">
          {attachments.map((att, idx) => (
            <div key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-secondary-fixed rounded-lg font-body-sm text-body-sm text-on-surface hover:bg-surface-variant transition-colors cursor-pointer shadow-sm">
              <span className="material-symbols-outlined text-error text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>
              {att.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
