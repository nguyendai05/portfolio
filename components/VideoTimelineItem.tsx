
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Maximize2, Film, Wifi, MonitorPlay, HardDrive, Video } from 'lucide-react';

export interface VideoData {
  type: 'video';
  id: string;
  year: string;
  title: string;
  description: string;
  videoUrl: string;
  platform: 'facebook' | 'youtube' | 'direct' | 'googledrive';
  thumbnail?: string;
}

interface VideoTimelineItemProps {
  data: VideoData;
  index: number;
}

export const VideoTimelineItem: React.FC<VideoTimelineItemProps> = ({ data, index }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isEven = index % 2 === 0;

  // Hide loading overlay after video starts playing
  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 2500); // Give Google Drive time to load
      return () => clearTimeout(timer);
    } else {
      setIsLoading(true);
    }
  }, [isPlaying]);

  const getEmbedUrl = (url: string, platform: string) => {
    if (platform === 'facebook') {
      const encoded = encodeURIComponent(url);
      return `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false&t=0&autoplay=1&mute=0`;
    }
    if (platform === 'youtube') {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&rel=0`;
    }
    if (platform === 'googledrive') {
      // Extract file ID from various Google Drive URL formats
      let fileId = '';

      // Format: https://drive.google.com/file/d/FILE_ID/view
      if (url.includes('/file/d/')) {
        fileId = url.split('/file/d/')[1]?.split('/')[0];
      }
      // Format: https://drive.google.com/open?id=FILE_ID
      else if (url.includes('open?id=')) {
        fileId = url.split('open?id=')[1]?.split('&')[0];
      }
      // Format: https://drive.google.com/uc?id=FILE_ID
      else if (url.includes('uc?id=')) {
        fileId = url.split('uc?id=')[1]?.split('&')[0];
      }
      // If already just the ID
      else if (!url.includes('drive.google.com')) {
        fileId = url;
      }

      // Google Drive embed URL - note: autoplay doesn't always work due to browser policies
      return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : url;
    }
    return url;
  };

  const PlatformIcon = () => {
    if (data.platform === 'facebook') return <Video size={16} />; // Facebook icon deprecated
    if (data.platform === 'youtube') return <Video size={16} />; // YouTube icon deprecated
    if (data.platform === 'googledrive') return <HardDrive size={16} />;
    return <MonitorPlay size={16} />;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ margin: "-10%" }}
      transition={{ duration: 0.8, type: "spring", bounce: 0.2 }}
      className={`flex flex-col md:flex-row items-center justify-between w-full mb-32 relative ${isEven ? 'md:flex-row-reverse' : ''}`}
    >
       {/* Connector Line (Mobile only, visual aid) */}
       <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-theme-border/10 md:hidden -z-10"></div>

       {/* Spacer for Desktop Zigzag */}
       <div className="w-full md:w-5/12 hidden md:block" />
       
       {/* Center Node (The Anchor) */}
       <div className="hidden md:flex w-2/12 justify-center relative z-10">
          <div className="relative">
            <div className={`w-6 h-6 bg-theme-bg border-2 border-theme-text rotate-45 transition-colors duration-500 ${isPlaying ? 'bg-theme-accent' : ''}`}></div>
            <div className="absolute inset-0 bg-theme-accent/50 blur-md opacity-50 animate-pulse"></div>
          </div>
       </div>

       {/* Content Card */}
       <div className={`w-full md:w-5/12 pl-12 md:pl-0 ${isEven ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
          <div className="relative group">
             
             {/* Floating Year Tag */}
             <div className={`absolute -top-5 ${isEven ? 'right-0' : 'left-0'} z-20 bg-theme-text text-theme-bg px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_var(--color-accent)] flex items-center gap-2`}>
                <span>{data.year}</span>
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span>REC</span>
             </div>

             {/* Video Frame */}
             <div
                className={`
                  bg-black border-2 border-theme-text p-1
                  shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                  group-hover:shadow-[12px_12px_0px_0px_var(--color-accent)]
                  group-hover:-translate-y-1
                  transition-all duration-300 relative overflow-hidden
                `}
              >
                <div className="relative w-full aspect-video bg-zinc-900 overflow-hidden border border-white/10">
                  {isPlaying ? (
                    <div className="relative w-full h-full bg-black">
                      <iframe
                        src={getEmbedUrl(data.videoUrl, data.platform)}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen={true}
                        title={data.title}
                        frameBorder="0"
                        loading="lazy"
                        style={{
                          border: 'none',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                        }}
                      />
                      {/* Loading overlay for Google Drive */}
                      {data.platform === 'googledrive' && isLoading && (
                        <motion.div
                          initial={{ opacity: 1 }}
                          animate={{ opacity: isLoading ? 1 : 0 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-0 bg-black/95 flex items-center justify-center pointer-events-none z-10"
                        >
                          <div className="flex flex-col items-center gap-4">
                            <motion.div
                              animate={{
                                rotate: [0, 360],
                                scale: [1, 1.1, 1],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear"
                              }}
                            >
                              <HardDrive className="text-blue-400 w-16 h-16" />
                            </motion.div>
                            <div className="flex flex-col items-center gap-2">
                              <span className="font-mono text-sm text-blue-400 font-bold">Loading from Google Drive</span>
                              <div className="flex gap-1">
                                {[0, 1, 2].map((i) => (
                                  <motion.div
                                    key={i}
                                    className="w-2 h-2 bg-blue-400 rounded-full"
                                    animate={{
                                      scale: [1, 1.5, 1],
                                      opacity: [0.5, 1, 0.5],
                                    }}
                                    transition={{
                                      duration: 1,
                                      repeat: Infinity,
                                      delay: i * 0.2,
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <div 
                      className="w-full h-full cursor-pointer relative"
                      onClick={() => setIsPlaying(true)}
                    >
                      {/* Thumbnail / Fallback Art */}
                      {data.thumbnail ? (
                        <img src={data.thumbnail} alt={data.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                      ) : (
                        <div className="w-full h-full bg-[repeating-linear-gradient(45deg,#111,#111_10px,#1a1a1a_10px,#1a1a1a_20px)] opacity-50 flex items-center justify-center">
                           <Film className="text-theme-text/20 w-24 h-24" />
                        </div>
                      )}

                      {/* Play Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                         <motion.div
                           whileHover={{ scale: 1.15, rotate: 90 }}
                           whileTap={{ scale: 0.95 }}
                           className="w-20 h-20 border-4 border-theme-accent bg-black/70 backdrop-blur-md flex items-center justify-center rounded-full group-hover:bg-theme-accent group-hover:text-black transition-all duration-300 shadow-[0_0_30px_rgba(4,120,87,0.5)] group-hover:shadow-[0_0_50px_rgba(4,120,87,0.8)]"
                         >
                            <Play size={32} className="fill-current ml-1" />
                         </motion.div>
                         {/* Pulsing ring effect */}
                         <motion.div
                           className="absolute w-20 h-20 border-2 border-theme-accent rounded-full opacity-0 group-hover:opacity-100"
                           animate={{
                             scale: [1, 1.3, 1],
                             opacity: [0.5, 0, 0.5],
                           }}
                           transition={{
                             duration: 2,
                             repeat: Infinity,
                             ease: "easeInOut"
                           }}
                         />
                      </div>

                      {/* Glitch / Noise Overlay */}
                      <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                      
                      {/* HUD Elements */}
                      <div className="absolute top-4 right-4 font-mono text-[10px] text-theme-accent bg-black/80 px-2 py-1 border border-theme-accent/30 flex items-center gap-2 backdrop-blur-sm">
                        <Wifi size={12} className="animate-pulse" />
                        LIVE FEED
                      </div>

                      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/80 to-transparent p-4 pt-16">
                         <div className={`flex items-center gap-2 font-mono text-xs mb-2 ${
                           data.platform === 'googledrive'
                             ? 'text-blue-400'
                             : data.platform === 'youtube'
                             ? 'text-red-400'
                             : data.platform === 'facebook'
                             ? 'text-blue-500'
                             : 'text-white/60'
                         }`}>
                            <PlatformIcon />
                            <span className="uppercase tracking-wider font-bold">
                              {data.platform === 'googledrive' ? 'Google Drive' : data.platform}
                            </span>
                            {data.platform === 'googledrive' && (
                              <div className="ml-auto bg-blue-500/20 border border-blue-400/30 px-2 py-0.5 text-[9px] rounded">
                                CLOUD
                              </div>
                            )}
                         </div>
                         <h3 className={`text-white text-lg font-bold leading-tight max-w-[90%] ${isEven ? 'ml-auto text-right' : ''}`}>
                           {data.title}
                         </h3>
                      </div>
                    </div>
                  )}
                </div>
             </div>

             {/* Description (Outside frame) */}
             <div className={`mt-4 font-mono text-xs opacity-70 max-w-xs ${isEven ? 'ml-auto' : ''}`}>
                <div className="flex items-center gap-2 mb-1 text-theme-accent opacity-50">
                  <Maximize2 size={12} />
                  <span>Video Log Entry</span>
                </div>
                <p>{data.description}</p>
             </div>

          </div>
       </div>
    </motion.div>
  );
};
