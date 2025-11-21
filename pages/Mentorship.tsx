import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle, AlertCircle, FileCode, Cpu, Loader, Shield } from 'lucide-react';
import { GlitchText } from '../components/GlitchText';
import { sendMessageToMantis } from '../services/geminiService';

export const Mentorship: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    url: '',
    focus: [] as string[]
  });
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'complete'>('idle');
  const [aiReport, setAiReport] = useState<string>('');
  const [ticketId, setTicketId] = useState<string>('');

  const focusAreas = ['UI/UX Design', 'Code Quality', 'Performance', 'Accessibility', 'Career Advice'];

  const toggleFocus = (area: string) => {
    setForm(prev => ({
      ...prev,
      focus: prev.focus.includes(area)
        ? prev.focus.filter(f => f !== area)
        : [...prev.focus, area]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.url || form.focus.length === 0) return;

    setStatus('analyzing');

    // Generate ticket ID
    const tid = `REQ-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    setTicketId(tid);

    // Construct prompt for Gemini
    const prompt = `
      SYSTEM: User ${form.name || 'Developer'} has submitted a portfolio for review: ${form.url}.
      FOCUS AREAS: ${form.focus.join(', ')}.
      
      TASK: Act as a strict but helpful Senior Engineer. 
      1. Acknowledge the request with the Ticket ID ${tid}.
      2. Based *solely* on their chosen focus areas, generate a "Preliminary Auto-Audit Checklist" of 5 specific, technical things they should self-check immediately before the manual review happens.
      3. Tone: Professional, brutalist, encouraging. Use bullet points.
    `;

    const history = [{ role: 'model', parts: [{ text: "Ready to analyze incoming requests." }] }];

    try {
      const response = await sendMessageToMantis(history, prompt);
      setAiReport(response);
      setStatus('complete');
    } catch (error) {
      setAiReport("Error establishing neural link. Please try again later.");
      setStatus('idle');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-theme-bg text-theme-text pt-24 md:pt-32 pb-24"
    >
      <div className="container mx-auto px-4 md:px-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

          {/* Header / Info */}
          <div className="lg:col-span-5">
            <div className="mb-12">
              <div className="flex items-center gap-2 text-theme-accent opacity-60 mb-4">
                <Shield size={14} />
                <span className="font-mono text-xs uppercase tracking-widest">Community Link</span>
              </div>
              <GlitchText
                text="Code Review Protocol."
                className="text-4xl md:text-[5vw] lg:text-[4vw] leading-[0.9] font-black tracking-tighter mb-8"
                highlightWord="Protocol."
              />
              <p className="font-mono text-sm opacity-80 leading-relaxed mb-8">
                Building a portfolio is hard. Doing it alone is harder.
                Submit your work for a constructive roast (mentorship) session.
              </p>
              <ul className="space-y-4 font-mono text-xs border-l-2 border-theme-text pl-6">
                <li className="flex items-center gap-3">
                  <CheckCircle size={14} className="text-theme-accent" />
                  <span>Automated pre-analysis (AI)</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle size={14} className="text-theme-accent" />
                  <span>Manual code inspection</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle size={14} className="text-theme-accent" />
                  <span>Actionable roadmap</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Interaction Console */}
          <div className="lg:col-span-7">
            <div className="bg-theme-panel border border-theme-border shadow-[20px_20px_0px_0px_var(--color-border)] overflow-hidden relative">

              {/* Console Header */}
              <div className="bg-theme-text text-theme-bg p-4 flex justify-between items-center">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <FileCode size={14} className="text-mantis-green" />
                  <span>MENTORSHIP_REQ_FORM_V2</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>

              <div className="p-8 md:p-12 text-theme-text">
                {status === 'idle' && (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-widest mb-2 opacity-60">Target URL</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm opacity-40">https://</span>
                        <input
                          type="text"
                          required
                          value={form.url}
                          onChange={e => setForm({ ...form, url: e.target.value })}
                          className="w-full bg-theme-bg p-4 pl-20 border-b-2 border-theme-border/10 focus:border-mantis-green outline-none font-mono transition-colors text-theme-text placeholder:text-theme-text/30"
                          placeholder="your-portfolio.dev"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block font-mono text-xs uppercase tracking-widest mb-2 opacity-60">Developer Name</label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          className="w-full bg-theme-bg p-4 border-b-2 border-theme-border/10 focus:border-mantis-green outline-none font-mono transition-colors text-theme-text placeholder:text-theme-text/30"
                          placeholder="Anon"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-mono text-xs uppercase tracking-widest mb-4 opacity-60">Request Audit For:</label>
                      <div className="flex flex-wrap gap-3">
                        {focusAreas.map(area => (
                          <button
                            key={area}
                            type="button"
                            onClick={() => toggleFocus(area)}
                            className={`px-4 py-2 font-mono text-xs border transition-all ${form.focus.includes(area)
                                ? 'bg-theme-text text-theme-bg border-theme-text'
                                : 'bg-transparent border-theme-border/20 text-theme-text hover:border-theme-border'
                              }`}
                          >
                            {area}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-theme-text text-theme-bg hover:bg-mantis-green hover:text-black py-4 font-mono uppercase tracking-widest transition-colors flex items-center justify-center gap-2 group"
                    >
                      <span>Initialize Scan</span>
                      <Send size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </form>
                )}

                {status === 'analyzing' && (
                  <div className="py-12 flex flex-col items-center text-center">
                    <div className="relative mb-8">
                      <div className="w-16 h-16 border-4 border-theme-border/10 border-t-mantis-green rounded-full animate-spin"></div>
                      <Cpu size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 animate-pulse">Analyzing Metadata...</h3>
                    <p className="font-mono text-xs opacity-50">Establishing link with Neural Interface.</p>
                  </div>
                )}

                {status === 'complete' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between border-b border-theme-border/10 pb-4 mb-6">
                      <div>
                        <div className="font-mono text-xs text-theme-accent opacity-50">TICKET ID</div>
                        <div className="text-xl font-bold font-mono">{ticketId}</div>
                      </div>
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                        <CheckCircle size={12} /> QUEUED
                      </div>
                    </div>

                    <div className="bg-theme-bg p-6 border-l-4 border-mantis-green mb-8">
                      <h4 className="font-bold text-sm uppercase mb-4 flex items-center gap-2">
                        <AlertCircle size={14} /> Automated Pre-Flight Check
                      </h4>
                      <div className="font-mono text-xs leading-relaxed whitespace-pre-wrap">
                        {aiReport}
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="mb-4 font-sans text-sm">Your request has been logged. A human will review it shortly.</p>
                      <button
                        onClick={() => { setStatus('idle'); setForm({ name: '', url: '', focus: [] }); }}
                        className="text-xs font-mono underline hover:text-mantis-green"
                      >
                        Submit Another Request
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};