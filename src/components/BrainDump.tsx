import React, { useState, useRef } from 'react';
import { Sparkles, Loader2, Mic, MicOff, ImagePlus } from 'lucide-react';
import { useToast } from './ToastContext';

interface BrainDumpProps {
  onSubmit: (text: string) => Promise<void>;
  onImageSubmit?: (base64: string, mimeType: string) => Promise<void>;
}

export function BrainDump({ onSubmit, onImageSubmit }: BrainDumpProps) {
  const { addToast } = useToast();
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      addToast('Speech recognition is not supported in this browser.', 'error');
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageSubmit) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please upload a valid image file.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast('Image must be under 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setIsSubmitting(true);
        const base64WithScheme = reader.result as string;
        const base64Data = base64WithScheme.split(',')[1];
        await onImageSubmit(base64Data, file.type);
      } finally {
        setIsSubmitting(false);
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
        Paste everything you need to do, upload a picture of your whiteboard, or speak your thoughts. Gemini will parse, prioritize, and structure your tasks automatically.
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
          {onImageSubmit && (
            <>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="p-2 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                title="Upload image"
              >
                <ImagePlus className="w-5 h-5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={toggleRecording}
            disabled={isSubmitting}
            className={`p-2 rounded-xl transition-colors disabled:opacity-50 ${
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
