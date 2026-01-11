import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { Scan, Activity, Cpu, Zap } from 'lucide-react';

interface AboutPortrait3DProps {
    motionPaused?: boolean;
}

export const AboutPortrait3D: React.FC<AboutPortrait3DProps> = ({ motionPaused = false }) => {
    const { theme } = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Motion values for tilt effect
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth spring physics for the tilt
    const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
    const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

    // Transform mouse position into rotation degrees
    const rotateX = useTransform(mouseY, [-0.5, 0.5], [7, -7]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], [-7, 7]);

    // Parallax layers
    const portraitX = useTransform(mouseX, [-0.5, 0.5], [-15, 15]);
    const portraitY = useTransform(mouseY, [-0.5, 0.5], [-15, 15]);

    const badgeX = useTransform(mouseX, [-0.5, 0.5], [-25, 25]);
    const badgeY = useTransform(mouseY, [-0.5, 0.5], [-25, 25]);

    const bgX = useTransform(mouseX, [-0.5, 0.5], [10, -10]);
    const bgY = useTransform(mouseY, [-0.5, 0.5], [10, -10]);

    const tagOneX = useTransform(mouseX, [-0.5, 0.5], [15, -15]);
    const tagOneY = useTransform(mouseY, [-0.5, 0.5], [15, -15]);
    const tagTwoX = useTransform(mouseX, [-0.5, 0.5], [10, -10]);
    const tagTwoY = useTransform(mouseY, [-0.5, 0.5], [10, -10]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (motionPaused) return;
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();

        // Calculate normalized position (-0.5 to 0.5)
        const width = rect.width;
        const height = rect.height;

        const mouseXVal = (e.clientX - rect.left) / width - 0.5;
        const mouseYVal = (e.clientY - rect.top) / height - 0.5;

        x.set(mouseXVal);
        y.set(mouseYVal);
    };

    const handleMouseLeave = () => {
        if (motionPaused) return;
        setIsHovered(false);
        x.set(0);
        y.set(0);
    };

    const handleMouseEnter = () => {
        if (motionPaused) return;
        setIsHovered(true);
    };

    // Floating animation for idle state
    const floatingAnim = {
        y: [0, -10, 0],
        rotate: [0, 1, -1, 0],
        transition: {
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
        }
    };

    useEffect(() => {
        if (!motionPaused) return;
        setIsHovered(false);
        x.set(0);
        y.set(0);
    }, [motionPaused, x, y]);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-[400px] md:h-[600px] perspective-1000 flex items-center justify-center py-8"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                className="relative w-full max-w-md h-full preserve-3d"
                style={{
                    rotateX: motionPaused ? 0 : rotateX,
                    rotateY: motionPaused ? 0 : rotateY,
                    transformStyle: "preserve-3d",
                }}
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
            >
                {/* LAYER 1: Back Shadow Plate / Neon Glow */}
                <motion.div
                    className="absolute inset-0 rounded-xl bg-theme-accent/20 blur-2xl -z-20"
                    style={{ x: motionPaused ? 0 : bgX, y: motionPaused ? 0 : bgY, scale: 0.9 }}
                    animate={motionPaused ? { opacity: 0.3 } : { opacity: [0.3, 0.6, 0.3] }}
                    transition={motionPaused ? { duration: 0 } : { duration: 4, repeat: Infinity }}
                />

                <motion.div
                    className="absolute inset-0 border border-theme-border/30 bg-theme-panel/10 backdrop-blur-sm rounded-lg -z-10"
                    style={{
                        x: motionPaused ? 0 : bgX,
                        y: motionPaused ? 0 : bgY,
                        translateZ: -40,
                        rotateZ: -2
                    }}
                >
                    {/* Grid Pattern Background */}
                    <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-theme-accent/50 rounded-tl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-theme-accent/50 rounded-br-lg"></div>
                </motion.div>

                {/* LAYER 2: Main Console Card */}
                <motion.div
                    className="absolute inset-4 border border-theme-border bg-theme-bg/80 overflow-hidden rounded-sm shadow-2xl"
                    style={{
                        translateZ: 0,
                        transformStyle: "preserve-3d"
                    }}
                >
                    {/* Inner Grid/Noise */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#000_2px,#000_4px)]"></div>

                    {/* Header Bar */}
                    <div className="absolute top-0 left-0 right-0 h-8 bg-theme-text/5 border-b border-theme-border flex items-center px-4 justify-between z-10">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        </div>
                        <div className="font-mono text-[10px] opacity-50 uppercase tracking-widest">
                            ID: XUNI-DIZAN-05
                        </div>
                    </div>

                    {/* Portrait Container */}
                    <div className="relative w-full h-full flex items-end justify-center overflow-hidden">
                        {/* Background Gradient behind portrait */}
                        <div className="absolute inset-0 bg-gradient-to-t from-theme-bg via-transparent to-transparent z-0"></div>

                        {/* The Portrait Image */}
                        <motion.img
                            src="https://nguyendai05.github.io/access_file/images/individual/portrait/transparent-img.png"
                            alt="Portrait"
                            className="relative w-full h-[90%] object-cover object-top z-10 filter contrast-110"
                            style={{
                                x: motionPaused ? 0 : portraitX,
                                y: motionPaused ? 0 : portraitY,
                                scale: 1.1,
                                filter: isHovered ? 'grayscale(0%) contrast(1.2)' : 'grayscale(20%) contrast(1.1)'
                            }}
                            transition={{ duration: 0.4 }}
                        />

                        {/* Scanline Sweep Effect */}
                        <motion.div
                            className="absolute inset-0 w-full h-[20%] bg-gradient-to-b from-transparent via-theme-accent/20 to-transparent z-20 pointer-events-none"
                            animate={motionPaused ? { top: '120%' } : { top: ['-20%', '120%'] }}
                            transition={{
                                duration: motionPaused ? 0 : 3,
                                repeat: motionPaused ? 0 : Infinity,
                                ease: "linear",
                                repeatDelay: motionPaused ? 0 : 2
                            }}
                        />
                    </div>

                    {/* Footer Data Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-theme-bg to-transparent z-20">
                        <div className="flex justify-between items-end border-t border-theme-border/30 pt-2">
                            <div className="font-mono text-xs">
                                <div className="opacity-50 text-[10px] uppercase">Status</div>
                                <div className="flex items-center gap-2 text-theme-accent">
                                    <Activity size={12} />
                                    <span>ONLINE</span>
                                </div>
                            </div>
                            <div className="font-mono text-xs text-right">
                                <div className="opacity-50 text-[10px] uppercase">System</div>
                                <div>V.2.0.25</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* LAYER 3: Floating Badges (Pop out in Z-space) */}

                {/* Main Name Badge */}
                <motion.div
                    className="absolute bottom-12 -left-6 bg-theme-text text-theme-bg px-4 py-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] border border-theme-bg z-30"
                    style={{
                        translateZ: 60,
                        x: motionPaused ? 0 : badgeX,
                        y: motionPaused ? 0 : badgeY,
                    }}
                    animate={motionPaused ? { y: 0, rotate: 0 } : floatingAnim}
                >
                    <div className="flex items-center gap-3">
                        <Scan size={16} />
                        <div>
                            <div className="text-[10px] uppercase leading-none opacity-80">Operator</div>
                            <div className="font-bold font-mono text-sm tracking-wider">XUNI-DIZAN</div>
                        </div>
                    </div>
                </motion.div>

                {/* Skill Tag 1 */}
                <motion.div
                    className="absolute top-20 -right-8 bg-theme-panel border border-theme-accent/50 text-theme-text px-3 py-1 shadow-lg z-30 backdrop-blur-md"
                    style={{
                        translateZ: 40,
                        x: motionPaused ? 0 : tagOneX,
                        y: motionPaused ? 0 : tagOneY,
                    }}
                    animate={motionPaused ? { y: 0 } : {
                        y: [0, 5, 0],
                        transition: { duration: 4, repeat: Infinity, delay: 1 }
                    }}
                >
                    <div className="flex items-center gap-2 font-mono text-xs">
                        <Cpu size={12} className="text-theme-accent" />
                        <span>NLU.Student</span>
                    </div>
                </motion.div>

                {/* Skill Tag 2 */}
                <motion.div
                    className="absolute bottom-32 -right-4 bg-theme-panel border border-theme-border text-theme-text px-3 py-1 shadow-lg z-30"
                    style={{
                        translateZ: 30,
                        x: motionPaused ? 0 : tagTwoX,
                        y: motionPaused ? 0 : tagTwoY,
                    }}
                    animate={motionPaused ? { y: 0 } : {
                        y: [0, -5, 0],
                        transition: { duration: 5, repeat: Infinity, delay: 0.5 }
                    }}
                >
                    <div className="flex items-center gap-2 font-mono text-xs">
                        <Zap size={12} className="text-yellow-500" />
                        <span>Exp.UI</span>
                    </div>
                </motion.div>

            </motion.div>
        </div>
    );
};
