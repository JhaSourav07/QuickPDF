import React, { useState, useRef, useEffect } from "react";
import { useFileStore } from "../../hooks/useFileStore";
import {
  Pencil, Type, Highlighter, Square, Eraser,
  Undo2, Download, Loader2, X, FileEdit, CheckCircle2, PenLine, Info,
} from "lucide-react";
import { motion } from "framer-motion";
import * as pdfjsLib from "pdfjs-dist";
import { Button }         from "../../components/ui/Button";
import { UpgradeButton }  from "../../components/ui/UpgradeButton";
import { Dropzone }       from "../../components/pdf/Dropzone";
import { formatFileSize } from "../../utils/formatters";
import { applyEdits, editPdfText } from "../../services/pdf.service";
import { useSubscription } from "../../hooks/useSubscription";
import { FREE_LIMITS, mbToBytes } from "../../config/limits";

// ── constants ────────────────────────────────────────────────────────────────
const RENDER_SCALE = 1.5;
const ANN_TOOLS = [
  { id: "draw",      Icon: Pencil,      label: "Draw"      },
  { id: "text",      Icon: Type,        label: "Text"      },
  { id: "highlight", Icon: Highlighter, label: "Highlight" },
  { id: "rect",      Icon: Square,      label: "Rectangle" },
  { id: "eraser",    Icon: Eraser,      label: "Eraser"    },
];
const COLORS = ["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#a855f7","#ec4899","#000000","#ffffff"];
const HINTS  = { draw:"Click and drag freely", text:"Click to place a text box", highlight:"Drag to highlight an area", rect:"Drag to draw a rectangle", eraser:"Click any annotation to remove it" };
const CURSOR = { draw:"crosshair", text:"text", highlight:"crosshair", rect:"crosshair", eraser:"cell" };

// ── canvas helpers ────────────────────────────────────────────────────────────
function drawAnn(ctx, ann) {
  ctx.save();
  ctx.strokeStyle = ann.color; ctx.fillStyle = ann.color;
  ctx.lineWidth = ann.strokeWidth ?? 2; ctx.lineCap = "round"; ctx.lineJoin = "round";
  switch (ann.type) {
    case "draw":
      if (!ann.points || ann.points.length < 2) break;
      ctx.globalAlpha = ann.opacity ?? 1;
      ctx.beginPath(); ctx.moveTo(ann.points[0].x, ann.points[0].y);
      ann.points.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke(); break;
    case "highlight": {
      ctx.globalAlpha = 0.35;
      const x = Math.min(ann.x, ann.x2??ann.x), y = Math.min(ann.y, ann.y2??ann.y);
      ctx.fillRect(x, y, Math.abs((ann.x2??ann.x)-ann.x), Math.abs((ann.y2??ann.y)-ann.y)); break;
    }
    case "rect": {
      ctx.globalAlpha = ann.opacity ?? 1;
      const x = Math.min(ann.x, ann.x2??ann.x), y = Math.min(ann.y, ann.y2??ann.y);
      ctx.strokeRect(x, y, Math.abs((ann.x2??ann.x)-ann.x), Math.abs((ann.y2??ann.y)-ann.y)); break;
    }
    case "text":
      ctx.globalAlpha = ann.opacity ?? 1;
      ctx.font = `${ann.fontSize??18}px sans-serif`;
      ctx.fillText(ann.text, ann.x, ann.y); break;
  }
  ctx.restore();
}

function hitTest(ann, x, y) {
  const R = Math.max(10, (ann.strokeWidth??2)*3);
  switch (ann.type) {
    case "draw": return ann.points?.some(p => Math.hypot(p.x-x, p.y-y) < R);
    case "text": { const fs = ann.fontSize??18; return x>=ann.x-4 && x<=ann.x+ann.text.length*fs*0.6 && y>=ann.y-fs && y<=ann.y+4; }
    default: return x>=Math.min(ann.x,ann.x2??ann.x)-4&&x<=Math.max(ann.x,ann.x2??ann.x)+4&&y>=Math.min(ann.y,ann.y2??ann.y)-4&&y<=Math.max(ann.y,ann.y2??ann.y)+4;
  }
}
function getPos(e, el) { const r = el.getBoundingClientRect(); return { x: e.clientX-r.left, y: e.clientY-r.top }; }

// ── component ─────────────────────────────────────────────────────────────────
export function EditPdf() {
  const [file, setFile] = useFileStore("EditPdf_file", null);
  const [pages, setPages]     = useFileStore("EditPdf_pages", []);    // {imageData,width,height,pdfWidth,pdfHeight}
  const [textItems, setTextItems] = useFileStore("EditPdf_textItems", []); // extracted text with coords
  const [isLoading, setIsLoading]     = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState(null);

  // editor
  const [mode, setMode]       = useState("annotate"); // "annotate" | "edittext"
  const [annotations, setAnnotations] = useFileStore("EditPdf_annotations", []);
  const [tool, setTool]       = useState("draw");
  const [color, setColor]     = useState("#ef4444");
  const [stroke, setStroke]   = useState(3);
  const [fontSize, setFontSize] = useState(18);
  const [opacity]             = useState(1);

  // text editing
  const [textEdits, setTextEdits] = useFileStore("EditPdf_textEdits", {});   // {itemId → newText}
  const [editingId, setEditingId] = useState(null);

  // annotate text-box overlay
  const [textBox, setTextBox] = useState(null);

  const canvasRefs = useRef({});
  const drawing    = useRef(null);

  const { isPremium, isWalletConnected: isConn, hasReachedGlobalLimit, incrementUsage } = useSubscription();
  const LIMIT_MB   = FREE_LIMITS.editPdf.maxFileSizeMb;
  const isOverSize = !isPremium && !!file && file.size > mbToBytes(LIMIT_MB);
  const isLocked   = !isPremium && (isOverSize || hasReachedGlobalLimit);

  // ── load PDF ────────────────────────────────────────────────────────────────
  async function loadFile(f) {
    setIsLoading(true); setError(null); setAnnotations([]); setTextEdits({}); setDone(false);
    try {
      const buf = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      const rendered = [], tItems = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const vp   = page.getViewport({ scale: RENDER_SCALE });
        const cvs  = document.createElement("canvas");
        cvs.width  = vp.width; cvs.height = vp.height;
        await page.render({ canvasContext: cvs.getContext("2d"), viewport: vp }).promise;

        const pageH = page.view[3]; // page height in PDF points
        rendered.push({ imageData: cvs.toDataURL("image/jpeg", 0.92), width: vp.width, height: vp.height, pdfWidth: page.view[2], pdfHeight: pageH });

        // Extract text positions
        const tc = await page.getTextContent();
        tc.items.forEach((item, idx) => {
          if (!item.str?.trim()) return;
          const [a, b, , d, tx, ty] = item.transform;
          const fs = Math.sqrt(a*a + b*b);
          if (fs < 0.5) return;
          tItems.push({
            id: `${i-1}-${idx}`,
            pageIndex: i - 1,
            str: item.str,
            // canvas coords (y flipped, baseline-offset)
            canvasX: tx * RENDER_SCALE,
            canvasY: (pageH - ty) * RENDER_SCALE - fs * RENDER_SCALE,
            canvasW: Math.max(item.width * RENDER_SCALE, 4),
            canvasH: fs * RENDER_SCALE * 1.4,
            // PDF coords for pdf-lib (bottom-left origin, already correct)
            pdfX: tx, pdfY: ty, pdfW: Math.max(item.width, 1), fontSize: fs,
          });
        });
      }
      setPages(rendered); setTextItems(tItems);
    } catch { setError("Could not read the PDF. It may be encrypted or corrupted."); }
    setIsLoading(false);
  }

  // ── redraw canvas on annotation + text-edit changes ─────────────────────────
  useEffect(() => { pages.forEach((_, i) => redraw(i, null)); }, [annotations, pages, textEdits, textItems]); // eslint-disable-line

  function redraw(pi, inProgress) {
    const cvs = canvasRefs.current[pi]; if (!cvs) return;
    const ctx = cvs.getContext("2d"); ctx.clearRect(0, 0, cvs.width, cvs.height);

    // ── 1. Paint text-edit replacements onto the canvas (WYSIWYG preview) ──
    textItems.filter(t => t.pageIndex === pi).forEach(item => {
      const newText = textEdits[item.id];
      if (newText === undefined || newText === item.str) return;

      // White rectangle covers the original text in the background image
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(item.canvasX - 1, item.canvasY - 1, item.canvasW + 2, item.canvasH + 2);

      // Draw replacement text at the baseline (canvasY is the TOP of text box,
      // so baseline = canvasY + fontSize * RENDER_SCALE)
      if (newText.trim()) {
        ctx.fillStyle = "#000000";
        ctx.font = `${item.fontSize * RENDER_SCALE}px Helvetica, Arial, sans-serif`;
        ctx.fillText(newText, item.canvasX, item.canvasY + item.fontSize * RENDER_SCALE);
      }
    });

    // ── 2. Draw annotation strokes on top ────────────────────────────────────
    annotations.filter(a => a.pageIndex === pi).forEach(a => drawAnn(ctx, a));
    if (inProgress) drawAnn(ctx, inProgress);
  }

  // ── annotation mouse handlers ────────────────────────────────────────────────
  function onMouseDown(e, pi) {
    if (mode !== "annotate") return;
    const pos = getPos(e, canvasRefs.current[pi]);
    if (tool === "text") { setTextBox({ pageIndex: pi, x: pos.x, y: pos.y, value: "" }); return; }
    if (tool === "eraser") {
      setAnnotations(prev => {
        const idx = [...prev].reverse().findIndex(a => a.pageIndex === pi && hitTest(a, pos.x, pos.y));
        return idx < 0 ? prev : prev.filter((_, i) => i !== prev.length - 1 - idx);
      }); return;
    }
    drawing.current = { pageIndex: pi, type: tool, color, strokeWidth: stroke, opacity, x: pos.x, y: pos.y, x2: pos.x, y2: pos.y, points: [pos] };
  }
  function onMouseMove(e, pi) {
    if (!drawing.current || drawing.current.pageIndex !== pi) return;
    const pos = getPos(e, canvasRefs.current[pi]);
    drawing.current.x2 = pos.x; drawing.current.y2 = pos.y;
    if (tool === "draw") drawing.current.points.push(pos);
    redraw(pi, drawing.current);
  }
  function onMouseUp(e, pi) {
    if (!drawing.current || drawing.current.pageIndex !== pi) return;
    const d = drawing.current; drawing.current = null;
    const ok = d.type === "draw" ? d.points.length >= 2 : Math.abs(d.x2-d.x) > 3 || Math.abs(d.y2-d.y) > 3;
    if (ok) setAnnotations(prev => [...prev, { ...d, id: Date.now() }]); else redraw(pi, null);
  }
  function commitTextBox() {
    if (!textBox) return;
    if (textBox.value.trim()) setAnnotations(prev => [...prev, { id: Date.now(), type: "text", pageIndex: textBox.pageIndex, x: textBox.x, y: textBox.y + fontSize, text: textBox.value, color, fontSize, opacity, strokeWidth: 1 }]);
    setTextBox(null);
  }

  // ── save PDF (applies both annotations and text edits) ──────────────────────
  const hasTextEdits = () => Object.entries(textEdits).some(([id, t]) => textItems.find(i => i.id === id)?.str !== t);
  const totalEdits   = annotations.length + Object.keys(textEdits).filter(id => textEdits[id] !== textItems.find(t => t.id === id)?.str).length;

  async function handleDownload() {
    if (!totalEdits) return;
    setIsProcessing(true); setError(null);
    try {
      let outFile = file;
      if (annotations.length) {
        const blob = await applyEdits(outFile, annotations, pages);
        outFile = new File([blob], file.name, { type: "application/pdf" });
      }
      if (hasTextEdits()) {
        const blob = await editPdfText(outFile, textEdits, textItems);
        outFile = new File([blob], file.name, { type: "application/pdf" });
      }
      const url = URL.createObjectURL(outFile);
      Object.assign(document.createElement("a"), { href: url, download: `edited_${file.name}` }).click();
      URL.revokeObjectURL(url);
      await incrementUsage(); setDone(true);
    } catch (err) { setError("Failed to apply edits. " + (err?.message ?? "")); }
    setIsProcessing(false);
  }

  function reset() { setFile(null); setPages([]); setTextItems([]); setAnnotations([]); setTextEdits({}); setDone(false); setError(null); }

  // ── upload view ──────────────────────────────────────────────────────────────
  if (!file || (!pages.length && !isLoading)) return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", duration: 0.6 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white text-black mb-6 shadow-[0_0_50px_rgba(255,255,255,0.15)]">
          <FileEdit className="w-10 h-10" />
        </motion.div>
        <h1 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase">Edit PDF</h1>
        <p className="text-zinc-500 text-lg font-light max-w-md mx-auto">Draw, annotate, highlight — or click existing text to edit it directly in the browser.</p>
      </div>
      {error && <div className="mb-6 p-4 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20 text-sm">{error}</div>}
      <Dropzone onFilesSelected={fs => { const f = fs[0]; if (f) { setFile(f); loadFile(f); } }} multiple={false} text="Drop a PDF to start editing" />
      {!isPremium && <p className="text-center text-xs text-zinc-600 mt-4">Free tier: files up to {LIMIT_MB} MB</p>}
    </div>
  );

  // ── loading view ─────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-10 h-10 text-white animate-spin" />
      <p className="text-zinc-400 text-sm">Rendering pages and extracting text…</p>
    </div>
  );

  // ── editor view ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Sticky toolbar ── */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur border-b border-white/10 px-4 py-3 flex flex-wrap items-center gap-3">

        {/* File + close */}
        <span className="text-xs text-zinc-500 truncate max-w-[110px]">{file.name}</span>
        <button onClick={reset} className="p-1 text-zinc-600 hover:text-white rounded transition-colors"><X className="w-4 h-4" /></button>
        <div className="h-4 w-px bg-white/10" />

        {/* Mode toggle */}
        <div className="flex bg-zinc-900 rounded-xl p-1 gap-1">
          <button onClick={() => setMode("annotate")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${mode==="annotate"?"bg-white text-black":"text-zinc-400 hover:text-white"}`}>
            <Pencil className="w-3 h-3" /> Annotate
          </button>
          <button onClick={() => setMode("edittext")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${mode==="edittext"?"bg-white text-black":"text-zinc-400 hover:text-white"}`}>
            <PenLine className="w-3 h-3" /> Edit Text
          </button>
        </div>

        {/* Annotation tools (annotate mode only) */}
        {mode === "annotate" && <>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex gap-1">
            {ANN_TOOLS.map(({ id, Icon, label }) => (
              <button key={id} title={label} onClick={() => setTool(id)}
                className={`p-2 rounded-xl transition-all ${tool===id?"bg-white text-black":"text-zinc-400 hover:text-white hover:bg-white/10"}`}>
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex gap-1">
            {COLORS.map(c => <button key={c} onClick={() => setColor(c)} style={{ background: c }} className={`w-5 h-5 rounded-full border-2 transition-all ${color===c?"border-white scale-125":"border-transparent"}`} />)}
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-5 h-5 rounded-full cursor-pointer bg-transparent border-0 p-0" title="Custom" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">{tool==="text"?"Font":"Size"}</span>
            <input type="range" min={tool==="text"?8:1} max={tool==="text"?72:20} value={tool==="text"?fontSize:stroke}
              onChange={e => tool==="text"?setFontSize(+e.target.value):setStroke(+e.target.value)} className="w-16 accent-white" />
            <span className="text-xs text-zinc-300 w-5">{tool==="text"?fontSize:stroke}</span>
          </div>
        </>}

        {/* Edit text mode info */}
        {mode === "edittext" && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Info className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <span>Hover text to see it · click to edit · Enter to confirm</span>
            {Object.keys(textEdits).filter(id => textEdits[id] !== textItems.find(t=>t.id===id)?.str).length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full font-medium">
                {Object.keys(textEdits).filter(id => textEdits[id] !== textItems.find(t=>t.id===id)?.str).length} edited
              </span>
            )}
          </div>
        )}

        <div className="h-4 w-px bg-white/10" />

        {/* Undo */}
        {mode === "annotate" && (
          <button onClick={() => setAnnotations(p => p.slice(0,-1))} disabled={!annotations.length}
            title="Undo" className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all">
            <Undo2 className="w-4 h-4" />
          </button>
        )}

        {totalEdits > 0 && <span className="text-xs text-zinc-500">{totalEdits} edit{totalEdits>1?"s":""}</span>}

        {/* Save */}
        <div className="ml-auto">
          {isLocked ? <UpgradeButton reason={hasReachedGlobalLimit?"global":"size"} limitLabel={`${LIMIT_MB} MB`} isWalletConnected={isConn} isPremium={isPremium} /> : (
            <Button onClick={handleDownload} disabled={isProcessing || !totalEdits} className="h-9 px-5 text-sm font-semibold disabled:opacity-40">
              {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Saving…</> : done ? <><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400"/>Downloaded!</> : <><Download className="w-4 h-4 mr-2"/>Save PDF</>}
            </Button>
          )}
        </div>
      </div>

      {error && <div className="mx-4 mt-4 p-3 bg-red-500/10 text-red-400 text-sm rounded-xl border border-red-500/20">{error}</div>}

      {/* Edit-text notice about font substitution */}
      {mode === "edittext" && (
        <div className="mx-4 mt-4 p-3 bg-zinc-900/60 border border-white/10 rounded-xl text-xs text-zinc-500 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-zinc-600" />
          Edited text uses Helvetica as the replacement font — the style will match the original size but the typeface may differ from the source PDF.
        </div>
      )}

      {/* ── Page area ── */}
      <div className="flex flex-col items-center gap-10 py-10 px-4 overflow-x-auto">
        {pages.map((page, pi) => (
          <div key={pi} className="relative shadow-2xl rounded overflow-hidden border border-white/10" style={{ width: page.width, height: page.height }}>

            <div className="absolute top-2 left-2 z-10 bg-black/60 text-zinc-400 text-xs px-2 py-0.5 rounded-full pointer-events-none">
              Page {pi + 1}
            </div>

            <img src={page.imageData} alt={`Page ${pi+1}`} style={{ display:"block", width:page.width, height:page.height, pointerEvents:"none" }} />

            {/* Annotation canvas */}
            <canvas
              ref={el => { if (el) canvasRefs.current[pi] = el; }}
              width={page.width} height={page.height}
              style={{ position:"absolute", top:0, left:0, cursor: mode==="edittext" ? "default" : CURSOR[tool], pointerEvents: mode==="edittext" ? "none" : "auto" }}
              onMouseDown={e => onMouseDown(e, pi)}
              onMouseMove={e => onMouseMove(e, pi)}
              onMouseUp={e => onMouseUp(e, pi)}
              onMouseLeave={e => onMouseUp(e, pi)}
            />

            {/* Text item overlays (Edit Text mode) */}
            {mode === "edittext" && textItems.filter(t => t.pageIndex === pi).map(item => {
              const isEditing  = editingId === item.id;
              const editedText = textEdits[item.id];
              const isChanged  = editedText !== undefined && editedText !== item.str;

              return isEditing ? (
                <input key={item.id} autoFocus
                  defaultValue={editedText ?? item.str}
                  onBlur={e => { setTextEdits(p => ({ ...p, [item.id]: e.target.value })); setEditingId(null); }}
                  onKeyDown={e => {
                    if (e.key === "Enter") { setTextEdits(p => ({ ...p, [item.id]: e.target.value })); setEditingId(null); }
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  style={{
                    position:"absolute", left:item.canvasX, top:item.canvasY,
                    width: Math.max(item.canvasW, 80), height: item.canvasH,
                    fontSize: item.fontSize * RENDER_SCALE * 0.9,
                    fontFamily:"sans-serif", lineHeight:1.2,
                    background:"rgba(255,248,180,0.95)", border:"2px solid #3b82f6",
                    color:"#000", outline:"none", padding:"0 3px", zIndex:20,
                  }}
                />
              ) : (
                <div key={item.id} onClick={() => setEditingId(item.id)} title={`Click to edit: "${item.str}"`}
                  style={{
                    position:"absolute", left:item.canvasX, top:item.canvasY,
                    width: item.canvasW, height: item.canvasH,
                    cursor:"text", zIndex:10,
                    // Always transparent — canvas draws the replacement text beneath this div
                    background: "transparent",
                    border: isChanged ? "1px solid rgba(59,130,246,0.35)" : "1px solid transparent",
                    borderRadius:2, transition:"border-color 0.15s",
                  }}
                  className="hover:border-blue-400/50"
                />
              );
            })}

            {/* Annotate text-box input */}
            {textBox?.pageIndex === pi && (
              <textarea autoFocus value={textBox.value}
                onChange={e => setTextBox(t => ({ ...t, value: e.target.value }))}
                onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { commitTextBox(); e.preventDefault(); } if (e.key==="Escape") setTextBox(null); }}
                onBlur={commitTextBox}
                style={{ position:"absolute", left:textBox.x, top:textBox.y - fontSize, background:"transparent", border:"1px dashed rgba(255,255,255,0.4)", color, fontSize, fontFamily:"sans-serif", lineHeight:1.2, outline:"none", resize:"none", padding:"2px 4px", minWidth:80, minHeight:fontSize+8 }}
              />
            )}
          </div>
        ))}

        {mode === "edittext" && textItems.filter(t => t.pageIndex !== undefined).length === 0 && pages.length > 0 && (
          <p className="text-zinc-600 text-sm">No selectable text found — this may be a scanned PDF.</p>
        )}
      </div>

      {/* ── Hint bar ── */}
      <div className="sticky bottom-0 bg-black/80 backdrop-blur border-t border-white/10 px-6 py-2 text-xs text-zinc-600 text-center">
        {mode === "annotate" ? HINTS[tool] : "Click any highlighted text region to edit it · Enter to confirm · Escape to cancel"}
      </div>
    </div>
  );
}
