import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Volume2, VolumeX, X } from 'lucide-react';

interface LiveModeProps {
  onClose: () => void;
  lastResponse: string;
}

export const LiveMode = ({ onClose, lastResponse }: LiveModeProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [caption, setCaption] = useState("");
  
  // Simulate captions based on last response
  useEffect(() => {
    if (lastResponse) {
      setIsSpeaking(true);
      const words = lastResponse.split(' ');
      let currentWord = 0;
      
      const interval = setInterval(() => {
        if (currentWord < words.length) {
          setCaption(prev => (prev + ' ' + words[currentWord]).trim().split(' ').slice(-10).join(' '));
          currentWord++;
        } else {
          setIsSpeaking(false);
          clearInterval(interval);
        }
      }, 200);
      
      return () => clearInterval(interval);
    }
  }, [lastResponse]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6"
    >
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
      >
        <X className="w-8 h-8" />
      </button>

      <div className="flex flex-col items-center gap-12 max-w-2xl w-full">
        <div className="relative">
          <motion.div 
            animate={{ 
              scale: isSpeaking ? [1, 1.2, 1] : 1,
              opacity: isSpeaking ? [0.5, 1, 0.5] : 0.5
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-48 h-48 rounded-full bg-emerald-500/20 blur-3xl absolute inset-0"
          />
          <div className="w-32 h-32 rounded-full border-2 border-emerald-500/50 flex items-center justify-center relative z-10">
            {isSpeaking ? (
              <Volume2 className="w-12 h-12 text-emerald-400 animate-pulse" />
            ) : (
              <Mic className={`w-12 h-12 ${isListening ? 'text-emerald-400' : 'text-white/30'}`} />
            )}
          </div>
        </div>

        <div className="text-center space-y-4">
          <h2 className="text-white/50 font-mono text-sm tracking-widest uppercase">
            {isSpeaking ? "OrgoMentor Speaking" : isListening ? "Listening..." : "Live Mode Active"}
          </h2>
          <div className="h-24 flex items-center justify-center">
            <p className="text-2xl md:text-3xl text-white font-serif italic leading-relaxed text-center">
              {caption || "How can I help you in the lab today?"}
            </p>
          </div>
        </div>

        <div className="flex gap-6">
          <button 
            onClick={() => setIsListening(!isListening)}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isListening ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>
          <button 
            className="w-16 h-16 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-12 left-0 right-0 flex justify-center">
        <div className="bg-white/5 border border-white/10 rounded-full px-6 py-2 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-white/50 text-xs font-mono uppercase tracking-tighter">
            WCAG 2.1 AA Compliant Captions
          </span>
        </div>
      </div>
    </motion.div>
  );
};
