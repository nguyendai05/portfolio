import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Send, Sparkles, X, Trash2 } from 'lucide-react';
import { sendMessageToMantis } from '../services/geminiService';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const Typewriter: React.FC<{ text: string; speed?: number }> = ({ text, speed = 20 }) => {
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
      {displayedText.length < text.length && <span className="inline-block w-2 h-4 bg-mantis-green animate-pulse ml-1 align-middle"></span>}
    </span>
  );
};

const MessageItem: React.FC<{ msg: Message }> = ({ msg }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20, filter: 'blur(4px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{
        opacity: 0,
        x: -20,
        skewX: -20,
        filter: 'blur(10px)',
        transition: { duration: 0.3 }
      }}
      transition={{ duration: 0.3, ease: "circOut" }}
      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[85%] p-4 border relative overflow-hidden group ${msg.role === 'user'
          ? 'bg-black text-white border-black'
          : 'bg-white text-black border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
          }`}
      >
        {/* Glitch decoration line */}
        <div className={`absolute top-0 left-0 h-full w-1 ${msg.role === 'model' ? 'bg-mantis-green' : 'bg-white/20'}`} />

        <span className="block text-[10px] opacity-50 mb-1 uppercase font-bold tracking-widest">
          {msg.role === 'model' ? 'XUNI_CORE' : 'USER_INPUT'}
        </span>

        <div className="whitespace-pre-wrap leading-relaxed">
          {msg.role === 'model' ? <Typewriter text={msg.text} /> : msg.text}
        </div>
      </div>
    </motion.div>
  );
};

export const NeuralInterface: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: 'model', text: 'System initialized. Hello, I am the digital assistant of Nguyen Xuan Dai.' }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages change
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100); // Slight delay to allow layout to adjust
    }
  }, [messages, isThinking]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    // Format history for API
    const history = messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    const responseText = await sendMessageToMantis(history, userMsg.text);

    setMessages((prev) => [
      ...prev,
      { id: (Date.now() + 1).toString(), role: 'model', text: responseText },
    ]);
    setIsThinking(false);
  };

  const handleClear = () => {
    setMessages([]);
    setTimeout(() => {
      setMessages([{ id: Date.now().toString(), role: 'model', text: 'Memory purged. Ready for new sequence.' }]);
    }, 800);
  };

  return (
    <>
      <motion.button
        className="fixed bottom-24 right-8 md:right-12 z-50 bg-gradient-to-br from-black/20 to-black/10 backdrop-blur-md text-mantis-green p-3.5 rounded-2xl hover:from-mantis-green/20 hover:to-mantis-green/10 hover:shadow-[0_0_40px_rgba(0,255,100,0.4)] transition-all duration-500 shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_20px_rgba(0,255,100,0.2)] border-2 border-mantis-green/30 hover:border-mantis-green/60 group overflow-hidden"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.08, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 200, damping: 15 }}
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-tr from-mantis-green/0 via-mantis-green/5 to-mantis-green/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <div className="relative">
          <Sparkles size={22} className="group-hover:rotate-12 transition-transform duration-500" strokeWidth={1.5} />

          {/* Refined pulse indicator */}
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-mantis-green rounded-full animate-pulse shadow-[0_0_10px_rgba(0,255,100,0.8)]"></span>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-mantis-green/50 rounded-full animate-ping"></span>
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-2xl bg-[#e6e6e6] border-2 border-black shadow-2xl overflow-hidden flex flex-col h-[60vh] md:h-[500px] relative"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              {/* Header */}
              <div className="bg-black text-mantis-green p-3 flex justify-between items-center font-mono text-xs tracking-widest border-b border-mantis-green select-none">
                <div className="flex items-center gap-2">
                  <Terminal size={14} />
                  <span>XUNI_NEURAL_LINK_V1.0</span>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={handleClear} className="hover:text-white transition-colors" title="Clear Terminal">
                    <Trash2 size={14} />
                  </button>
                  <button onClick={() => setIsOpen(false)} className="hover:text-white transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Chat Area */}
              <div
                className="flex-1 p-6 overflow-y-auto font-mono text-sm"
                ref={scrollRef}
                style={{ backgroundColor: '#f0f0f0' }}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {messages.map((msg) => (
                    <MessageItem key={msg.id} msg={msg} />
                  ))}
                </AnimatePresence>

                {isThinking && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-transparent text-black font-mono text-xs flex items-center gap-2">
                      <span className="animate-spin">/</span>
                      PROCESSING_NEURAL_PATHWAYS...
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-black flex gap-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about projects or skills..."
                  className="flex-1 bg-transparent border-b border-black/20 focus:border-black outline-none font-mono text-sm py-2 placeholder:text-black/30"
                  autoFocus
                />
                <button
                  onClick={handleSend}
                  disabled={isThinking || !input.trim()}
                  className="bg-black text-mantis-green px-6 py-2 hover:bg-mantis-green hover:text-black transition-colors font-mono text-xs uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Send</span>
                  <Send size={12} />
                </button>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-mantis-green to-transparent opacity-50 pointer-events-none"></div>
              <div className="absolute bottom-0 right-0 p-1 pointer-events-none">
                <div className="w-2 h-2 bg-black/10"></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};