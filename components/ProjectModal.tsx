import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';
import {
   X, ExternalLink, ArrowRight, Code2, Layers, Cpu, Terminal,
   Database, ScanLine, Share2, Maximize2, Minimize2, Activity,
   GitBranch, Globe, Calendar, Hash
} from 'lucide-react';
import { Project } from '../types';

// --- Types & Interfaces ---

interface ProjectModalProps {
   project: Project;
   onClose: () => void;
}

// --- Animation Variants ---

const backdropVariants = {
   hidden: { opacity: 0, backdropFilter: "blur(0px)" },
   visible: {
      opacity: 1,
      backdropFilter: "blur(8px)",
      transition: { duration: 0.4 }
   },
   exit: {
      opacity: 0,
      backdropFilter: "blur(0px)",
      transition: { duration: 0.3, delay: 0.1 }
   }
};

const containerVariants = {
   hidden: { scale: 0.95, opacity: 0, y: 20 },
   visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
         type: "spring",
         damping: 30,
         stiffness: 300,
         staggerChildren: 0.1,
         delayChildren: 0.2
      }
   },
   exit: {
      scale: 0.95,
      opacity: 0,
      y: 20,
      transition: { duration: 0.2 }
   }
};

const itemVariants = {
   hidden: { y: 20, opacity: 0 },
   visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", damping: 20, stiffness: 100 }
   }
};

// --- Sub-Components ---

const TechMatrix: React.FC<{ technologies: string[] }> = ({ technologies }) => {
   return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
         {technologies.map((tech, i) => (
            <motion.div
               key={tech}
               variants={itemVariants}
               whileHover={{ scale: 1.05, backgroundColor: "var(--color-text)", color: "var(--color-bg)" }}
               className="relative group border border-black/20 bg-white/50 p-2 flex flex-col justify-between h-20 overflow-hidden cursor-default transition-colors"
            >
               <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono opacity-50">{(i + 1).toString().padStart(2, '0')}</span>
                  <Cpu size={12} className="opacity-30 group-hover:opacity-100 transition-opacity" />
               </div>
               <span className="font-mono text-xs font-bold uppercase tracking-tight break-words z-10">
                  {tech}
               </span>
               {/* Decorative corner */}
               <div className="absolute bottom-0 right-0 w-2 h-2 bg-mantis-green opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
         ))}
      </div>
   );
};

const VisualCore: React.FC<{ project: Project }> = ({ project }) => {
   const mouseX = useMotionValue(0);
   const mouseY = useMotionValue(0);
   const containerRef = useRef<HTMLDivElement>(null);

   const handleMouseMove = (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const { left, top, width, height } = containerRef.current.getBoundingClientRect();
      mouseX.set((e.clientX - left) / width - 0.5);
      mouseY.set((e.clientY - top) / height - 0.5);
   };

   const rotateX = useTransform(mouseY, [-0.5, 0.5], [5, -5]);
   const rotateY = useTransform(mouseX, [-0.5, 0.5], [-5, 5]);

   return (
      <motion.div
         ref={containerRef}
         onMouseMove={handleMouseMove}
         onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
         className="relative w-full h-[400px] md:h-full min-h-[400px] bg-black overflow-hidden group perspective-1000"
      >
         {/* 3D Tilt Container */}
         <motion.div
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="w-full h-full relative"
         >
            {/* Main Image */}
            <motion.img
               src={project.image}
               alt={project.title}
               initial={{ scale: 1.1, filter: "grayscale(100%) blur(5px)" }}
               animate={{ scale: 1, filter: "grayscale(0%) blur(0px)" }}
               transition={{ duration: 1.5, ease: "circOut" }}
               className="w-full h-full object-cover opacity-90"
            />

            {/* Overlay Grid */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

            {/* Floating UI Elements (Parallax) */}
            <motion.div
               style={{ z: 50, x: useTransform(mouseX, [-0.5, 0.5], [20, -20]) }}
               className="absolute top-6 left-6 bg-black/80 backdrop-blur-md border border-white/20 p-3 text-white hidden md:block"
            >
               <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-mono text-[10px] uppercase tracking-widest">Live Feed</span>
               </div>
               <div className="font-mono text-xs opacity-70">
                  IMG_SEQ_{project.id.toString().padStart(3, '0')}
               </div>
            </motion.div>

            <motion.div
               style={{ z: 30, x: useTransform(mouseX, [-0.5, 0.5], [-10, 10]) }}
               className="absolute bottom-6 right-6 bg-mantis-green text-black px-4 py-2 font-bold font-mono text-sm uppercase tracking-wider shadow-lg"
            >
               {project.category}
            </motion.div>
         </motion.div>

         {/* Scanline */}
         <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/5 to-transparent h-[10%] w-full animate-[scan_4s_linear_infinite]" />
      </motion.div>
   );
};

const PhaseTimeline: React.FC<{ phases?: string[] }> = ({ phases }) => {
   if (!phases || phases.length === 0) return null;

   return (
      <div className="mt-8 pt-8 border-t border-black/10">
         <div className="flex items-center gap-2 mb-4 opacity-60">
            <GitBranch size={14} />
            <span className="font-mono text-xs uppercase tracking-widest">Development_Log</span>
         </div>
         <div className="relative flex justify-between items-center">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/10 -z-10" />

            {phases.map((phase, i) => (
               <div key={i} className="flex flex-col items-center gap-3 group cursor-default">
                  <motion.div
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     transition={{ delay: 0.5 + (i * 0.1) }}
                     className={`w-3 h-3 border-2 border-black rounded-full bg-white z-10 transition-colors duration-300 ${i === phases.length - 1 ? 'bg-mantis-green' : 'group-hover:bg-black'}`}
                  />
                  <span className="font-mono text-[10px] uppercase tracking-widest opacity-50 group-hover:opacity-100 transition-opacity bg-[#e6e6e6] px-2">
                     {phase}
                  </span>
               </div>
            ))}
         </div>
      </div>
   );
};

// --- Main Component ---

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
   // Prevent body scroll
   useEffect(() => {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
         document.body.style.overflow = 'unset';
         window.removeEventListener('keydown', handleKeyDown);
      };
   }, [onClose]);

   return (
      <AnimatePresence mode="wait">
         <motion.div
            role="dialog"
            aria-modal="true"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4 lg:p-8 overflow-y-auto"
         >
            <motion.div
               variants={containerVariants}
               onClick={(e) => e.stopPropagation()}
               className="w-full max-w-7xl bg-[#e6e6e6] min-h-screen md:min-h-0 md:h-auto md:max-h-[95vh] shadow-2xl overflow-hidden flex flex-col md:flex-row relative border border-black/50"
            >
               {/* --- LEFT PANEL: VISUAL CORE (55%) --- */}
               <div className="w-full md:w-[55%] relative border-b md:border-b-0 md:border-r border-black/20">
                  <VisualCore project={project} />

                  {/* Mobile Close Button (Visible only on small screens) */}
                  <button
                     onClick={onClose}
                     className="absolute top-4 right-4 md:hidden bg-black text-white p-2 rounded-full z-50 shadow-lg"
                  >
                     <X size={20} />
                  </button>
               </div>

               {/* --- RIGHT PANEL: DATA STREAM (45%) --- */}
               <div className="w-full md:w-[45%] flex flex-col bg-[#e6e6e6] overflow-y-auto max-h-[95vh]">
                  {/* Header Bar */}
                  <div className="sticky top-0 z-20 bg-[#e6e6e6]/90 backdrop-blur-md border-b border-black/10 p-6 flex justify-between items-center">
                     <div className="flex items-center gap-2 opacity-50">
                        <Terminal size={14} />
                        <span className="font-mono text-xs uppercase tracking-widest">System_ID: {project.id}</span>
                     </div>

                     {/* Desktop Close Button */}
                     <div className="hidden md:flex items-center gap-4">
                        <button className="opacity-40 hover:opacity-100 transition-opacity" title="Share">
                           <Share2 size={18} />
                        </button>
                        <button
                           onClick={onClose}
                           className="bg-black text-mantis-green p-2 hover:bg-mantis-green hover:text-black transition-colors"
                        >
                           <X size={20} />
                        </button>
                     </div>
                  </div>

                  {/* Content Scroll Area */}
                  <div className="p-6 md:p-10 flex-1 flex flex-col">

                     {/* Title Section */}
                     <motion.div variants={itemVariants} className="mb-8">
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-[0.9] mb-4 uppercase break-words">
                           {project.title}
                        </h2>
                        <div className="flex flex-wrap gap-3">
                           <span className="px-3 py-1 border border-black text-xs font-mono font-bold uppercase bg-white">
                              {project.category}
                           </span>
                           {project.featured && (
                              <span className="px-3 py-1 bg-mantis-green text-black text-xs font-mono font-bold uppercase flex items-center gap-1">
                                 <Activity size={12} /> Featured
                              </span>
                           )}
                        </div>
                     </motion.div>

                     {/* Description */}
                     <motion.div variants={itemVariants} className="mb-10">
                        <p className="text-lg font-sans leading-relaxed text-theme-text/90">
                           {project.description}
                        </p>
                     </motion.div>

                     {/* Tech Matrix */}
                     <motion.div variants={itemVariants} className="mb-10">
                        <div className="flex items-center gap-2 mb-4 opacity-60">
                           <Database size={14} />
                           <span className="font-mono text-xs uppercase tracking-widest">Tech_Stack_Matrix</span>
                        </div>
                        <TechMatrix technologies={project.technologies} />
                     </motion.div>

                     {/* Phase Timeline */}
                     <motion.div variants={itemVariants}>
                        <PhaseTimeline phases={project.phases} />
                     </motion.div>

                     {/* Footer / CTA */}
                     <motion.div variants={itemVariants} className="mt-auto pt-10">
                        {project.link ? (
                           <a
                              href={project.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative w-full block"
                           >
                              <div className="absolute inset-0 bg-mantis-green translate-x-2 translate-y-2 transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
                              <div className="relative bg-black text-white p-5 flex items-center justify-between border border-transparent group-hover:border-mantis-green transition-colors">
                                 <div className="flex flex-col">
                                    <span className="font-mono text-xs text-mantis-green mb-1">Access_Terminal</span>
                                    <span className="font-bold text-xl uppercase tracking-wider flex items-center gap-2">
                                       Launch Project
                                    </span>
                                 </div>
                                 <ArrowRight className="transform group-hover:translate-x-2 transition-transform text-mantis-green" />
                              </div>
                           </a>
                        ) : (
                           <div className="p-4 border border-black/10 bg-black/5 font-mono text-xs text-center uppercase opacity-60">
                              Project_Archived // No_Live_Link
                           </div>
                        )}
                     </motion.div>
                  </div>
               </div>
            </motion.div>
         </motion.div>
      </AnimatePresence>
   );
};
