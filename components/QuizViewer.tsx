
import React, { useState, useMemo } from 'react';
import { QuizQuestion } from '../types';

const QuizViewer: React.FC<{ data: string }> = ({ data }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
  const [showResults, setShowResults] = useState(false);

  const questions = useMemo<QuizQuestion[] | null>(() => {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.every(q => 'question' in q && 'options' in q && 'answer' in q && 'explanation' in q)) {
        setSelectedAnswers(new Array(parsed.length).fill(null));
        return parsed;
      }
      return null;
    } catch (e) {
      console.error("Failed to parse quiz JSON", e);
      return null;
    }
  }, [data]);

  if (!questions) {
    return <div className="p-4 text-red-400">Error: The generated content is not valid quiz data. Please try again.</div>;
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  const isAnswered = selectedAnswers[currentQuestionIndex] !== null;

  const handleSelectAnswer = (optionIndex: number) => {
    if (showResults || isAnswered) return;
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };
  
  const score = selectedAnswers.filter((answer, index) => answer === questions[index].answer).length;

  const getOptionClass = (optionIndex: number) => {
    const isSelected = selectedAnswers[currentQuestionIndex] === optionIndex;

    if (!isAnswered && !showResults) { // Not answered yet
        return 'bg-slate-700 hover:bg-slate-600';
    }

    // Answered or results are shown
    const isCorrect = currentQuestion.answer === optionIndex;

    if (isCorrect) return 'bg-green-600 ring-2 ring-green-400';
    if (isSelected && !isCorrect) return 'bg-red-600 ring-2 ring-red-400';
    return 'bg-slate-700 opacity-60'; // Fade out non-selected, non-correct options
  }

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers(new Array(questions.length).fill(null));
    setShowResults(false);
  }

  if (showResults) {
    return (
        <div className="p-6 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Quiz Results</h2>
            <p className="text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
                {score} / {questions.length}
            </p>
            <p className="text-xl mb-6">You answered {Math.round((score / questions.length) * 100)}% correctly!</p>
            <button onClick={handleRestart} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                Try Again
            </button>
        </div>
    );
  }

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-bold mb-2 text-center text-slate-300">Quiz Time!</h2>
      <p className="text-center text-slate-400 mb-6">Question {currentQuestionIndex + 1} of {questions.length}</p>
      
      <div className="bg-slate-800 p-6 rounded-lg">
        <p className="text-lg font-medium mb-4">{currentQuestion.question}</p>
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSelectAnswer(index)}
              disabled={showResults || isAnswered}
              className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${getOptionClass(index)} ${!isAnswered ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {option}
            </button>
          ))}
        </div>
        {(isAnswered || showResults) && (
            <div className="mt-4 pt-4 border-t border-slate-600/50 text-slate-300">
                <h4 className="font-bold text-md mb-1 text-slate-200">Explanation</h4>
                <p className="text-sm">{currentQuestion.explanation}</p>
            </div>
        )}
      </div>
      
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        {currentQuestionIndex === questions.length - 1 ? (
          <button 
            onClick={() => setShowResults(true)}
            disabled={!isAnswered}
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
          >
            Finish Quiz
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
            disabled={!isAnswered}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizViewer;