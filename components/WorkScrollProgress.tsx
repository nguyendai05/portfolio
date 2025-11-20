import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

export const WorkScrollProgress: React.FC = () => {
    const { scrollYProgress } = useScroll();
    const scaleY = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <div className="fixed right-0 top-0 bottom-0 w-1 z-50 pointer-events-none hidden md:block">
            <div className="absolute inset-y-0 right-0 w-px bg-theme-border opacity-20"></div>
            <motion.div
                className="absolute top-0 right-0 w-1 bg-mantis-green origin-top"
                style={{ scaleY, height: '100%' }}
            />
        </div>
    );
};
