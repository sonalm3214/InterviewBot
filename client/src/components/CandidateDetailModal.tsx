import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Download, Mail, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { Candidate, Question, Answer } from '@shared/schema';

interface CandidateDetailModalProps {
  candidate: Candidate;
  onClose: () => void;
}

export default function CandidateDetailModal({ candidate, onClose }: CandidateDetailModalProps) {
  // Fetch detailed candidate data including questions and answers
  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ['/api/candidates', candidate.id, 'questions'],
    enabled: !!candidate.id,
  });

  const { data: answers = [] } = useQuery<Answer[]>({
    queryKey: ['/api/candidates', candidate.id, 'answers'],
    enabled: !!candidate.id,
  });

  const getAvatarInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  const renderStars = (score: number) => {
    const fullStars = Math.floor(score / 2);
    const hasHalfStar = (score % 2) >= 1;
    
    return (
      <div className="flex justify-center mb-3">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i}
            className={`w-4 h-4 ${
              i < fullStars 
                ? 'text-yellow-400 fill-yellow-400' 
                : i === fullStars && hasHalfStar
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const formatDuration = (startTime?: Date, endTime?: Date) => {
    if (!startTime) return 'Not started';
    if (!endTime) return 'In progress';
    
    const duration = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60));
    return `${duration} minutes`;
  };

  const questionsWithAnswers = questions.map(question => {
    const answer = answers.find(a => a.questionId === question.id);
    return { question, answer };
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" data-testid="candidate-detail-modal">
        {/* Modal Header */}
        <DialogHeader className="flex flex-row items-center gap-3 space-y-0 pb-4 border-b">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(candidate.name)}`}>
            {getAvatarInitials(candidate.name)}
          </div>
          <div className="flex-1">
            <DialogTitle className="text-xl" data-testid="text-candidate-name">{candidate.name}</DialogTitle>
            <p className="text-muted-foreground" data-testid="text-candidate-email">{candidate.email}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-modal">
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        {/* Modal Content */}
        <div className="overflow-y-auto max-h-[70vh] space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Candidate Info */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Candidate Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span data-testid="text-info-email">{candidate.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span data-testid="text-info-phone">{candidate.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Started:</span>
                      <span data-testid="text-info-started">
                        {candidate.startedAt ? new Date(candidate.startedAt).toLocaleString() : 'Not started'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span data-testid="text-info-duration">
                        {formatDuration(candidate.startedAt, candidate.completedAt)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline" data-testid="badge-status">
                        {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {candidate.status === 'completed' && candidate.score && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3">Final Score</h4>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2" data-testid="text-final-score">
                        {candidate.score}/10
                      </div>
                      {renderStars(candidate.score)}
                      {candidate.summary && (
                        <p className="text-sm text-muted-foreground" data-testid="text-summary">
                          {candidate.summary}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Interview History */}
            <div className="lg:col-span-2">
              <h4 className="font-semibold mb-4">Interview History</h4>
              <div className="space-y-4">
                {questionsWithAnswers.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">No interview questions yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  questionsWithAnswers.map(({ question, answer }, index) => (
                    <Card key={question.id} data-testid={`question-card-${index}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-medium capitalize ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty} Question {index + 1}
                          </span>
                          {answer && (
                            <span className="text-sm text-muted-foreground" data-testid="text-question-score">
                              Score: {answer.score}/10
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm mb-3 text-muted-foreground" data-testid="text-question-text">
                          {question.questionText}
                        </p>
                        
                        {answer ? (
                          <>
                            <div className="bg-accent/30 rounded p-3 text-sm mb-2" data-testid="text-answer-text">
                              {answer.answerText}
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span data-testid="text-time-spent">
                                Answered in {answer.timeSpent}s
                              </span>
                              <span data-testid="text-time-limit">
                                Time limit: {question.timeLimit}s
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="bg-muted/50 rounded p-3 text-sm text-muted-foreground italic">
                            Not answered yet
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Download className="w-4 h-4" />
            <span>Export detailed report</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" data-testid="button-download-pdf">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button data-testid="button-send-results">
              <Mail className="w-4 h-4 mr-2" />
              Send Results
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
