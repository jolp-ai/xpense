import React, { useState, useRef, useEffect } from 'react';
import { Mic, Camera, Type, X, Loader2, Check, StopCircle } from 'lucide-react';
import { parseExpenseFromAudio, parseExpenseFromImage, parseExpenseFromText } from '../services/geminiService';
import { ExpenseCategory, Wallet, Language } from '../types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (expenses: { amount: number; category: string; description: string; date: string }[]) => void;
  currencyCode: string;
  wallets: Wallet[];
  language: Language;
}

type InputMode = 'select' | 'voice' | 'camera' | 'text';

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onAdd, currencyCode, wallets, language }) => {
  const [mode, setMode] = useState<InputMode>('select');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [textInput, setTextInput] = useState('');
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Camera state
  const fileInputRef = useRef<HTMLInputElement>(null);

  const walletNames = wallets.map(w => w.name);

  useEffect(() => {
    if (isOpen) {
      setMode('select');
      setStatusMessage('');
      setIsProcessing(false);
      setTextInput('');
    }
  }, [isOpen]);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    setIsProcessing(true);
    setStatusMessage("Analyzing text...");
    try {
      const results = await parseExpenseFromText(textInput, currencyCode, language);
      const validExpenses = results.filter(r => r.amount > 0);

      if (validExpenses.length === 0) {
        setStatusMessage("No valid expense found in text.");
      } else {
        const mappedExpenses = validExpenses.map(result => ({
            amount: result.amount,
            category: result.category || ExpenseCategory.OTHER,
            description: result.description || 'Expense',
            date: result.date || new Date().toISOString()
        }));
        onAdd(mappedExpenses);
        onClose();
      }
    } catch (error) {
      console.error(error);
      setStatusMessage("Failed to process. Please try again.");
    } finally {
      setIsProcessing(false);
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
      setStatusMessage("Listening...");
    } catch (err) {
      console.error("Error accessing microphone", err);
      setStatusMessage("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setStatusMessage("Processing audio...");
      setIsProcessing(true);
    }
  };

  const processAudio = async (blob: Blob) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        try {
            const results = await parseExpenseFromAudio(base64Audio, blob.type || 'audio/webm', currencyCode, walletNames, language);
            const validExpenses = results.filter(r => r.amount > 0);

            if (validExpenses.length === 0) {
                setStatusMessage("No expense detected in audio.");
                setIsProcessing(false);
            } else {
                const mappedExpenses = validExpenses.map(result => ({
                    amount: result.amount,
                    category: result.category || ExpenseCategory.OTHER,
                    description: result.description || 'Voice Entry',
                    date: result.date || new Date().toISOString()
                }));
                onAdd(mappedExpenses);
                onClose();
            }
        } catch (error) {
            console.error(error);
            setStatusMessage("Failed to understand audio.");
            setIsProcessing(false);
        }
      };
    } catch (error) {
      console.error(error);
      setStatusMessage("Audio processing error.");
      setIsProcessing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage("Analyzing image...");
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const base64Image = (reader.result as string).split(',')[1];
        const results = await parseExpenseFromImage(base64Image, file.type || 'image/jpeg', currencyCode, walletNames, language);
        const validExpenses = results.filter(r => r.amount > 0);

        if (validExpenses.length === 0) {
            setStatusMessage("No expense detected in image.");
        } else {
            const mappedExpenses = validExpenses.map(result => ({
                amount: result.amount,
                category: result.category || ExpenseCategory.OTHER,
                description: result.description || 'Receipt',
                date: result.date || new Date().toISOString()
            }));
            onAdd(mappedExpenses);
            onClose();
        }
      } catch (error) {
        console.error(error);
        setStatusMessage("Failed to analyze image.");
      } finally {
        setIsProcessing(false);
      }
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl transform transition-transform animate-in slide-in-from-bottom-10 fade-in duration-200">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {isProcessing ? 'Processing AI...' : 'Add Expense'}
          </h2>
          {!isProcessing && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          )}
        </div>

        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <p className="text-gray-600 font-medium">{statusMessage}</p>
          </div>
        ) : (
          <>
            {mode === 'select' && (
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    setMode('voice');
                    startRecording();
                  }}
                  className="flex flex-col items-center justify-center p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors group"
                >
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-emerald-200 text-emerald-600">
                    <Mic size={24} />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Voice</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors group"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-200 text-blue-600">
                    <Camera size={24} />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Photo</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </button>

                <button
                  onClick={() => setMode('text')}
                  className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors group"
                >
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-purple-200 text-purple-600">
                    <Type size={24} />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Manual</span>
                </button>
              </div>
            )}

            {mode === 'voice' && (
              <div className="flex flex-col items-center justify-center py-6">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-1000 ${isRecording ? 'bg-red-100 animate-pulse' : 'bg-gray-100'}`}>
                   {isRecording ? <Mic size={48} className="text-red-500" /> : <Loader2 className="animate-spin text-gray-400" />}
                </div>
                <p className="text-gray-600 mb-6 text-center">
                  {isRecording ? "Listening... Tap stop when done." : "Initializing..."}
                </p>
                <button
                  onClick={stopRecording}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2 shadow-lg transform active:scale-95 transition-all"
                >
                  <StopCircle size={20} />
                  Stop Recording
                </button>
              </div>
            )}

            {mode === 'text' && (
              <form onSubmit={handleTextSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Describe your expense
                  </label>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="e.g., Spent $15 on lunch at Subway, $5 for coffee"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none h-32 text-gray-700"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={!textInput.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  Add Expense
                </button>
                <button
                  type="button"
                  onClick={() => setMode('select')}
                  className="w-full text-gray-500 hover:text-gray-700 text-sm py-2"
                >
                  Back to options
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};