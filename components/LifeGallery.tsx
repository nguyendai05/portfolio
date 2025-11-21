import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue } from 'framer-motion';
import { MapPin, Calendar, X, Grid, Shuffle, Aperture, Globe, Heart, Play, Layers, ChevronLeft, ChevronRight, Search, Sparkles } from 'lucide-react';
import { GlitchText } from './GlitchText';

// --- Helper Functions ---
/**
 * Convert Google Drive share link to direct viewable/embeddable URL
 * Supports multiple formats:
 * - /file/d/FILE_ID/view
 * - /file/d/FILE_ID/view?usp=drive_link (new format)
 * - /open?id=FILE_ID
 * - /uc?id=FILE_ID
 * 
 * Returns: https://drive.google.com/uc?export=view&id=FILE_ID
 * This format works best with <img> tags and doesn't require authentication
 */
const convertGoogleDriveUrl = (url: string): string => {
  if (!url) return url;

  // Check if it's a Google Drive link
  if (!url.includes('drive.google.com')) {
    return url;
  }

  // Extract file ID from various Google Drive URL formats
  let fileId = '';

  // Format 1: https://drive.google.com/file/d/FILE_ID/view (with or without query params)
  // Example: https://drive.google.com/file/d/1B8jchrhOqwQj8MefBCxXWaPakN5R6lXw/view?usp=drive_link
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    fileId = fileMatch[1];
  }

  // Format 2: https://drive.google.com/open?id=FILE_ID
  if (!fileId) {
    const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (openMatch && openMatch[1]) {
      fileId = openMatch[1];
    }
  }

  // Format 3: https://drive.google.com/uc?id=FILE_ID
  if (!fileId) {
    const ucMatch = url.match(/\/uc\?.*id=([a-zA-Z0-9_-]+)/);
    if (ucMatch && ucMatch[1]) {
      fileId = ucMatch[1];
    }
  }

  // If we found a file ID, return the direct view URL
  if (fileId) {
    // Use uc?export=view&id=FILE_ID for best image compatibility
    // This format works well with img tags and doesn't require authentication
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  // Fallback: return original URL
  return url;
};

const getVideoPlatform = (url: string): 'youtube' | 'googledrive' | 'direct' => {
  if (!url) return 'direct';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('drive.google.com')) return 'googledrive';
  return 'direct';
};


// --- Types ---
interface LifeMoment {
  id: string;
  type: 'image' | 'video';
  url: string;
  mediaUrls?: string[];
  videoUrl?: string;
  videoUrls?: string[]; // Support for multiple videos
  videoPlatform?: 'youtube' | 'direct' | 'googledrive';
  category: string[]; // Updated to support multiple categories
  caption: string;
  date: string;
  location: string;
  rotation: number;
  scale: number;
  zIndex: number;
}

// --- Data ---
const LIFE_MOMENTS: LifeMoment[] = [
  // {
  //   id: '1',
  //   type: 'image',
  //   url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop',
  //   category: ['study'],
  //   caption: 'Late night debugging at the campus library.',
  //   date: '2023.11.12',
  //   location: 'NLU Library',
  //   rotation: -5,
  //   scale: 1.1,
  //   zIndex: 1
  // },
  {
    id: '1',
    type: 'video',
    url: 'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743457/photo_8_2025-11-21_00-32-47_iduwdy.jpg',
    videoUrl: 'https://drive.google.com/file/d/14WDUY4il5pwmTkg_pfGnEzgOr0AYET3j/view',
    videoPlatform: 'googledrive',
    category: ['Thpt', 'memories'], // Multiple categories example
    caption: 'Hành trình đi thi Quân sự Thpt',
    date: '2022.11.19',
    location: 'Số 204 Đường Hoàng Văn Thụ, Phường 9, Tân Bình, Thành phố Hồ Chí Minh, VN',
    rotation: -5,
    scale: 0.9,
    zIndex: 2
  },
  {
    id: '2',
    type: 'image',
    mediaUrls: [
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743457/photo_6_2025-11-21_00-32-47_sfy3mv.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743457/photo_5_2025-11-21_00-32-47_qbvykz.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743456/photo_1_2025-11-21_15-30-48_qd8rq0.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743457/photo_4_2025-11-21_00-32-47_vfskhn.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763744057/photo_3_2025-11-21_00-49-04_b80gfr.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743456/photo_2_2025-11-21_15-30-48_gm6pme.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743455/photo_2_2025-11-21_15-37-34_jyalhx.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743455/photo_1_2025-11-21_15-37-34_funykt.jpg'
    ],
    url: 'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743147/quan-su-1_r2jgwq.jpg',
    category: ['Thpt', 'achievements'], // Multiple categories example
    caption: 'Thành công tốt đẹp',
    date: '2022.21.22',
    location: 'Số 204 Đường Hoàng Văn Thụ, Phường 9, Tân Bình, Thành phố Hồ Chí Minh, VN',
    rotation: -2,
    scale: 1.0,
    zIndex: 3
  },
  {
    id: '3',
    type: 'image',
    mediaUrls: [
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743465/photo_16_2025-11-21_00-32-47_ykotha.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743465/photo_17_2025-11-21_00-32-47_kghoca.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743466/photo_19_2025-11-21_00-32-47_hmjjk3.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743461/photo_12_2025-11-21_00-32-47_uuk0kn.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743471/photo_1_2025-11-21_00-26-09_kacobr.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743455/photo_1_2025-11-21_15-59-12_y1bgkq.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743463/photo_14_2025-11-21_00-32-47_onxxcw.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743466/photo_15_2025-11-21_00-32-47_y66sjy.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743472/photo_3_2025-11-21_00-26-09_vtb82r.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743459/photo_9_2025-11-21_00-32-47_ha5dlo.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743459/photo_10_2025-11-21_00-32-47_thndsl.jpg'
    ],
    url: 'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743461/photo_11_2025-11-21_00-32-47_gucco6.jpg',
    category: ['travel', 'adventure', 'friends'], // Multiple categories example
    caption: 'Chạy nước rút 3 ngày 2 đêm tại Đà Lạt',
    date: '2023.01.02',
    location: 'Đà Lạt, Vn',
    rotation: 6,
    scale: 1.05,
    zIndex: 1
  },
  {
    id: '4',
    type: 'video',
    url: 'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763747971/Screenshot_2025-11-22_0056261_omdt87.png',
    videoUrl: 'https://res.cloudinary.com/dak4x4d7u/video/upload/v1763744077/video_2025-11-21_00-56-19_qy7nhs.mp4',
    videoPlatform: 'direct',
    category: ['hobby', 'thpt', 'travel'],
    caption: 'Tối đó - Chúng tôi đã làm những điều khó hiểu',
    date: '2023.01.03',
    location: 'Đà Lạt, Vn',
    rotation: -4,
    scale: 0.95,
    zIndex: 2
  },
  {
    id: '5',
    type: 'video',
    url: 'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763745704/photo_1_2025-11-22_00-21-31_aplph1.jpg',
    videoUrl: 'https://res.cloudinary.com/dak4x4d7u/video/upload/v1763743944/dalat_fpfgqt.mp4',
    videoPlatform: 'direct',
    category: ['thpt', 'travel'],
    caption: 'Đà Lạt - Video Log',
    date: '2023.01.04',
    location: 'Đà Lạt, Vn',
    rotation: 2,
    scale: 1.0,
    zIndex: 1
  },
  {
    id: '6',
    type: 'video',
    url: 'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763748314/photo_1_2025-11-22_01-05-02_rwsyzd.jpg',
    videoUrl: 'https://res.cloudinary.com/dak4x4d7u/video/upload/v1763749805/AQMZp-eYYLMrJITzdT7h3TnyRcUixAN0wvX3TOgVaAbibViP5A9aUSSs2psqzNUHjcysYFm_9ky6rj0UGPM7VAp8J5tT4k2bNXf3GT0nD8MBJw_fuqzys.mp4',
    category: ['Tet', 'sports'],
    caption: 'Mồng 4 đi cày',
    date: '2023.01.26',
    location: 'Xã Thanh Giang, Thanh Chương, Nghệ An, VN',
    rotation: -3,
    scale: 1.0,
    zIndex: 2
  },
  {
    id: '7',
    type: 'video',
    url: 'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763751715/photo_1_2025-11-22_02-01-24_qsxyzi.jpg',
    videoUrls: [
      'https://res.cloudinary.com/dak4x4d7u/video/upload/v1763750775/AQPP2jr-1psdtttCD_3BDax2FCaLLQotgv6FY5mzRvcepdIL-xJvTyr_I8WUXVNtJMk3YUK6-ikTpUvqLlBURa6MeWmLG-QHjTHaBBdvwDsBmA_ejarfh.mp4',
      'https://res.cloudinary.com/dak4x4d7u/video/upload/v1763749888/AQPwNGfZxe7qZlTgF8AqVuxk0-yepWf75yqhxK2wROITqn5img9G93SMQuV1PSB1zLilyevFIpo8k4rydHrwP3OpVZJu2iMXrr-vlHhLIKSKXQ_u2y9ut.mp4',
      'https://res.cloudinary.com/dak4x4d7u/video/upload/v1763749888/AQO1p4PTJRIZaHP7p-F1Dc5dEJOhJJDzP05T3RAl8KvoOcrq0EKzfp7fR70xuXO8LrxU2-r_CeotJG3vrk7G2GlgfDpyYP6brXk6oTnquBOdJw_byaoi0.mp4'
    ],
    category: ['Thpt', 'sports'],
    caption: 'Tuy thất bại khó tránh nhưng cũng đã rồi, thật may rằng tôi được cùng thầy và đồng đội trải qua giây phút khó quên này.',
    date: '2023.03.05',
    location: '',
    rotation: 4,
    scale: 1.02,
    zIndex: 3
  },
  // {
  //   id: '8',
  //   type: 'video',
  //   url: 'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763751715/photo_1_2025-11-22_02-01-24_qsxyzi.jpg',
  //   videoUrls: [
  //     'https://res.cloudinary.com/dak4x4d7u/video/upload/v1763750775/AQPP2jr-1psdtttCD_3BDax2FCaLLQotgv6FY5mzRvcepdIL-xJvTyr_I8WUXVNtJMk3YUK6-ikTpUvqLlBURa6MeWmLG-QHjTHaBBdvwDsBmA_ejarfh.mp4',
  //     'https://res.cloudinary.com/dak4x4d7u/video/upload/v1763749888/AQPwNGfZxe7qZlTgF8AqVuxk0-yepWf75yqhxK2wROITqn5img9G93SMQuV1PSB1zLilyevFIpo8k4rydHrwP3OpVZJu2iMXrr-vlHhLIKSKXQ_u2y9ut.mp4',
  //     'https://res.cloudinary.com/dak4x4d7u/video/upload/v1763749888/AQO1p4PTJRIZaHP7p-F1Dc5dEJOhJJDzP05T3RAl8KvoOcrq0EKzfp7fR70xuXO8LrxU2-r_CeotJG3vrk7G2GlgfDpyYP6brXk6oTnquBOdJw_byaoi0.mp4'
  //   ],
  //   category: ['Thpt'],
  //   caption: 'HCI Assignment Sketches.',
  //   date: '2024.03.01',
  //   location: 'Desk',
  //   rotation: 4,
  //   scale: 1.02,
  //   zIndex: 3
  // }
];

// --- Components ---

const ControlDeck: React.FC<{
  filter: string;
  setFilter: (f: string) => void;
  layout: 'scatter' | 'grid';
  setLayout: (l: 'scatter' | 'grid') => void;
  categories: string[];
  totalCount: number;
}> = ({ filter, setFilter, layout, setLayout, categories, totalCount }) => {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative md:sticky md:top-8 z-40 mx-auto max-w-4xl px-4 mb-16"
    >
      <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] overflow-hidden">
        {/* Decorative Glow */}
        <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-theme-accent to-transparent opacity-50" />

        <div className="flex flex-col md:flex-row items-center justify-between p-2 md:p-4 gap-4">

          {/* Left: Stats & Search */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
              <Sparkles size={14} className="text-theme-accent" />
              <span className="text-[10px] font-mono text-white/60">MEMORIES: {totalCount.toString().padStart(2, '0')}</span>
            </div>
            <div className="relative flex-1 md:w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search archives..."
                className="w-full bg-black/20 border border-white/10 rounded-full py-1.5 pl-8 pr-4 text-xs text-white focus:outline-none focus:border-theme-accent/50 transition-colors"
              />
            </div>
          </div>

          {/* Center: Categories */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full md:w-auto pb-2 md:pb-0 mask-linear-fade">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`relative px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${filter === cat
                  ? 'text-black bg-theme-accent shadow-[0_0_15px_rgba(var(--color-accent-rgb),0.4)]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                {filter === cat && (
                  <motion.div
                    layoutId="activeFilter"
                    className="absolute inset-0 bg-theme-accent rounded-full -z-10"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Right: Layout Toggles */}
          <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-white/5">
            <button
              onClick={() => setLayout('scatter')}
              className={`p-1.5 rounded-md transition-all ${layout === 'scatter' ? 'bg-white/10 text-theme-accent shadow-inner' : 'text-white/40 hover:text-white'}`}
              title="3D Scatter"
            >
              <Shuffle size={16} />
            </button>
            <button
              onClick={() => setLayout('grid')}
              className={`p-1.5 rounded-md transition-all ${layout === 'grid' ? 'bg-white/10 text-theme-accent shadow-inner' : 'text-white/40 hover:text-white'}`}
              title="Grid View"
            >
              <Grid size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PhotoCard3D: React.FC<{
  photo: LifeMoment;
  index: number;
  layout: 'scatter' | 'grid';
  onSelect: (photo: LifeMoment) => void;
}> = ({ photo, index, layout, onSelect }) => {
  const ref = useRef<HTMLDivElement>(null);

  // Mouse tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Scroll Parallax for Scatter Mode
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const parallaxY = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  // Random positioning for scatter
  const randomOffset = useMemo(() => ({
    x: (index % 2 === 0 ? -1 : 1) * (Math.random() * 20 + 10),
    y: Math.random() * 50,
    z: Math.random() * 20 // slight depth variance
  }), []);

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
      className={`relative group perspective-1000 ${layout === 'scatter'
        ? 'w-full md:w-[45%] mb-24 md:mb-0'
        : 'w-full aspect-[4/5]'
        }`}
      style={{
        marginLeft: layout === 'scatter' ? (index % 2 === 0 ? '5%' : '50%') : 0,
        y: layout === 'scatter' ? parallaxY : 0,
        zIndex: photo.zIndex
      }}
      onClick={() => onSelect(photo)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{
          rotateX: layout === 'scatter' ? rotateX : 0,
          rotateY: layout === 'scatter' ? rotateY : 0,
          transformStyle: "preserve-3d",
        }}
        className="relative w-full h-full cursor-pointer"
      >
        {/* Glass Card Container */}
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl transition-all duration-500 group-hover:border-theme-accent/50 group-hover:shadow-[0_0_30px_rgba(var(--color-accent-rgb),0.2)]">

          {/* Image */}
          <div className="relative aspect-[4/5] overflow-hidden">
            <img
              src={convertGoogleDriveUrl(photo.url)}
              alt={photo.caption}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />

            {/* Cinematic Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

            {/* Floating Icons */}
            <div className="absolute top-4 right-4 flex gap-2">
              {photo.type === 'video' && (
                <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center border border-white/20">
                  <Play size={14} className="text-white ml-0.5" />
                </div>
              )}
              {((photo.mediaUrls && photo.mediaUrls.length > 1) || (photo.videoUrls && photo.videoUrls.length > 1)) && (
                <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center border border-white/20">
                  <Layers size={14} className="text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Info Panel (Slide Up) */}
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-1">
                {photo.category.map((cat, i) => (
                  <span key={i} className="text-[10px] font-mono uppercase tracking-widest text-theme-accent bg-theme-accent/10 px-2 py-0.5 rounded border border-theme-accent/20">
                    {cat}
                  </span>
                ))}
              </div>
              <span className="text-[10px] font-mono text-white/60 flex items-center gap-1">
                <Calendar size={10} /> {photo.date}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 group-hover:text-theme-accent transition-colors">
              {photo.caption}
            </h3>

            {/* Hidden Details that appear on hover */}
            <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-300 opacity-0 group-hover:opacity-100">
              <div className="pt-3 mt-3 border-t border-white/10 flex items-center gap-2 text-[10px] text-white/50 font-mono">
                <MapPin size={10} />
                {photo.location}
              </div>
            </div>
          </div>
        </div>

        {/* 3D Depth Layers (Decorative) */}
        <div
          className="absolute -inset-1 bg-theme-accent/20 rounded-xl blur-xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ transform: "translateZ(-20px)" }}
        />
      </motion.div>
    </motion.div>
  );
};

// --- Main Component ---

export const LifeGallery: React.FC = () => {
  const [layout, setLayout] = useState<'scatter' | 'grid'>('scatter');
  const [filter, setFilter] = useState<string>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<LifeMoment | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Force grid on mobile
  useEffect(() => {
    if (isMobile) setLayout('grid');
  }, [isMobile]);

  // Reset media index
  useEffect(() => {
    if (selectedPhoto) setCurrentMediaIndex(0);
  }, [selectedPhoto]);

  // Filter logic: Support multiple categories per moment
  // Uses .includes() to check if selected category exists in the moment's category array
  // This allows moments with multiple categories to appear when any of their categories is selected
  const filteredPhotos = useMemo(() => {
    return filter === 'all' ? LIFE_MOMENTS : LIFE_MOMENTS.filter(p => p.category.includes(filter));
  }, [filter]);

  // Extract all unique categories from all moments (including moments with multiple categories)
  const categories = useMemo(() => {
    const allCategories = LIFE_MOMENTS.flatMap(p => p.category);
    return ['all', ...Array.from(new Set(allCategories))];
  }, []);

  // Lightbox handlers
  const handleNextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhoto) {
      const urls = selectedPhoto.type === 'video' && selectedPhoto.videoUrls ? selectedPhoto.videoUrls : selectedPhoto.mediaUrls;
      if (urls) {
        setCurrentMediaIndex((prev) => (prev + 1) % urls.length);
      }
    }
  };

  const handlePrevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhoto) {
      const urls = selectedPhoto.type === 'video' && selectedPhoto.videoUrls ? selectedPhoto.videoUrls : selectedPhoto.mediaUrls;
      if (urls) {
        setCurrentMediaIndex((prev) => (prev - 1 + urls.length) % urls.length);
      }
    }
  };

  const getEmbedUrl = (url: string, platform: string) => {
    if (platform === 'youtube') {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&rel=0`;
    }
    if (platform === 'googledrive') {
      // Extract file ID from various Google Drive URL formats
      let fileId = '';

      // Format 1: /file/d/FILE_ID/view (with or without query params like ?usp=drive_link)
      const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileMatch && fileMatch[1]) {
        fileId = fileMatch[1];
      }

      // Format 2: open?id=FILE_ID
      if (!fileId) {
        const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (openMatch && openMatch[1]) {
          fileId = openMatch[1];
        }
      }

      if (fileId) {
        // Use /preview endpoint for video embedding
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
      // Fallback to simple replace
      return url.replace('/view', '/preview');
    }
    return url;
  };

  return (
    <section className="relative py-32 bg-theme-bg text-theme-text overflow-hidden min-h-screen">

      {/* Ambient Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-theme-accent/5 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">

        {/* Header */}
        <div className="mb-24 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center md:justify-start gap-2 text-theme-accent opacity-80 mb-4"
          >
            <Aperture size={16} className="animate-spin-slow" />
            <span className="font-mono text-xs uppercase tracking-[0.2em]">Chronosphere // Archive</span>
          </motion.div>

          <GlitchText
            text="Visual Memories."
            className="text-[12vw] md:text-[7vw] leading-[0.8] font-black tracking-tighter text-center md:text-left"
            highlightWord="Memories"
          />
        </div>

        {/* Control Deck */}
        <ControlDeck
          filter={filter}
          setFilter={setFilter}
          layout={layout}
          setLayout={setLayout}
          categories={categories}
          totalCount={filteredPhotos.length}
        />

        {/* Gallery Grid / Scatter */}
        <div
          ref={containerRef}
          className={`relative min-h-[80vh] transition-all duration-700 ${layout === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'
            : 'flex flex-wrap justify-center'
            }`}
        >
          <AnimatePresence mode="popLayout">
            {filteredPhotos.map((photo, index) => (
              <PhotoCard3D
                key={photo.id}
                photo={photo}
                index={index}
                layout={layout}
                onSelect={setSelectedPhoto}
              />
            ))}
          </AnimatePresence>

          {filteredPhotos.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50">
              <Globe size={48} className="mb-4 text-theme-accent animate-pulse" />
              <p className="font-mono text-sm">NO_DATA_FOUND_IN_SECTOR</p>
            </div>
          )}
        </div>

      </div>

      {/* Immersive Lightbox Overlay */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-0 md:p-8"
            onClick={() => setSelectedPhoto(null)}
          >
            {/* Close Button */}
            <button
              className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-theme-accent hover:text-black transition-all"
              onClick={() => setSelectedPhoto(null)}
            >
              <X size={24} />
            </button>

            <motion.div
              layoutId={`photo-${selectedPhoto.id}`}
              className="relative w-full h-full md:max-w-7xl md:h-[85vh] bg-[#0a0a0a] border border-white/10 rounded-none md:rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Media Area */}
              <div className="relative w-full md:w-3/4 h-[50vh] md:h-full bg-black flex items-center justify-center group">
                {selectedPhoto.type === 'video' ? (
                  (() => {
                    const currentVideoUrl = selectedPhoto.videoUrls && selectedPhoto.videoUrls.length > 0
                      ? selectedPhoto.videoUrls[currentMediaIndex]
                      : selectedPhoto.videoUrl;

                    // Determine platform for the current video
                    const currentPlatform = selectedPhoto.videoUrls && selectedPhoto.videoUrls.length > 0
                      ? getVideoPlatform(currentVideoUrl || '')
                      : (selectedPhoto.videoPlatform || 'direct');

                    if (!currentVideoUrl) return null;

                    return (
                      <>
                        {currentPlatform === 'direct' ? (
                          <video
                            key={currentVideoUrl} // Force re-render on change
                            src={currentVideoUrl}
                            className="w-full h-full object-contain"
                            controls
                            autoPlay
                            loop
                          />
                        ) : (
                          <iframe
                            key={currentVideoUrl} // Force re-render on change
                            src={getEmbedUrl(currentVideoUrl, currentPlatform)}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        )}

                        {/* Navigation for multiple videos */}
                        {selectedPhoto.videoUrls && selectedPhoto.videoUrls.length > 1 && (
                          <>
                            <button onClick={handlePrevMedia} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-theme-accent hover:text-black transition-all opacity-0 group-hover:opacity-100">
                              <ChevronLeft size={24} />
                            </button>
                            <button onClick={handleNextMedia} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-theme-accent hover:text-black transition-all opacity-0 group-hover:opacity-100">
                              <ChevronRight size={24} />
                            </button>
                            {/* Video Counter */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1 bg-black/50 backdrop-blur rounded-full border border-white/10 text-xs font-mono text-white/80">
                              {currentMediaIndex + 1} / {selectedPhoto.videoUrls.length}
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()
                ) : (
                  <>
                    <img
                      src={selectedPhoto.mediaUrls ? convertGoogleDriveUrl(selectedPhoto.mediaUrls[currentMediaIndex]) : convertGoogleDriveUrl(selectedPhoto.url)}
                      alt={selectedPhoto.caption}
                      className="w-full h-full object-contain"
                    />
                    {selectedPhoto.mediaUrls && selectedPhoto.mediaUrls.length > 1 && (
                      <>
                        <button onClick={handlePrevMedia} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-theme-accent hover:text-black transition-all opacity-0 group-hover:opacity-100">
                          <ChevronLeft size={24} />
                        </button>
                        <button onClick={handleNextMedia} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-theme-accent hover:text-black transition-all opacity-0 group-hover:opacity-100">
                          <ChevronRight size={24} />
                        </button>
                        {/* Image Counter */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1 bg-black/50 backdrop-blur rounded-full border border-white/10 text-xs font-mono text-white/80">
                          {currentMediaIndex + 1} / {selectedPhoto.mediaUrls.length}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Info Sidebar */}
              <div className="w-full md:w-1/4 h-full bg-[#111] border-l border-white/5 p-8 flex flex-col overflow-y-auto">
                <div className="flex items-center gap-2 mb-6 opacity-50">
                  <Globe size={14} />
                  <span className="text-[10px] font-mono uppercase tracking-widest">Data Log #{selectedPhoto.id}</span>
                </div>

                <h2 className="text-2xl font-bold text-white mb-4 leading-tight">{selectedPhoto.caption}</h2>

                <div className="space-y-6 mt-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-white/40 uppercase">Date</span>
                    <span className="text-sm text-white/80 flex items-center gap-2"><Calendar size={14} /> {selectedPhoto.date}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-white/40 uppercase">Location</span>
                    <span className="text-sm text-white/80 flex items-center gap-2"><MapPin size={14} /> {selectedPhoto.location}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-white/40 uppercase">Category</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedPhoto.category.map((cat, i) => (
                        <span key={i} className="inline-flex self-start items-center px-2 py-1 rounded bg-theme-accent/10 text-theme-accent text-xs font-bold border border-theme-accent/20">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-8">
                  <button className="w-full py-3 rounded border border-white/10 hover:bg-white/5 flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest transition-all group">
                    <Heart size={16} className="group-hover:text-red-500 transition-colors" />
                    Add to Favorites
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};