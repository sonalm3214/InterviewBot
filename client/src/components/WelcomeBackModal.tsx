import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/store/store';
import { setShowWelcomeBack, clearCurrentCandidate } from '@/store/interviewSlice';

interface WelcomeBackModalProps {
  onContinue: () => void;
  onStartFresh: () => void;
}

export default function WelcomeBackModal({ onContinue, onStartFresh }: WelcomeBackModalProps) {
  const dispatch = useDispatch();
  const showWelcomeBack = useSelector((state: RootState) => state.interview.showWelcomeBack);
  const currentCandidate = useSelector((state: RootState) => state.interview.currentCandidate);

  const handleContinue = () => {
    dispatch(setShowWelcomeBack(false));
    onContinue();
  };

  const handleStartFresh = () => {
    dispatch(setShowWelcomeBack(false));
    dispatch(clearCurrentCandidate());
    onStartFresh();
  };

  if (!showWelcomeBack || !currentCandidate) {
    return null;
  }

  const isInProgress = ['interviewing', 'info_collection', 'paused'].includes(currentCandidate.status);

  return (
    <Dialog open={showWelcomeBack} onOpenChange={() => dispatch(setShowWelcomeBack(false))}>
      <DialogContent className="max-w-md" data-testid="welcome-back-modal">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="text-primary text-2xl" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Welcome Back!</h2>
          <p className="text-muted-foreground mb-6">
            {isInProgress 
              ? "You have an incomplete interview session. Would you like to continue where you left off?"
              : "You have a previous session. Would you like to start a new interview?"
            }
          </p>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleStartFresh}
              data-testid="button-start-fresh"
            >
              Start Fresh
            </Button>
            <Button 
              className="flex-1"
              onClick={handleContinue}
              data-testid="button-continue"
            >
              {isInProgress ? 'Continue Interview' : 'View Previous'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
