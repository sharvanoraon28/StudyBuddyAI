
import React, { useState, useCallback, useEffect } from 'react';
import mermaid from 'mermaid';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import { StudyAidAction, ChatMessage } from './types';
import { generateStudyAid, generateChatResponse, generateVisualFromText } from './services/geminiService';

const App: React.FC = () => {
  // State for study aid generation
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [outputContent, setOutputContent] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<StudyAidAction>(StudyAidAction.SIMPLIFY);
  const [isThinkingMode, setIsThinkingMode] = useState<boolean>(false);
  const [isGoogleSearchEnabled, setIsGoogleSearchEnabled] = useState<boolean>(false);
  const [educationLevel, setEducationLevel] = useState<string>('High School');

  // State for on-demand visualization
  const [visualizedImage, setVisualizedImage] = useState<string | null>(null);
  const [isVisualizing, setIsVisualizing] = useState<boolean>(false);
  const [visualizeError, setVisualizeError] = useState<string | null>(null);

  // State for source material
  const [inputValue, setInputValue] = useState('');
  const [imageData, setImageData] = useState<{ mimeType: string; data: string; dataUrl: string; } | null>(null);
  
  // State for chatbot
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      fontFamily: 'inherit',
      securityLevel: 'loose',
    });
  }, []);

  const clearVisualization = () => {
    setVisualizedImage(null);
    setVisualizeError(null);
  };

  // Effect to clear output when source is cleared
  useEffect(() => {
    if (!inputValue.trim() && !imageData) {
      setOutputContent(null);
      setError(null);
      clearVisualization();
    }
  }, [inputValue, imageData]);

  const handleGenerate = useCallback(async (
    action: StudyAidAction, 
    sourceText: string, 
    sourceImage: { mimeType: string; data: string; } | null
  ) => {
    if (!sourceText.trim() && !sourceImage && action !== StudyAidAction.IMAGE) {
      setError("Please provide source content to generate a study aid.");
      setOutputContent(null);
      return;
    }
     if (!sourceText.trim() && action === StudyAidAction.IMAGE) {
      setError("Please provide a topic or description to generate an image.");
      setOutputContent(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setOutputContent(null);
    clearVisualization();
    setSelectedAction(action);

    try {
      const result = await generateStudyAid(sourceText, sourceImage, action, isThinkingMode, educationLevel);
      setOutputContent(result);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [isThinkingMode, educationLevel]);
  
  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    const newUserMessage: ChatMessage = { role: 'user', text: message };
    setChatHistory(prev => [...prev, newUserMessage]);
    setIsChatLoading(true);

    try {
        const { text: responseText, sources } = await generateChatResponse(chatHistory, message, educationLevel, isGoogleSearchEnabled);
        const newModelMessage: ChatMessage = { role: 'model', text: responseText, sources };
        setChatHistory(prev => [...prev, newModelMessage]);
    } catch (e: any) {
        const errorMessage = e.message || "Sorry, I couldn't get a response. Please try again.";
        setChatHistory(prev => [...prev, {role: 'model', text: errorMessage}]);
    } finally {
        setIsChatLoading(false);
    }
  }, [chatHistory, educationLevel, isGoogleSearchEnabled]);

  const handleTabChange = useCallback(() => {
    setOutputContent(null);
    setError(null);
    clearVisualization();
  }, []);

  const handleVisualize = useCallback(async (topic: string) => {
    if (!topic.trim()) return;

    setIsVisualizing(true);
    setVisualizeError(null);
    setVisualizedImage(null);

    try {
      const imageResult = await generateVisualFromText(topic, educationLevel);
      setVisualizedImage(imageResult);
    } catch (e: any) {
      console.error("Visualization failed:", e);
      setVisualizeError(e.message || "Failed to generate a visual for this topic.");
    } finally {
      setIsVisualizing(false);
    }
  }, [educationLevel]);

  return (
    <div className="min-h-screen bg-slate-900 font-sans">
      <header className="py-4 px-8 border-b border-slate-700">
        <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
          StudyBuddy AI
        </h1>
        <p className="text-center text-slate-400 mt-1">StudyBuddy Ai created by- Sharvan Orang</p>
      </header>
      <main className="flex flex-col gap-8 p-4 lg:p-8 max-w-screen-xl mx-auto">
        <InputPanel 
            onGenerate={handleGenerate} 
            isLoading={isLoading}
            inputValue={inputValue}
            setInputValue={setInputValue}
            imageData={imageData}
            setImageData={setImageData}
            chatHistory={chatHistory}
            isChatLoading={isChatLoading}
            onSendMessage={handleSendMessage}
            selectedAction={selectedAction}
            setSelectedAction={setSelectedAction}
            isThinkingMode={isThinkingMode}
            setIsThinkingMode={setIsThinkingMode}
            isGoogleSearchEnabled={isGoogleSearchEnabled}
            setIsGoogleSearchEnabled={setIsGoogleSearchEnabled}
            educationLevel={educationLevel}
            setEducationLevel={setEducationLevel}
            onTabChange={handleTabChange}
        />
        <OutputPanel 
          isLoading={isLoading} 
          error={error} 
          content={outputContent} 
          actionType={selectedAction}
          onVisualize={handleVisualize}
          isVisualizing={isVisualizing}
          visualizedImage={visualizedImage}
          visualizeError={visualizeError}
        />
      </main>
    </div>
  );
};

export default App;