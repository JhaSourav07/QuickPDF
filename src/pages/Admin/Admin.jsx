import React, { useState, useEffect } from "react";
import {
  Bug, Lightbulb, Star, Shield, LogIn, Loader2,
  CheckCircle2, Circle, Trash2, RefreshCw, Mail,
  Filter, BarChart3, MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection, onSnapshot, doc, updateDoc, deleteDoc,
  query, orderBy,
} from "firebase/firestore";
import { db } from "../../lib/firebase";


const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

const TYPE_META = {
  bug:         { label: "Bug",         Icon: Bug,       colorClass: "text-red-400",   bgClass: "bg-red-500/10 border-red-500/20"    },
  improvement: { label: "Improvement", Icon: Lightbulb, colorClass: "text-amber-400", bgClass: "bg-amber-500/10 border-amber-500/20" },
  general:     { label: "Feedback",    Icon: Star,      colorClass: "text-blue-400",  bgClass: "bg-blue-500/10 border-blue-500/20"  },
};

function fmt(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function Stars({ n }) {
  if (!n) return <span className="text-zinc-700 text-xs">—</span>;
  return <span className="text-amber-400 text-sm">{"★".repeat(n)}{"☆".repeat(5 - n)}</span>;
}

function LoginScreen({ onAuth }) {
  const [pw, setPw]   = useState("");
  const [err, setErr] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) { onAuth(); }
    else { setErr(true); setTimeout(() => setErr(false), 1500); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-black">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white text-black mb-4">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Admin Panel</h1>
          <p className="text-zinc-500 text-sm mt-1">QuickPDF feedback dashboard</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password" value={pw} onChange={e => setPw(e.target.value)}
            placeholder="Admin password" autoFocus
            className={`w-full h-12 px-4 bg-zinc-900 border rounded-xl text-white text-sm placeholder-zinc-600 outline-none transition-all
              ${err ? "border-red-500/70 animate-pulse" : "border-white/10 focus:border-white/30"}`}
          />
          <button type="submit"
            className="w-full h-12 flex items-center justify-center gap-2 bg-white text-black font-bold rounded-xl hover:bg-zinc-100 transition-all text-sm">
            <LogIn className="w-4 h-4" /> Sign In
          </button>
          {err && <p className="text-center text-red-400 text-xs">Incorrect password</p>}
        </form>
      </motion.div>
    </div>
  );
}

function StatCard({ label, value, sub, Icon, color }) {
  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-zinc-700 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function FeedbackCard({ item, onToggleResolved, onDelete }) {
  const meta     = TYPE_META[item.type] ?? TYPE_META.general;
  const { Icon } = meta;
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await onDelete(item.id);
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      className={`bg-[#0a0a0a] border rounded-2xl p-5 space-y-3 transition-all
        ${item.resolved ? "border-white/[0.04] opacity-60" : "border-white/10"}`}>

      {/* Top row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${meta.bgClass} ${meta.colorClass}`}>
            <Icon className="w-3 h-3" />{meta.label}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs text-zinc-400 bg-white/5 border border-white/[0.06]">{item.tool}</span>
          {item.rating && <Stars n={item.rating} />}
          {item.resolved && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
              Resolved
            </span>
          )}
        </div>
        <span className="text-xs text-zinc-600 shrink-0">{fmt(item.createdAt)}</span>
      </div>

      {/* Message */}
      <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{item.message}</p>

      {/* Email */}
      {item.email && (
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Mail className="w-3.5 h-3.5 shrink-0" />
          <a href={`mailto:${item.email}`} className="hover:text-white transition-colors">{item.email}</a>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button onClick={() => onToggleResolved(item.id, item.resolved)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
            ${item.resolved
              ? "text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10"
              : "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20"}`}>
          {item.resolved
            ? <><Circle className="w-3.5 h-3.5" />Mark open</>
            : <><CheckCircle2 className="w-3.5 h-3.5" />Mark resolved</>}
        </button>

        <button onClick={handleDelete} disabled={deleting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40">
          <Trash2 className="w-3.5 h-3.5" />Delete
        </button>

        <span className="ml-auto text-[10px] text-zinc-700 font-mono truncate max-w-[180px]" title={item.userAgent}>
          {item.userAgent?.split(")")[0]?.replace("Mozilla/5.0 (", "")}
        </span>
      </div>
    </motion.div>
  );
}

export function Admin() {
  const [authed, setAuthed]             = useState(() => sessionStorage.getItem("qp_admin") === "1");
  const [items, setItems]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filterType, setFilterType]     = useState("all");
  const [filterStatus, setFilterStatus] = useState("open");
  const [sortOrder, setSortOrder]       = useState("desc");

  useEffect(() => {
    if (!authed) return;
    const q = query(collection(db, "feedback"), orderBy("createdAt", sortOrder));
    const unsub = onSnapshot(q, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [authed, sortOrder]);

  function handleAuth() { sessionStorage.setItem("qp_admin", "1"); setAuthed(true); }

  async function toggleResolved(id, current) {
    await updateDoc(doc(db, "feedback", id), { resolved: !current });
  }
  async function handleDelete(id) {
    await deleteDoc(doc(db, "feedback", id));
  }

  if (!authed) return <LoginScreen onAuth={handleAuth} />;

  // Stats
  const total     = items.length;
  const open      = items.filter(i => !i.resolved).length;
  const bugs      = items.filter(i => i.type === "bug").length;
  const avgRating = (() => {
    const rated = items.filter(i => i.rating);
    return rated.length ? (rated.reduce((s, i) => s + i.rating, 0) / rated.length).toFixed(1) : "—";
  })();

  // Filtered list
  const filtered = items.filter(i => {
    if (filterType !== "all" && i.type !== filterType) return false;
    if (filterStatus === "open"     && i.resolved)  return false;
    if (filterStatus === "resolved" && !i.resolved) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-black text-white pb-20">

      {/* Sticky header */}
      <div className="border-b border-white/10 bg-black/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-bold text-white">Admin Panel</span>
            <span className="text-zinc-600 text-sm hidden sm:block">· QuickPDF Feedback</span>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem("qp_admin"); setAuthed(false); }}
            className="text-xs text-zinc-500 hover:text-white transition-colors">
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-8 space-y-8">

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Submissions" value={total}     Icon={MessageSquare} color="bg-white/5"      />
          <StatCard label="Open Items"        value={open}      Icon={Circle}        color="bg-blue-500/10"  sub={`${total - open} resolved`} />
          <StatCard label="Bug Reports"       value={bugs}      Icon={Bug}           color="bg-red-500/10"   />
          <StatCard label="Avg Rating"        value={avgRating} Icon={Star}          color="bg-amber-500/10" sub={`from ${items.filter(i => i.rating).length} ratings`} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-zinc-600 uppercase tracking-widest font-semibold flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter
          </span>

          <div className="flex gap-1 bg-zinc-900 p-1 rounded-xl">
            {["all", "bug", "improvement", "general"].map(v => (
              <button key={v} onClick={() => setFilterType(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
                  ${filterType === v ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}>
                {v === "all" ? "All types" : v}
              </button>
            ))}
          </div>

          <div className="flex gap-1 bg-zinc-900 p-1 rounded-xl">
            {[["all","All"],["open","Open"],["resolved","Resolved"]].map(([v,l]) => (
              <button key={v} onClick={() => setFilterStatus(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${filterStatus === v ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}>
                {l}
              </button>
            ))}
          </div>

          <button onClick={() => setSortOrder(o => o === "desc" ? "asc" : "desc")}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 rounded-xl text-xs text-zinc-400 hover:text-white transition-all">
            <RefreshCw className="w-3 h-3" />
            {sortOrder === "desc" ? "Newest first" : "Oldest first"}
          </button>

          <span className="ml-auto text-xs text-zinc-600">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-zinc-600">
            <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No feedback matches these filters.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-4">
              {filtered.map(item => (
                <FeedbackCard
                  key={item.id} item={item}
                  onToggleResolved={toggleResolved}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
