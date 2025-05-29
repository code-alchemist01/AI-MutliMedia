import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse, Part } from '@google/genai'; // Assuming Chat type is exported
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { SectionContainer } from '../common/SectionContainer';
import { Feature, GEMINI_TEXT_MODEL } from '../../constants';
import { PaperAirplaneIcon, SparklesIcon } from '../icons/Icons';
import type { ChatMessage, GroundingSource } from '../../types'; // Using GroundingSource for potential future integration

const API_KEY = process.env.API_KEY;

export const ChatComponent: React.FC = () => {
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [systemInstruction, setSystemInstruction] = useState<string>(''); // Optional system instruction
  const chatEndRef = useRef<HTMLDivElement>(null);

  const initializeChat = useCallback(() => {
    if (!API_KEY) {
      setError("API Key for Gemini is not configured. Please set the API_KEY environment variable.");
      return;
    }
    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const newChat = ai.chats.create({
        model: GEMINI_TEXT_MODEL,
        ...(systemInstruction && { config: { systemInstruction } }),
        // history: messages.map(msg => ({ // Initialize with existing messages if any (careful with format)
        //    role: msg.role,
        //    parts: [{ text: msg.text }]
        // }))
      });
      setChatSession(newChat);
      setError(null);
    } catch (e) {
      console.error("Failed to initialize chat session:", e);
      setError(e instanceof Error ? e.message : "Failed to initialize chat session.");
    }
  }, [systemInstruction /*, messages (if re-initializing with history) */]);
  
  useEffect(() => {
    initializeChat();
  }, [initializeChat]); // Re-initialize if systemInstruction changes

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentInput.trim() || !chatSession) {
      if (!chatSession) setError("Chat session is not initialized. Check API Key.");
      return;
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: currentInput,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    const userMessageForApi = currentInput;
    setCurrentInput('');
    setIsLoading(true);
    setError(null);

    try {
      const stream = await chatSession.sendMessageStream({ message: userMessageForApi });
      let modelResponseText = '';
      const modelMessageId = Date.now().toString() + "-model";
      
      // Add a placeholder for the model's response immediately for better UX
      setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: '...', timestamp: new Date() }]);

      for await (const chunk of stream) { // chunk is GenerateContentResponse
        modelResponseText += chunk.text;
        // Update the placeholder message with the streamed content
        setMessages(prev => prev.map(msg => 
          msg.id === modelMessageId ? { ...msg, text: modelResponseText } : msg
        ));
      }
      // Final update after stream ends to ensure all text is captured
       setMessages(prev => prev.map(msg => 
          msg.id === modelMessageId ? { ...msg, text: modelResponseText } : msg
        ));

    } catch (e) {
      console.error("Error sending message:", e);
      const errorMessage = e instanceof Error ? e.message : "An error occurred while sending the message.";
      setError(errorMessage);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: `Error: ${errorMessage}`, timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSystemInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSystemInstruction(e.target.value);
  };

  const handleRestartChat = () => {
    setMessages([]);
    initializeChat(); // Re-initializes the chat session, effectively clearing server-side history for this Chat object
    setError(null);
    setCurrentInput('');
  };


  return (
    <SectionContainer title={Feature.CHAT_WITH_AI} className="animate-fadeIn flex flex-col h-[calc(100vh-250px)] sm:h-[calc(100vh-300px)]">
      <div className="mb-4">
        <label htmlFor="system-instruction" className="block text-sm font-medium text-themed-secondary mb-1">System Instruction (Optional)</label>
        <textarea
          id="system-instruction"
          value={systemInstruction}
          onChange={handleSystemInstructionChange}
          onBlur={handleRestartChat} // Re-initialize chat if instruction changes and input loses focus
          placeholder="e.g., You are a helpful assistant that speaks like a pirate."
          className="w-full p-2 form-input rounded-lg text-xs"
          rows={2}
          disabled={isLoading || messages.length > 0} // Disable if chat started to prevent mid-convo changes easily
        />
        {messages.length > 0 && <p className="text-xs text-themed-muted mt-1">To change system instruction, restart chat.</p>}
        <button onClick={handleRestartChat} className="mt-2 btn-secondary text-xs py-1 px-3 rounded-md">Restart Chat</button>
      </div>

      <div className="flex-grow overflow-y-auto mb-4 p-3 bg-themed-secondary rounded-lg space-y-3 min-h-[200px]">
        {messages.length === 0 && !isLoading && (
          <p className="text-center text-themed-muted p-4">Start a conversation by typing your message below.</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] p-3 rounded-xl shadow ${
              msg.role === 'user' 
                ? 'bg-[var(--color-accent-primary)] text-white rounded-br-none' 
                : 'bg-themed-card text-themed-primary rounded-bl-none border border-themed-primary'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-indigo-200' : 'text-themed-muted'}`}>
                {msg.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length-1]?.role === 'user' && (
            <div className="flex justify-start">
                 <div className="max-w-[75%] p-3 rounded-xl shadow bg-themed-card text-themed-primary rounded-bl-none border border-themed-primary">
                    <LoadingSpinner size="sm" message="AI is thinking..." />
                 </div>
            </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {error && <ErrorMessage message={error} title="Chat Error"/>}

      <div className="mt-auto flex items-center gap-2">
        <input
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
          placeholder={chatSession ? "Type your message..." : "Initializing chat..."}
          className="flex-grow p-3 form-input rounded-lg text-sm sm:text-base"
          disabled={isLoading || !chatSession}
          aria-label="Chat message input"
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !currentInput.trim() || !chatSession}
          className="btn-primary p-3 rounded-lg shadow-md flex items-center justify-center"
          aria-label="Send message"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>
    </SectionContainer>
  );
};
