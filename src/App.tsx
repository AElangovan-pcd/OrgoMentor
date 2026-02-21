/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Paperclip, 
  Mic, 
  Download, 
  FlaskConical, 
  ShieldAlert, 
  History, 
  Settings,
  ChevronRight,
  Plus,
  Trash2,
  FileText,
  FileDown,
  Image as ImageIcon
} from 'lucide-react';
import { geminiService } from './services/gemini';
import { exportToMarkdown, exportToPDF, exportToWord } from './services/exportService';
import { ChatMessage, ProjectDesignState, MessagePart } from './types';
import { FormulaRenderer } from './components/FormulaRenderer';
import { HeilmeierTracker } from './components/HeilmeierTracker';
import { LiveMode } from './components/LiveMode';
import { HEILMEIER_QUESTIONS } from './constants';
import confetti from 'canvas-confetti';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [projectState, setProjectState] = useState<ProjectDesignState>({
    currentQuestion: -1,
    answers: {},
    isComplete: false
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() && !isLoading) return;

    const userParts: MessagePart[] = [{ text: input }];
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      parts: userParts,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Track Heilmeier Progress if active
    if (projectState.currentQuestion >= 0) {
      setProjectState(prev => ({
        ...prev,
        answers: { ...prev.answers, [prev.currentQuestion]: input },
        currentQuestion: prev.currentQuestion + 1,
        isComplete: prev.currentQuestion === 7
      }));
      
      if (projectState.currentQuestion === 7) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }

    try {
      const response = await geminiService.sendMessage(messages, userParts);
      const modelMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        parts: [{ text: response }],
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        parts: [{ text: "I encountered an error. Please check your connection or API key." }],
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      const userParts: MessagePart[] = [
        { text: `I've uploaded a file: ${file.name}. Please analyze it.` },
        { inlineData: { mimeType: file.type, data: base64 } }
      ];
      
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        parts: userParts,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await geminiService.sendMessage(messages, userParts);
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'model',
          parts: [{ text: response }],
          timestamp: Date.now()
        }]);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const startProjectDesign = () => {
    setProjectState({
      currentQuestion: 0,
      answers: {},
      isComplete: false
    });
    const initialMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'model',
      parts: [{ text: "Excellent. Let's design your laboratory project using the Heilmeier Catechism. I'll ask you 8 questions to sharpen your thinking. \n\n**Question 1:** " + HEILMEIER_QUESTIONS[0] }],
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, initialMsg]);
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 border-right border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col hidden lg:flex">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif italic text-xl font-bold tracking-tight">OrgoMentor</h1>
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Expert AI Tutor</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-2">
            <button 
              onClick={() => setMessages([])}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> New Session
            </button>
            <button 
              onClick={startProjectDesign}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-sm font-medium border border-emerald-100 dark:border-emerald-800"
            >
              <FlaskConical className="w-4 h-4" /> Project Design
            </button>
          </div>

          {projectState.currentQuestion >= 0 && (
            <HeilmeierTracker state={projectState} />
          )}

          <div className="space-y-3">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 px-4">Safety Protocols</h3>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium text-xs">
                <ShieldAlert className="w-4 h-4" /> SDS Review Required
              </div>
              <p className="text-[11px] text-amber-600 dark:text-amber-500 leading-relaxed">
                Always consult the Safety Data Sheet before handling any reagents. Fume hoods are mandatory for volatile organics.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">Chemistry Student</p>
              <p className="text-[10px] text-slate-400">Undergraduate</p>
            </div>
            <Settings className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <div className="lg:hidden w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
              <FlaskConical className="w-5 h-5" />
            </div>
            <h2 className="font-serif italic text-lg text-slate-900 dark:text-white">
              {projectState.currentQuestion >= 0 ? "Project Design Session" : "General Chemistry Guidance"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsLiveMode(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              <Mic className="w-4 h-4" /> Live Mode
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity text-xs font-medium"
              >
                <Download className="w-4 h-4" /> Export
              </button>
              
              <AnimatePresence>
                {showExportMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 z-20"
                  >
                    <button 
                      onClick={() => { exportToMarkdown(messages, "Chemistry"); setShowExportMenu(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-xs text-left"
                    >
                      <FileText className="w-4 h-4 text-slate-400" /> Markdown (.md)
                    </button>
                    <button 
                      onClick={() => { exportToPDF(messages, "Chemistry"); setShowExportMenu(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-xs text-left"
                    >
                      <FileDown className="w-4 h-4 text-red-400" /> PDF Document (.pdf)
                    </button>
                    <button 
                      onClick={() => { exportToWord(messages, "Chemistry"); setShowExportMenu(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-xs text-left"
                    >
                      <FileDown className="w-4 h-4 text-blue-400" /> Word Document (.docx)
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <FlaskConical className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-serif italic">Welcome to OrgoMentor</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  I'm your expert AI tutor for organic chemistry. I can help with mechanisms, spectral interpretation, or designing your next lab project.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full">
                <button 
                  onClick={() => setInput("Explain the mechanism of the Diels-Alder reaction.")}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-left hover:border-emerald-500 transition-colors"
                >
                  "Explain the Diels-Alder mechanism..."
                </button>
                <button 
                  onClick={() => setInput("How do I interpret an NMR spectrum with a singlet at 3.8 ppm?")}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-left hover:border-emerald-500 transition-colors"
                >
                  "How to interpret NMR peaks..."
                </button>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] lg:max-w-[70%] space-y-2`}>
                <div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                    {msg.role === 'user' ? 'Student' : 'OrgoMentor'}
                  </span>
                  <span className="text-[10px] text-slate-300">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={`p-5 rounded-2xl shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-emerald-600 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-tl-none'
                }`}>
                  {msg.parts.map((part, i) => (
                    <div key={i}>
                      {part.text && (
                        <div className={msg.role === 'user' ? 'text-white' : ''}>
                          <FormulaRenderer content={part.text} />
                        </div>
                      )}
                      {part.inlineData && (
                        <div className="mt-3 rounded-lg overflow-hidden border border-white/20">
                          <img 
                            src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} 
                            alt="Attachment"
                            className="max-w-full h-auto"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                <div className="flex gap-1">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                </div>
                <span className="text-xs text-slate-400 font-mono">Self-auditing response...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto relative">
            <div className="relative flex items-end gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-emerald-500 transition-colors"
                title="Upload Image/Spectra"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload}
                accept="image/*,.pdf"
                className="hidden" 
              />
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={projectState.currentQuestion >= 0 ? "Enter your answer..." : "Ask OrgoMentor about a mechanism or spectrum..."}
                className="flex-1 bg-transparent border-none focus:ring-0 py-3 px-2 text-sm resize-none min-h-[44px] max-h-32"
                rows={1}
              />
              <button 
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-600/20"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between px-2">
              <p className="text-[10px] text-slate-400 font-mono">
                Shift + Enter for new line • OrgoMentor v2.5
              </p>
              <div className="flex items-center gap-4">
                <button 
                  type="button"
                  onClick={() => setIsLiveMode(true)}
                  className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1 hover:opacity-80"
                >
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Live Mode
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Live Mode Overlay */}
      <AnimatePresence>
        {isLiveMode && (
          <LiveMode 
            onClose={() => setIsLiveMode(false)} 
            lastResponse={messages.filter(m => m.role === 'model').slice(-1)[0]?.parts[0]?.text || ""}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
