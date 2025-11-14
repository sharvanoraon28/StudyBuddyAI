
import React from 'react';
import { StudyAidAction } from './types';

const BrainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4.5 4.5 0 0 0-4.5 4.5c0 1.25.5 2.4 1.34 3.25C7.98 10.88 7 12.35 7 14c0 2.21 1.79 4 4 4h2c2.21 0 4-1.79 4-4c0-1.65-.98-3.12-2.34-3.75C16 9.4 16.5 8.25 16.5 7.5A4.5 4.5 0 0 0 12 2Z"></path><path d="M12 18v4"></path><path d="M12 2v2.5"></path><path d="M19.5 7.5l-2 2"></path><path d="M4.5 7.5l2 2"></path></svg>
);
const CardsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
);
const QuizIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9.5 14.5 2-2.5 4 4" /><path d="m14 10-2 2.5-4-4" /></svg>
);
const AudioIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
);
const ImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
);


export const STUDY_AID_ACTIONS = [
  { id: StudyAidAction.SIMPLIFY, icon: <BrainIcon />, name: 'Simplify' },
  { id: StudyAidAction.FLASHCARDS, icon: <CardsIcon />, name: 'Flashcards' },
  { id: StudyAidAction.QUIZ, icon: <QuizIcon />, name: 'Quiz' },
  { id: StudyAidAction.AUDIO, icon: <AudioIcon />, name: 'Audio' },
  { id: StudyAidAction.IMAGE, icon: <ImageIcon />, name: 'Image' },
];

const getBasePrompt = (educationLevel: string) => `You are "StudyBuddy," an advanced AI educational assistant. Your goal is to take a source text, topic, or image and transform it into a specific study aid. CRITICAL: Tailor your response for a '${educationLevel}' student. Adjust complexity, vocabulary, and examples accordingly.`;

export const getPromptForAction = (
  inputValue: string, // The actual user text
  imageProvided: boolean,
  action: StudyAidAction,
  educationLevel: string
): string => {
  let sourceInstruction: string;
  const hasText = inputValue.trim().length > 0;
  const basePrompt = getBasePrompt(educationLevel);

  if (imageProvided && hasText) {
    sourceInstruction = `Base your response strictly on the provided image and the following text content:\n\n"""\n${inputValue}\n"""`;
  } else if (imageProvided) {
    sourceInstruction = `Base your response strictly on the provided image.`;
  } else if (hasText) {
    // Heuristic to differentiate between a short topic and longer source text
    sourceInstruction = inputValue.length < 100 && !inputValue.includes('\n')
      ? `Generate content for the topic: "${inputValue}"`
      : `Base your response strictly on the following text:\n\n"""\n${inputValue}\n"""`;
  } else {
    // This case should be prevented by UI validation but serves as a fallback.
    sourceInstruction = `No source material was provided.`;
  }
  
  const taskPrompt = (() => {
    switch (action) {
      case StudyAidAction.SIMPLIFY:
        return `Task: Provide a detailed explanation of the topic. First, identify and list 3-5 core concepts. Then, explain each concept in simple terms, using helpful analogies. Finally, provide a concise overall summary and a "Key Takeaway" section with the single most important point.`;
      case StudyAidAction.FLASHCARDS:
        return `Task: Create 15-20 key term/definition pairs. Return ONLY raw JSON in this exact format: [{"front": "Term", "back": {"definition": "A clear definition suitable for the student's level.", "example": "A sentence using the term in context."}}]. Do not include any other text, explanations, or markdown formatting.`;
      case StudyAidAction.QUIZ:
        return `Task: Create a multiple-choice quiz with 15 questions. For each question, provide a clear explanation for why the correct answer is right. Return ONLY raw JSON in this exact format: [{"question": "...", "options": ["A", "B", "C", "D"], "answer": 0, "explanation": "Why this is the correct answer..."}]. The 'answer' must be a number from 0 to 3. Do not include any other text, explanations, or markdown formatting.`;
      case StudyAidAction.AUDIO:
        return `Task: Write a conversational, podcast-style script summarizing the topic, approximately a 2-minute read time. Structure it with a clear intro, 2-3 main discussion points, and a concluding summary. Use a friendly host persona and include cues for sound effects where appropriate (e.g., [SOUND of a school bell]).`;
      // Note: Image generation prompt is handled directly in the service
      case StudyAidAction.IMAGE:
         return `Task: Generate a single, clear, and visually appealing image that represents the core concept of the provided material. The image should be suitable as a visual aid for a student.`;
      default:
        return '';
    }
  })();

  return `${basePrompt}\n\n${taskPrompt}\n\n${sourceInstruction}`;
};
