import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from '../context/GamificationContext';
import { X, Trophy, Lock, Award, Star } from 'lucide-react';

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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-lg p-4 md:p-8"
          onClick={toggleTrophyCase}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-[#0a0a0a] to-[#050505] w-full max-w-4xl border border-mantis-green/20 shadow-[0_0_80px_rgba(0,255,100,0.15),0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative rounded-2xl"
          >
            {/* Decorative Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,100,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,100,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none"></div>

            <div className="bg-gradient-to-r from-black/70 via-black/60 to-black/70 backdrop-blur-sm text-mantis-green p-6 md:p-8 flex justify-between items-center border-b border-mantis-green/20 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-mantis-green/5 rounded-xl border border-mantis-green/30 shadow-[0_0_20px_rgba(0,255,100,0.1)]">
                  <Trophy size={24} className="text-mantis-green" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-mono text-base md:text-lg uppercase tracking-[0.25em] font-bold text-white">Achievements</h3>
                  <p className="text-[10px] md:text-xs font-mono text-mantis-green/70 tracking-wider">NEURAL_REWARDS_SYSTEM_V2.0</p>
                </div>
              </div>
              <div className="flex items-center gap-6 md:gap-8">
                <div className="flex flex-col items-end">
                  <span className="font-mono text-2xl md:text-3xl font-bold text-white">{unlockedCount} <span className="text-mantis-green/30">/</span> {achievements.length}</span>
                  <span className="text-[10px] md:text-xs font-mono text-mantis-green/60 uppercase tracking-wider">Unlocked</span>
                </div>
                <button
                  onClick={toggleTrophyCase}
                  aria-label="Close trophy case"
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-all duration-300 text-white/50 hover:text-white border border-transparent hover:border-mantis-green/20"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-h-[65vh] overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-mantis-green/30 scrollbar-track-transparent">
              {achievements.map((ach, index) => (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.06, type: "spring", stiffness: 260, damping: 20 }}
                  className={`group relative p-6 border backdrop-blur-sm flex flex-col gap-4 transition-all duration-500 rounded-xl overflow-hidden ${ach.unlocked
                    ? 'bg-gradient-to-br from-white/8 to-white/4 border-mantis-green/30 hover:border-mantis-green/60 hover:shadow-[0_0_30px_rgba(0,255,100,0.15)] hover:from-white/12 hover:to-white/6'
                    : 'bg-gradient-to-br from-white/2 to-transparent border-white/5 hover:border-white/10 hover:from-white/3'
                    } hover:scale-[1.02] cursor-pointer`}
                >
                  {/* Animated gradient border on hover */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${ach.unlocked ? 'bg-gradient-to-br from-mantis-green/10 via-transparent to-mantis-green/5' : ''}`}></div>

                  {ach.unlocked && (
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-25 transition-all duration-500 group-hover:rotate-12">
                      <Star size={50} className="text-mantis-green" strokeWidth={1} />
                    </div>
                  )}

                  <div className="flex items-start gap-4 relative z-10">
                    <div className={`w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-xl border transition-all duration-500 ${ach.unlocked
                      ? 'bg-gradient-to-br from-mantis-green/15 to-mantis-green/5 border-mantis-green/50 text-mantis-green shadow-[0_0_20px_rgba(0,255,100,0.25)] group-hover:shadow-[0_0_30px_rgba(0,255,100,0.4)] group-hover:scale-110'
                      : 'bg-black/50 border-white/10 text-white/20'
                      }`}>
                      {ach.unlocked ? ach.icon : <Lock size={22} strokeWidth={1.5} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold text-sm uppercase mb-2 tracking-wide transition-colors duration-300 ${ach.unlocked ? 'text-white' : 'text-white/40'}`}>
                        {ach.title}
                      </h4>
                      <p className={`font-mono text-xs leading-relaxed transition-colors duration-300 ${ach.unlocked ? 'text-mantis-green/90' : 'text-white/20'}`}>
                        {ach.unlocked ? ach.description : 'Locked Achievement'}
                      </p>
                      {!ach.unlocked && ach.hint && (
                        <p className="font-mono text-[10px] text-white/30 italic mt-2 flex items-center gap-1">
                          <span className="opacity-50">💡</span> {ach.hint}
                        </p>
                      )}
                    </div>
                  </div>

                  {ach.unlocked && (
                    <div className="flex items-center gap-2 relative z-10">
                      <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-mantis-green/10 text-mantis-green border border-mantis-green/30 shadow-[0_0_10px_rgba(0,255,100,0.1)] uppercase tracking-wider">
                        ✓ Unlocked
                      </span>
                    </div>
                  )}

                  {/* Bottom glow effect */}
                  {ach.unlocked && (
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-mantis-green/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Footer decoration */}
            <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-mantis-green/60 to-transparent relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};