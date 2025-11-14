
import React from 'react';
import { StudyAidAction } from '../types';
import FlashcardViewer from './FlashcardViewer';
import QuizViewer from './QuizViewer';
import MermaidDiagram from './MermaidDiagram';
import AudioPlayer from './AudioPlayer';

interface OutputPanelProps {
  isLoading: boolean;
  error: string | null;
  content: string | null;
  actionType: StudyAidAction;
  onVisualize: (content: string) => void;
  isVisualizing: boolean;
  visualizedImage: string | null;
  visualizeError: string | null;
}

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-slate-400">
    <svg className="animate-spin h-12 w-12 text-blue-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="text-lg font-semibold">Generating your study aid...</p>
    <p className="text-sm">The AI is thinking. This may take a moment for complex topics.</p>
  </div>
);

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center justify-center h-full text-red-400">
    <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
      <h3 className="text-lg font-bold mb-2">An Error Occurred</h3>
      <p>{message}</p>
    </div>
  </div>
);

const Placeholder: React.FC = () => (
    <div className="flex items-center justify-center h-full text-slate-500 p-8">
        <div className="text-center border-2 border-dashed border-slate-700 rounded-xl p-12 w-full max-w-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-6 text-xl font-semibold text-slate-300">Your study material will appear here</h3>
            <p className="mt-2 text-sm text-slate-400">Provide your content and select a study tool from the options above to begin.</p>
        </div>
    </div>
);

const VisualizeComponent: React.FC<{
    onVisualize: () => void;
    isVisualizing: boolean;
    image: string | null;
    error: string | null;
}> = ({ onVisualize, isVisualizing, image, error }) => {
    if (isVisualizing) {
        return (
            <div className="aspect-video bg-slate-800 rounded-lg flex items-center justify-center">
                <div className="flex flex-col items-center text-slate-400">
                    <svg className="animate-spin h-8 w-8 text-blue-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm">Creating a visual...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
             <div className="aspect-video bg-slate-800 rounded-lg flex flex-col items-center justify-center text-center p-4">
                <p className="text-red-400 text-sm mb-4">{error}</p>
                <button onClick={onVisualize} className="bg-blue-600 text-white font-semibold px-4 py-2 text-sm rounded-md hover:bg-blue-500 transition-colors">
                    Try Again
                </button>
            </div>
        );
    }

    if (image) {
        return (
            <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                 <img 
                    src={`data:image/png;base64,${image}`} 
                    alt="Generated visual aid for the topic" 
                    className="max-w-full max-h-full object-contain rounded-lg"
                />
            </div>
        );
    }
    
    return (
        <div className="text-center">
            <button
                onClick={onVisualize}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-5 rounded-lg transition-all inline-flex items-center"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Visualize Concept
            </button>
        </div>
    );
};


const OutputPanel: React.FC<OutputPanelProps> = ({ isLoading, error, content, actionType, onVisualize, isVisualizing, visualizedImage, visualizeError }) => {
  const renderContent = () => {
    if (isLoading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    if (!content) return <Placeholder />;

    switch (actionType) {
      case StudyAidAction.FLASHCARDS:
        return <FlashcardViewer data={content} />;
      case StudyAidAction.QUIZ:
        return <QuizViewer data={content} />;
      case StudyAidAction.AUDIO:
        return <AudioPlayer base64Audio={content} />;
      case StudyAidAction.IMAGE:
        return (
          <div className="p-4 flex items-center justify-center h-full w-full">
              <img 
                  src={`data:image/png;base64,${content}`} 
                  alt="Generated visual aid" 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
          </div>
        );
      case StudyAidAction.SIMPLIFY:
        return (
          <div className="p-4">
            <div className="mb-6 border-b border-slate-700 pb-6">
                <VisualizeComponent 
                  onVisualize={() => onVisualize(content)}
                  isVisualizing={isVisualizing}
                  image={visualizedImage}
                  error={visualizeError}
                />
            </div>
            <div className="whitespace-pre-wrap text-slate-300 leading-relaxed text-base">{content}</div>
          </div>
        );
      default:
        return <div className="p-4">{content}</div>;
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-2 overflow-auto min-h-[60vh]">
      <div className="bg-slate-900 rounded-md min-h-full">
        {renderContent()}
      </div>
    </div>
  );
};

export default OutputPanel;
