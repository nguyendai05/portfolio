import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GenerativeArt } from '../components/GenerativeArt';
import { GlitchText } from '../components/GlitchText';
import { Sliders, Monitor, Maximize2, Info } from 'lucide-react';
import { useTheme, THEMES } from '../context/ThemeContext';

type ArtVariant = 'network' | 'particles' | 'matrix' | 'flow';

export const Gallery: React.FC = () => {
  const { theme } = useTheme();
  const [activeVariant, setActiveVariant] = useState<ArtVariant>('flow');
  const [intensity, setIntensity] = useState(50);
  const [speed, setSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const variants: { id: ArtVariant; label: string; desc: string }[] = [
    { id: 'network', label: 'Neural Network', desc: 'Simulated nodes with proximity connections. Represents cognitive web.' },
    { id: 'flow', label: 'Noise Field', desc: 'Perlin-like flow vectors. Visualizing data streams.' },
    { id: 'particles', label: 'Atomic Dust', desc: 'Loose particles reactive to cursor gravity.' },
    { id: 'matrix', label: 'System Rain', desc: 'The classic digital cascade. Raw data visualization.' },
  ];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Use pure black bg for matrix mode, otherwise theme background
  const bgClass = activeVariant === 'matrix' ? 'bg-black' : 'bg-theme-bg';
  
  // Contrast text logic
  const textClass = activeVariant === 'matrix' ? 'text-white' : 'text-theme-text';
  const borderClass = activeVariant === 'matrix' ? 'border-white' : 'border-theme-border';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`min-h-screen pt-24 pb-12 relative overflow-hidden flex flex-col ${bgClass}`}
    >
      {/* Background Art Layer */}
      <div className="absolute inset-0 z-0">
         <GenerativeArt 
           variant={activeVariant} 
           intensity={intensity} 
           speed={speed} 
           color={activeVariant === 'matrix' ? '#39ff14' : THEMES[theme].text} 
         />
      </div>

      {/* UI Overlay */}
      <div className="container mx-auto px-4 md:px-12 relative z-10 flex-grow flex flex-col pointer-events-none">
        
        <div className="flex justify-between items-start mb-8 pointer-events-auto">
           <div>
             <div className={`flex items-center gap-2 mb-2 opacity-60 ${textClass}`}>
                <Monitor size={14} />
                <span className="font-mono text-xs uppercase tracking-widest">
                  Visual Experiments
                </span>
             </div>
             <GlitchText 
               text={variants.find(v => v.id === activeVariant)?.label || "Gallery"} 
               className={`text-4xl md:text-6xl font-black tracking-tighter ${textClass}`}
             />
           </div>
           <button 
             onClick={toggleFullscreen}
             className={`p-3 border rounded-full hover:scale-110 transition-transform ${activeVariant === 'matrix' ? 'border-white text-white hover:bg-white hover:text-black' : 'border-theme-text text-theme-text hover:bg-theme-text hover:text-theme-bg'}`}
           >
             <Maximize2 size={20} />
           </button>
        </div>

        <div className="flex-grow"></div>

        {/* Controls Panel */}
        <div className={`bg-theme-panel/20 backdrop-blur-md border ${activeVariant === 'matrix' ? 'border-white/20' : 'border-theme-border/20'} p-6 md:p-8 rounded-lg shadow-2xl pointer-events-auto max-w-3xl mx-auto w-full mb-8`}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Variant Selector */}
              <div>
                 <h3 className={`text-xs font-mono uppercase tracking-widest mb-4 ${textClass}`}>Select Algorithm</h3>
                 <div className="grid grid-cols-2 gap-2">
                    {variants.map(v => (
                      <button
                        key={v.id}
                        onClick={() => setActiveVariant(v.id)}
                        className={`p-3 text-left text-xs font-mono border transition-all ${
                          activeVariant === v.id 
                            ? 'bg-mantis-green text-black border-mantis-green font-bold' 
                            : (activeVariant === 'matrix' ? 'border-white/20 text-white hover:border-white' : 'border-theme-border/20 text-theme-text hover:border-theme-border')
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                 </div>
                 <div className={`mt-4 text-xs opacity-70 flex gap-2 items-start ${textClass}`}>
                    <Info size={12} className="mt-0.5 shrink-0" />
                    <p>{variants.find(v => v.id === activeVariant)?.desc}</p>
                 </div>
              </div>

              {/* Parameter Sliders */}
              <div>
                 <h3 className={`text-xs font-mono uppercase tracking-widest mb-4 flex items-center gap-2 ${textClass}`}>
                    <Sliders size={12} /> Parameters
                 </h3>
                 
                 <div className="space-y-6">
                    <div>
                       <div className={`flex justify-between text-xs font-mono mb-2 ${textClass}`}>
                          <span>Intensity / Count</span>
                          <span className="text-mantis-green">{intensity}</span>
                       </div>
                       <input 
                         type="range" 
                         min="10" 
                         max="100" 
                         value={intensity} 
                         onChange={(e) => setIntensity(parseInt(e.target.value))}
                         className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-mantis-green"
                       />
                    </div>

                    <div>
                       <div className={`flex justify-between text-xs font-mono mb-2 ${textClass}`}>
                          <span>Simulation Speed</span>
                          <span className="text-mantis-green">{speed.toFixed(1)}x</span>
                       </div>
                       <input 
                         type="range" 
                         min="0.1" 
                         max="3" 
                         step="0.1"
                         value={speed} 
                         onChange={(e) => setSpeed(parseFloat(e.target.value))}
                         className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-mantis-green"
                       />
                    </div>
                 </div>
                 
                 <div className={`mt-8 pt-4 border-t ${activeVariant === 'matrix' ? 'border-white/10' : 'border-theme-border/10'}`}>
                    <p className={`text-[10px] font-mono opacity-50 text-center ${textClass}`}>
                       RENDER ENGINE: HTML5 CANVAS 2D <br/>
                       INTERACTION: MOUSE_MOVE / CLICK
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
};