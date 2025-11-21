
import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GenerativeArt } from '../components/GenerativeArt';
import { GlitchText } from '../components/GlitchText';
import { ProjectModal } from '../components/ProjectModal';
import { ArrowRight, ArrowUpRight, Trophy, Star, Code2 } from 'lucide-react';
import { PROJECTS, CLIENTS, AWARDS, EXPERIMENTS } from '../data/mockData';
import { Project } from '../types';

export const Home: React.FC = () => {
  const [hoveredProject, setHoveredProject] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const yHero = useTransform(scrollYProgress, [0, 0.2], [0, -100]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const yArt = useTransform(scrollYProgress, [0, 0.25], [0, 150]);

  // Display only first 3 projects on Home
  const FEATURED_PROJECTS = PROJECTS.slice(0, 3);

  // Prepare duplicated clients list for seamless loop
  const MARQUEE_CLIENTS = [...CLIENTS, ...CLIENTS];

  return (
    <motion.div
      ref={containerRef}
      className="relative bg-theme-bg text-theme-text min-h-screen selection:bg-theme-accent selection:text-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatePresence>
        {selectedProject && (
          <ProjectModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div
          className="absolute inset-0 z-0"
          style={{ y: yArt }}
        >
          <GenerativeArt intensity={40} speed={0.8} variant="network" color="#047857" />
        </motion.div>

        <motion.div
          style={{ y: yHero, opacity: opacityHero }}
          className="relative z-10 text-center w-full px-4 md:px-0 flex flex-col items-center"
        >
          <div className="absolute -top-24 w-[1px] h-24 bg-theme-text/10 hidden md:block"></div>

          {/* 3D Parallax Hi with Advanced Effects */}
          <div
            className="relative select-none z-20 perspective-[1000px]"
            style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
          >
            {/* Animated Background Particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-theme-accent rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    scale: [0, 1.5, 0],
                    opacity: [0, 0.8, 0],
                    x: [0, (Math.random() - 0.5) * 100],
                    y: [0, (Math.random() - 0.5) * 100],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>

            {/* Dynamic Glow Effect */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="w-[500px] h-[500px] bg-theme-accent/30 blur-[100px] rounded-full"></div>
            </motion.div>

            {/* 3D Layer Stack - Deep Background */}
            {/* 3D Layer Stack - Deep Background */}
            {[6, 5, 4, 3, 2, 1].map((depth) => (
              <motion.h1
                key={`depth-${depth}`}
                className="absolute top-0 left-0 w-full text-[35vw] md:text-[25vw] leading-[0.8] font-black tracking-tighter text-theme-text/5 pointer-events-none"
                style={{
                  transform: `translateZ(-${depth * 20}px)`,
                  transformStyle: 'preserve-3d',
                }}
                animate={{
                  rotateY: [0, 2, 0, -2, 0],
                  rotateX: [0, -1, 0, 1, 0],
                }}
                transition={{
                  duration: 10 + depth,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: depth * 0.1
                }}
              >
                Hi.
              </motion.h1>
            ))}

            {/* Chromatic Aberration Layers */}
            <motion.h1
              className="absolute top-0 left-0 w-full text-[35vw] md:text-[25vw] leading-[0.8] font-black tracking-tighter text-red-500/20 pointer-events-none mix-blend-screen"
              animate={{
                x: [-2, 2, -2],
                y: [1, -1, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Hi.
            </motion.h1>

            <motion.h1
              className="absolute top-0 left-0 w-full text-[35vw] md:text-[25vw] leading-[0.8] font-black tracking-tighter text-cyan-500/20 pointer-events-none mix-blend-screen"
              animate={{
                x: [2, -2, 2],
                y: [-1, 1, -1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Hi.
            </motion.h1>

            {/* Accent Stroke Layer */}
            <motion.h1
              className="absolute top-0 left-0 w-full text-[35vw] md:text-[25vw] leading-[0.8] font-black tracking-tighter text-transparent stroke-accent-thick pointer-events-none"
              style={{
                WebkitTextStroke: '3px var(--color-accent)',
                transform: 'translateZ(30px)',
                transformStyle: 'preserve-3d',
              }}
              animate={{
                rotateY: [0, 5, 0, -5, 0],
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Hi.
            </motion.h1>

            {/* Main 3D Text with Hover Interaction */}
            <motion.div
              className="relative cursor-pointer"
              style={{ transformStyle: 'preserve-3d' }}
              whileHover={{ scale: 1.05 }}
              animate={{
                rotateY: [0, 3, 0, -3, 0],
                rotateX: [0, -2, 0, 2, 0],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <h1
                className="relative text-[35vw] md:text-[25vw] leading-[0.8] font-black tracking-tighter text-theme-text"
                style={{
                  textShadow: `
                     2px 2px 0 var(--color-accent),
                     4px 4px 0 rgba(0,0,0,0.1),
                     6px 6px 20px rgba(0,0,0,0.2),
                     0 0 40px var(--color-accent-rgb, 0.3)
                   `,
                  transform: 'translateZ(50px)',
                  transformStyle: 'preserve-3d',
                }}
              >
                Hi
                <motion.span
                  className="inline-block text-theme-accent"
                  animate={{
                    rotateZ: [0, 10, 0, -10, 0],
                    y: [0, -10, 0, -5, 0],
                    scale: [1, 1.2, 1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  .
                </motion.span>
              </h1>

              {/* Inner Glow Effect */}
              <h1
                className="absolute top-0 left-0 w-full text-[35vw] md:text-[25vw] leading-[0.8] font-black tracking-tighter text-theme-accent/30 blur-sm pointer-events-none"
                style={{
                  transform: 'translateZ(45px)',
                }}
              >
                Hi.
              </h1>
            </motion.div>

            {/* Floating 3D Decorative Elements */}
            <motion.div
              className="absolute -right-8 md:-right-16 top-[20%] pointer-events-none"
              style={{ transformStyle: 'preserve-3d' }}
              animate={{
                rotateY: [0, 360],
                rotateX: [0, 180],
                z: [0, 50, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <div
                className="w-10 h-10 md:w-16 md:h-16 border-4 border-theme-accent/50"
                style={{
                  transform: 'translateZ(100px)',
                  transformStyle: 'preserve-3d',
                }}
              />
            </motion.div>

            <motion.div
              className="absolute -left-8 md:-left-16 bottom-[20%] pointer-events-none"
              style={{ transformStyle: 'preserve-3d' }}
              animate={{
                rotateZ: [0, 360],
                rotateY: [0, -360],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <div
                className="w-8 h-8 md:w-12 md:h-12 rounded-full border-4 border-theme-text/30"
                style={{
                  transform: 'translateZ(80px)',
                  transformStyle: 'preserve-3d',
                }}
              />
            </motion.div>

            {/* Animated Text Badge */}
            <motion.div
              className="absolute right-0 md:-right-8 top-[25%]"
              initial={{ opacity: 0, x: -30, rotateZ: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                x: [-30, 10, 10, 40],
                rotateZ: [0, 12, 12, 20],
                scale: [0.8, 1, 1, 0.8],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.3, 0.7, 1]
              }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div
                className="bg-theme-text text-theme-bg px-2 py-1 md:px-4 md:py-2 font-mono text-[10px] md:text-xs font-bold border-2 border-theme-accent shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                style={{
                  transform: 'translateZ(100px)',
                }}
              >
                INITIALIZING...
              </div>
            </motion.div>

            {/* Scanline Effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none overflow-hidden"
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="w-full h-1 bg-theme-accent/50 blur-sm"
                animate={{ y: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          </div>

          <div className="mt-8 opacity-0 animate-[fadeIn_1s_ease-out_1s_forwards]">
            <p className="font-mono text-sm md:text-base uppercase tracking-[0.2em] opacity-60">
              Welcome to the void
            </p>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <motion.div
              className="w-0 h-0 border-t-[50px] border-t-transparent border-l-[80px] border-l-theme-accent border-b-[50px] border-b-transparent opacity-80 mix-blend-multiply blur-sm"
              animate={{
                rotate: [0, 10, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 10, repeat: Infinity }}
            />
          </div>

          <div className="absolute bottom-[-20vh] left-1/2 -translate-x-1/2">
            <Link to="/work" className="px-6 py-2 border border-theme-text rounded-full flex items-center gap-2 bg-theme-panel/50 backdrop-blur-sm cursor-pointer hover:bg-theme-panel transition-colors text-theme-text">
              <span className="text-sm font-mono uppercase">View Assignments</span>
              <div className="w-2 h-2 bg-theme-text rounded-full animate-pulse"></div>
            </Link>
          </div>
        </motion.div>

        {/* Bottom Left Profile */}
        <div className="absolute bottom-8 left-8 md:left-32 z-20">
          <h2 className="text-2xl font-black tracking-tighter text-theme-text relative z-10">Xuni-Dizan</h2>
          <p className="text-[10px] font-mono uppercase tracking-widest opacity-60 mb-2 relative z-10">IT Student <br /> Developer</p>
          <p className="text-xs font-bold text-theme-accent max-w-[200px] mt-1 relative z-10">“Ngày ta đại thành Java kinh phổ, ắt sẽ danh chấn thiên hạ!”</p>
          <div className="w-12 h-12 bg-theme-accent absolute -left-4 -top-4 z-0 opacity-80"></div>
        </div>
      </section>

      {/* PHILOSOPHY SECTION */}
      <section className="relative min-h-screen flex items-center py-24">
        <div className="container mx-auto px-8 md:px-32 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="md:col-span-8 md:col-start-3">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <GlitchText
                  text="I don't just write code. I try to fix it."
                  className="text-[7vw] md:text-[5vw] leading-[0.9] font-medium tracking-tight text-theme-text"
                  highlightWord="fix it."
                  highlightStyle="font-serif italic text-theme-accent"
                />
              </motion.div>

              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: '100%' }}
                transition={{ duration: 1.5 }}
                className="h-[2px] bg-theme-text mt-12 mb-12"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-sm leading-relaxed opacity-80">
                <p>
                  I am Nguyễn Xuân Đại, an IT student at Nong Lam University.
                  My journey is about bridging the gap between theory and practice,
                  one console.log at a time.
                </p>
                <div>
                  <p className="mb-6">
                    From simple HCI exercises to building personal digital spaces,
                    I am exploring the raw potential of the web. It's messy, it's fun, and it's mine.
                  </p>
                  <Link to="/about" className="inline-flex items-center gap-2 border-b border-theme-text pb-1 hover:text-theme-accent hover:border-theme-accent transition-colors">
                    ABOUT ME <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-40">
            <GenerativeArt intensity={30} speed={0.5} color="#000" variant="particles" />
          </div>
        </div>
      </section>

      {/* FEATURED WORKS */}
      <section className="relative py-32 border-t border-theme-border bg-theme-bg overflow-hidden">
        <AnimatePresence mode="popLayout">
          {hoveredProject !== null && (
            <motion.div
              key={hoveredProject}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
            >
              <motion.img
                src={PROJECTS.find(p => p.id === hoveredProject)?.image}
                alt="Project Preview"
                className="w-full h-full object-cover grayscale contrast-125"
                initial={{ scale: 1 }}
                animate={{ scale: 1.08 }}
                transition={{ duration: 4, ease: "easeOut" }}
              />
              <div className="absolute inset-0 bg-theme-bg mix-blend-screen"></div>
              <div className="absolute inset-0 bg-black/10"></div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="container mx-auto px-8 md:px-32 relative z-10">
          <div className="flex items-end justify-between mb-16 border-b border-theme-border pb-4">
            <h2 className="text-[6vw] leading-none font-black tracking-tighter">Selected Labs</h2>
            <Link to="/work" className="font-mono text-xs uppercase tracking-widest mb-2 hover:bg-theme-text hover:text-theme-bg px-2 transition-colors">View All</Link>
          </div>

          <div className="flex flex-col">
            {FEATURED_PROJECTS.map((project) => (
              <motion.div
                key={project.id}
                onMouseEnter={() => setHoveredProject(project.id)}
                onMouseLeave={() => setHoveredProject(null)}
                onClick={() => setSelectedProject(project)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="group flex flex-col md:flex-row md:items-center justify-between py-12 border-b border-theme-border hover:border-theme-text transition-colors cursor-pointer relative"
              >
                <div className="flex items-center gap-8 transform transition-transform duration-500 ease-out group-hover:-translate-y-2">
                  <span className="font-mono text-xs text-theme-accent opacity-0 group-hover:opacity-100 transition-opacity">0{project.id}</span>
                  <h3 className="text-4xl md:text-6xl font-bold tracking-tight mix-blend-multiply">{project.title}</h3>
                </div>
                <div className="mt-4 md:mt-0 flex items-center gap-4 opacity-60 group-hover:opacity-100 transition-opacity mix-blend-multiply transform transition-transform duration-500 ease-out group-hover:-translate-y-2">
                  <span className="font-mono text-xs uppercase tracking-wider">{project.category}</span>
                  <ArrowRight className="w-4 h-4 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MILESTONES */}
      <section className="py-24 border-t border-b border-theme-border bg-theme-bg">
        <div className="container mx-auto px-8 md:px-32">
          <div className="flex flex-col md:flex-row gap-16">
            <div className="md:w-1/3">
              <h2 className="text-4xl font-black tracking-tighter mb-6 flex items-center gap-4">
                Milestones.
                <Trophy size={28} className="text-theme-text opacity-20" />
              </h2>
              <p className="font-mono text-sm opacity-60 leading-relaxed max-w-[280px]">
                No Cannes Lions here (yet). Just the steady progress of learning, failing, and learning again.
              </p>
            </div>
            <div className="md:w-2/3 flex flex-col">
              {AWARDS.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group flex flex-col md:flex-row md:items-baseline justify-between py-6 border-b border-theme-border hover:border-theme-text transition-colors"
                >
                  <div className="flex gap-4 md:gap-8 items-baseline mb-2 md:mb-0">
                    <span className="font-mono text-xs opacity-40">{item.year}</span>
                    <span className="font-bold text-xl md:text-2xl group-hover:text-theme-accent transition-colors">{item.org}</span>
                  </div>
                  <div className="md:text-right">
                    <div className="font-mono text-xs uppercase tracking-wider opacity-60 group-hover:text-theme-accent transition-colors">{item.award}</div>
                    <div className="text-sm font-medium">{item.project}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOCUS AREAS PREVIEW */}
      <section className="relative min-h-screen bg-theme-text text-theme-bg flex flex-col justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <GenerativeArt intensity={60} color="#39ff14" variant="network" />
        </div>

        <div className="container mx-auto px-8 md:px-32 relative z-10">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <GlitchText
              text="I. activate strict mode."
              className="text-[12vw] leading-[0.8] font-black tracking-tighter text-transparent stroke-text hover:text-theme-accent transition-colors duration-700 cursor-default block"
              highlightWord="strict mode."
            />
          </motion.div>

          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-theme-bg/20 pt-8 font-mono">
            {['FRONT-END DEV', 'HCI STUDY', 'UI EXPERIMENTS'].map((service, i) => (
              <div key={service} className="group cursor-pointer">
                <div className="text-xs text-theme-accent mb-2">0{i + 1}</div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-theme-accent transition-colors">{service}</h3>
                <p className="text-xs opacity-50 leading-relaxed">
                  Exploring the fundamentals of web development through coursework and self-directed chaos.
                </p>
                <ArrowRight className="mt-4 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300 text-theme-accent" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TECH STACK MARQUEE */}
      <section className="py-20 bg-theme-accent overflow-hidden border-y border-theme-border">
        <div className="flex w-fit animate-marquee">
          {MARQUEE_CLIENTS.map((client, i) => (
            <div key={i} className="flex items-center mx-12 select-none">
              <span className="text-5xl md:text-7xl font-black tracking-tighter text-black opacity-90 hover:opacity-100 transition-opacity cursor-crosshair">{client}</span>
              <span className="ml-12 text-3xl opacity-40">✦</span>
            </div>
          ))}
        </div>
      </section>

      {/* LAB PREVIEW */}
      <section className="relative py-32 bg-theme-text text-theme-bg overflow-hidden border-b border-theme-border">
        <div className="absolute top-0 right-0 p-12 opacity-30 pointer-events-none">
          <div className="w-[500px] h-[500px]">
            <GenerativeArt intensity={25} color="#39ff14" variant="particles" speed={2} />
          </div>
        </div>

        <div className="container mx-auto px-8 md:px-32 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 border-b border-white/20 pb-8">
            <div>
              <div className="flex items-center gap-2 text-theme-accent mb-4">
                <Star size={16} className="animate-spin-slow" />
                <span className="font-mono text-xs uppercase tracking-widest">Learning Lab</span>
              </div>
              <h2 className="text-[5vw] leading-none font-black tracking-tighter">
                Research & <br /> <span className="text-theme-accent">Debugging</span>.
              </h2>
            </div>
            <div className="text-right md:max-w-sm mt-8 md:mt-0">
              <p className="font-mono text-sm opacity-60 leading-relaxed">
                My internal playground. Where I break things to see how they're made.
                Uncommercial, unhinged, and educational.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {EXPERIMENTS.map((exp, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="group relative aspect-square border border-white/20 bg-white/5 p-8 flex flex-col justify-between overflow-hidden hover:bg-theme-accent hover:text-black transition-colors duration-300 cursor-crosshair"
              >
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs opacity-50">LAB_{exp.id}</span>
                  <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-2">{exp.name}</h3>
                  <p className="font-mono text-xs opacity-60 group-hover:opacity-80">{exp.desc}</p>
                </div>

                <div className="absolute -bottom-12 -right-12 w-32 h-32 border border-current rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 dashed-border"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT TEASER */}
      <section className="relative min-h-screen flex items-center bg-theme-bg">
        <div className="absolute inset-0 w-full h-1/2 md:h-2/3 bg-theme-text overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop"
            alt="Digital Landscape"
            className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-theme-bg"></div>
        </div>

        <div className="container mx-auto px-8 md:px-32 pt-[40vh] relative z-10">
          <div className="bg-theme-panel p-8 md:p-16 border border-theme-border shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] max-w-5xl mx-auto">
            <GlitchText
              text="Connect."
              className="text-4xl md:text-5xl font-bold mb-12 tracking-tight block"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 font-sans text-lg">
              <div>
                <p className="mb-8">
                  I am currently a student and beginner front-end developer.
                </p>
                <p>
                  I believe that <span className="bg-theme-accent text-black px-1">curiosity</span> is the best driver for clean code.
                </p>
              </div>
              <div>
                <p className="mb-8">
                  Check out my social profiles or drop a message if you want to chat about tech, school, or debugging.
                </p>
                <div className="mt-8 flex gap-4">
                  <Link to="/contact" className="bg-theme-text text-theme-bg px-6 py-3 font-mono uppercase tracking-widest hover:bg-theme-accent hover:text-black transition-colors">
                    Say Hello
                  </Link>
                  <a href="https://github.com/Xuni-Dizan" target="_blank" rel="noreferrer" className="px-6 py-3 font-mono uppercase tracking-widest border border-theme-text hover:bg-theme-text hover:text-theme-bg transition-colors flex items-center gap-2">
                    <Code2 size={14} /> GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};
