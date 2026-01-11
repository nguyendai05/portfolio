import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Sliders, Zap, Activity, Cpu, Grid, Layers, Radio, Maximize2, RotateCcw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

type ArtVariant = 'network' | 'particles' | 'matrix' | 'flow';

interface GalleryControlPanelProps {
    activeVariant: ArtVariant;
    setActiveVariant: (v: ArtVariant) => void;
    intensity: number;
    setIntensity: (v: number) => void;
    speed: number;
    setSpeed: (v: number) => void;
    variants: { id: ArtVariant; label: string; desc: string }[];
    onToggleFullscreen: () => void;
    isFullscreen: boolean;
}

export const GalleryControlPanel: React.FC<GalleryControlPanelProps> = ({
    activeVariant,
    setActiveVariant,
    intensity,
    setIntensity,
    speed,
    setSpeed,
    variants,
    onToggleFullscreen,
    isFullscreen
}) => {
    const { theme } = useTheme();
    const panelRef = useRef<HTMLDivElement>(null);

    // 3D Tilt Logic
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
    const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["7deg", "-7deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-7deg", "7deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!panelRef.current) return;
        const rect = panelRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseXVal = e.clientX - rect.left;
        const mouseYVal = e.clientY - rect.top;
        const xPct = mouseXVal / width - 0.5;
        const yPct = mouseYVal / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    // Theme helpers
    const isMatrix = activeVariant === 'matrix';
    const borderColor = isMatrix ? 'border-white/30' : 'border-theme-border/30';
    const textColor = isMatrix ? 'text-white' : 'text-theme-text';
    const accentColor = isMatrix ? 'text-[#39ff14]' : 'text-theme-accent';
    const bgPanel = isMatrix ? 'bg-black/80' : 'bg-theme-panel/80';

    return (
        <motion.div
            ref={panelRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                perspective: 1000,
            }}
            className="w-full max-w-md mx-auto md:mr-0"
        >
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                }}
                className={`
          relative backdrop-blur-xl rounded-xl border ${borderColor} ${bgPanel} 
          shadow-2xl overflow-hidden transition-colors duration-500
        `}
            >
                {/* Decorative Header Bar */}
                <div className={`h-8 border-b ${borderColor} flex items-center justify-between px-4 bg-black/5`}>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isMatrix ? 'bg-green-500' : 'bg-theme-accent'} animate-pulse`} />
                        <span className={`text-[10px] font-mono uppercase tracking-widest ${textColor} opacity-70`}>
                            Control_Deck_v2.0
                        </span>
                    </div>
                    <div className="flex gap-1">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`w-1 h-3 ${borderColor} border-r`} />
                        ))}
                    </div>
                </div>

                <div className="p-6 space-y-8">

                    {/* Variant Selector Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className={`text-xs font-mono uppercase tracking-widest flex items-center gap-2 ${textColor}`}>
                                <Layers size={12} /> Algorithm
                            </h3>
                            <span className={`text-[10px] font-mono ${accentColor}`}>
                                {activeVariant.toUpperCase()}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {variants.map((v) => (
                                <button
                                    key={v.id}
                                    onClick={() => setActiveVariant(v.id)}
                                    className={`
                      relative group overflow-hidden rounded-lg border p-3 text-left transition-all duration-300
                      ${activeVariant === v.id
                                            ? (isMatrix ? 'bg-white text-black border-white' : 'bg-theme-text text-theme-bg border-theme-text')
                                            : (isMatrix ? 'border-white/20 text-white hover:border-white/60' : 'border-theme-border/20 text-theme-text hover:border-theme-border/60')
                                        }
                    `}
                                >
                                    <div className="relative z-10 flex flex-col gap-1">
                                        <span className="text-[10px] font-mono opacity-60">0{variants.indexOf(v) + 1}</span>
                                        <span className="font-bold text-sm tracking-tight">{v.label}</span>
                                    </div>
                                    {/* Hover Effect Background */}
                                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${isMatrix ? 'bg-white' : 'bg-theme-text'}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Parameters Section */}
                    <div className="space-y-6">
                        <h3 className={`text-xs font-mono uppercase tracking-widest flex items-center gap-2 ${textColor}`}>
                            <Sliders size={12} /> Parameters
                        </h3>

                        {/* Intensity Slider */}
                        <div className="group">
                            <div className="flex justify-between text-xs font-mono mb-2">
                                <span className={`${textColor} opacity-70`}>Density / Force</span>
                                <span className={accentColor}>{intensity}%</span>
                            </div>
                            <div className="relative h-6 flex items-center">
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    value={intensity}
                                    onChange={(e) => setIntensity(parseInt(e.target.value))}
                                    className="w-full absolute z-20 opacity-0 cursor-pointer h-full"
                                    aria-label="Density / Force intensity slider"
                                />
                                {/* Custom Track */}
                                <div className={`w-full h-1 rounded-full overflow-hidden relative z-10 ${isMatrix ? 'bg-white/20' : 'bg-theme-border/20'}`}>
                                    <motion.div
                                        className={`h-full ${isMatrix ? 'bg-[#39ff14]' : 'bg-theme-accent'}`}
                                        style={{ width: `${intensity}%` }}
                                    />
                                </div>
                                {/* Custom Thumb (Visual Only) */}
                                <motion.div
                                    className={`absolute w-4 h-4 rounded-full shadow-lg z-10 pointer-events-none border-2 ${isMatrix ? 'bg-black border-[#39ff14]' : 'bg-theme-bg border-theme-accent'}`}
                                    style={{ left: `calc(${intensity}% - 8px)` }}
                                />
                            </div>
                        </div>

                        {/* Speed Slider */}
                        <div className="group">
                            <div className="flex justify-between text-xs font-mono mb-2">
                                <span className={`${textColor} opacity-70`}>Simulation Speed</span>
                                <span className={accentColor}>{speed.toFixed(1)}x</span>
                            </div>
                            <div className="relative h-6 flex items-center">
                                <input
                                    type="range"
                                    min="0.1"
                                    max="3"
                                    step="0.1"
                                    value={speed}
                                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                    className="w-full absolute z-20 opacity-0 cursor-pointer h-full"
                                    aria-label="Simulation speed slider"
                                />
                                <div className={`w-full h-1 rounded-full overflow-hidden relative z-10 ${isMatrix ? 'bg-white/20' : 'bg-theme-border/20'}`}>
                                    <motion.div
                                        className={`h-full ${isMatrix ? 'bg-[#39ff14]' : 'bg-theme-accent'}`}
                                        style={{ width: `${(speed / 3) * 100}%` }}
                                    />
                                </div>
                                <motion.div
                                    className={`absolute w-4 h-4 rounded-full shadow-lg z-10 pointer-events-none border-2 ${isMatrix ? 'bg-black border-[#39ff14]' : 'bg-theme-bg border-theme-accent'}`}
                                    style={{ left: `calc(${(speed / 3) * 100}% - 8px)` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions Footer */}
                    <div className={`pt-6 border-t ${borderColor} grid grid-cols-2 gap-4`}>
                        <button
                            onClick={() => {
                                setIntensity(50);
                                setSpeed(1);
                            }}
                            className={`
                 flex items-center justify-center gap-2 py-2 text-xs font-mono uppercase border rounded transition-all
                 ${isMatrix ? 'border-white/30 text-white hover:bg-white/10' : 'border-theme-border/30 text-theme-text hover:bg-theme-text/5'}
               `}
                        >
                            <RotateCcw size={12} /> Reset
                        </button>
                        <button
                            onClick={onToggleFullscreen}
                            className={`
                 flex items-center justify-center gap-2 py-2 text-xs font-mono uppercase border rounded transition-all
                 ${isFullscreen
                                    ? (isMatrix ? 'bg-white text-black border-white' : 'bg-theme-text text-theme-bg border-theme-text')
                                    : (isMatrix ? 'border-white/30 text-white hover:bg-white/10' : 'border-theme-border/30 text-theme-text hover:bg-theme-text/5')
                                }
               `}
                        >
                            <Maximize2 size={12} /> {isFullscreen ? 'Exit' : 'Full'}
                        </button>
                    </div>

                    {/* System Status Decor */}
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className={`text-[9px] font-mono opacity-50 ${textColor}`}>
                            CPU: <span className={accentColor}>{Math.floor(Math.random() * 20 + 10)}%</span>
                        </div>
                        <div className={`text-[9px] font-mono opacity-50 ${textColor} text-center`}>
                            MEM: <span className={accentColor}>128MB</span>
                        </div>
                        <div className={`text-[9px] font-mono opacity-50 ${textColor} text-right`}>
                            FPS: <span className={accentColor}>60</span>
                        </div>
                    </div>

                </div>
            </motion.div>
        </motion.div>
    );
};
