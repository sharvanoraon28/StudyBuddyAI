
import React, { useState } from 'react';
import { StudyAidAction, ChatMessage } from '../types';
import { STUDY_AID_ACTIONS } from '../constants';
import ChatPanel from './ChatPanel';

declare const pdfjsLib: any;

interface InputPanelProps {
  onGenerate: (action: StudyAidAction, sourceText: string, sourceImage: { mimeType: string; data: string; } | null) => void;
  isLoading: boolean;
  inputValue: string;
  setInputValue: (value: string) => void;
  imageData: { dataUrl: string; mimeType: string; data: string } | null;
  setImageData: (data: { dataUrl: string; mimeType: string; data: string } | null) => void;
  chatHistory: ChatMessage[];
  isChatLoading: boolean;
  onSendMessage: (message: string) => void;
  selectedAction: StudyAidAction;
  setSelectedAction: (action: StudyAidAction) => void;
  isThinkingMode: boolean;
  setIsThinkingMode: (value: boolean) => void;
  isGoogleSearchEnabled: boolean;
  setIsGoogleSearchEnabled: (value: boolean) => void;
  educationLevel: string;
  setEducationLevel: (value: string) => void;
  onTabChange: () => void;
}

const fileToBase64 = (file: File): Promise<{ dataUrl: string, base64: string, mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve({ dataUrl, base64, mimeType: file.type });
    };
    reader.onerror = error => reject(error);
  });
};

const InputPanel: React.FC<InputPanelProps> = ({ 
  onGenerate, 
  isLoading,
  inputValue,
  setInputValue,
  imageData,
  setImageData,
  chatHistory,
  isChatLoading,
  onSendMessage,
  selectedAction,
  setSelectedAction,
  isThinkingMode,
  setIsThinkingMode,
  isGoogleSearchEnabled,
  setIsGoogleSearchEnabled,
  educationLevel,
  setEducationLevel,
  onTabChange
}) => {
  const [activeTab, setActiveTab] = useState<'source' | 'chat'>('source');
  const [chatMessage, setChatMessage] = useState('');

  const EDUCATION_LEVELS = ['Middle School', 'High School', 'Undergraduate', 'Graduate'];

  const switchTab = (tab: 'source' | 'chat') => {
    if (tab !== activeTab) {
      onTabChange();
      setActiveTab(tab);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
        try {
            const { dataUrl, base64, mimeType } = await fileToBase64(file);
            setImageData({ dataUrl, data: base64, mimeType });
        } catch (error) {
            console.error("Error reading image file:", error);
            setImageData(null);
        }
    } else if (file.type === 'application/pdf') {
        try {
            setImageData(null); // Clear any existing image
            setInputValue("Reading PDF..."); // Provide immediate feedback
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let fullText = '';

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const items = textContent.items as any[];
                
                if (items.length === 0) continue;

                const lines = new Map<number, any[]>();
                const Y_TOLERANCE = 5; 

                for (const item of items) {
                    let foundLine = false;
                    for (const y of lines.keys()) {
                        if (Math.abs(y - item.transform[5]) < Y_TOLERANCE) {
                            lines.get(y)!.push(item);
                            foundLine = true;
                            break;
                        }
                    }
                    if (!foundLine) {
                        lines.set(item.transform[5], [item]);
                    }
                }

                const sortedLines = Array.from(lines.entries()).sort((a, b) => b[0] - a[0]);

                const pageText = sortedLines.map(([, lineItems]) => {
                    lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
                    
                    let lineText = '';
                    let lastItem: any = null;
                    for (const item of lineItems) {
                        if (lastItem) {
                            const spaceWidth = item.transform[4] - (lastItem.transform[4] + lastItem.width);
                            if (item.str.length > 0 && spaceWidth > (item.width / item.str.length) * 0.2) {
                                lineText += ' ';
                            }
                        }
                        lineText += item.str;
                        lastItem = item;
                    }
                    return lineText;
                }).join('\n');
                
                fullText += pageText + '\n\n';
            }

            setInputValue(fullText.trim());
        } catch (error) {
            console.error("Error parsing PDF:", error);
            setInputValue('Error: Could not read text from PDF.');
        }
    }
  };

  const handleChatSendMessage = (message: string) => {
    onSendMessage(message);
    setChatMessage('');
  };

  const handleSubmit = () => {
    if (activeTab === 'source') {
      const imageDataForApi = imageData ? { mimeType: imageData.mimeType, data: imageData.data } : null;
      onGenerate(selectedAction, inputValue, imageDataForApi);
    } else { // activeTab === 'chat'
      onGenerate(selectedAction, chatMessage, null);
    }
  };

  const isGenerateDisabled = isLoading ||
    (activeTab === 'source' && !imageData && !inputValue.trim()) ||
    (activeTab === 'chat' && !chatMessage.trim());

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6 flex flex-col h-full">
      <div className="mb-6 flex-shrink-0">
          <label htmlFor="class-select" className="flex items-center text-sm font-medium text-slate-300 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v6" />
              </svg>
              Select Your Class
          </label>
          <div className="relative">
              <select
                  id="class-select"
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                  {EDUCATION_LEVELS.map(level => (
                      <option key={level} value={level}>{level}</option>
                  ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
          </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 mb-4 flex-shrink-0">
        <button
          onClick={() => switchTab('source')}
          className={`py-2 px-5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'source' ? 'bg-slate-900 text-slate-100' : 'bg-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Source Content
        </button>
        <button
          onClick={() => switchTab('chat')}
          className={`py-2 px-5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'chat' ? 'bg-slate-900 text-slate-100' : 'bg-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Chatbot
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-grow min-h-0 mb-6">
        {activeTab === 'source' ? (
          <div className="flex flex-col h-full">
            <div className="flex flex-col flex-grow min-h-0">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Paste your source text here, or upload a file below..."
                className="w-full h-full flex-grow bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
              />
              <div className="h-32 flex-shrink-0">
                {imageData ? (
                  <div className="relative w-full h-full">
                    <img src={imageData.dataUrl} alt="Upload preview" className="object-contain w-full h-full rounded-md" />
                    <button
                      onClick={() => setImageData(null)}
                      className="absolute top-2 right-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full p-1.5"
                      aria-label="Remove image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                    <input id="file-upload" type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
                    <div className="text-center">
                        <div className="bg-indigo-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-indigo-500 transition-colors inline-flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            Select File
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Upload a PDF or Image</p>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>
        ) : (
          <ChatPanel 
            history={chatHistory} 
            isLoading={isChatLoading} 
            onSendMessage={handleChatSendMessage}
            placeholder="Ask a question, or type a topic to generate a study aid..."
            inputValue={chatMessage}
            onInputChange={setChatMessage}
          />
        )}
      </div>
      
      {/* Controls */}
      <div className="flex-shrink-0 space-y-4">
        <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg">
            <label htmlFor="thinking-mode-toggle" className="flex items-center justify-between cursor-pointer">
                <div>
                    <div className="text-slate-200 font-medium">Enhanced Thinking Mode</div>
                    <div className="text-xs text-slate-400">For more complex topics, slower response.</div>
                </div>
                <div className="relative">
                    <input 
                        type="checkbox" 
                        id="thinking-mode-toggle" 
                        className="sr-only peer" 
                        checked={isThinkingMode}
                        onChange={(e) => setIsThinkingMode(e.target.checked)}
                    />
                    <div className="block bg-slate-600 w-14 h-8 rounded-full peer-checked:bg-blue-600 transition"></div>
                    <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform peer-checked:translate-x-6"></div>
                </div>
            </label>
            
            <label htmlFor="google-search-toggle" className="flex items-center justify-between cursor-pointer">
                <div>
                    <div className="text-slate-200 font-medium">Use Google Search</div>
                    <div className="text-xs text-slate-400">For up-to-date, factual answers (Chatbot only).</div>
                </div>
                <div className="relative">
                    <input 
                        type="checkbox" 
                        id="google-search-toggle" 
                        className="sr-only peer" 
                        checked={isGoogleSearchEnabled}
                        onChange={(e) => setIsGoogleSearchEnabled(e.target.checked)}
                    />
                    <div className="block bg-slate-600 w-14 h-8 rounded-full peer-checked:bg-blue-600 transition"></div>
                    <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform peer-checked:translate-x-6"></div>
                </div>
            </label>
        </div>

        <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Study Tools</h3>
            <div className="grid grid-cols-5 gap-2">
            {STUDY_AID_ACTIONS.map(action => (
                <button
                key={action.id}
                onClick={() => setSelectedAction(action.id)}
                className={`flex flex-col items-center justify-center p-3 text-sm rounded-md transition-all duration-200 aspect-square ${selectedAction === action.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                >
                {action.icon}
                <span className="mt-1.5 text-xs text-center">{action.name}</span>
                </button>
            ))}
            </div>
        </div>
      
        <button
          onClick={handleSubmit}
          disabled={isGenerateDisabled}
          className="w-full bg-gradient-to-r from-blue-500 to-teal-400 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-600 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            `Generate ${selectedAction}`
          )}
        </button>
      </div>
    </div>
  );
};

export default InputPanel;
