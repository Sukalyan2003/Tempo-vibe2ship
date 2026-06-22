import React, { useState, useRef } from 'react';
import { Sparkles, Loader2, Mic, MicOff } from 'lucide-react';

interface BrainDumpProps {
  onSubmit: (text: string) => Promise<void>;
}

export function BrainDump({ onSubmit }: BrainDumpProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsRecording(true);
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        setText(prev => prev + (prev.endsWith(' ') ? '' : ' ') + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsRecording(false);
    };

    recognition.onend = () => setIsRecording(false);
    
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(text);
      setText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
      <label htmlFor="braindump" className="block text-sm font-medium text-gray-900 mb-2">
        Brain Dump
      </label>
      <p className="text-sm text-gray-500 mb-4">
        Paste everything you need to do, no matter how chaotic. Gemini will parse, prioritize, and structure your tasks automatically.
      </p>
      <div className="relative">
        <textarea
          id="braindump"
          rows={4}
          className="w-full rounded-2xl border-gray-200 border p-4 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none"
          placeholder="E.g., I need to pay the electricity bill by Friday, finish the biology report for Monday morning, and remember to buy groceries tonight..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isSubmitting}
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleRecording}
            className={`p-2 rounded-xl transition-colors ${
              isRecording 
                ? 'bg-red-100 text-red-600 animate-pulse' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={isRecording ? 'Stop recording' : 'Start voice typing'}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button
            type="submit"
            disabled={!text.trim() || isSubmitting}
            className="flex items-center gap-2 py-2 px-4 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Organize for me
          </button>
        </div>
      </div>
    </form>
  );
}
