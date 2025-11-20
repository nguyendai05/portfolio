import React from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
  highlightWord?: string;
  highlightStyle?: string;
}

export const GlitchText: React.FC<GlitchTextProps> = ({ 
  text, 
  className = "", 
  highlightWord, 
  highlightStyle = "text-mantis-green"
}) => {
  // Helper to split text if highlighting is needed
  const content = (() => {
    if (!highlightWord) return text;
    const parts = text.split(highlightWord);
    if (parts.length < 2) return text;
    return (
      <>
        {parts[0]}
        <span className={highlightStyle}>{highlightWord}</span>
        {parts[1]}
      </>
    );
  })();

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Base Text */}
      <div className="relative z-10">{content}</div>
      
      {/* Glitch Layer 1 (Green offset) */}
      <div 
        className="absolute top-0 left-0 w-full h-full text-mantis-green pointer-events-none opacity-0 animate-glitch z-0" 
        aria-hidden="true"
        style={{ 
            clipPath: 'polygon(0 0, 100% 0, 100% 33%, 0 33%)',
            animationDelay: '0s'
        }}
      >
        {content}
      </div>
      
      {/* Glitch Layer 2 (Purple offset) */}
      <div 
        className="absolute top-0 left-0 w-full h-full text-purple-600 pointer-events-none opacity-0 animate-glitch z-0" 
        aria-hidden="true"
        style={{ 
            clipPath: 'polygon(0 67%, 100% 67%, 100% 100%, 0 100%)',
            animationDirection: 'reverse',
            animationDuration: '2.5s'
        }}
      >
        {content}
      </div>
    </div>
  );
};