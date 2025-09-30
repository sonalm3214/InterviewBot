import { Clock } from 'lucide-react';

interface TimerProps {
  timeLeft: number;
  timeLimit: number;
  difficulty: string;
  isRunning: boolean;
}

export default function Timer({ timeLeft, timeLimit, difficulty, isRunning }: TimerProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const formatTime = (time: number) => time.toString().padStart(2, '0');
  
  const getTimerColor = () => {
    const percentage = (timeLeft / timeLimit) * 100;
    if (percentage > 50) return 'text-green-500';
    if (percentage > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="bg-card rounded-lg px-4 py-2 border border-border" data-testid="timer-component">
      <div className="flex items-center gap-2">
        <Clock 
          className={`w-4 h-4 ${getTimerColor()} ${isRunning ? 'timer-pulse' : ''}`} 
        />
        <span 
          className={`font-mono font-bold text-lg ${getTimerColor()}`}
          data-testid="timer-display"
        >
          {formatTime(minutes)}:{formatTime(seconds)}
        </span>
      </div>
      <p className={`text-xs text-center capitalize ${getDifficultyColor()}`}>
        {difficulty} Question
      </p>
    </div>
  );
}
