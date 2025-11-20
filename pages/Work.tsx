import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PROJECTS } from '../data/mockData';
import { ProjectModal } from '../components/ProjectModal';
import { Project } from '../types';
import { Filter, ArrowUpRight } from 'lucide-react';
import { GlitchText } from '../components/GlitchText';

export const Work: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filter, setFilter] = useState<string>('All');
  
  const categories = ['All', ...Array.from(new Set(PROJECTS.map(p => p.category)))];
  const filteredProjects = filter === 'All' ? PROJECTS : PROJECTS.filter(p => p.category === filter);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-theme-bg text-theme-text pt-32 pb-24"
    >
      <AnimatePresence>
        {selectedProject && (
          <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
        )}
      </AnimatePresence>

      <div className="container mx-auto px-8 md:px-32">
        <div className="mb-24">
          <div className="flex items-center gap-4 mb-4 opacity-60">
             <div className="w-2 h-2 bg-mantis-green rounded-full animate-pulse"></div>
             <span className="font-mono text-xs uppercase tracking-widest">Student Archive</span>
          </div>
          <GlitchText 
            text="The Labs." 
            className="text-[10vw] leading-[0.8] font-black tracking-tighter" 
            highlightWord="Labs."
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-16 border-b border-theme-border pb-8 sticky top-24 z-20 bg-theme-bg/90 backdrop-blur-sm py-4">
           <Filter size={16} className="mr-4" />
           {categories.map(cat => (
             <button
               key={cat}
               onClick={() => setFilter(cat)}
               className={`font-mono text-xs uppercase tracking-widest px-3 py-1 border border-transparent hover:border-theme-border transition-colors ${filter === cat ? 'bg-theme-text text-theme-bg' : 'bg-transparent text-theme-text'}`}
             >
               {cat}
             </button>
           ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-24">
           {filteredProjects.map((project, i) => (
             <motion.div
               key={project.id}
               layoutId={`project-${project.id}`}
               initial={{ opacity: 0, y: 50 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.6, delay: i * 0.1 }}
               className="group cursor-pointer"
               onClick={() => setSelectedProject(project)}
             >
               <div className="relative aspect-[4/3] overflow-hidden border border-theme-border mb-6 bg-theme-panel">
                  <motion.img 
                    src={project.image} 
                    alt={project.title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-mantis-green/20 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4 bg-theme-text text-theme-bg p-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                     <ArrowUpRight size={20} />
                  </div>
               </div>
               
               <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wider text-theme-text/60 mb-2 block">{project.category}</span>
                    <h3 className="text-4xl font-bold tracking-tighter group-hover:text-theme-accent transition-colors">{project.title}</h3>
                  </div>
                  <span className="font-mono text-xs mt-1 opacity-40">0{project.id}</span>
               </div>
             </motion.div>
           ))}
        </div>
      </div>
    </motion.div>
  );
};