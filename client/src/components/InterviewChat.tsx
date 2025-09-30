import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Send, Pause, Play, Bot, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { RootState } from '@/store/store';
import { setCurrentCandidate, updateTimer, pauseTimer, resumeTimer, stopTimer, updateLastActivity } from '@/store/interviewSlice';
import Timer from './Timer';

interface InterviewChatProps {
  candidateId: string;
}

export default function InterviewChat({ candidateId }: InterviewChatProps) {
  const dispatch = useDispatch();
  const { currentCandidate, timerState } = useSelector((state: RootState) => state.interview);
  const [answer, setAnswer] = useState('');
  const [missingInfo, setMissingInfo] = useState<{ [key: string]: string }>({});
  const [isPaused, setIsPaused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch candidate data
  const { data: candidate, isLoading } = useQuery({
    queryKey: ['/api/candidates', candidateId],
    enabled: !!candidateId,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  // Update Redux state when candidate data changes
  useEffect(() => {
    if (candidate) {
      dispatch(setCurrentCandidate(candidate));
    }
  }, [candidate, dispatch]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [candidate?.messages]);

  // Timer management
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerState.isRunning && timerState.timeLeft > 0 && !isPaused) {
      interval = setInterval(() => {
        dispatch(updateTimer(timerState.timeLeft - 1));
        
        if (timerState.timeLeft <= 1) {
          // Auto-submit when timer expires
          handleAutoSubmit();
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.timeLeft, isPaused, dispatch]);

  const submitAnswerMutation = useMutation({
    mutationFn: async (data: { questionId: string; answerText: string; timeSpent: number }) => {
      const response = await apiRequest('POST', `/api/candidates/${candidateId}/answers`, data);
      return response.json();
    },
    onSuccess: (data) => {
      dispatch(setCurrentCandidate(data));
      setAnswer('');
      dispatch(updateLastActivity());
      queryClient.invalidateQueries({ queryKey: ['/api/candidates', candidateId] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit answer",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateInfoMutation = useMutation({
    mutationFn: async (info: { name?: string; email?: string; phone?: string }) => {
      const response = await apiRequest('PATCH', `/api/candidates/${candidateId}/info`, info);
      return response.json();
    },
    onSuccess: (data) => {
      dispatch(setCurrentCandidate(data));
      setMissingInfo({});
      dispatch(updateLastActivity());
      queryClient.invalidateQueries({ queryKey: ['/api/candidates', candidateId] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update information",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const pauseResumeMutation = useMutation({
    mutationFn: async (action: 'pause' | 'resume') => {
      const response = await apiRequest('PATCH', `/api/candidates/${candidateId}/pause`, { action });
      return response.json();
    },
    onSuccess: (data) => {
      setIsPaused(data.status === 'paused');
      if (data.status === 'paused') {
        dispatch(pauseTimer());
      } else {
        dispatch(resumeTimer());
      }
      dispatch(updateLastActivity());
      queryClient.invalidateQueries({ queryKey: ['/api/candidates', candidateId] });
    },
  });

  const handleSubmitAnswer = () => {
    if (!answer.trim() || !currentCandidate?.currentQuestion) return;

    const timeSpent = currentCandidate.currentQuestion.timeLimit - timerState.timeLeft;
    
    submitAnswerMutation.mutate({
      questionId: currentCandidate.currentQuestion.id,
      answerText: answer.trim(),
      timeSpent,
    });

    dispatch(stopTimer());
  };

  const handleAutoSubmit = () => {
    if (currentCandidate?.currentQuestion) {
      const timeSpent = currentCandidate.currentQuestion.timeLimit;
      
      submitAnswerMutation.mutate({
        questionId: currentCandidate.currentQuestion.id,
        answerText: answer.trim() || "No answer provided (time expired)",
        timeSpent,
      });

      dispatch(stopTimer());
      setAnswer('');
      
      toast({
        title: "Time's up!",
        description: "Your answer has been automatically submitted.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitInfo = () => {
    if (Object.keys(missingInfo).length === 0) return;
    updateInfoMutation.mutate(missingInfo);
  };

  const handlePauseResume = () => {
    pauseResumeMutation.mutate(isPaused ? 'resume' : 'pause');
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading interview...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-muted-foreground">Candidate not found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Information collection phase
  if (candidate.status === 'info_collection') {
    const lastMessage = candidate.messages[candidate.messages.length - 1];
    const missingFields = lastMessage?.metadata?.missingFields || [];

    return (
      <div className="max-w-2xl mx-auto" data-testid="info-collection-section">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">AI Assistant</h3>
                <p className="text-sm text-muted-foreground">Collecting missing information</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-accent/50 rounded-lg p-4">
                <p className="text-sm">{lastMessage?.message}</p>
              </div>
              
              <div className="space-y-3">
                {missingFields.includes('name') && (
                  <Input
                    placeholder="Enter your full name"
                    value={missingInfo.name || ''}
                    onChange={(e) => setMissingInfo(prev => ({ ...prev, name: e.target.value }))}
                    data-testid="input-name"
                  />
                )}
                {missingFields.includes('email') && (
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={missingInfo.email || ''}
                    onChange={(e) => setMissingInfo(prev => ({ ...prev, email: e.target.value }))}
                    data-testid="input-email"
                  />
                )}
                {missingFields.includes('phone') && (
                  <Input
                    type="tel"
                    placeholder="Enter your phone number"
                    value={missingInfo.phone || ''}
                    onChange={(e) => setMissingInfo(prev => ({ ...prev, phone: e.target.value }))}
                    data-testid="input-phone"
                  />
                )}
                
                <Button 
                  onClick={handleSubmitInfo}
                  disabled={updateInfoMutation.isPending || Object.keys(missingInfo).length === 0}
                  className="w-full"
                  data-testid="button-submit-info"
                >
                  {updateInfoMutation.isPending ? 'Submitting...' : 'Continue'}
                  <Send className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Interview progress calculation
  const progressPercentage = (candidate.completedQuestions / candidate.totalQuestions) * 100;
  const difficultyProgress = {
    easy: Math.min(2, candidate.completedQuestions),
    medium: Math.max(0, Math.min(2, candidate.completedQuestions - 2)),
    hard: Math.max(0, candidate.completedQuestions - 4),
  };

  return (
    <div className="max-w-4xl mx-auto" data-testid="interview-chat-section">
      {/* Progress Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Interview Progress</h3>
            <span className="text-sm text-muted-foreground" data-testid="text-progress">
              Question {candidate.completedQuestions + 1} of {candidate.totalQuestions}
            </span>
          </div>
          <Progress value={progressPercentage} className="mb-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Easy ({difficultyProgress.easy}/2)</span>
            <span>Medium ({difficultyProgress.medium}/2)</span>
            <span>Hard ({difficultyProgress.hard}/2)</span>
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="overflow-hidden">
        {/* Chat Header */}
        <CardHeader className="bg-accent/50 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">AI Interviewer</h3>
                <p className="text-sm text-muted-foreground">Full Stack Developer Assessment</p>
              </div>
            </div>
            
            {/* Timer */}
            {candidate.status === 'interviewing' && candidate.currentQuestion && (
              <Timer
                timeLeft={timerState.timeLeft}
                timeLimit={candidate.currentQuestion.timeLimit}
                difficulty={candidate.currentQuestion.difficulty}
                isRunning={timerState.isRunning && !isPaused}
              />
            )}
          </div>
        </CardHeader>

        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto p-6 space-y-4" data-testid="chat-messages">
          {candidate.messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 message-animation ${
                message.sender === 'candidate' ? 'justify-end' : ''
              }`}
            >
              {message.sender === 'ai' && (
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-accent-foreground" />
                </div>
              )}
              
              <div className={`flex-1 max-w-3xl ${message.sender === 'candidate' ? 'ml-auto' : ''}`}>
                <div
                  className={`rounded-lg p-4 ${
                    message.sender === 'ai'
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  <p className="text-sm font-medium mb-1">
                    {message.sender === 'ai' ? 'AI Interviewer' : 'You'}
                  </p>
                  <p>{message.message}</p>
                </div>
                <div className={`text-xs text-muted-foreground mt-1 ${
                  message.sender === 'candidate' ? 'text-right' : ''
                }`}>
                  {message.messageType === 'question' && message.metadata && (
                    <>
                      {message.metadata.difficulty} Question • {message.metadata.timeLimit} seconds
                    </>
                  )}
                  {message.messageType === 'answer' && message.metadata && (
                    <>
                      Submitted • Score: {message.metadata.score}/10
                    </>
                  )}
                  {message.messageType === 'text' && (
                    <>
                      {new Date(message.createdAt!).toLocaleTimeString()}
                    </>
                  )}
                </div>
              </div>

              {message.sender === 'candidate' && (
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        {candidate.status === 'interviewing' && candidate.currentQuestion && (
          <div className="border-t border-border p-4">
            <div className="flex gap-3">
              <Textarea
                placeholder="Type your answer here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="flex-1 resize-none"
                rows={3}
                disabled={isPaused || timerState.timeLeft <= 0}
                data-testid="textarea-answer"
              />
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!answer.trim() || submitAnswerMutation.isPending || isPaused || timerState.timeLeft <= 0}
                  data-testid="button-submit-answer"
                >
                  <Send className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePauseResume}
                  disabled={pauseResumeMutation.isPending}
                  title={isPaused ? "Resume Interview" : "Pause Interview"}
                  data-testid="button-pause-resume"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Interview Completed */}
        {candidate.status === 'completed' && (
          <div className="border-t border-border p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Interview Completed!</h3>
            <p className="text-muted-foreground mb-4">
              Thank you for your time. Your final score: {candidate.score}/10
            </p>
            {candidate.summary && (
              <div className="bg-accent/50 rounded-lg p-4 text-left">
                <p className="text-sm">{candidate.summary}</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
