import { useState, useEffect, useRef } from "react";

let _db = null;
const getDB = () => _db ??= new Promise((res, rej) => {
  const req = indexedDB.open("quickpdf_store", 1);
  req.onupgradeneeded = () => req.result.createObjectStore("store");
  req.onsuccess  = () => res(req.result);
  req.onerror    = () => { _db = null; rej(req.error); };
});

const dbCall = async (mode, action) => {
  const db = await getDB();
  return new Promise((res, rej) => {
    const t = db.transaction("store", mode);
    const r = action(t.objectStore("store"));
    t.oncomplete = () => res(r?.result);
    t.onerror    = rej;
  });
};

export function useFileStore(key, initial = null) {
  const [state, setState] = useState(initial);
  const hydrated = useRef(false);
  const pendingWrite = useRef(false);

  useEffect(() => {
    let active = true;
    dbCall("readonly", s => s.get(key)).then(saved => {
      if (!active) return;
      hydrated.current = true;
      if (pendingWrite.current) { pendingWrite.current = false; setState(p => p); }
      if (!saved) return;
      const revive = (v) => (v?.file instanceof Blob || v?.file instanceof File) ? { ...v, url: URL.createObjectURL(v.file), id: v.id || crypto.randomUUID() } : v;
      setState(Array.isArray(saved) ? saved.map(revive) : (saved instanceof Blob || saved instanceof File ? saved : revive(saved)));
    }).catch(() => {
      hydrated.current = true;
      if (pendingWrite.current) { pendingWrite.current = false; setState(p => p); }
    });
    return () => { active = false; };
  }, [key]);

  useEffect(() => {
    if (!hydrated.current) { pendingWrite.current = true; return; }
    const strip = (v) => { if (v && typeof v === "object") { const c = { ...v }; if (typeof c.url === "string" && c.url.startsWith("blob:")) delete c.url; return c; } return v; };
    const clean = Array.isArray(state) ? state.map(strip) : (state instanceof Blob || state instanceof File ? state : strip(state));
    const isEmpty = !state || (Array.isArray(state) && !state.length);
    dbCall("readwrite", s => isEmpty ? s.delete(key) : s.put(clean, key));
  }, [state, key]);

  const setStateWithRevoke = (next) => {
    const outgoing = Array.isArray(state) ? state : (state ? [state] : []);
    outgoing.forEach(i => i?.url?.startsWith("blob:") && URL.revokeObjectURL(i.url));
    setState(next);
  };

  const clear = () => setStateWithRevoke(initial);
  return [state, setStateWithRevoke, clear];
}
