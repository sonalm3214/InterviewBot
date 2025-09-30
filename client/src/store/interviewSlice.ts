import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CandidateWithProgress } from '@shared/schema';

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  questionStartTime: number | null;
}

interface InterviewState {
  currentCandidate: CandidateWithProgress | null;
  timerState: TimerState;
  lastActivity: number;
  showWelcomeBack: boolean;
  activeTab: 'interviewee' | 'interviewer';
}

const initialState: InterviewState = {
  currentCandidate: null,
  timerState: {
    timeLeft: 0,
    isRunning: false,
    questionStartTime: null,
  },
  lastActivity: Date.now(),
  showWelcomeBack: false,
  activeTab: 'interviewee',
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    setCurrentCandidate: (state, action: PayloadAction<CandidateWithProgress>) => {
      state.currentCandidate = action.payload;
      state.lastActivity = Date.now();
      
      // Set up timer for current question if in progress
      if (action.payload.status === 'interviewing' && action.payload.currentQuestion) {
        state.timerState = {
          timeLeft: action.payload.currentQuestion.timeLimit,
          isRunning: true,
          questionStartTime: Date.now(),
        };
      }
    },
    
    updateTimer: (state, action: PayloadAction<number>) => {
      if (state.timerState.isRunning && state.timerState.timeLeft > 0) {
        state.timerState.timeLeft = Math.max(0, action.payload);
      }
    },
    
    startTimer: (state, action: PayloadAction<number>) => {
      state.timerState = {
        timeLeft: action.payload,
        isRunning: true,
        questionStartTime: Date.now(),
      };
    },
    
    pauseTimer: (state) => {
      state.timerState.isRunning = false;
    },
    
    resumeTimer: (state) => {
      state.timerState.isRunning = true;
      state.timerState.questionStartTime = Date.now();
    },
    
    stopTimer: (state) => {
      state.timerState = {
        timeLeft: 0,
        isRunning: false,
        questionStartTime: null,
      };
    },
    
    updateLastActivity: (state) => {
      state.lastActivity = Date.now();
    },
    
    setShowWelcomeBack: (state, action: PayloadAction<boolean>) => {
      state.showWelcomeBack = action.payload;
    },
    
    setActiveTab: (state, action: PayloadAction<'interviewee' | 'interviewer'>) => {
      state.activeTab = action.payload;
    },
    
    clearCurrentCandidate: (state) => {
      state.currentCandidate = null;
      state.timerState = initialState.timerState;
    },
  },
});

export const {
  setCurrentCandidate,
  updateTimer,
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  updateLastActivity,
  setShowWelcomeBack,
  setActiveTab,
  clearCurrentCandidate,
} = interviewSlice.actions;

export default interviewSlice.reducer;
