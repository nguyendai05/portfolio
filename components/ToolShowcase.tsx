import React from 'react';
import { motion } from 'framer-motion';
import { Project } from '../types';
import { Wrench, ExternalLink, Sparkles, Zap } from 'lucide-react';

interface ToolShowcaseProps {
  tools: Project[];
  onToolClick: (tool: Project) => void;
}

export const ToolShowcase: React.FC<ToolShowcaseProps> = ({ tools, onToolClick }) => {
  if (tools.length === 0) return null;

  return (
    <section className="relative py-16 md:py-24 mb-16">
      {/* Background Glow Effect */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-mantis-green/5 rounded-full blur-[120px]" />
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-mantis-green/20 blur-xl rounded-full" />
            <div className="relative bg-mantis-green/10 border border-mantis-green/30 p-3 rounded-2xl">
              <Wrench className="w-6 h-6 text-mantis-green" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={12} className="text-mantis-green" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mantis-green">
                Featured
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Tools & Utilities
            </h2>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-theme-text/50 font-mono text-xs">
          <Zap size={14} className="text-mantis-green" />
          <span>{tools.length} tools available</span>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool, index) => (
          <ToolCard 
            key={tool.id} 
            tool={tool} 
            onClick={() => onToolClick(tool)}
            index={index}
            isFirst={index === 0}
          />
        ))}
      </div>

      {/* Empty State Placeholder */}
      {tools.length === 0 && (
        <div className="text-center py-16 border border-dashed border-theme-border rounded-2xl">
          <Wrench className="w-12 h-12 mx-auto mb-4 text-theme-text/30" />
          <p className="text-theme-text/50 font-mono text-sm">Tools coming soon...</p>
        </div>
      )}
    </section>
  );
};


interface ToolCardProps {
  tool: Project;
  onClick: () => void;
  index: number;
  isFirst: boolean;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, onClick, index, isFirst }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-5%" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={onClick}
      className={`group relative cursor-pointer ${isFirst ? 'md:col-span-2 lg:col-span-2' : ''}`}
    >
      {/* Card Container */}
      <div className={`relative overflow-hidden rounded-2xl border border-theme-border/50 bg-theme-panel/50 backdrop-blur-sm
        hover:border-mantis-green/50 transition-all duration-500
        ${isFirst ? 'min-h-[320px] md:min-h-[400px]' : 'min-h-[280px]'}`}
      >
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-mantis-green/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Animated Border Glow */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-[-1px] bg-gradient-to-r from-mantis-green/50 via-mantis-green/20 to-mantis-green/50 rounded-2xl blur-sm" />
        </div>

        {/* Image Section */}
        <div className={`relative overflow-hidden ${isFirst ? 'h-48 md:h-56' : 'h-36'}`}>
          <motion.img
            src={tool.image}
            alt={tool.title}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-theme-panel via-theme-panel/50 to-transparent" />
          
          {/* Tool Badge */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-mantis-green/90 text-theme-bg text-[10px] font-mono uppercase tracking-wider font-bold shadow-lg">
              <Zap size={10} />
              Tool
            </span>
          </div>

          {/* External Link Icon */}
          {tool.link && (
            <motion.a
              href={tool.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute top-4 right-4 p-2 rounded-full bg-theme-bg/80 backdrop-blur-sm border border-theme-border/50 text-theme-text hover:text-mantis-green hover:border-mantis-green/50 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ExternalLink size={14} />
            </motion.a>
          )}
        </div>

        {/* Content Section */}
        <div className="relative p-6">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-mantis-green/80 mb-2 block">
            {tool.category}
          </span>
          
          <h3 className={`font-black tracking-tight mb-3 group-hover:text-mantis-green transition-colors duration-300
            ${isFirst ? 'text-2xl md:text-3xl' : 'text-xl'}`}>
            {tool.title}
          </h3>
          
          <p className={`text-theme-text/60 leading-relaxed mb-4 ${isFirst ? 'line-clamp-3' : 'line-clamp-2'} text-sm`}>
            {tool.description}
          </p>

          {/* Tech Stack */}
          <div className="flex flex-wrap gap-2">
            {tool.technologies.slice(0, isFirst ? 5 : 3).map((tech) => (
              <span
                key={tech}
                className="text-[10px] font-mono px-2 py-1 rounded-md border border-theme-border/30 text-theme-text/50 bg-theme-bg/30"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Hover Arrow Indicator */}
        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          <div className="flex items-center gap-2 text-mantis-green font-mono text-xs">
            <span>Explore</span>
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
