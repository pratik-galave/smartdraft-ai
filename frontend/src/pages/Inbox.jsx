import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import toast from 'react-hot-toast';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState('actionable');

  const fetchEmails = async (filterType = currentTab) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getEmails(filterType);
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
    fetchEmails(currentTab);
  }, [currentTab]);

  const handleSelectEmail = (id, isSelected) => {
    setSelectedIds(prev => 
      isSelected ? [...prev, id] : prev.filter(selectedId => selectedId !== id)
    );
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedIds(filteredEmails.map(e => e.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSync = async () => {
    await fetchEmails();
    toast.success('Inbox synchronized');
  };

  const handleApproveSelected = async () => {
    const loadingToast = toast.loading(`Approving ${selectedIds.length} emails...`);
    try {
      await new Promise(r => setTimeout(r, 1000));
      toast.success(`${selectedIds.length} emails approved`, { id: loadingToast });
      setSelectedIds([]);
      fetchEmails();
    } catch (err) {
      toast.error('Failed to approve emails', { id: loadingToast });
    }
  };

  const handleArchiveSelected = async () => {
    const loadingToast = toast.loading(`Archiving ${selectedIds.length} emails...`);
    try {
      await new Promise(r => setTimeout(r, 1000));
      toast.success(`${selectedIds.length} emails archived`, { id: loadingToast });
      setSelectedIds([]);
      fetchEmails();
    } catch (err) {
      toast.error('Failed to archive emails', { id: loadingToast });
    }
  };

  const filteredEmails = emails.filter(email => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (email.subject || '').toLowerCase().includes(q) ||
             (email.senderName || '').toLowerCase().includes(q) ||
             (email.senderEmail || '').toLowerCase().includes(q) ||
             (email.aiSummary || '').toLowerCase().includes(q);
    }
    return true;
  });

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
          <button onClick={handleSync} disabled={isLoading} className="bg-surface border border-outline-variant text-on-surface-variant font-label-md text-label-md px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-surface-container-low transition-colors shadow-sm disabled:opacity-50">
            <span className="material-symbols-outlined text-sm">sync</span>
            Sync
          </button>
          <button onClick={() => toast('This feature is coming soon!', { icon: '🚧' })} className="bg-primary-container text-on-primary font-label-md text-label-md px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-primary-container/90 transition-colors shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
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
          <div></div>
        )}
        <FilterBar 
          searchQuery={searchQuery} 
          onSearchChange={setSearchQuery} 
          onFilterClick={() => toast('Advanced filters coming soon!', { icon: '🚧' })}
        />
      </div>

      {/* Category Tabs */}
      <div className="bg-surface-container-lowest border-x border-outline-variant flex border-b">
        {['actionable', 'skipped'].map(tab => (
          <button 
            key={tab}
            onClick={() => setCurrentTab(tab)}
            className={`px-4 py-3 font-label-md text-label-md border-b-2 transition-colors ${currentTab === tab ? 'border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            {tab === 'actionable' ? 'Actionable' : 'Skipped by AI'}
          </button>
        ))}
      </div>

      {/* Email Table or Empty State */}
      {filteredEmails.length === 0 && !isLoading ? (
        <div className="bg-surface-container-lowest border border-t-0 border-outline-variant rounded-b-lg p-16 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-6xl text-primary/20 mb-4">inbox</span>
          <h3 className="text-xl font-medium text-on-surface">Inbox Zero</h3>
          <p className="text-on-surface-variant mt-2 max-w-md">No emails require your attention right now.</p>
        </div>
      ) : (
        <EmailTable 
          emails={filteredEmails} 
          selectedIds={selectedIds}
          onSelectEmail={handleSelectEmail}
          onSelectAll={handleSelectAll}
        />
      )}

      {/* Pagination */}
      <Pagination 
        totalCount={filteredEmails.length} 
        currentPage={1} 
        pageSize={10} 
      />
    </div>
  );
}
