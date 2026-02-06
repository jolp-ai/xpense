import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Sparkles, Send, Loader2, Bot, Mic, StopCircle } from 'lucide-react';
import { Expense, Language } from '../types';
import { askAiAboutExpenses, transcribeAudio } from '../services/geminiService';

interface InsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  currencySymbol: string;
  t: (key: string) => string;
  language: Language;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export const InsightsModal: React.FC<InsightsModalProps> = ({ isOpen, onClose, expenses, currencySymbol, t, language }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: t('askInsights') }
  ]);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isRecording, isTranscribing]);

  useEffect(() => {
      if (!isOpen) {
          stopRecording(); // Safety cleanup
          setQuery('');
      } else {
        setMessages([{ role: 'ai', content: t('askInsights') }]);
      }
  }, [isOpen, language]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || loading || isTranscribing) return;

    const userMsg = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const answer = await askAiAboutExpenses(userMsg, expenses, currencySymbol, language);
      setMessages(prev => [...prev, { role: 'ai', content: answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error analyzing your data." }]);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsTranscribing(true);
    }
  };

  const toggleRecording = () => {
      if (isRecording) {
          stopRecording();
      } else {
          startRecording();
      }
  };

  const processAudio = async (blob: Blob) => {
      try {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
              const base64Audio = (reader.result as string).split(',')[1];
              try {
                  const text = await transcribeAudio(base64Audio, blob.type || 'audio/webm', language);
                  if (text) {
                      setQuery(text);
                  }
              } catch (e) {
                  console.error("Transcription failed", e);
              } finally {
                  setIsTranscribing(false);
              }
          };
      } catch (e) {
          console.error("Processing failed", e);
          setIsTranscribing(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 flex flex-col animate-slide-in-right">
        
        {/* Header */}
        <div className="flex items-center gap-4 px-4 py-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shadow-sm shrink-0 safe-area-top">
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100 dark:active:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-emerald-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('insights')}</h2>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-2xl mx-auto w-full space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-emerald-600 text-white rounded-br-none' 
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                  }`}
                >
                  {msg.role === 'ai' && <Bot size={18} className="inline-block mr-2 mb-0.5 text-emerald-500" />}
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-bl-none border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
                  <Loader2 size={18} className="animate-spin text-emerald-500" />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('thinking')}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 safe-area-bottom">
          <div className="max-w-2xl mx-auto w-full">
            <form onSubmit={handleSend} className="relative flex items-center gap-3">
              <input 
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isRecording ? t('listening') : isTranscribing ? t('processing') : t('askInsights')}
                disabled={isRecording || isTranscribing}
                className={`flex-1 p-4 pr-12 bg-gray-100 dark:bg-gray-700 border-none rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${isRecording ? 'animate-pulse bg-red-50 dark:bg-red-900/20 placeholder-red-400' : ''}`}
              />
              
              <div className="absolute right-3 flex items-center">
                  {query.trim() ? (
                      <button 
                          type="submit" 
                          disabled={loading || isTranscribing}
                          className="w-10 h-10 flex items-center justify-center bg-emerald-600 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                          <Send size={18} />
                      </button>
                  ) : (
                      <button 
                          type="button"
                          onClick={toggleRecording}
                          disabled={isTranscribing}
                          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
                              isRecording 
                                  ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse shadow-md' 
                                  : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                          }`}
                      >
                          {isRecording ? <StopCircle size={18} /> : <Mic size={20} />}
                      </button>
                  )}
              </div>
            </form>
            {isTranscribing && (
              <p className="text-xs text-gray-400 text-center mt-2 animate-pulse font-medium">{t('processing')}</p>
            )}
          </div>
        </div>

    </div>
  );
};