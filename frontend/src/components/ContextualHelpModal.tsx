import React, { useState } from 'react';
import { X, Sparkles, Send, HelpCircle, Bot } from 'lucide-react';
import { sendCitizenQuery } from '../services/api';

interface ContextualHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStepContext: string;
  initialQuery?: string;
}

const CONTEXT_HINTS: Record<string, string[]> = {
  discover: [
    'Which documents are needed for an address certificate?',
    'Is there any processing fee for pension update?',
    'How long does a driving license renewal take?',
  ],
  guide: [
    'Can I resume this application later?',
    'What happens if I miss a required document?',
    'Are these government fees refundable?',
  ],
  workspace: [
    'Why do we need your date of birth?',
    'What formats are allowed for document uploads?',
    'How to mask Aadhar card number before uploading?',
  ],
  payment: [
    'Why was I redirected to a external payment bridge?',
    'My payment failed, was money deducted?',
    'What does status "Unknown / Verification Pending" mean?',
  ],
  tracking: [
    'What does "Under department review" mean?',
    'How do I replace an address document?',
    'Who is the assigned verifying officer?',
  ],
  result: [
    'Where can I download my verified digital certificate?',
    'How to verify the digital signature QR code?',
    'How to apply for another public service?',
  ],
};

export const ContextualHelpModal: React.FC<ContextualHelpModalProps> = ({
  isOpen,
  onClose,
  currentStepContext,
  initialQuery = '',
}) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'nira'; text: string; sources?: any[] }>>([
    {
      sender: 'nira',
      text: `Hi! I'm Nira 👋. I notice you are currently on the ${currentStepContext.toUpperCase()} step. How can I help you complete this step?`,
    },
  ]);
  const [input, setInput] = useState(initialQuery);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (queryText: string) => {
    if (!queryText.trim()) return;
    const userText = queryText;
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await sendCitizenQuery(userText, 'en');
      let botMsg = res.message || 'I have analyzed your request.';
      const topOpts = res.payload?.top_options || [];
      if (topOpts.length > 0 && !botMsg.includes(topOpts[0].train_name)) {
        const trainList = topOpts.map((t: any) => `• ${t.train_name} (#${t.train_no}) — Dep: ${t.departure_time} | ₹${t.fare_inr}`).join('\n');
        botMsg += `\n\nTop Available Options (Local DB):\n${trainList}`;
      }
      setMessages((prev) => [
        ...prev,
        {
          sender: 'nira',
          text: botMsg,
          sources: (res.payload?.web_results || []).map((s: any) => ({ title: s.title || s.url, url: s.url })),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'nira',
          text: 'Nira is operating in resilient offline mode. Your application progress is fully saved.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const hints = CONTEXT_HINTS[currentStepContext.toLowerCase()] || CONTEXT_HINTS['workspace'];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-lg bg-[#0b1329] border-l border-indigo-500/20 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#080d1f]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-[1.5px] shadow-lg shadow-indigo-500/30 flex items-center justify-center">
              <div className="h-full w-full bg-[#0b1329] rounded-[14px] flex items-center justify-center text-indigo-400">
                <Bot className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                Need help with this step?
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {currentStepContext}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Nira Contextual AI Guide</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hints */}
        <div className="p-4 bg-indigo-950/30 border-b border-indigo-500/10">
          <p className="text-[11px] font-mono font-bold text-indigo-300 mb-2 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Frequently asked on {currentStepContext}:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {hints.map((hint, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(hint)}
                className="text-left text-xs bg-white/5 hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-400/40 text-slate-200 px-3 py-1.5 rounded-xl transition-all"
              >
                {hint}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gradient-to-tr from-indigo-500 to-purple-500 text-white'
                }`}
              >
                {msg.sender === 'user' ? 'You' : <Sparkles className="w-4 h-4" />}
              </div>
              <div
                className={`p-4 rounded-2xl text-sm max-w-[85%] leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-purple-900/60 text-purple-100 border border-purple-500/30'
                    : 'bg-[#111a36] text-slate-200 border border-white/10 shadow-md'
                }`}
              >
                {msg.text}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-white/10 space-y-1">
                    <p className="text-[10px] font-mono text-indigo-400">Verified Sources:</p>
                    {msg.sources.map((s: any, i: number) => (
                      <a
                        key={i}
                        href={s.url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-xs text-indigo-300 hover:underline truncate"
                      >
                        • {s.title || s.url}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
              <Sparkles className="w-4 h-4 animate-spin" /> Nira is analyzing official guidelines…
            </div>
          )}
        </div>

        {/* Input Footer */}
        <div className="p-4 border-t border-white/10 bg-[#080d1f] flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder={`Ask Nira about ${currentStepContext}...`}
            className="flex-1 bg-[#050914] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold disabled:opacity-40 transition-all flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
