import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import toast from 'react-hot-toast';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const emailsData = await api.getEmails();
        const emailsList = Array.isArray(emailsData) ? emailsData : (emailsData.emails || []);
        const currentEmail = emailsList.find(e => e.id.toString() === id);
        
        if (currentEmail) {
          const fromHeader = currentEmail.from || '';
          let senderName = fromHeader;
          let senderEmail = fromHeader;
          const emailMatch = fromHeader.match(/<([^>]+)>/);
          if (emailMatch) {
            senderEmail = emailMatch[1];
            senderName = fromHeader.replace(/<[^>]+>/, '').trim().replace(/"/g, '') || senderEmail;
          }
          currentEmail.senderName = senderName;
          currentEmail.senderEmail = senderEmail;
          currentEmail.date = currentEmail.date || 'Just now';
          currentEmail.content = currentEmail.body;
          setEmailDetails(currentEmail);
          
          if (currentEmail.generated_reply) {
            setDrafts([{ text: currentEmail.generated_reply, note: 'Initial AI Draft' }]);
          } else {
            setDrafts([]);
          }
          
          // Try to load scores if they exist
          try {
            const scoresData = await api.getScores(id);
            if (scoresData && scoresData.scores) {
              const mappedScores = [
                { name: 'Relevance', value: scoresData.scores.relevance * 20 },
                { name: 'Tone', value: scoresData.scores.tone * 20 },
                { name: 'Completeness', value: scoresData.scores.completeness * 20 },
                { name: 'Accuracy', value: scoresData.scores.accuracy * 20 },
                { name: 'Conciseness', value: scoresData.scores.conciseness * 20 }
              ];
              setScores(mappedScores);
              setOverallScore(scoresData.overall * 20);
            }
          } catch (scoreErr) {
            console.log('No previous scores found.');
          }
        } else {
          setError('Email not found.');
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

  const handleGenerate = async () => {
    setIsRegenerating(true);
    const loadingToast = toast.loading('Generating draft...');
    try {
      const response = await api.generateDraft(id);
      if (response.reply) {
        setDrafts(prev => [...prev, { text: response.reply, note: 'Initial AI Draft' }]);
      }
      if (response.scores) {
        const mappedScores = [
          { name: 'Relevance', value: response.scores.relevance * 20 },
          { name: 'Tone', value: response.scores.tone * 20 },
          { name: 'Completeness', value: response.scores.completeness * 20 },
          { name: 'Accuracy', value: response.scores.accuracy * 20 },
          { name: 'Conciseness', value: response.scores.conciseness * 20 }
        ];
        setScores(mappedScores);
        setOverallScore(
          (response.scores.relevance + response.scores.tone + response.scores.completeness + response.scores.accuracy + response.scores.conciseness) / 5 * 20
        );
      }
      toast.success('Draft generated', { id: loadingToast });
    } catch (err) {
      console.error(err);
      setError('Failed to generate draft.');
      toast.error('Failed to generate draft', { id: loadingToast });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRegenerate = async (customInstructions) => {
    if (!drafts.length) {
      return handleGenerate();
    }
    setIsRegenerating(true);
    const loadingToast = toast.loading('Regenerating draft...');
    try {
      const response = await api.regenerateDraft(id, customInstructions);
      if (response.reply) {
        setDrafts(prev => [...prev, { text: response.reply, note: customInstructions ? `Custom: ${customInstructions}` : `v${prev.length + 1}` }]);
      }
      if (response.scores) {
        const mappedScores = [
          { name: 'Relevance', value: response.scores.relevance * 20 },
          { name: 'Tone', value: response.scores.tone * 20 },
          { name: 'Completeness', value: response.scores.completeness * 20 },
          { name: 'Accuracy', value: response.scores.accuracy * 20 },
          { name: 'Conciseness', value: response.scores.conciseness * 20 }
        ];
        setScores(mappedScores);
        setOverallScore(
          (response.scores.relevance + response.scores.tone + response.scores.completeness + response.scores.accuracy + response.scores.conciseness) / 5 * 20
        );
      }
      toast.success('Draft regenerated', { id: loadingToast });
    } catch (err) {
      console.error(err);
      setError('Failed to regenerate draft.');
      toast.error('Failed to regenerate draft', { id: loadingToast });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDraftChange = (index, newText) => {
    setDrafts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], text: newText };
      return updated;
    });
  };

  const handleApproveAndSend = async () => {
    setIsSubmitting(true);
    const loadingToast = toast.loading('Sending email...');
    try {
      const currentDraftText = drafts.length > 0 ? drafts[drafts.length - 1].text : '';
      await api.approveEmail(id, 'send', currentDraftText);
      toast.success('Email sent successfully!', { id: loadingToast });
      setIsModalOpen(false);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Failed to send email.');
      toast.error('Failed to send email.', { id: loadingToast });
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    const loadingToast = toast.loading('Saving draft...');
    try {
      const currentDraftText = drafts.length > 0 ? drafts[drafts.length - 1].text : '';
      await api.approveEmail(id, 'draft', currentDraftText);
      toast.success('Draft saved successfully!', { id: loadingToast });
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Failed to save draft.');
      toast.error('Failed to save draft.', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    toast.success('Draft discarded');
    navigate('/');
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
            onDraftChange={handleDraftChange}
          />
        </div>

        {/* Quality Scores Panel */}
        <QualityScoresPanel scores={scores} overallScore={overallScore} />
      </div>

      <BottomActionBar 
        onSaveDraft={handleSaveDraft}
        onApproveAndSend={() => setIsModalOpen(true)}
        onDiscard={handleDiscard}
        isSubmitting={isSubmitting}
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
