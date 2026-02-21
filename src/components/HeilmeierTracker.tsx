import { HEILMEIER_QUESTIONS } from "../constants";
import { ProjectDesignState } from "../types";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

interface HeilmeierTrackerProps {
  state: ProjectDesignState;
}

export const HeilmeierTracker = ({ state }: HeilmeierTrackerProps) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif italic text-xl text-slate-900 dark:text-white">Heilmeier Catechism</h3>
        <span className="text-xs font-mono bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded">
          {Math.round((Object.keys(state.answers).length / 8) * 100)}% Complete
        </span>
      </div>
      
      <div className="space-y-4">
        {HEILMEIER_QUESTIONS.map((q, i) => {
          const isAnswered = !!state.answers[i];
          const isCurrent = state.currentQuestion === i;
          
          return (
            <div 
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                isCurrent ? 'bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-200 dark:ring-emerald-800' : ''
              }`}
            >
              <div className="mt-0.5">
                {isAnswered ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Circle className={`w-5 h-5 ${isCurrent ? 'text-emerald-400 animate-pulse' : 'text-slate-300'}`} />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm leading-tight ${
                  isAnswered ? 'text-slate-500 line-through' : 
                  isCurrent ? 'text-slate-900 dark:text-white font-medium' : 
                  'text-slate-400'
                }`}>
                  {q}
                </p>
                {isAnswered && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                    Answered
                  </p>
                )}
              </div>
              {isCurrent && <ArrowRight className="w-4 h-4 text-emerald-500" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};
