import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from '../context/GamificationContext';
import { X, Trophy, Lock } from 'lucide-react';

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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={toggleTrophyCase}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#e6e6e6] w-full max-w-2xl border border-white shadow-2xl overflow-hidden"
          >
            <div className="bg-black text-white p-4 flex justify-between items-center border-b border-white">
               <div className="flex items-center gap-2">
                  <Trophy size={16} className="text-mantis-green" />
                  <span className="font-mono text-xs uppercase tracking-widest">Achievements</span>
               </div>
               <div className="flex items-center gap-4">
                 <span className="font-mono text-xs text-mantis-green">{unlockedCount} / {achievements.length}</span>
                 <button onClick={toggleTrophyCase} className="hover:text-mantis-green transition-colors">
                   <X size={18} />
                 </button>
               </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
               {achievements.map((ach) => (
                 <div 
                   key={ach.id}
                   className={`p-4 border ${ach.unlocked ? 'bg-white border-black' : 'bg-gray-300 border-transparent opacity-50'} flex items-start gap-4 transition-all`}
                 >
                    <div className={`w-10 h-10 flex items-center justify-center text-2xl ${ach.unlocked ? '' : 'grayscale'}`}>
                       {ach.unlocked ? ach.icon : <Lock size={20} />}
                    </div>
                    <div>
                       <h4 className="font-bold text-sm uppercase mb-1">{ach.title}</h4>
                       <p className="font-mono text-xs opacity-70">{ach.unlocked ? ach.description : 'Locked'}</p>
                    </div>
                 </div>
               ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};