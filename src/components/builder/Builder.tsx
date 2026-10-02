import { useCallback, useEffect, useState } from "react";
import {
  Type, AlignLeft, MousePointerClick, Image as ImageIcon, Square, Columns3, Minus,
  Trash2, Copy, ArrowUp, ArrowDown, Undo2, Redo2, Eye, Pencil, Monitor, Tablet, Smartphone, Download, RotateCcw, Layers,
} from "lucide-react";
import { RenderNode } from "./Canvas";
import { Inspector } from "./Inspector";
import {
  type BNode, type NodeType, createNode, defaultPage, findNode, findParent, mapTree, cloneWithIds, isContainer, toHTML,
} from "./types";

const KEY = "builder-page-v1";
const ADD: { type: NodeType; label: string; icon: React.ElementType }[] = [
  { type: "section", label: "Section", icon: Square },
  { type: "container", label: "Row / Box", icon: Columns3 },
  { type: "heading", label: "Heading", icon: Type },
  { type: "text", label: "Paragraph", icon: AlignLeft },
  { type: "button", label: "Button", icon: MousePointerClick },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "divider", label: "Divider", icon: Minus },
];
const DEVICES = { desktop: "100%", tablet: "768px", mobile: "390px" } as const;

export function Builder() {
  const [page, setPage] = useState<BNode>(defaultPage);
  const [past, setPast] = useState<BNode[]>([]);
  const [future, setFuture] = useState<BNode[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [textEditId, setTextEditId] = useState<string | null>(null);
  const [editing, setEditing] = useState(true);
  const [device, setDevice] = useState<keyof typeof DEVICES>("desktop");
  const [tab, setTab] = useState<"add" | "layers">("add");

  const select = (id: string | null) => { setSelected(id); setTextEditId(null); };
  const selectParent = (id: string) => {
    const parent = findParent(page, id);
    if (parent && parent.id !== id) select(parent.id);
  };

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) try { setPage(JSON.parse(raw)); } catch { /* ignore */ }
  }, []);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(page)); }, [page]);

  const commit = useCallback((next: BNode) => {
    setPast((p) => [...p.slice(-50), page]);
    setFuture([]);
    setPage(next);
  }, [page]);

  const undo = () => { if (!past.length) return; setFuture((f) => [page, ...f]); setPage(past[past.length - 1]!); setPast((p) => p.slice(0, -1)); };
  const redo = () => { if (!future.length) return; setPast((p) => [...p, page]); setPage(future[0]!); setFuture((f) => f.slice(1)); };

  const update = (id: string, patch: Partial<BNode>) => commit(mapTree(page, (n) => (n.id === id ? { ...n, ...patch } : n)));
  const setStyle = (id: string, k: string, v: string) =>
    commit(mapTree(page, (n) => {
      if (n.id !== id) return n;
      const style = { ...n.style };
      if (v === "") delete style[k]; else style[k] = v;
      return { ...n, style };
    }));

  const add = (type: NodeType) => {
    const node = createNode(type);
    const sel = selected ? findNode(page, selected) : null;
    let next: BNode;
    if (sel && isContainer(sel.type)) {
      next = mapTree(page, (n) => (n.id === sel.id ? { ...n, children: [...(n.children ?? []), node] } : n));
    } else if (sel) {
      const parent = findParent(page, sel.id)!;
      next = mapTree(page, (n) => {
        if (n.id !== parent.id) return n;
        const ch = [...n.children!]; ch.splice(ch.findIndex((c) => c.id === sel.id) + 1, 0, node);
        return { ...n, children: ch };
      });
    } else {
      next = { ...page, children: [...(page.children ?? []), node] };
    }
    commit(next); setSelected(node.id);
  };

  const remove = () => {
    if (!selected || selected === "root") return;
    const parent = findParent(page, selected)!;
    commit(mapTree(page, (n) => (n.id === parent.id ? { ...n, children: n.children!.filter((c) => c.id !== selected) } : n)));
    setSelected(null);
  };
  const duplicate = () => {
    if (!selected || selected === "root") return;
    const parent = findParent(page, selected)!;
    const copy = cloneWithIds(findNode(page, selected)!);
    commit(mapTree(page, (n) => {
      if (n.id !== parent.id) return n;
      const ch = [...n.children!]; ch.splice(ch.findIndex((c) => c.id === selected) + 1, 0, copy);
      return { ...n, children: ch };
    }));
    setSelected(copy.id);
  };
  const move = (dir: -1 | 1) => {
    if (!selected || selected === "root") return;
    const parent = findParent(page, selected)!;
    commit(mapTree(page, (n) => {
      if (n.id !== parent.id) return n;
      const ch = [...n.children!]; const i = ch.findIndex((c) => c.id === selected); const j = i + dir;
      if (j < 0 || j >= ch.length) return n;
      const tmp = ch[i]!; ch[i] = ch[j]!; ch[j] = tmp;
      return { ...n, children: ch };
    }));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (e.key === "Delete" || e.key === "Backspace") remove();
      else if (e.key === "Escape") { if (textEditId) setTextEditId(null); else setSelected(null); }
      else if (e.key === "Enter" && selected && !textEditId) {
        const n = findNode(page, selected);
        if (n && (n.type === "heading" || n.type === "text" || n.type === "button")) { e.preventDefault(); setTextEditId(selected); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const exportHtml = () => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>My site</title><style>body{margin:0;font-family:'DM Sans',system-ui,sans-serif}</style></head><body>${toHTML(page)}</body></html>`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    a.download = "site.html"; a.click();
  };

  const selNode = selected ? findNode(page, selected) : null;

  const Layer = ({ n, depth }: { n: BNode; depth: number }) => (
    <>
      <button className={`layer ${selected === n.id ? "layer-active" : ""}`} style={{ paddingLeft: 10 + depth * 14 }} onClick={() => setSelected(n.id)}>
        <span className="layer-type">{n.id === "root" ? "page" : n.type}</span>
        <span className="layer-text">{n.text ?? ""}</span>
      </button>
      {n.children?.map((c) => <Layer key={c.id} n={c} depth={depth + 1} />)}
    </>
  );

  return (
    <div className="bld">
      <header className="bld-top">
        <div className="bld-brand">Canvas<span>.</span></div>
        <div className="bld-group">
          <button className="ibtn" onClick={undo} disabled={!past.length} title="Undo"><Undo2 size={16} /></button>
          <button className="ibtn" onClick={redo} disabled={!future.length} title="Redo"><Redo2 size={16} /></button>
        </div>
        <div className="bld-group">
          {(Object.keys(DEVICES) as (keyof typeof DEVICES)[]).map((d) => {
            const I = d === "desktop" ? Monitor : d === "tablet" ? Tablet : Smartphone;
            return <button key={d} className={`ibtn ${device === d ? "ibtn-on" : ""}`} onClick={() => setDevice(d)} title={d}><I size={16} /></button>;
          })}
        </div>
        <div className="bld-group">
          <button className="ibtn" title="Reset page" onClick={() => { commit(defaultPage); setSelected(null); }}><RotateCcw size={16} /></button>
          <button className="ibtn" title="Download HTML" onClick={exportHtml}><Download size={16} /></button>
          <button className="pbtn" onClick={() => { setEditing(!editing); setSelected(null); }}>
            {editing ? <><Eye size={15} /> Preview</> : <><Pencil size={15} /> Edit</>}
          </button>
        </div>
      </header>

      <div className="bld-body">
        {editing && (
          <aside className="bld-left">
            <div className="tabs">
              <button className={tab === "add" ? "on" : ""} onClick={() => setTab("add")}>Add</button>
              <button className={tab === "layers" ? "on" : ""} onClick={() => setTab("layers")}><Layers size={13} /> Layers</button>
            </div>
            {tab === "add" ? (
              <div className="addgrid">
                {ADD.map(({ type, label, icon: I }) => (
                  <button key={type} className="addbtn" onClick={() => add(type)}><I size={20} /><span>{label}</span></button>
                ))}
                <p className="insp-hint" style={{ gridColumn: "1 / -1" }}>
                  New elements go inside the selected section/box, or right after the selected element.
                </p>
              </div>
            ) : (
              <div className="layers"><Layer n={page} depth={0} /></div>
            )}
          </aside>
        )}

        <main className="bld-stage" onClick={() => setSelected(null)}>
          <div className="bld-frame" style={{ width: DEVICES[device] }}>
            <RenderNode node={page} selected={selected} editing={editing} onSelect={setSelected} onText={(id, text) => {
              const n = findNode(page, id); if (n && n.text !== text) update(id, { text });
            }} />
          </div>
        </main>

        {editing && (
          <aside className="bld-right">
            {selNode ? (
              <>
                <div className="insp-head">
                  <strong>{selNode.id === "root" ? "Page" : selNode.type}</strong>
                  {selNode.id !== "root" && (
                    <div className="bld-group">
                      <button className="ibtn" onClick={() => move(-1)} title="Move up"><ArrowUp size={15} /></button>
                      <button className="ibtn" onClick={() => move(1)} title="Move down"><ArrowDown size={15} /></button>
                      <button className="ibtn" onClick={duplicate} title="Duplicate"><Copy size={15} /></button>
                      <button className="ibtn ibtn-danger" onClick={remove} title="Delete"><Trash2 size={15} /></button>
                    </div>
                  )}
                </div>
                <Inspector key={selNode.id} node={selNode} onChange={(p) => update(selNode.id, p)} onStyle={(k, v) => setStyle(selNode.id, k, v)} />
              </>
            ) : (
              <div className="insp-empty">
                <MousePointerClick size={28} />
                <p>Select any element on the page to edit its content and style.</p>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
