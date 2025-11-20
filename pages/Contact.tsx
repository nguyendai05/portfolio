import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, MapPin, Github, Facebook, Instagram, AtSign } from 'lucide-react';

export const Contact: React.FC = () => {
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-theme-bg text-theme-text pt-32 pb-24 flex flex-col"
    >
      <div className="container mx-auto px-8 md:px-32 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
           {/* Info Side */}
           <div>
              <h1 className="text-[8vw] leading-[0.8] font-black tracking-tighter mb-12">
                 STAY <br/> CONNECTED.
              </h1>
              
              <div className="space-y-12 font-mono">
                 <div>
                    <h3 className="text-xs uppercase tracking-widest opacity-50 mb-4">Connect</h3>
                    <div className="flex flex-col gap-2 text-lg">
                       <a href="https://github.com/Xuni-Dizan" target="_blank" className="hover:text-theme-accent flex items-center gap-2 hover:bg-theme-text hover:text-theme-bg w-fit px-1 transition-colors"><Github size={18}/> GitHub</a>
                       <a href="https://facebook.com/xuni.dizan" target="_blank" className="hover:text-theme-accent flex items-center gap-2 hover:bg-theme-text hover:text-theme-bg w-fit px-1 transition-colors"><Facebook size={18}/> Facebook</a>
                       <a href="https://instagram.com/xuni.dizan" target="_blank" className="hover:text-theme-accent flex items-center gap-2 hover:bg-theme-text hover:text-theme-bg w-fit px-1 transition-colors"><Instagram size={18}/> Instagram</a>
                       <a href="https://www.tiktok.com/@nxd.dizan.2005" target="_blank" className="hover:text-theme-accent flex items-center gap-2 hover:bg-theme-text hover:text-theme-bg w-fit px-1 transition-colors">TikTok</a>
                    </div>
                 </div>

                 <div className="pt-12 border-t border-theme-border/10">
                    <div className="flex items-start gap-4">
                       <MapPin className="mt-1" />
                       <div>
                          <p>Nong Lam University</p>
                          <p>Ho Chi Minh City, Vietnam</p>
                          <p className="mt-2 opacity-50">10.8231° N, 106.6297° E</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Form Side */}
           <div className="bg-theme-panel p-8 md:p-12 border border-theme-border shadow-[20px_20px_0px_0px_var(--color-border)]">
              {isSent ? (
                 <div className="h-full flex flex-col justify-center items-center text-center">
                    <div className="w-24 h-24 bg-mantis-green rounded-full flex items-center justify-center mb-8 animate-bounce">
                       <Send size={40} className="text-black" />
                    </div>
                    <h3 className="text-3xl font-bold mb-4">Message Sent.</h3>
                    <p className="font-mono opacity-60">I'll get back to you after I finish debugging.</p>
                    <button onClick={() => setIsSent(false)} className="mt-8 underline hover:text-mantis-green">Send another</button>
                 </div>
              ) : (
                 <form onSubmit={handleSubmit} className="space-y-8">
                    <div>
                       <label className="block font-mono text-xs uppercase tracking-widest mb-2">Identification</label>
                       <input 
                         type="text" 
                         required
                         value={formState.name}
                         onChange={e => setFormState({...formState, name: e.target.value})}
                         className="w-full bg-theme-bg border-b-2 border-theme-border/10 focus:border-theme-border p-4 outline-none transition-colors font-sans text-lg text-theme-text placeholder:text-theme-text/30"
                         placeholder="Your Name"
                       />
                    </div>
                    <div>
                       <label className="block font-mono text-xs uppercase tracking-widest mb-2">Contact</label>
                       <input 
                         type="email" 
                         required
                         value={formState.email}
                         onChange={e => setFormState({...formState, email: e.target.value})}
                         className="w-full bg-theme-bg border-b-2 border-theme-border/10 focus:border-theme-border p-4 outline-none transition-colors font-sans text-lg text-theme-text placeholder:text-theme-text/30"
                         placeholder="email@address.com"
                       />
                    </div>
                    <div>
                       <label className="block font-mono text-xs uppercase tracking-widest mb-2">Message</label>
                       <textarea 
                         rows={4}
                         required
                         value={formState.message}
                         onChange={e => setFormState({...formState, message: e.target.value})}
                         className="w-full bg-theme-bg border-b-2 border-theme-border/10 focus:border-theme-border p-4 outline-none transition-colors font-sans text-lg text-theme-text placeholder:text-theme-text/30"
                         placeholder="Say hello..."
                       />
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-theme-text text-theme-bg py-6 font-mono uppercase tracking-[0.2em] hover:bg-mantis-green hover:text-black transition-colors flex justify-center items-center gap-4 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                      {!isSubmitting && <Send size={16} />}
                    </button>
                 </form>
              )}
           </div>
        </div>
      </div>
    </motion.div>
  );
};