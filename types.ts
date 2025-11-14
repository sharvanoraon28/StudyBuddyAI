
export enum StudyAidAction {
  SIMPLIFY = 'Simplify/Explain',
  FLASHCARDS = 'Flashcards',
  QUIZ = 'Quiz',
  AUDIO = 'Audio',
  IMAGE = 'Image',
}

export interface Flashcard {
  front: string;
  back: {
    definition: string;
    example: string;
  };
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number; // index of correct option
  explanation: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: any[];
}
