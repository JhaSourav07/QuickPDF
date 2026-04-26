import React, { useState } from "react";
import { MessageSquarePlus, X, Bug, Lightbulb, Star, Send, CheckCircle2, Loader2, ChevronDown } from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";

const TYPES = [
  { value: "bug",         label: "Bug Report",       color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20"    },
  { value: "improvement", label: "Improvement Idea",  color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20" },
  { value: "general",     label: "General Feedback",  color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20"  },
];

const TOOLS = [
  "General / Home", "Merge PDF", "Split PDF", "Watermark PDF", "Image to PDF",
  "Compress PDF", "Rotate PDF", "Organize PDF", "PDF to Images", "Grayscale PDF",
  "Page Numbers", "Lock PDF", "Edit PDF",
];

export function FeedbackWidget() {
  const [open, setOpen]       = useState(false);
  const [type, setType]       = useState("general");
  const [tool, setTool]       = useState("General / Home");
  const [message, setMessage] = useState("");
  const [email, setEmail]     = useState("");
  const [rating, setRating]   = useState(0);
  const [hovered, setHovered] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState(null);

  function reset() {
    setType("general"); setTool("General / Home"); setMessage("");
    setEmail(""); setRating(0); setSent(false); setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true); setError(null);
    try {
      await addDoc(collection(db, "feedback"), {
        type, tool, message: message.trim(),
        email: email.trim() || null,
        rating: rating || null,
        userAgent: navigator.userAgent,
        createdAt: serverTimestamp(),
        resolved: false,
      });
      setSent(true);
      setTimeout(() => { setOpen(false); setTimeout(reset, 300); }, 2500);
    } catch {
      setError("Failed to send. Please try again.");
    }
    setSending(false);
  }


  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => { setOpen(true); setSent(false); }}
        title="Send feedback"
        className="fixed bottom-20 right-6 z-40 flex items-center gap-2 h-11 px-4 rounded-full bg-white text-black text-sm font-semibold shadow-[0_4px_24px_rgba(255,255,255,0.15)] hover:scale-105 hover:shadow-[0_4px_32px_rgba(255,255,255,0.25)] transition-all duration-200"
      >
        <MessageSquarePlus className="w-4 h-4" />
        Feedback
      </button>

      {/* Backdrop + Modal */}
      <AnimatePresence>
        {open && (
          <Motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) { setOpen(false); setTimeout(reset, 300); } }}
          >
            <Motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
              className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-white font-bold text-lg">Share Feedback</h2>
                  <p className="text-zinc-500 text-sm mt-0.5">Help us improve QuickPDF</p>
                </div>
                <button
                  onClick={() => { setOpen(false); setTimeout(reset, 300); }}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {sent ? (
                /* ── Success state ── */
                <div className="flex flex-col items-center justify-center py-14 gap-4">
                  <Motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
                    <CheckCircle2 className="w-14 h-14 text-emerald-400" />
                  </Motion.div>
                  <p className="text-white font-semibold text-lg">Thank you!</p>
                  <p className="text-zinc-500 text-sm text-center px-8">Your feedback has been received. We read every submission.</p>
                </div>
              ) : (
                /* ── Form ── */
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

                  {/* Type */}
                  <div className="space-y-2">
                    <label className="block text-xs text-zinc-500 uppercase tracking-widest font-semibold">Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {TYPES.map(({ value, label, color, bg }) => (
                        <button key={value} type="button" onClick={() => setType(value)}
                          className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border text-xs font-medium transition-all
                            ${type === value ? `${bg} ${color} border-current` : "border-white/[0.06] text-zinc-500 hover:text-white hover:border-white/20"}`}>
                          
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tool */}
                  <div className="space-y-2">
                    <label className="block text-xs text-zinc-500 uppercase tracking-widest font-semibold">Related Tool</label>
                    <div className="relative">
                      <select value={tool} onChange={e => setTool(e.target.value)}
                        className="w-full h-11 pl-4 pr-10 bg-zinc-900/60 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/30 appearance-none cursor-pointer transition-colors">
                        {TOOLS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Star rating */}
                  <div className="space-y-2">
                    <label className="block text-xs text-zinc-500 uppercase tracking-widest font-semibold">
                      Rating <span className="normal-case font-normal">(optional)</span>
                    </label>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} type="button"
                          onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}
                          onClick={() => setRating(r => r === n ? 0 : n)}
                          className={`w-9 h-9 rounded-xl text-lg transition-all
                            ${n <= (hovered || rating) ? "text-amber-400 bg-amber-400/10" : "text-zinc-700 hover:text-zinc-500"}`}>
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label className="block text-xs text-zinc-500 uppercase tracking-widest font-semibold">
                      Message <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={message} onChange={e => setMessage(e.target.value)}
                      required maxLength={2000} rows={4}
                      placeholder={
                        type === "bug"         ? "Describe what happened and how to reproduce it…" :
                        type === "improvement" ? "What feature or change would help you most?" :
                                                 "What's on your mind?"
                      }
                      className="w-full px-4 py-3 bg-zinc-900/60 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 resize-none transition-colors"
                    />
                    <p className="text-right text-xs text-zinc-700">{message.length}/2000</p>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="block text-xs text-zinc-500 uppercase tracking-widest font-semibold">
                      Email <span className="normal-case font-normal">(optional — for follow-up)</span>
                    </label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full h-11 px-4 bg-zinc-900/60 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors" />
                  </div>

                  {error && <p className="text-red-400 text-sm">{error}</p>}

                  {/* Submit */}
                  <button type="submit" disabled={sending || !message.trim()}
                    className="w-full h-12 flex items-center justify-center gap-2 bg-white text-black font-bold rounded-2xl hover:bg-zinc-100 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-sm">
                    {sending
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</>
                      : <><Send className="w-4 h-4" />Send Feedback</>}
                  </button>
                </form>
              )}
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
