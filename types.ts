
export interface ResourceLink {
  title: string;
  url: string;
}

export interface TestCategory {
  title: string;
  tests: ResourceLink[];
}

export enum Section {
  HOME = 'HOME',
  QUANTITATIVE = 'QUANTITATIVE',
  VERBAL = 'VERBAL',
  TESTS = 'TESTS',
  MISTAKES = 'MISTAKES',
  HISTORY = 'HISTORY',
  LEADERBOARD = 'LEADERBOARD',
  AI_TUTOR = 'AI_TUTOR',
  SUPPORT = 'SUPPORT',
  REVIEW = 'REVIEW',
  SUBSCRIPTIONS = 'SUBSCRIPTIONS',
  PROFILE = 'PROFILE'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // stored locally for simulation
  avatar?: string;
  joinedDate: number;
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswerIndex: number; // 0-based index
  explanation?: string;
  image?: string; // Optional image URL for the question
}

export interface QuizResult {
  score: number;
  total: number;
  answers: { [questionId: number]: number }; // questionId -> selectedOptionIndex
  timeSpent: number; // in seconds
  timestamp?: number; // Date completed
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: any; // Lucide icon node or string
    color: string;
    condition: string; // Text description of how to get it
}