import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Send, Sparkles, X, Trash2, Cpu, Minimize2, Maximize2 } from 'lucide-react';
import { sendMessageToMantis } from '../services/geminiService';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

// --- Components ---

const Typewriter: React.FC<{ text: string; speed?: number }> = ({ text, speed = 15 }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span>
      {displayedText}
      {displayedText.length < text.length && (
        <span className="inline-block w-1.5 h-3 bg-theme-accent animate-pulse ml-0.5 align-middle" />
      )}
    </span>
  );
};

const MessageItem: React.FC<{ msg: Message }> = ({ msg }) => {
  const isUser = msg.role === 'user';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`
          relative max-w-[85%] p-3 text-sm font-mono leading-relaxed shadow-sm
          ${isUser
            ? 'bg-theme-text text-theme-bg rounded-l-lg rounded-tr-lg'
            : 'bg-theme-panel text-theme-text border border-theme-border rounded-r-lg rounded-tl-lg'
          }
        `}
      >
        {/* Accent Bar for Model */}
        {!isUser && (
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-theme-accent rounded-l-lg" />
        )}

        {/* Label */}
        <div className={`text-[9px] uppercase tracking-wider mb-1 font-bold opacity-50 ${isUser ? 'text-right' : 'text-left pl-2'}`}>
          {isUser ? 'YOU' : 'XUNI_CORE'}
        </div>

        <div className={!isUser ? 'pl-2' : ''}>
          {!isUser ? <Typewriter text={msg.text} /> : msg.text}
        </div>
      </div>
    </motion.div>
  );
};

const LoadingIndicator = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center gap-2 text-[10px] font-mono text-theme-text/50 p-2"
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <Cpu size={12} />
    </motion.div>
    <span className="animate-pulse">PROCESSING_NEURAL_PATHWAYS...</span>
  </motion.div>
);

export const NeuralInterface: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: 'model', text: 'Neural link online. Hỏi mình về project, code, hoặc cuộc đời IT sinh viên cũng được.' }
  ]);
  const [isThinking, setIsThinking] = useState(false);
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

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    const history = messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    try {
      const responseText = await sendMessageToMantis(history, userMsg.text);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'model', text: responseText },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'model', text: 'Neural link vừa bị giật lag. Kiểm tra mạng hoặc API key, rồi ping mình lại nhé.' },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setTimeout(() => {
      setMessages([{ id: Date.now().toString(), role: 'model', text: 'Memory purged. Systems normal. Sẵn sàng cho câu hỏi mới.' }]);
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
                fixed z-[70] bg-theme-bg border-2 border-theme-border flex flex-col overflow-hidden shadow-2xl
                ${isMobile
                  ? 'bottom-20 left-2 right-2 h-[60vh] rounded-2xl'
                  : 'bottom-8 right-8 w-[380px] h-[600px] max-h-[80vh] rounded-xl'
                }
              `}
              initial={isMobile ? { y: "100%" } : { x: "100%", opacity: 0 }}
              animate={isMobile ? { y: 0 } : { x: 0, opacity: 1 }}
              exit={isMobile ? { y: "100%" } : { x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-theme-panel border-b border-theme-border select-none">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-theme-accent rounded-full animate-pulse" />
                  <span className="font-mono text-xs font-bold tracking-widest text-theme-text">XUNI_NEURAL_DOCK</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleClear}
                    className="text-theme-text/40 hover:text-theme-text transition-colors"
                    title="Purge Memory"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-theme-text hover:text-red-500 transition-colors"
                  >
                    {isMobile ? <X size={20} /> : <Minimize2 size={16} />}
                  </button>
                </div>
              </div>

              {/* Chat Area */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-theme-bg"
                ref={scrollRef}
              >
                {messages.map((msg) => (
                  <MessageItem key={msg.id} msg={msg} />
                ))}
                {isThinking && <LoadingIndicator />}
              </div>

              {/* Input Area */}
              <div className="p-3 bg-theme-panel border-t border-theme-border">
                <div className="flex items-center gap-2 bg-theme-bg border border-theme-border/20 focus-within:border-theme-border rounded-lg px-3 py-2 transition-colors">
                  <Terminal size={14} className="text-theme-text/40" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Input command..."
                    className="flex-1 bg-transparent outline-none font-mono text-sm placeholder:text-theme-text/30 text-theme-text"
                    autoComplete="off"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isThinking}
                    className="text-theme-text hover:text-theme-accent disabled:opacity-30 disabled:hover:text-theme-text transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
                <div className="flex justify-between mt-2 px-1">
                  <span className="text-[9px] font-mono text-theme-text/30">V2.4.0 STABLE</span>
                  <span className="text-[9px] font-mono text-theme-text/30">LATENCY: 12ms</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};