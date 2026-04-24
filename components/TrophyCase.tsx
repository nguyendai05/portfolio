import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from '../context/GamificationContext';
import { X, Trophy, Lock, Star } from 'lucide-react';

export const TrophyCase: React.FC = () => {
  const { achievements, isTrophyCaseOpen, toggleTrophyCase } = useGamification();
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <AnimatePresence>
      {isTrophyCaseOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-theme-bg/80 backdrop-blur-lg p-4 md:p-8"
          onClick={toggleTrophyCase}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-theme-panel text-theme-text w-full max-w-4xl border border-theme-border/40 shadow-2xl overflow-hidden relative rounded-2xl"
          >
            {/* Decorative grid background using theme tokens */}
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(var(--color-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-border)_1px,transparent_1px)] bg-[size:30px_30px] opacity-[0.04] pointer-events-none"
            />

            <div className="bg-theme-panel/80 backdrop-blur-sm text-theme-text p-6 md:p-8 flex justify-between items-center border-b border-theme-border/30 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-theme-accent/10 rounded-xl border border-theme-accent/40">
                  <Trophy size={24} className="text-theme-accent" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-mono text-base md:text-lg uppercase tracking-[0.25em] font-bold text-theme-text">Achievements</h3>
                  <p className="text-[10px] md:text-xs font-mono text-theme-text/60 tracking-wider">NEURAL_REWARDS_SYSTEM_V2.0</p>
                </div>
              </div>
              <div className="flex items-center gap-6 md:gap-8">
                <div className="flex flex-col items-end">
                  <span className="font-mono text-2xl md:text-3xl font-bold text-theme-text">
                    {unlockedCount} <span className="text-theme-text/30">/</span> {achievements.length}
                  </span>
                  <span className="text-[10px] md:text-xs font-mono text-theme-accent/80 uppercase tracking-wider">Unlocked</span>
                </div>
                <button
                  onClick={toggleTrophyCase}
                  aria-label="Close trophy case"
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-theme-text/10 transition-all duration-300 text-theme-text/60 hover:text-theme-text border border-transparent hover:border-theme-border/40"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-4 md:p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 max-h-[60vh] md:max-h-[65vh] overflow-y-auto relative z-10">
              {achievements.map((ach, index) => (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.05, type: "spring", stiffness: 260, damping: 20 }}
                  className={`group relative p-6 border flex flex-col gap-4 transition-all duration-300 rounded-xl overflow-hidden hover:scale-[1.02] cursor-pointer ${
                    ach.unlocked
                      ? 'bg-theme-accent/5 border-theme-accent/40 hover:border-theme-accent hover:shadow-[0_8px_30px_-12px_rgba(57,255,20,0.35)]'
                      : 'bg-theme-bg/40 border-theme-border/20 hover:border-theme-border/40'
                  }`}
                >
                  {ach.unlocked && (
                    <div className="absolute top-0 right-0 p-3 opacity-15 group-hover:opacity-30 transition-all duration-500 group-hover:rotate-12">
                      <Star size={50} className="text-theme-accent" strokeWidth={1} />
                    </div>
                  )}

                  <div className="flex items-start gap-4 relative z-10">
                    <div className={`w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-xl border transition-all duration-300 ${
                      ach.unlocked
                        ? 'bg-theme-accent/15 border-theme-accent/60 text-theme-accent group-hover:scale-110'
                        : 'bg-theme-bg/50 border-theme-border/30 text-theme-text/30'
                    }`}>
                      {ach.unlocked ? ach.icon : <Lock size={22} strokeWidth={1.5} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold text-sm uppercase mb-2 tracking-wide transition-colors duration-300 ${
                        ach.unlocked ? 'text-theme-text' : 'text-theme-text/50'
                      }`}>
                        {ach.title}
                      </h4>
                      <p className={`font-mono text-xs leading-relaxed transition-colors duration-300 ${
                        ach.unlocked ? 'text-theme-text/80' : 'text-theme-text/40'
                      }`}>
                        {ach.unlocked ? ach.description : 'Locked Achievement'}
                      </p>
                      {!ach.unlocked && ach.hint && (
                        <p className="font-mono text-[10px] text-theme-text/40 italic mt-2 flex items-center gap-1">
                          <span className="opacity-60">💡</span> {ach.hint}
                        </p>
                      )}
                    </div>
                  </div>

                  {ach.unlocked && (
                    <div className="flex items-center gap-2 relative z-10">
                      <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-theme-accent/15 text-theme-accent border border-theme-accent/40 uppercase tracking-wider">
                        ✓ Unlocked
                      </span>
                    </div>
                  )}

                  {ach.unlocked && (
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-theme-accent/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Footer accent bar (subtle, uses theme accent) */}
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-theme-accent/50 to-transparent" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
