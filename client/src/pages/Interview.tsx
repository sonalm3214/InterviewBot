import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Brain, GraduationCap, Bus } from 'lucide-react';
import type { RootState } from '@/store/store';
import { setActiveTab, setShowWelcomeBack, setCurrentCandidate } from '@/store/interviewSlice';
import ResumeUpload from '@/components/ResumeUpload';
import InterviewChat from '@/components/InterviewChat';
import InterviewerDashboard from '@/components/InterviewerDashboard';
import WelcomeBackModal from '@/components/WelcomeBackModal';

export default function Interview() {
  const dispatch = useDispatch();
  const { activeTab, currentCandidate, lastActivity } = useSelector((state: RootState) => state.interview);
  const [candidateId, setCandidateId] = useState<string | null>(null);

  // Check for incomplete sessions on mount
  useEffect(() => {
    // Check if there's a recent session (within last 24 hours)
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    if (currentCandidate && lastActivity > oneDayAgo) {
      const isIncomplete = ['interviewing', 'info_collection', 'paused'].includes(currentCandidate.status);
      if (isIncomplete) {
        dispatch(setShowWelcomeBack(true));
      }
    }
  }, [currentCandidate, lastActivity, dispatch]);

  const handleUploadSuccess = (id: string) => {
    setCandidateId(id);
  };

  const handleContinueInterview = () => {
    if (currentCandidate) {
      setCandidateId(currentCandidate.id);
    }
  };

  const handleStartFresh = () => {
    setCandidateId(null);
  };

  const handleTabSwitch = (tab: 'interviewee' | 'interviewer') => {
    dispatch(setActiveTab(tab));
  };

  return (
    <div className="min-h-screen bg-background" data-testid="interview-page">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="text-primary-foreground text-sm" />
              </div>
              <h1 className="text-xl font-bold">AI Interview Assistant</h1>
            </div>
            <nav className="flex items-center gap-2">
              <Button
                variant={activeTab === 'interviewee' ? 'default' : 'ghost'}
                onClick={() => handleTabSwitch('interviewee')}
                data-testid="tab-interviewee"
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                Interviewee
              </Button>
              <Button
                variant={activeTab === 'interviewer' ? 'default' : 'ghost'}
                onClick={() => handleTabSwitch('interviewer')}
                data-testid="tab-interviewer"
              >
                <Bus className="w-4 h-4 mr-2" />
                Interviewer
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === 'interviewee' ? (
          <div data-testid="interviewee-view">
            {candidateId ? (
              <InterviewChat candidateId={candidateId} />
            ) : (
              <ResumeUpload onUploadSuccess={handleUploadSuccess} />
            )}
          </div>
        ) : (
          <div data-testid="interviewer-view">
            <InterviewerDashboard />
          </div>
        )}
      </main>

      {/* Welcome Back Modal */}
      <WelcomeBackModal
        onContinue={handleContinueInterview}
        onStartFresh={handleStartFresh}
      />
    </div>
  );
}
