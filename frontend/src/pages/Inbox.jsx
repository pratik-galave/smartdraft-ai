import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import ErrorBanner from '../components/inbox/ErrorBanner';
import BulkActionsBar from '../components/inbox/BulkActionsBar';
import FilterBar from '../components/inbox/FilterBar';
import EmailTable from '../components/inbox/EmailTable';
import Pagination from '../components/inbox/Pagination';

export default function Inbox() {
  const [emails, setEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchEmails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getEmails();
      const emailsList = Array.isArray(data) ? data : (data.emails || []);
      
      const mappedEmails = emailsList.map(email => {
        // Parse 'Name <email@example.com>' or just 'email@example.com'
        const fromHeader = email.from || '';
        let senderName = fromHeader;
        let senderEmail = fromHeader;
        const emailMatch = fromHeader.match(/<([^>]+)>/);
        if (emailMatch) {
          senderEmail = emailMatch[1];
          senderName = fromHeader.replace(/<[^>]+>/, '').trim().replace(/"/g, '') || senderEmail;
        }
        
        let status = 'Pending';
        if (email.reply_status === 'REPLIED') status = 'Generated';
        if (email.reply_status === 'SKIPPED') status = 'Skipped';

        return {
          id: email.id,
          subject: email.subject || 'No Subject',
          senderName: senderName,
          senderEmail: senderEmail,
          aiSummary: email.body ? email.body.substring(0, 100) + '...' : 'No content',
          status: status,
          needsReply: status !== 'Skipped',
          qualityScore: email.quality_score,
          date: 'Just now',
          originalData: email
        };
      });

      setEmails(mappedEmails);
    } catch (err) {
      console.error(err);
      setError('Sync Failed — Unable to fetch latest emails. Retrying in 30 seconds...');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleSelectEmail = (id, isSelected) => {
    setSelectedIds(prev => 
      isSelected ? [...prev, id] : prev.filter(selectedId => selectedId !== id)
    );
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedIds(emails.map(e => e.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleApproveSelected = () => {
    // In a real app we would call an API for each selected email
    console.log('Approve selected', selectedIds);
  };

  const handleArchiveSelected = () => {
    console.log('Archive selected', selectedIds);
  };

  return (
    <div className="flex-1 pt-[80px] px-margin-desktop pb-12 w-full max-w-[1200px] mx-auto">
      <ErrorBanner message={error} onClose={() => setError(null)} />
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Inbox</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Manage and review your AI-processed emails</p>
        </div>
        <div className="flex items-center gap-4">
          {isLoading && (
            <div className="bg-[#F0F7FF] border border-primary/20 text-primary-fixed-variant px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
              <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
              <span className="font-label-sm text-label-sm">Fetching latest...</span>
            </div>
          )}
          <button className="bg-primary-container text-on-primary font-label-md text-label-md px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-primary-container/90 transition-colors shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <span className="material-symbols-outlined text-sm">edit_square</span>
            Compose New
          </button>
        </div>
      </div>

      {/* Bulk Actions & Filters Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-t-lg p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {selectedIds.length > 0 ? (
          <BulkActionsBar 
            selectedCount={selectedIds.length} 
            onApprove={handleApproveSelected}
            onArchive={handleArchiveSelected}
          />
        ) : (
          <div></div> /* Empty div to push filters to the right if needed, or we can just leave it */
        )}
        <FilterBar />
      </div>

      {/* Active Filter Chips */}
      <div className="bg-surface-container-lowest border-x border-outline-variant p-3 flex gap-2 flex-wrap border-b">
        <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center h-full mr-2">Active Filters:</span>
        <div className="bg-secondary-fixed/50 border border-outline-variant/50 text-on-surface px-2 py-1 rounded-full flex items-center gap-1 font-label-sm text-[11px]">
          Status: Pending
          <button className="hover:text-error"><span className="material-symbols-outlined text-[12px]">close</span></button>
        </div>
        <div className="bg-secondary-fixed/50 border border-outline-variant/50 text-on-surface px-2 py-1 rounded-full flex items-center gap-1 font-label-sm text-[11px]">
          Reply Needed: Yes
          <button className="hover:text-error"><span className="material-symbols-outlined text-[12px]">close</span></button>
        </div>
      </div>

      {/* Email Table */}
      <EmailTable 
        emails={emails} 
        selectedIds={selectedIds}
        onSelectEmail={handleSelectEmail}
        onSelectAll={handleSelectAll}
      />

      {/* Pagination */}
      <Pagination 
        totalCount={emails.length} 
        currentPage={1} 
        pageSize={10} 
      />
    </div>
  );
}
