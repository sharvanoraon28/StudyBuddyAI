import React, { useState, useMemo, useEffect } from 'react';
import { Flashcard as FlashcardType } from '../types';

const Flashcard: React.FC<{ card: FlashcardType }> = ({ card }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
  }, [card]);

  return (
    <div className="w-full h-96 [perspective:1000px] cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
      <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
        
        {/* Front of the card */}
        <div className="absolute w-full h-full [backface-visibility:hidden] bg-slate-700/80 rounded-xl flex items-center justify-center p-6 text-center shadow-lg border border-slate-600">
          <h3 className="text-4xl font-bold text-white tracking-tight">{card.front}</h3>
        </div>
        
        {/* Back of the card */}
        <div className="absolute w-full h-full [backface-visibility:hidden] bg-slate-800 rounded-xl flex flex-col justify-center p-8 text-left shadow-lg border border-blue-500/50 [transform:rotateY(180deg)] overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-blue-400 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                Definition
              </h4>
              <p className="text-slate-200 text-lg leading-relaxed">{card.back.definition}</p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-md">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-blue-400 mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    Example
                </h4>
                <p className="text-slate-300 text-lg italic">"{card.back.example}"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const FlashcardViewer: React.FC<{ data: string }> = ({ data }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const flashcards = useMemo<FlashcardType[] | null>(() => {
    try {
      // Find the start of the JSON array
      const startIndex = data.indexOf('[');
      if (startIndex === -1) throw new Error("No JSON array found in the data.");
      const jsonString = data.substring(startIndex);
      const parsed = JSON.parse(jsonString);
      
      if (Array.isArray(parsed) && parsed.every(item => 'front' in item && 'back' in item && 'definition' in item.back && 'example' in item.back)) {
        return parsed;
      }
      return null;
    } catch (e) {
      console.error("Failed to parse flashcard JSON", e);
      return null;
    }
  }, [data]);

  if (!flashcards) {
    return <div className="p-4 text-red-400 flex items-center justify-center h-full">Error: The generated content is not valid flashcard data. Please try again.</div>;
  }
  
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };


  return (
    <div className="p-6 flex flex-col items-center justify-start h-full w-full">
      <h2 className="text-3xl font-bold mb-8 text-center text-slate-200">Flashcards</h2>
       <div className="w-full max-w-2xl mb-4">
        {flashcards.length > 0 && <Flashcard card={flashcards[currentIndex]} />}
      </div>

       <div className="text-sm text-slate-400 flex items-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Click card to flip
        </div>

      <div className="flex items-center justify-center space-x-8 w-full max-w-lg">
        <button onClick={goToPrev} className="bg-slate-700 hover:bg-slate-600 text-white font-bold h-14 w-14 rounded-full transition-colors flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Previous card" disabled={flashcards.length <= 1}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-slate-300 font-medium text-lg w-20 text-center">{currentIndex + 1} / {flashcards.length}</span>
        <button onClick={goToNext} className="bg-slate-700 hover:bg-slate-600 text-white font-bold h-14 w-14 rounded-full transition-colors flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Next card" disabled={flashcards.length <= 1}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
};

export default FlashcardViewer;
