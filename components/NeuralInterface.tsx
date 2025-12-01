import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, X, Trash2, Cpu, Minimize2 } from 'lucide-react';
import { sendMessageToMantis } from '../services/geminiService';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp?: string;
}

// --- Components ---

// Simple markdown renderer for chat messages
const renderMarkdown = (text: string): React.ReactNode => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  const processInline = (line: string): React.ReactNode => {
    // Bold: **text** or __text__
    // Inline code: `code`
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    while (remaining.length > 0) {
      // Check for inline code first
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(
          <code key={key++} className="bg-theme-text/10 px-1 py-0.5 rounded text-[11px] font-mono text-theme-accent">
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Check for bold
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        parts.push(<strong key={key++} className="font-semibold">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Find next special char
      const nextSpecial = remaining.search(/[`*]/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block start/end
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBuffer = [];
      } else {
        elements.push(
          <pre key={i} className="bg-theme-text/5 border border-theme-border/30 rounded-lg p-2 my-2 overflow-x-auto">
            <code className="text-[11px] font-mono text-theme-text/90 whitespace-pre-wrap break-words">
              {codeBuffer.join('\n')}
            </code>
          </pre>
        );
        inCodeBlock = false;
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(<div key={i} className="font-bold text-theme-text mt-2 mb-1">{line.slice(4)}</div>);
      continue;
    }

    // Bullet points
    if (line.match(/^[-*•]\s/)) {
      elements.push(
        <div key={i} className="flex gap-2 ml-1">
          <span className="text-theme-accent">•</span>
          <span>{processInline(line.slice(2))}</span>
        </div>
      );
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s/);
    if (numMatch) {
      elements.push(
        <div key={i} className="flex gap-2 ml-1">
          <span className="text-theme-accent font-mono text-[11px] min-w-[1.2em]">{numMatch[1]}.</span>
          <span>{processInline(line.slice(numMatch[0].length))}</span>
        </div>
      );
      continue;
    }

    // Empty line = paragraph break
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    // Normal text
    elements.push(<div key={i}>{processInline(line)}</div>);
  }

  // Handle unclosed code block
  if (inCodeBlock && codeBuffer.length > 0) {
    elements.push(
      <pre key="unclosed" className="bg-theme-text/5 border border-theme-border/30 rounded-lg p-2 my-2 overflow-x-auto">
        <code className="text-[11px] font-mono text-theme-text/90 whitespace-pre-wrap break-words">
          {codeBuffer.join('\n')}
        </code>
      </pre>
    );
  }

  return <div className="space-y-0.5">{elements}</div>;
};

const Typewriter: React.FC<{ text: string; speed?: number }> = ({ text, speed = 12 }) => {
  const [charIndex, setCharIndex] = useState(0);
  // Use Array.from to properly handle emoji and Unicode characters
  const chars = React.useMemo(() => Array.from(text), [text]);

  useEffect(() => {
    setCharIndex(0);
  }, [text]);

  useEffect(() => {
    if (charIndex >= chars.length) return;

    const timer = setTimeout(() => {
      setCharIndex((prev) => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [charIndex, chars.length, speed]);

  const displayedText = chars.slice(0, charIndex).join('');
  const isComplete = charIndex >= chars.length;

  return (
    <div className="relative">
      {renderMarkdown(displayedText)}
      {!isComplete && (
        <span className="inline-block w-1.5 h-3 bg-theme-accent animate-pulse ml-0.5 align-middle" />
      )}
    </div>
  );
};

const TypingDots: React.FC = () => (
  <div className="flex items-center gap-1 mt-1">
    <span className="w-1.5 h-1.5 rounded-full bg-theme-accent/60 animate-bounce" />
    <span className="w-1.5 h-1.5 rounded-full bg-theme-accent/60 animate-bounce [animation-delay:0.15s]" />
    <span className="w-1.5 h-1.5 rounded-full bg-theme-accent/60 animate-bounce [animation-delay:0.3s]" />
  </div>
);

const MessageItem: React.FC<{ msg: Message; isLatest?: boolean }> = ({ msg, isLatest = false }) => {
  const isUser = msg.role === 'user';
  // Only animate typewriter for the latest model message
  const shouldAnimate = !isUser && isLatest;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`
          relative max-w-[85%] p-3 text-sm leading-relaxed
          ${isUser
            ? 'bg-theme-text text-theme-bg rounded-l-xl rounded-tr-xl shadow-md font-mono'
            : 'bg-theme-panel/80 text-theme-text border border-theme-border/50 rounded-r-xl rounded-tl-xl backdrop-blur-sm'
          }
        `}
      >
        {/* Accent Bar for Model */}
        {!isUser && (
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-theme-accent to-theme-accent/40 rounded-l-xl" />
        )}

        {/* Label */}
        <div className={`text-[9px] uppercase tracking-wider mb-1.5 font-bold font-mono opacity-50 ${isUser ? 'text-right' : 'text-left pl-2'}`}>
          {isUser ? 'YOU' : 'XUNI_CORE'}
        </div>

        <div className={!isUser ? 'pl-2' : ''}>
          {shouldAnimate ? <Typewriter text={msg.text} /> : renderMarkdown(msg.text)}
        </div>

        {/* Timestamp */}
        {msg.timestamp && (
          <div className={`text-[8px] font-mono mt-2 opacity-30 ${isUser ? 'text-right' : 'text-left pl-2'}`}>
            {msg.timestamp}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const LoadingIndicator: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-start gap-2 p-3"
  >
    <div className="relative">
      <div className="absolute inset-0 rounded-full bg-theme-accent/20 blur-md animate-pulse" />
      <div className="relative w-6 h-6 rounded-full border border-theme-accent/60 flex items-center justify-center bg-theme-panel">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >
          <Cpu size={12} className="text-theme-accent" />
        </motion.div>
      </div>
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] font-mono text-theme-text/50 animate-pulse">
        PROCESSING_NEURAL_PATHWAYS...
      </span>
      <TypingDots />
    </div>
  </motion.div>
);


export const NeuralInterface: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'model',
      text: 'Neural link online. Hỏi mình về project, code, hoặc cuộc đời IT sinh viên cũng được.',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isThinking, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && !isMobile) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMobile]);

  const getTimestamp = () => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const handleSend = async () => {
    if (!input.trim() || isThinking) return; // Prevent spam when thinking

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: getTimestamp()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    const history = messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    try {
      const responseText = await sendMessageToMantis(history, userMsg.text);

      if (responseText.includes("kết nối với XUNI_CORE đang bị giới hạn tạm thời")) {
        setIsRateLimited(true);
      } else {
        setIsRateLimited(false);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: responseText,
          timestamp: getTimestamp()
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: 'Neural link vừa bị giật lag. Kiểm tra mạng hoặc API key, rồi ping mình lại nhé.',
          timestamp: getTimestamp()
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setTimeout(() => {
      setMessages([{
        id: Date.now().toString(),
        role: 'model',
        text: 'Memory purged. Systems normal. Sẵn sàng cho câu hỏi mới.',
        timestamp: getTimestamp()
      }]);
    }, 500);
  };

  return (
    <>
      {/* --- TRIGGER BUTTON --- */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="neural-trigger"
            className={`
              fixed z-50 flex items-center justify-center group
              ${isMobile ? 'bottom-20 right-4' : 'bottom-8 right-8'}
            `}
            onClick={() => setIsOpen(true)}
            initial={{ scale: 0, rotate: 90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90, transition: { duration: 0.2 } }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {/* Pulse Effect */}
            <div className="absolute inset-0 bg-theme-accent/20 rounded-full animate-ping opacity-75" />

            {/* Main Button */}
            <div className="relative bg-theme-panel border-2 border-theme-border text-theme-text p-3 rounded-full shadow-[4px_4px_0px_0px_var(--color-border)] group-hover:shadow-[2px_2px_0px_0px_var(--color-border)] group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all">
              <Sparkles size={20} className="text-theme-accent fill-theme-accent/20" />
            </div>

            {/* Label (Desktop only) */}
            {!isMobile && (
              <motion.div
                className="absolute right-full mr-4 bg-theme-text text-theme-bg text-[10px] font-mono px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
                initial={{ x: 10 }}
                whileHover={{ x: 0 }}
              >
                NEURAL_LINK_OFFLINE
              </motion.div>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* --- DOCK PANEL --- */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop (Mobile only) */}
            {isMobile && (
              <motion.div
                className="fixed inset-0 bg-theme-text/20 backdrop-blur-sm z-[60]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
              />
            )}

            <motion.div
              className={`
                fixed z-[70] bg-theme-bg/95 backdrop-blur-md border border-theme-border/80 flex flex-col overflow-hidden
                ${isMobile
                  ? 'bottom-20 left-2 right-2 h-[65vh] rounded-2xl shadow-2xl'
                  : 'bottom-8 right-8 w-[400px] h-[600px] max-h-[80vh] rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]'
                }
              `}
              initial={isMobile ? { y: "100%" } : { x: "100%", opacity: 0 }}
              animate={isMobile ? { y: 0 } : { x: 0, opacity: 1 }}
              exit={isMobile ? { y: "100%" } : { x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 260 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-3 bg-theme-panel/95 border-b border-theme-border backdrop-blur-sm select-none">
                <div className="flex items-center gap-2">
                  {/* CPU Icon with Glow */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-theme-accent/20 blur-md" />
                    <div className="relative w-7 h-7 rounded-full border border-theme-accent/60 flex items-center justify-center bg-theme-panel">
                      <Cpu size={14} className="text-theme-accent" />
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold tracking-widest text-theme-text">XUNI_NEURAL_DOCK</span>
                  {isRateLimited && (
                    <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold font-mono bg-amber-500/20 text-amber-500 border border-amber-500/50 rounded animate-pulse">
                      API_COOLDOWN
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleClear}
                    className="text-theme-text/40 hover:text-theme-text transition-colors"
                    title="Clear conversation"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-theme-text/60 hover:text-red-500 transition-colors"
                    title={isMobile ? "Close" : "Minimize"}
                  >
                    {isMobile ? <X size={20} /> : <Minimize2 size={16} />}
                  </button>
                </div>
              </div>

              {/* Chat Area */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-3 md:space-y-4 bg-gradient-to-b from-theme-bg to-theme-bg/95"
                ref={scrollRef}
              >
                {messages.map((msg, index) => {
                  // Find the last model message index
                  const lastModelIndex = messages.map((m, i) => m.role === 'model' ? i : -1).filter(i => i !== -1).pop();
                  const isLatestModelMessage = msg.role === 'model' && index === lastModelIndex;
                  return (
                    <MessageItem key={msg.id} msg={msg} isLatest={isLatestModelMessage} />
                  );
                })}
                {isThinking && <LoadingIndicator />}
              </div>

              {/* Input Area */}
              <div className="p-3 bg-theme-panel/80 border-t border-theme-border/60 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !isThinking) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Input command..."
                    disabled={isThinking}
                    className="flex-1 bg-theme-bg/60 border border-theme-border/60 rounded-lg px-3 py-2 text-xs
                      focus:outline-none focus:border-theme-accent/70 font-mono placeholder:text-theme-text/30 text-theme-text
                      disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    autoComplete="off"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isThinking}
                    className="p-2 rounded-full border border-theme-accent/60 text-theme-accent 
                      hover:bg-theme-accent/10 hover:scale-105
                      disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed 
                      transition-all duration-200"
                    title="Send message"
                  >
                    <Send size={14} />
                  </button>
                </div>
                <div className="flex justify-between mt-2 px-1 text-[9px] font-mono text-theme-text/30">
                  <span>XUNI_CORE • V2.4.0</span>
                  {isThinking ? (
                    <span className="animate-pulse text-theme-accent/60">PROCESSING_NEURAL_PATHWAYS...</span>
                  ) : (
                    <span>READY</span>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
