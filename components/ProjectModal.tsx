
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink, ArrowRight, Code2, Layers } from 'lucide-react';

interface Project {
  id: number;
  title: string;
  category: string;
  image: string;
  description: string;
  technologies: string[];
  link?: string;
}

interface ProjectModalProps {
  project: Project;
  onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-8 overflow-y-auto"
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#e6e6e6] w-full max-w-5xl min-h-screen md:min-h-0 md:h-auto md:max-h-[90vh] overflow-y-auto shadow-2xl border border-black relative flex flex-col"
      >
        {/* Header / Close Button */}
        <div className="sticky top-0 z-20 flex justify-end p-4 mix-blend-difference text-white pointer-events-none">
           <button 
             onClick={onClose}
             className="bg-black text-mantis-green p-2 hover:bg-mantis-green hover:text-black transition-colors pointer-events-auto rounded-full md:rounded-none"
           >
             <X size={24} />
           </button>
        </div>

        <div className="flex flex-col md:flex-row h-full">
           {/* Image Section */}
           <div className="w-full md:w-1/2 h-64 md:h-auto relative border-b md:border-b-0 md:border-r border-black overflow-hidden group">
              <img 
                src={project.image} 
                alt={project.title} 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-mantis-green/20 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Floating Label */}
              <div className="absolute bottom-4 left-4 bg-white px-3 py-1 border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hidden md:block">
                 <span className="font-mono text-xs uppercase tracking-widest">Project_IMG_0{project.id}</span>
              </div>
           </div>

           {/* Content Section */}
           <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col bg-[#e6e6e6]">
              <div className="mb-8">
                 <span className="font-mono text-xs text-mantis-green bg-black px-2 py-1 uppercase tracking-widest inline-block mb-4">
                    {project.category}
                 </span>
                 <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-[0.9] mb-6">
                    {project.title}
                 </h2>
                 <div className="w-24 h-1 bg-black mb-8"></div>
                 <p className="text-lg md:text-xl font-sans leading-relaxed opacity-80">
                    {project.description}
                 </p>
              </div>

              <div className="mt-auto space-y-8">
                 {/* Tech Stack */}
                 <div>
                    <div className="flex items-center gap-2 mb-3 opacity-50 font-mono text-xs uppercase tracking-widest">
                       <Code2 size={14} />
                       <span>Technologies Used</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {project.technologies.map((tech, i) => (
                          <span key={i} className="border border-black px-3 py-1 text-sm font-medium hover:bg-black hover:text-white transition-colors cursor-default">
                             {tech}
                          </span>
                       ))}
                    </div>
                 </div>

                 {/* Call to Action */}
                 {project.link && (
                    <div className="pt-8 border-t border-black/10">
                       <a 
                         href={project.link}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="group w-full flex items-center justify-between bg-black text-white p-4 hover:bg-mantis-green hover:text-black transition-all duration-300 border border-transparent hover:border-black"
                       >
                          <span className="font-mono uppercase tracking-widest font-bold flex items-center gap-2">
                             View Live Project
                             <ExternalLink size={16} className="opacity-50 group-hover:opacity-100" />
                          </span>
                          <ArrowRight className="transform group-hover:translate-x-2 transition-transform" />
                       </a>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
