import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import OriginalEmailCard from '../components/detail/OriginalEmailCard';
import AIDraftCard from '../components/detail/AIDraftCard';
import QualityScoresPanel from '../components/detail/QualityScoresPanel';
import SendConfirmModal from '../components/detail/SendConfirmModal';
import BottomActionBar from '../components/detail/BottomActionBar';
import ErrorBanner from '../components/inbox/ErrorBanner';

export default function EmailDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [emailDetails, setEmailDetails] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [scores, setScores] = useState([]);
  const [overallScore, setOverallScore] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // In a real app we would have GET /emails/{id} but since it's not specified,
    // we assume we can GET /emails and filter or the backend provides it.
    // For now, let's fetch emails and get the one with this id,
    // and also fetch the draft and scores.
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [emailsData, scoresData] = await Promise.all([
          api.getEmails(),
          api.getScores(id)
        ]);
        
        const emailsList = Array.isArray(emailsData) ? emailsData : (emailsData.emails || []);
        const currentEmail = emailsList.find(e => e.id.toString() === id);
        
        if (currentEmail) {
          setEmailDetails(currentEmail);
          setDrafts(currentEmail.drafts || [{ text: currentEmail.aiSummary || 'Draft text...', note: 'v1' }]);
        } else {
          setError('Email not found.');
        }

        if (scoresData) {
          setScores(scoresData.details || [
            { name: 'Relevance', value: 95 },
            { name: 'Tone', value: 90 },
            { name: 'Completeness', value: 92 },
            { name: 'Accuracy', value: 88 },
            { name: 'Conciseness', value: 95 }
          ]);
          setOverallScore(scoresData.overall || 92);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load email details.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleRegenerate = async (customInstructions) => {
    setIsRegenerating(true);
    try {
      const response = await api.regenerateDraft(id, customInstructions);
      setDrafts(prev => [...prev, { text: response.text || 'New drafted text...', note: customInstructions ? `Custom: ${customInstructions}` : `v${prev.length + 1}` }]);
    } catch (err) {
      console.error(err);
      setError('Failed to regenerate draft.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleApproveAndSend = async () => {
    try {
      await api.approveEmail(id, 'send');
      setIsModalOpen(false);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Failed to send email.');
      setIsModalOpen(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      await api.approveEmail(id, 'draft');
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Failed to save draft.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop flex items-center justify-center">
        <div className="animate-spin text-primary">
          <span className="material-symbols-outlined text-4xl">progress_activity</span>
        </div>
      </div>
    );
  }

  if (!emailDetails) {
    return (
      <div className="flex-1 p-margin-desktop">
        <ErrorBanner message={error || 'Email not found.'} />
      </div>
    );
  }

  const currentDraftText = drafts.length > 0 ? drafts[drafts.length - 1].text : '';

  return (
    <div className="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop relative">
      <div className="max-w-[1200px] mx-auto w-full space-y-6 pb-24">
        
        <ErrorBanner message={error} onClose={() => setError(null)} />

        {/* Email Detail Header */}
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
              {emailDetails.subject || 'Subject'}
            </h1>
            {emailDetails.priority === 'High' && (
              <span className="bg-error/10 text-error px-2.5 py-1 rounded-full font-label-sm text-label-sm uppercase tracking-wider">
                High Priority
              </span>
            )}
            {emailDetails.needsReply && (
              <span className="bg-tertiary-container/10 text-tertiary px-2.5 py-1 rounded-full font-label-sm text-label-sm uppercase tracking-wider">
                Needs Reply
              </span>
            )}
          </div>
        </div>

        {/* Two Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter items-start">
          <OriginalEmailCard 
            senderName={emailDetails.senderName}
            senderEmail={emailDetails.senderEmail}
            date={emailDetails.date}
            content={emailDetails.content || 'No content provided.'}
            attachments={emailDetails.attachments || []}
          />
          <AIDraftCard 
            drafts={drafts} 
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
          />
        </div>

        {/* Quality Scores Panel */}
        <QualityScoresPanel scores={scores} overallScore={overallScore} />
      </div>

      <BottomActionBar 
        onSaveDraft={handleSaveDraft}
        onApproveAndSend={() => setIsModalOpen(true)}
      />

      <SendConfirmModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleApproveAndSend}
        recipient={`${emailDetails.senderName} <${emailDetails.senderEmail}>`}
        draftText={currentDraftText}
      />
    </div>
  );
}
