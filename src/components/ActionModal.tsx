import React from 'react';
import { X } from 'lucide-react';
import Markdown from 'react-markdown';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  isLoading: boolean;
}

export function ActionModal({ isOpen, onClose, title, content, isLoading }: ActionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm shadow-2xl">
      <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Action: {title}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto flex-1 min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 h-full">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p>Gemini is working on it...</p>
            </div>
          ) : content ? (
            <div className="prose prose-sm md:prose-base prose-indigo max-w-none">
              <Markdown>{content}</Markdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 h-full">
              <p>No content produced. Try again.</p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-100 mt-auto bg-gray-50">
          <button 
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
