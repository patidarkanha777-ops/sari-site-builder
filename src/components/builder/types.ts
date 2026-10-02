export type NodeType = "section" | "container" | "heading" | "text" | "button" | "image" | "divider";

export interface BNode {
  id: string;
  type: NodeType;
  text?: string;
  src?: string;
  href?: string;
  style: Record<string, string>;
  children?: BNode[];
}

export const uid = () => Math.random().toString(36).slice(2, 9);

export const isContainer = (t: NodeType) => t === "section" || t === "container";

export function createNode(type: NodeType): BNode {
  const id = uid();
  switch (type) {
    case "section":
      return { id, type, style: { padding: "64px 32px", background: "#f6f1ea", display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }, children: [] };
    case "container":
      return { id, type, style: { display: "flex", flexDirection: "row", gap: "16px", padding: "16px", width: "100%", justifyContent: "center" }, children: [] };
    case "heading":
      return { id, type, text: "New heading", style: { fontSize: "40px", fontWeight: "700", color: "#1c1917", margin: "0" } };
    case "text":
      return { id, type, text: "Write something meaningful here.", style: { fontSize: "18px", color: "#57534e", lineHeight: "1.6", margin: "0" } };
    case "button":
      return { id, type, text: "Click me", href: "#", style: { background: "#c2410c", color: "#ffffff", padding: "12px 28px", borderRadius: "999px", fontSize: "16px", fontWeight: "600", display: "inline-block", textDecoration: "none" } };
    case "image":
      return { id, type, src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200", style: { width: "100%", maxWidth: "640px", borderRadius: "16px", display: "block" } };
    case "divider":
      return { id, type, style: { width: "100%", height: "1px", background: "#d6d3d1", border: "none", margin: "16px 0" } };
  }
}

export const defaultPage: BNode = {
  id: "root",
  type: "section",
  style: { display: "flex", flexDirection: "column", background: "#ffffff", minHeight: "100%" },
  children: [
    {
      id: "hero", type: "section",
      style: { padding: "120px 32px", background: "#1c1917", display: "flex", flexDirection: "column", gap: "24px", alignItems: "center", textAlign: "center" },
      children: [
        { id: "h1", type: "heading", text: "Build your site, visually.", style: { fontSize: "64px", fontWeight: "700", color: "#fafaf9", margin: "0", maxWidth: "800px", lineHeight: "1.05" } },
        { id: "p1", type: "text", text: "Click any element to select it. Double-click text to edit. Use the panel on the right to change styles.", style: { fontSize: "20px", color: "#a8a29e", margin: "0", maxWidth: "600px", lineHeight: "1.6" } },
        { id: "b1", type: "button", text: "Get started", href: "#", style: { background: "#ea580c", color: "#ffffff", padding: "14px 32px", borderRadius: "999px", fontSize: "16px", fontWeight: "600", display: "inline-block", textDecoration: "none" } },
      ],
    },
    {
      id: "feat", type: "section",
      style: { padding: "80px 32px", background: "#f6f1ea", display: "flex", flexDirection: "column", gap: "32px", alignItems: "center" },
      children: [
        { id: "h2", type: "heading", text: "Everything is editable", style: { fontSize: "40px", fontWeight: "700", color: "#1c1917", margin: "0" } },
        {
          id: "row", type: "container",
          style: { display: "flex", flexDirection: "row", gap: "24px", width: "100%", maxWidth: "1000px", justifyContent: "center", flexWrap: "wrap" },
          children: ["Styles", "Content", "Layout"].map((t, i): BNode => ({
            id: "c" + i, type: "container" as const,
            style: { display: "flex", flexDirection: "column", gap: "8px", padding: "28px", background: "#ffffff", borderRadius: "16px", flex: "1", minWidth: "220px" },
            children: [
              { id: "ch" + i, type: "heading" as const, text: t, style: { fontSize: "22px", fontWeight: "700", color: "#1c1917", margin: "0" } },
              { id: "ct" + i, type: "text" as const, text: "Change colors, fonts, spacing and more without writing code.", style: { fontSize: "16px", color: "#57534e", margin: "0", lineHeight: "1.6" } },
            ],
          })),
        },
      ],
    },
  ],
};

// tree helpers
export function findNode(root: BNode, id: string): BNode | null {
  if (root.id === id) return root;
  for (const c of root.children ?? []) { const f = findNode(c, id); if (f) return f; }
  return null;
}
export function findParent(root: BNode, id: string): BNode | null {
  for (const c of root.children ?? []) {
    if (c.id === id) return root;
    const f = findParent(c, id); if (f) return f;
  }
  return null;
}
export function mapTree(root: BNode, fn: (n: BNode) => BNode): BNode {
  const n = fn(root);
  return n.children ? { ...n, children: n.children.map((c) => mapTree(c, fn)) } : n;
}
export function cloneWithIds(n: BNode): BNode {
  return { ...n, id: uid(), style: { ...n.style }, children: n.children?.map(cloneWithIds) };
}

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
const esc = (s = "") => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
export function toHTML(n: BNode): string {
  const css = Object.entries(n.style).map(([k, v]) => `${kebab(k)}:${v}`).join(";");
  switch (n.type) {
    case "heading": return `<h2 style="${css}">${esc(n.text)}</h2>`;
    case "text": return `<p style="${css}">${esc(n.text)}</p>`;
    case "button": return `<a href="${n.href}" style="${css}">${esc(n.text)}</a>`;
    case "image": return `<img src="${n.src}" style="${css}" alt=""/>`;
    case "divider": return `<hr style="${css}"/>`;
    default: return `<div style="${css}">${(n.children ?? []).map(toHTML).join("")}</div>`;
  }
}
