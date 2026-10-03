import type { BNode } from "./types";
import { isContainer } from "./types";

interface Props {
  node: BNode;
  onChange: (patch: Partial<BNode>) => void;
  onStyle: (key: string, value: string) => void;
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="insp-field"><span>{label}</span>{children}</label>
);

function toHex(v = "") { return /^#[0-9a-f]{6}$/i.test(v) ? v : "#000000"; }

export function Inspector({ node, onChange, onStyle }: Props) {
  const s = node.style;
  const txt = (key: string, label: string, ph = "") => (
    <Field label={label}>
      <input className="insp-input" value={s[key] ?? ""} placeholder={ph} onChange={(e) => onStyle(key, e.target.value)} />
    </Field>
  );
  const color = (key: string, label: string) => (
    <Field label={label}>
      <div className="insp-color">
        <input type="color" value={toHex(s[key])} onChange={(e) => onStyle(key, e.target.value)} />
        <input className="insp-input" value={s[key] ?? ""} placeholder="none" onChange={(e) => onStyle(key, e.target.value)} />
      </div>
    </Field>
  );
  const select = (key: string, label: string, opts: string[]) => (
    <Field label={label}>
      <select className="insp-input" value={s[key] ?? ""} onChange={(e) => onStyle(key, e.target.value)}>
        <option value="">—</option>
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </Field>
  );

  return (
    <div className="insp">
      <div className="insp-group">
        <h4>Content</h4>
        {(node.type === "heading" || node.type === "text" || node.type === "button") && (
          <Field label="Text"><textarea className="insp-input" rows={3} value={node.text} onChange={(e) => onChange({ text: e.target.value })} /></Field>
        )}
        {node.type === "heading" && (
          <Field label="Heading level">
            <select className="insp-input" value={String(node.level ?? 2)} onChange={(e) => onChange({ level: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5, 6].map((l) => <option key={l} value={l}>H{l}</option>)}
            </select>
          </Field>
        )}
        {node.type === "button" && (
          <Field label="Link"><input className="insp-input" value={node.href} onChange={(e) => onChange({ href: e.target.value })} /></Field>
        )}
        {node.type === "image" && (
          <Field label="Image URL"><input className="insp-input" value={node.src} onChange={(e) => onChange({ src: e.target.value })} /></Field>
        )}
        {isContainer(node.type) && <p className="insp-hint">Containers hold other elements.</p>}
        {node.type === "divider" && <p className="insp-hint">A horizontal line.</p>}
      </div>

      <div className="insp-group">
        <h4>Colors</h4>
        {node.type !== "image" && color("color", "Text color")}
        {color("background", "Background")}
      </div>

      {node.type !== "image" && node.type !== "divider" && (
        <div className="insp-group">
          <h4>Typography</h4>
          {txt("fontSize", "Size", "16px")}
          {select("fontWeight", "Weight", ["300", "400", "500", "600", "700", "800"])}
          {select("textAlign", "Align", ["left", "center", "right"])}
          {txt("lineHeight", "Line height", "1.5")}
          {select("fontFamily", "Font", ["inherit", "Georgia, serif", "'Space Grotesk', sans-serif", "'DM Sans', sans-serif", "monospace"])}
        </div>
      )}

      {isContainer(node.type) && (
        <div className="insp-group">
          <h4>Layout</h4>
          {select("flexDirection", "Direction", ["row", "column"])}
          {select("alignItems", "Align items", ["flex-start", "center", "flex-end", "stretch"])}
          {select("justifyContent", "Justify", ["flex-start", "center", "flex-end", "space-between"])}
          {txt("gap", "Gap", "16px")}
          {select("flexWrap", "Wrap", ["nowrap", "wrap"])}
        </div>
      )}

      <div className="insp-group">
        <h4>Box</h4>
        {txt("width", "Width", "auto")}
        {txt("maxWidth", "Max width")}
        {txt("padding", "Padding", "0px")}
        {txt("margin", "Margin", "0px")}
        {txt("borderRadius", "Radius", "0px")}
        {txt("border", "Border", "1px solid #ccc")}
        {txt("boxShadow", "Shadow")}
        {txt("opacity", "Opacity", "1")}
      </div>
    </div>
  );
}
