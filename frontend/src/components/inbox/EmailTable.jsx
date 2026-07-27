import React from 'react';
import EmailRow from './EmailRow';

export default function EmailTable({ emails, selectedIds, onSelectEmail, onSelectAll }) {
  const isAllSelected = emails.length > 0 && selectedIds.length === emails.length;

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-b-lg overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.04)] border-t-0">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface border-b border-outline-variant">
            <th className="p-4 w-12 text-center">
              <input 
                type="checkbox" 
                className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4" 
                checked={isAllSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
              />
            </th>
            <th className="p-4 font-label-sm text-label-sm text-on-surface-variant font-semibold">Sender</th>
            <th className="p-4 font-label-sm text-label-sm text-on-surface-variant font-semibold">Subject & AI Summary</th>
            <th className="p-4 font-label-sm text-label-sm text-on-surface-variant font-semibold w-48">AI Status & Tags</th>
            <th className="p-4 font-label-sm text-label-sm text-on-surface-variant font-semibold w-24 text-right">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {emails.map((email) => (
            <EmailRow 
              key={email.id} 
              email={email} 
              isSelected={selectedIds.includes(email.id)}
              onSelect={onSelectEmail}
            />
          ))}
          {emails.length === 0 && (
            <tr>
              <td colSpan="5" className="p-8 text-center text-on-surface-variant font-body-sm text-body-sm">
                No emails found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
