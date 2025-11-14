
import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';

interface ChatPanelProps {
  history: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  placeholder?: string;
  inputValue: string;
  onInputChange: (value: string) => void;
}

const TypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-2 p-3">
        <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
    </div>
);


const ChatPanel: React.FC<ChatPanelProps> = ({ history, isLoading, onSendMessage, placeholder, inputValue, onInputChange }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
    }
  };
  
  const renderSources = (sources: any[]) => {
    if (!sources || sources.length === 0) return null;
    
    return (
        <div className="mt-2 pt-2 border-t border-slate-600">
            <h4 className="text-xs font-bold text-slate-400 mb-1">Sources:</h4>
            <ul className="text-xs space-y-1">
                {sources.map((source, index) => {
                    if (source.web && source.web.uri) {
                        return (
                            <li key={index} className="truncate">
                                <a 
                                    href={source.web.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline flex items-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                    </svg>
                                    <span className="truncate">{source.web.title || source.web.uri}</span>
                                </a>
                            </li>
                        );
                    }
                    return null;
                })}
            </ul>
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg">
      <div className="flex-grow p-3 overflow-y-auto space-y-4">
        {history.map((chat, index) => (
          <div key={index} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg rounded-xl px-4 py-2 ${chat.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
              <p className="text-sm whitespace-pre-wrap">{chat.text}</p>
              {chat.role === 'model' && renderSources(chat.sources || [])}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                 <div className="max-w-xs md:max-w-md lg:max-w-lg rounded-xl px-4 py-2 bg-slate-700">
                    <TypingIndicator />
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t border-slate-700 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={placeholder || "Ask a question..."}
            disabled={isLoading}
            className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Chat message input"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send chat message"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
