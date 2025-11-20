import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Send, Cpu, X, Trash2 } from 'lucide-react';
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
        className={`max-w-[85%] p-4 border relative overflow-hidden group ${
          msg.role === 'user'
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
        className="fixed bottom-8 right-8 md:right-24 z-50 bg-black text-mantis-green p-3 md:p-4 hover:bg-mantis-green hover:text-black transition-colors duration-300 shadow-lg border border-transparent hover:border-black group"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <div className="relative">
          <Cpu size={24} className="group-hover:animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-mantis-green group-hover:bg-black rounded-full animate-ping"></span>
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