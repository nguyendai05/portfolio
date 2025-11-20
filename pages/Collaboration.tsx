import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlitchText } from '../components/GlitchText';
import { Users, Plus, ThumbsUp, Tag, Filter, MessageSquare, X, Zap } from 'lucide-react';

interface Idea {
  id: number;
  title: string;
  description: string;
  tags: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  upvotes: number;
  lookingForTeam: boolean;
  author: string;
}

const MOCK_IDEAS: Idea[] = [
  {
    id: 1,
    title: "AI-Powered Plant Waterer",
    description: "IoT system using Raspberry Pi and Gemini API to analyze soil moisture and plant health, then water automatically.",
    tags: ["IoT", "Python", "React", "AI"],
    difficulty: "Hard",
    upvotes: 42,
    lookingForTeam: true,
    author: "GreenThumb"
  },
  {
    id: 2,
    title: "Brutalist Todo App",
    description: "A task manager that insults you when you miss deadlines. High contrast, no animations, pure anxiety.",
    tags: ["React", "LocalStorage", "CSS"],
    difficulty: "Easy",
    upvotes: 128,
    lookingForTeam: false,
    author: "Xuni-Dizan"
  },
  {
    id: 3,
    title: "Decentralized Social Graph",
    description: "Visualizing wallet connections on Ethereum using Three.js force-directed graphs.",
    tags: ["Web3", "Three.js", "Solidity"],
    difficulty: "Expert",
    upvotes: 8,
    lookingForTeam: true,
    author: "CryptoNomad"
  },
  {
    id: 4,
    title: "Retro Terminal Portfolio",
    description: "A portfolio template that looks exactly like an Ubuntu terminal. Fully keyboard navigable.",
    tags: ["Vue", "Typescript"],
    difficulty: "Medium",
    upvotes: 24,
    lookingForTeam: false,
    author: "LinuxFan"
  }
];

export const Collaboration: React.FC = () => {
  const [ideas, setIdeas] = useState<Idea[]>(MOCK_IDEAS);
  const [filter, setFilter] = useState<'All' | 'Team' | 'Easy' | 'Hard'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newIdea, setNewIdea] = useState({ title: '', description: '', tags: '', difficulty: 'Medium' });

  const handleUpvote = (id: number) => {
    setIdeas(prev => prev.map(idea => 
      idea.id === id ? { ...idea, upvotes: idea.upvotes + 1 } : idea
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const idea: Idea = {
      id: Date.now(),
      title: newIdea.title,
      description: newIdea.description,
      tags: newIdea.tags.split(',').map(t => t.trim()),
      difficulty: newIdea.difficulty as any,
      upvotes: 0,
      lookingForTeam: true,
      author: "Guest_User"
    };
    setIdeas([idea, ...ideas]);
    setIsModalOpen(false);
    setNewIdea({ title: '', description: '', tags: '', difficulty: 'Medium' });
  };

  const filteredIdeas = ideas.filter(idea => {
    if (filter === 'All') return true;
    if (filter === 'Team') return idea.lookingForTeam;
    return idea.difficulty === filter;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-theme-bg text-theme-text pt-32 pb-24"
    >
      <div className="container mx-auto px-8 md:px-32">
        
        {/* Header */}
        <div className="mb-16 flex flex-col md:flex-row justify-between items-end gap-8">
          <div>
             <div className="flex items-center gap-2 text-theme-accent opacity-60 mb-4">
                <Users size={14} />
                <span className="font-mono text-xs uppercase tracking-widest">Community Hive</span>
             </div>
             <GlitchText 
               text="Collaboration Board." 
               className="text-[6vw] leading-[0.9] font-black tracking-tighter"
               highlightWord="Board."
             />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-theme-text text-theme-bg px-6 py-4 font-mono uppercase tracking-widest hover:bg-mantis-green hover:text-black transition-colors flex items-center gap-2 group shadow-[8px_8px_0px_0px_var(--color-accent)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
          >
            <Plus size={16} />
            Propose Idea
          </button>
        </div>

        {/* Controls */}
        <div className="sticky top-24 z-30 bg-theme-bg/90 backdrop-blur-sm py-4 mb-12 border-b border-theme-border flex flex-wrap gap-4 items-center">
           <Filter size={16} className="mr-2 opacity-50" />
           {['All', 'Team', 'Easy', 'Hard'].map(f => (
             <button
               key={f}
               onClick={() => setFilter(f as any)}
               className={`px-4 py-2 font-mono text-xs uppercase tracking-widest border transition-all ${
                 filter === f 
                   ? 'bg-theme-text text-theme-bg border-theme-text' 
                   : 'bg-transparent text-theme-text border-transparent hover:border-theme-border'
               }`}
             >
               {f === 'Team' ? 'Looking for Team' : f}
             </button>
           ))}
           <div className="ml-auto font-mono text-xs opacity-50 hidden md:block">
             {filteredIdeas.length} PROJECTS FOUND
           </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           <AnimatePresence mode="popLayout">
             {filteredIdeas.map((idea) => (
               <motion.div
                 key={idea.id}
                 layout
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 className="bg-theme-panel border border-theme-border p-8 flex flex-col shadow-[10px_10px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[15px_15px_0px_0px_var(--color-border)] hover:-translate-y-1 transition-all duration-300 group"
               >
                  <div className="flex justify-between items-start mb-6">
                     <div className="flex gap-2 flex-wrap">
                        {idea.tags.map(tag => (
                          <span key={tag} className="bg-theme-bg px-2 py-1 text-[10px] font-mono uppercase tracking-wide border border-transparent group-hover:border-theme-border/10 transition-colors">
                            {tag}
                          </span>
                        ))}
                     </div>
                     <span className={`px-2 py-1 text-[10px] font-bold uppercase border border-theme-border ${idea.difficulty === 'Easy' ? 'bg-green-100 text-green-800' : idea.difficulty === 'Hard' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {idea.difficulty}
                     </span>
                  </div>

                  <h3 className="text-2xl font-bold leading-tight mb-4 group-hover:text-theme-accent transition-colors">{idea.title}</h3>
                  <p className="font-mono text-xs opacity-60 leading-relaxed mb-8 flex-grow">
                    {idea.description}
                  </p>

                  <div className="border-t border-theme-border/10 pt-6 mt-auto flex justify-between items-center">
                     <button 
                       onClick={() => handleUpvote(idea.id)}
                       className="flex items-center gap-2 text-xs font-bold hover:text-theme-accent transition-colors"
                     >
                        <ThumbsUp size={14} />
                        <span>{idea.upvotes}</span>
                     </button>
                     
                     <div className="flex items-center gap-4">
                        {idea.lookingForTeam && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-theme-accent animate-pulse">
                             <Zap size={12} className="fill-current" />
                             TEAM
                          </div>
                        )}
                        <button className="bg-theme-text text-theme-bg p-2 hover:bg-mantis-green hover:text-black transition-colors">
                           <MessageSquare size={14} />
                        </button>
                     </div>
                  </div>
               </motion.div>
             ))}
           </AnimatePresence>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setIsModalOpen(false)}
          >
             <motion.div
               initial={{ y: 50, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: 50, opacity: 0 }}
               onClick={e => e.stopPropagation()}
               className="bg-theme-panel w-full max-w-lg border-2 border-theme-text shadow-2xl overflow-hidden"
             >
                <div className="bg-theme-text text-theme-bg p-4 flex justify-between items-center border-b border-theme-text">
                   <span className="font-mono text-xs uppercase tracking-widest">New_Proposal.exe</span>
                   <button onClick={() => setIsModalOpen(false)} className="hover:text-mantis-green"><X size={18}/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                   <div>
                      <label className="block font-mono text-xs uppercase tracking-widest mb-2">Project Title</label>
                      <input 
                        type="text" 
                        required
                        value={newIdea.title}
                        onChange={e => setNewIdea({...newIdea, title: e.target.value})}
                        className="w-full bg-theme-bg p-3 border border-theme-border focus:border-mantis-green outline-none transition-colors"
                        placeholder="e.g., Quantum To-Do List"
                      />
                   </div>
                   <div>
                      <label className="block font-mono text-xs uppercase tracking-widest mb-2">Description</label>
                      <textarea 
                        required
                        rows={3}
                        value={newIdea.description}
                        onChange={e => setNewIdea({...newIdea, description: e.target.value})}
                        className="w-full bg-theme-bg p-3 border border-theme-border focus:border-mantis-green outline-none transition-colors"
                        placeholder="Briefly explain your idea..."
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block font-mono text-xs uppercase tracking-widest mb-2">Tags (comma sep)</label>
                         <input 
                           type="text" 
                           required
                           value={newIdea.tags}
                           onChange={e => setNewIdea({...newIdea, tags: e.target.value})}
                           className="w-full bg-theme-bg p-3 border border-theme-border focus:border-mantis-green outline-none transition-colors"
                           placeholder="React, IoT, Web3"
                         />
                      </div>
                      <div>
                         <label className="block font-mono text-xs uppercase tracking-widest mb-2">Difficulty</label>
                         <select 
                           value={newIdea.difficulty}
                           onChange={e => setNewIdea({...newIdea, difficulty: e.target.value})}
                           className="w-full bg-theme-bg p-3 border border-theme-border focus:border-mantis-green outline-none"
                         >
                            <option>Easy</option>
                            <option>Medium</option>
                            <option>Hard</option>
                            <option>Expert</option>
                         </select>
                      </div>
                   </div>

                   <button type="submit" className="w-full bg-theme-text text-theme-bg py-4 font-mono uppercase tracking-widest hover:bg-mantis-green hover:text-black transition-colors font-bold">
                      Submit to Board
                   </button>
                </form>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};