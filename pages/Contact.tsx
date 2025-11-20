import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
   Send, Mail, MapPin, Github, Facebook, Instagram,
   Terminal, Cpu, Globe, Clock, Radio, CheckCircle2,
   ArrowRight, Zap, MessageSquare
} from 'lucide-react';
import { GlitchText } from '../components/GlitchText';
import { GenerativeArt } from '../components/GenerativeArt';

// --- Types ---
type ContactTopic = 'collaboration' | 'mentorship' | 'freelance' | 'other';

interface ContactFormState {
   name: string;
   email: string;
   topic: ContactTopic;
   message: string;
}

// --- Components ---

const SocialChip = ({
   icon: Icon,
   label,
   subLabel,
   href,
   delay
}: {
   icon: any,
   label: string,
   subLabel: string,
   href: string,
   delay: number
}) => (
   <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="group relative flex items-center gap-4 p-4 border border-theme-border/30 bg-theme-bg/50 hover:bg-theme-panel hover:border-theme-accent/50 transition-all duration-300 overflow-hidden"
   >
      <div className="absolute inset-0 bg-theme-accent/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
      <div className="p-3 bg-theme-panel border border-theme-border/50 rounded-sm group-hover:scale-110 transition-transform duration-300">
         <Icon size={20} className="text-theme-text group-hover:text-theme-accent transition-colors" />
      </div>
      <div className="flex flex-col z-10">
         <span className="font-bold text-sm uppercase tracking-wider text-theme-text">{label}</span>
         <span className="text-xs font-mono text-theme-text/60 group-hover:text-theme-accent/80 transition-colors">
            {subLabel}
         </span>
      </div>
      <ArrowRight className="ml-auto opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-theme-accent" size={16} />
   </motion.a>
);

const StatusIndicator = ({ label, value, active = true }: { label: string, value: string, active?: boolean }) => (
   <div className="flex flex-col font-mono text-xs gap-1">
      <span className="uppercase tracking-widest opacity-50">{label}</span>
      <div className="flex items-center gap-2">
         {active && (
            <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-theme-accent opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-theme-accent"></span>
            </span>
         )}
         <span className="text-theme-accent">{value}</span>
      </div>
   </div>
);

export const Contact: React.FC = () => {
   const [formState, setFormState] = useState<ContactFormState>({
      name: '',
      email: '',
      topic: 'collaboration',
      message: ''
   });
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [isSent, setIsSent] = useState(false);
   const [currentTime, setCurrentTime] = useState<string>('');

   // Scroll parallax
   const { scrollY } = useScroll();
   const y1 = useTransform(scrollY, [0, 1000], [0, 100]);

   useEffect(() => {
      // Update time every minute
      const updateTime = () => {
         const now = new Date();
         setCurrentTime(now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Ho_Chi_Minh'
         }));
      };
      updateTime();
      const interval = setInterval(updateTime, 60000);
      return () => clearInterval(interval);
   }, []);

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      // Simulate API call
      setTimeout(() => {
         setIsSubmitting(false);
         setIsSent(true);
      }, 2000);
   };

   return (
      <div className="min-h-screen bg-theme-bg text-theme-text relative overflow-hidden selection:bg-theme-accent selection:text-theme-bg">
         {/* Background Elements */}
         <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
            <GenerativeArt variant="network" intensity={30} color="#888" />
         </div>
         <div className="fixed inset-0 z-0 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]" />

         {/* Main Content Container */}
         {/* 
            Layout Fixes:
            - pl-20 (mobile) / pl-32 (desktop): Clears the fixed left sidebar (w-16/w-24) + gap.
            - pr-20 (mobile) / pr-32 (desktop): Clears the fixed right navigation (p-8/p-10) + gap.
            - py-24/py-32: Ensures top/bottom spacing for header/footer elements.
            - min-h-screen: Ensures the section takes full height.
         */}
         <div className="relative z-10 w-full min-h-screen flex flex-col justify-center py-24 md:py-32 pl-20 md:pl-32 pr-20 md:pr-32">
            <div className="container mx-auto max-w-7xl">
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">

                  {/* LEFT COLUMN: SIGNAL / STATUS */}
                  <motion.div
                     className="lg:col-span-5 flex flex-col justify-between h-full"
                     style={{ y: y1 }}
                  >
                     <div>
                        <motion.div
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ duration: 0.8 }}
                           className="mb-12"
                        >
                           <div className="flex items-center gap-2 mb-4 text-theme-accent font-mono text-xs tracking-[0.3em]">
                              <Radio size={14} className="animate-pulse" />
                              <span>SIGNAL_STATUS: ONLINE</span>
                           </div>
                           <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-6">
                              <GlitchText text="OPEN A" /> <br />
                              <span className="text-theme-accent">CHANNEL.</span>
                           </h1>
                           <p className="text-base md:text-lg text-theme-text/70 max-w-md leading-relaxed">
                              Initiate a secure connection. Whether for collaboration, inquiries, or just to say hello—my terminal is open.
                           </p>
                        </motion.div>

                        {/* Status Grid */}
                        <motion.div
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           transition={{ delay: 0.4 }}
                           className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 mb-12 border-y border-theme-border/20 py-8"
                        >
                           <StatusIndicator label="Local Time" value={`${currentTime} ICT`} />
                           <StatusIndicator label="Availability" value="Open for Work" />
                           <StatusIndicator label="Response Time" value="< 24 Hours" active={false} />
                           <StatusIndicator label="Location" value="Ho Chi Minh, VN" active={false} />
                        </motion.div>

                        {/* Social Capsules */}
                        <div className="space-y-4">
                           <SocialChip
                              icon={Github}
                              label="GitHub"
                              subLabel="Explore my repositories"
                              href="https://github.com/Xuni-Dizan"
                              delay={0.6}
                           />
                           <SocialChip
                              icon={Facebook}
                              label="Facebook"
                              subLabel="Social updates"
                              href="https://facebook.com/xuni.dizan"
                              delay={0.7}
                           />
                           <SocialChip
                              icon={Instagram}
                              label="Instagram"
                              subLabel="Visual log"
                              href="https://instagram.com/xuni.dizan"
                              delay={0.8}
                           />
                           <SocialChip
                              icon={Globe}
                              label="TikTok"
                              subLabel="Short form content"
                              href="https://www.tiktok.com/@nxd.dizan.2005"
                              delay={0.9}
                           />
                        </div>
                     </div>

                     {/* Location Block */}
                     <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="mt-12 lg:mt-0 pt-8 border-t border-theme-border/20"
                     >
                        <div className="flex items-start gap-4 opacity-70 hover:opacity-100 transition-opacity">
                           <div className="p-3 bg-theme-panel border border-theme-border rounded-full relative">
                              <MapPin size={20} />
                              <div className="absolute inset-0 border border-theme-accent rounded-full animate-ping opacity-20" />
                           </div>
                           <div className="font-mono text-sm">
                              <p className="font-bold uppercase tracking-wider mb-1">Base of Operations</p>
                              <p>Nong Lam University</p>
                              <p className="text-theme-accent">10.8231° N, 106.6297° E</p>
                           </div>
                        </div>
                     </motion.div>
                  </motion.div>

                  {/* RIGHT COLUMN: CONSOLE FORM */}
                  <motion.div
                     className="lg:col-span-7 relative"
                     initial={{ opacity: 0, x: 50 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ duration: 0.8, delay: 0.2 }}
                  >
                     <div className="bg-theme-panel/80 backdrop-blur-md border border-theme-border p-1 md:p-2 shadow-2xl relative overflow-hidden">
                        {/* Decorative borders */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-theme-accent" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-theme-accent" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-theme-accent" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-theme-accent" />

                        <div className="bg-theme-bg/50 p-6 md:p-10 border border-theme-border/30 h-full relative">
                           {/* Header Bar */}
                           <div className="flex justify-between items-center mb-8 pb-4 border-b border-theme-border/20">
                              <div className="flex items-center gap-2">
                                 <Terminal size={16} className="text-theme-accent" />
                                 <span className="font-mono text-xs uppercase tracking-widest">Console // Channel_01</span>
                              </div>
                              <div className="hidden sm:flex gap-4 font-mono text-[10px] opacity-50">
                                 <span>UPTIME: 99.9%</span>
                                 <span>PKT_LOSS: 0.0%</span>
                              </div>
                           </div>

                           <AnimatePresence mode="wait">
                              {isSent ? (
                                 <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex flex-col items-center justify-center py-20 text-center"
                                 >
                                    <div className="w-24 h-24 rounded-full border-2 border-theme-accent flex items-center justify-center mb-6 relative">
                                       <div className="absolute inset-0 bg-theme-accent/20 rounded-full animate-pulse" />
                                       <CheckCircle2 size={48} className="text-theme-accent" />
                                    </div>
                                    <h3 className="text-3xl font-bold mb-2">TRANSMISSION RECEIVED</h3>
                                    <p className="text-theme-text/60 max-w-xs mx-auto mb-8">
                                       Your signal has been successfully logged in the system. I will decode and reply shortly.
                                    </p>
                                    <button
                                       onClick={() => setIsSent(false)}
                                       className="font-mono text-xs uppercase tracking-widest hover:text-theme-accent underline decoration-theme-accent/50 underline-offset-4"
                                    >
                                       Initialize New Transmission
                                    </button>
                                 </motion.div>
                              ) : (
                                 <motion.form
                                    key="form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onSubmit={handleSubmit}
                                    className="space-y-8"
                                 >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                       <div className="group">
                                          <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 text-theme-text/50 group-focus-within:text-theme-accent transition-colors">
                                             Identity // Name
                                          </label>
                                          <input
                                             type="text"
                                             required
                                             value={formState.name}
                                             onChange={e => setFormState({ ...formState, name: e.target.value })}
                                             className="w-full bg-theme-bg/50 border border-theme-border/30 focus:border-theme-accent p-4 outline-none transition-all font-sans text-lg placeholder:text-theme-text/20 focus:bg-theme-bg focus:shadow-[0_0_20px_rgba(0,0,0,0.1)]"
                                             placeholder="Enter ID..."
                                          />
                                       </div>
                                       <div className="group">
                                          <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 text-theme-text/50 group-focus-within:text-theme-accent transition-colors">
                                             Contact // Email
                                          </label>
                                          <input
                                             type="email"
                                             required
                                             value={formState.email}
                                             onChange={e => setFormState({ ...formState, email: e.target.value })}
                                             className="w-full bg-theme-bg/50 border border-theme-border/30 focus:border-theme-accent p-4 outline-none transition-all font-sans text-lg placeholder:text-theme-text/20 focus:bg-theme-bg focus:shadow-[0_0_20px_rgba(0,0,0,0.1)]"
                                             placeholder="user@domain.com"
                                          />
                                       </div>
                                    </div>

                                    <div className="group">
                                       <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 text-theme-text/50 group-focus-within:text-theme-accent transition-colors">
                                          Subject // Topic
                                       </label>
                                       <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                          {['collaboration', 'mentorship', 'freelance', 'other'].map((t) => (
                                             <button
                                                key={t}
                                                type="button"
                                                onClick={() => setFormState({ ...formState, topic: t as ContactTopic })}
                                                className={`p-3 text-xs font-mono uppercase border transition-all ${formState.topic === t
                                                   ? 'border-theme-accent bg-theme-accent/10 text-theme-accent'
                                                   : 'border-theme-border/30 text-theme-text/50 hover:border-theme-border hover:text-theme-text'
                                                   }`}
                                             >
                                                {t}
                                             </button>
                                          ))}
                                       </div>
                                    </div>

                                    <div className="group">
                                       <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 text-theme-text/50 group-focus-within:text-theme-accent transition-colors">
                                          Data // Message
                                       </label>
                                       <textarea
                                          rows={5}
                                          required
                                          value={formState.message}
                                          onChange={e => setFormState({ ...formState, message: e.target.value })}
                                          className="w-full bg-theme-bg/50 border border-theme-border/30 focus:border-theme-accent p-4 outline-none transition-all font-sans text-lg placeholder:text-theme-text/20 focus:bg-theme-bg focus:shadow-[0_0_20px_rgba(0,0,0,0.1)] resize-none"
                                          placeholder="Input transmission data..."
                                       />
                                    </div>

                                    <button
                                       type="submit"
                                       disabled={isSubmitting}
                                       className="w-full group relative overflow-hidden bg-theme-text text-theme-bg py-5 font-mono uppercase tracking-[0.2em] hover:bg-theme-accent hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                       <span className="relative z-10 flex justify-center items-center gap-3">
                                          {isSubmitting ? (
                                             <>
                                                <span className="animate-pulse">Transmitting</span>
                                                <span className="flex gap-1">
                                                   <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                   <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                   <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </span>
                                             </>
                                          ) : (
                                             <>
                                                Send Signal <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                             </>
                                          )}
                                       </span>
                                       <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                    </button>
                                 </motion.form>
                              )}
                           </AnimatePresence>
                        </div>
                     </div>
                  </motion.div>
               </div>
            </div>
         </div>
      </div>
   );
};