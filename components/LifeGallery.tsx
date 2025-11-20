import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, X, Grid, Shuffle, Aperture, Globe, Heart } from 'lucide-react';
import { GlitchText } from './GlitchText';

interface LifePhoto {
  id: string;
  url: string;
  category: 'study' | 'travel' | 'sports' | 'social' | 'hobby';
  caption: string;
  date: string;
  location: string;
  rotation: number;
  scale: number;
  zIndex: number;
}

const LIFE_MOMENTS: LifePhoto[] = [
  { 
    id: '1', 
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop', 
    category: 'study', 
    caption: 'Late night debugging at the campus library.', 
    date: '2023.11.12', 
    location: 'NLU Library',
    rotation: -5,
    scale: 1.1,
    zIndex: 1
  },
  { 
    id: '2', 
    url: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=1974&auto=format&fit=crop', 
    category: 'travel', 
    caption: 'Lost in the mist of Da Lat.', 
    date: '2023.06.15', 
    location: 'Da Lat, VN',
    rotation: 3,
    scale: 0.9,
    zIndex: 2
  },
  { 
    id: '3', 
    url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop', 
    category: 'study', 
    caption: 'Group project chaos. We shipped it though.', 
    date: '2024.01.20', 
    location: 'Coffee House',
    rotation: -2,
    scale: 1.0,
    zIndex: 3
  },
  { 
    id: '4', 
    url: 'https://images.unsplash.com/photo-1508197744197-83a2596f4dd2?q=80&w=2070&auto=format&fit=crop', 
    category: 'travel', 
    caption: 'Exploring the streets of Ho Chi Minh City.', 
    date: '2023.09.02', 
    location: 'District 1',
    rotation: 6,
    scale: 1.05,
    zIndex: 1
  },
  { 
    id: '5', 
    url: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?q=80&w=1964&auto=format&fit=crop', 
    category: 'social', 
    caption: 'Post-exam celebration.', 
    date: '2023.12.24', 
    location: 'Rooftop Bar',
    rotation: -4,
    scale: 0.95,
    zIndex: 2
  },
  { 
    id: '6', 
    url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2070&auto=format&fit=crop', 
    category: 'hobby', 
    caption: 'Mechanical keyboard build #3.', 
    date: '2024.02.10', 
    location: 'Home Lab',
    rotation: 2,
    scale: 1.0,
    zIndex: 1
  },
  { 
    id: '7', 
    url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2070&auto=format&fit=crop', 
    category: 'sports', 
    caption: 'Weekend football match.', 
    date: '2023.10.05', 
    location: 'Sports Complex',
    rotation: -3,
    scale: 1.0,
    zIndex: 2
  },
  { 
    id: '8', 
    url: 'https://images.unsplash.com/photo-1504805572947-34fad45aed93?q=80&w=2070&auto=format&fit=crop', 
    category: 'study', 
    caption: 'HCI Assignment Sketches.', 
    date: '2024.03.01', 
    location: 'Desk',
    rotation: 4,
    scale: 1.02,
    zIndex: 3
  }
];

const PhotoCard: React.FC<{ 
  photo: LifePhoto; 
  index: number; 
  layout: 'scatter' | 'grid';
  onSelect: (photo: LifePhoto) => void;
}> = ({ photo, index, layout, onSelect }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Parallax for scatter mode
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const rotate = useTransform(scrollYProgress, [0, 1], [photo.rotation - 5, photo.rotation + 5]);
  
  // Random positioning for scatter mode (deterministic based on index)
  const randomX = useMemo(() => (index % 3 - 1) * 30 + (Math.random() * 20 - 10), [index]);
  const randomY = useMemo(() => (Math.random() * 100 - 50), [index]);

  const motionStyle = layout === 'scatter' ? {
    left: `${(index % 3) * 33 + 5}%`,
    top: `${Math.floor(index / 3) * 300 + 50 + randomY}px`,
    y: y,
    rotate: rotate,
    zIndex: photo.zIndex,
    x: `${randomX}%`
  } : {
    rotate: 0,
    y: 0,
    zIndex: 1
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
      className={`relative group cursor-pointer ${
        layout === 'scatter'
          ? 'w-full md:w-[300px] md:absolute'
          : 'w-full aspect-[3/4]'
      }`}
      style={motionStyle}
      onClick={() => onSelect(photo)}
    >
      {/* Brutalist Frame */}
      <div className="relative bg-theme-panel p-2 border-2 border-theme-text shadow-[4px_4px_0px_0px_var(--color-text)] transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-[8px_8px_0px_0px_var(--color-accent)] group-hover:border-theme-accent">
        
        {/* Image Container */}
        <div className="relative overflow-hidden aspect-[3/4] bg-gray-900 grayscale group-hover:grayscale-0 transition-all duration-500">
           <img 
             src={photo.url} 
             alt={photo.caption} 
             className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
           />
           <div className="absolute inset-0 bg-theme-accent/20 opacity-0 group-hover:opacity-100 mix-blend-overlay transition-opacity duration-300" />
           
           {/* Glitch Overlay on Hover */}
           <div className="absolute inset-0 opacity-0 group-hover:opacity-20 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#000_2px,#000_4px)]" />
        </div>

        {/* Label */}
        <div className="absolute -top-3 -right-3 bg-theme-text text-theme-bg px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity delay-100">
           {photo.category}
        </div>

        {/* Caption visible only on hover/focus */}
        <div className="mt-2 border-t border-theme-text/10 pt-2">
           <div className="flex justify-between items-center font-mono text-[10px] opacity-60">
              <span className="flex items-center gap-1"><Calendar size={10}/> {photo.date}</span>
              <span>IMG_00{photo.id}</span>
           </div>
           <p className="font-bold text-xs mt-1 line-clamp-1 group-hover:text-theme-accent transition-colors">{photo.caption}</p>
        </div>
      </div>
    </motion.div>
  );
};

export const LifeGallery: React.FC = () => {
  const [layout, setLayout] = useState<'scatter' | 'grid'>('scatter');
  const [filter, setFilter] = useState<string>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<LifePhoto | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Force grid on mobile
  useEffect(() => {
    if (isMobile) setLayout('grid');
  }, [isMobile]);

  const filteredPhotos = filter === 'all' 
    ? LIFE_MOMENTS 
    : LIFE_MOMENTS.filter(p => p.category === filter);

  const categories = ['all', ...Array.from(new Set(LIFE_MOMENTS.map(p => p.category)))];

  // Calculate container height for scatter mode
  const scatterHeight = Math.ceil(filteredPhotos.length / 3) * 350 + 200;

  return (
    <div className="relative py-32 bg-theme-bg text-theme-text overflow-hidden">
      <div className="container mx-auto px-8 md:px-32">
        
        {/* Header Section */}
        <div className="mb-24 flex flex-col md:flex-row justify-between items-end gap-8">
           <div>
              <div className="flex items-center gap-2 text-theme-accent opacity-60 mb-4">
                 <Aperture size={14} className="animate-spin-slow" />
                 <span className="font-mono text-xs uppercase tracking-widest">Visual Archives</span>
              </div>
              <GlitchText 
                text="Beyond The Code." 
                className="text-[8vw] md:text-[6vw] leading-[0.85] font-black tracking-tighter"
                highlightWord="Beyond"
              />
           </div>
           
           <div className="flex flex-col items-end gap-4">
              <div className="flex gap-2 bg-theme-panel border border-theme-border p-1 rounded-lg">
                 <button 
                   onClick={() => setLayout('scatter')}
                   disabled={isMobile}
                   className={`p-2 rounded transition-colors ${layout === 'scatter' ? 'bg-theme-text text-theme-bg' : 'hover:bg-theme-border/10 opacity-50 hover:opacity-100'} disabled:opacity-20 disabled:cursor-not-allowed`}
                   title="Scatter View"
                 >
                    <Shuffle size={16} />
                 </button>
                 <button 
                   onClick={() => setLayout('grid')}
                   className={`p-2 rounded transition-colors ${layout === 'grid' ? 'bg-theme-text text-theme-bg' : 'hover:bg-theme-border/10 opacity-50 hover:opacity-100'}`}
                   title="Grid View"
                 >
                    <Grid size={16} />
                 </button>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-end">
                 {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilter(cat)}
                      className={`px-3 py-1 font-mono text-[10px] uppercase tracking-widest border transition-all ${
                        filter === cat 
                          ? 'bg-theme-accent text-black border-theme-accent font-bold' 
                          : 'border-theme-border text-theme-text/60 hover:border-theme-text hover:text-theme-text'
                      }`}
                    >
                      {cat}
                    </button>
                 ))}
              </div>
           </div>
        </div>

        {/* Gallery Container */}
        <div 
          ref={containerRef}
          className={`relative transition-all duration-500 ease-in-out ${layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8' : ''}`}
          style={{ height: layout === 'scatter' && !isMobile ? scatterHeight : 'auto' }}
        >
           <AnimatePresence mode="popLayout">
              {filteredPhotos.map((photo, index) => (
                 <PhotoCard 
                   key={photo.id} 
                   photo={photo} 
                   index={index} 
                   layout={isMobile ? 'grid' : layout} 
                   onSelect={setSelectedPhoto}
                 />
              ))}
           </AnimatePresence>

           {layout === 'scatter' && !isMobile && filteredPhotos.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center font-mono text-sm opacity-50">
                 NO_DATA_FOUND_IN_SECTOR
              </div>
           )}
        </div>
      </div>

      {/* Immersive Lightbox */}
      <AnimatePresence>
         {selectedPhoto && (
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
               onClick={() => setSelectedPhoto(null)}
            >
               {/* Close Button */}
               <button 
                 className="absolute top-8 right-8 text-white hover:text-theme-accent transition-colors z-20"
                 onClick={() => setSelectedPhoto(null)}
               >
                  <X size={32} />
               </button>

               <motion.div
                 layoutId={`photo-${selectedPhoto.id}`} // Shared layout ID could be used for seamless transition if structured correctly
                 initial={{ scale: 0.9, y: 20 }}
                 animate={{ scale: 1, y: 0 }}
                 exit={{ scale: 0.9, y: 20 }}
                 onClick={(e) => e.stopPropagation()}
                 className="relative max-w-6xl w-full h-full md:h-auto md:aspect-video bg-black border border-white/20 shadow-2xl flex flex-col md:flex-row overflow-hidden"
               >
                  {/* Main Image */}
                  <div className="w-full md:w-2/3 h-2/3 md:h-full relative bg-neutral-900 group">
                     <img 
                       src={selectedPhoto.url} 
                       alt={selectedPhoto.caption} 
                       className="w-full h-full object-contain md:object-cover"
                     />
                     <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                     
                     {/* HUD Overlay */}
                     <div className="absolute top-4 left-4 font-mono text-[10px] text-white/50 flex flex-col gap-1">
                        <span>ISO 400</span>
                        <span>f/1.8</span>
                        <span>1/500s</span>
                     </div>
                  </div>

                  {/* Info Sidebar */}
                  <div className="w-full md:w-1/3 h-1/3 md:h-full bg-theme-panel p-8 flex flex-col border-l border-white/10">
                     <div className="mb-auto">
                        <span className="inline-block px-2 py-1 bg-theme-accent text-black font-mono text-[10px] font-bold uppercase tracking-widest mb-4">
                           {selectedPhoto.category}
                        </span>
                        <h2 className="text-2xl md:text-3xl font-bold mb-6 leading-tight">
                           {selectedPhoto.caption}
                        </h2>
                        <div className="space-y-4 font-mono text-xs opacity-70">
                           <div className="flex items-center gap-3 border-b border-theme-text/10 pb-2">
                              <Calendar size={14} />
                              <span>{selectedPhoto.date}</span>
                           </div>
                           <div className="flex items-center gap-3 border-b border-theme-text/10 pb-2">
                              <MapPin size={14} />
                              <span>{selectedPhoto.location}</span>
                           </div>
                           <div className="flex items-center gap-3 border-b border-theme-text/10 pb-2">
                              <Globe size={14} />
                              <span>Coordinates: Unknown</span>
                           </div>
                        </div>
                     </div>

                     <div className="mt-8 pt-8 border-t border-theme-text/10">
                        <div className="flex justify-between items-center">
                           <div className="font-mono text-[10px] uppercase tracking-widest opacity-50">
                              Memory_ID: #{selectedPhoto.id.padStart(4, '0')}
                           </div>
                           <button className="text-theme-accent hover:text-theme-text transition-colors">
                              <Heart size={20} />
                           </button>
                        </div>
                     </div>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
};