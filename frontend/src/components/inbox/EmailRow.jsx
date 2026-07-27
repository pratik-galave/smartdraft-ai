import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function EmailRow({ email, isSelected, onSelect }) {
  const navigate = useNavigate();

  const handleRowClick = (e) => {
    // If they clicked the checkbox, ignore row click navigation
    if (e.target.type === 'checkbox') return;
    navigate(`/email/${email.id}`);
  };

  return (
    <tr 
      onClick={handleRowClick}
      className={`hover:bg-surface-container-low transition-colors cursor-pointer ${email.status === 'Generated' ? 'bg-primary/5' : ''}`}
    >
      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
        <input 
          type="checkbox" 
          className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4" 
          checked={isSelected}
          onChange={(e) => onSelect(email.id, e.target.checked)}
        />
      </td>
      <td className="p-4 align-top">
        <div className="font-label-md text-label-md text-on-surface font-semibold">{email.senderName || 'Sender'}</div>
        <div className="font-body-sm text-body-sm text-on-surface-variant">{email.senderEmail || 'email@example.com'}</div>
      </td>
      <td className="p-4 align-top">
        <div className="font-label-md text-label-md text-on-surface font-bold">{email.subject}</div>
        <div className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">
          {email.aiSummary || 'No summary available.'}
        </div>
      </td>
      <td className="p-4 align-top">
        <div className="flex flex-col gap-2 items-start">
          {email.status === 'Generated' && (
            <div className="bg-primary/10 text-primary-fixed-variant px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold border border-primary/20">
              Generated
            </div>
          )}
          {email.status === 'Pending' && (
            <div className="bg-yellow-500/10 text-yellow-700 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold border border-yellow-500/20">
              Pending
            </div>
          )}
          {email.status === 'Processed' && (
            <div className="bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold border border-outline-variant/30">
              Processed
            </div>
          )}

          {email.needsReply && (
            <div className="bg-secondary-fixed/50 text-on-surface px-2 py-0.5 rounded-full font-label-sm text-[11px]">
              Needs Reply
            </div>
          )}
          {email.tone && (
            <div className="bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded-full font-label-sm text-[10px]">
              {email.tone}
            </div>
          )}
        </div>
      </td>
      <td className="p-4 align-top text-right font-body-sm text-body-sm text-on-surface-variant whitespace-nowrap">
        {email.date || '10:42 AM'}
      </td>
    </tr>
  );
}
