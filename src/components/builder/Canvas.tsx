import { useState, type CSSProperties } from "react";
import type { BNode } from "./types";

interface Props {
  node: BNode;
  selected: string | null;
  editing: boolean;
  textEditId: string | null;
  onSelect: (id: string) => void;
  onSelectParent: (id: string) => void;
  onEditText: (id: string) => void;
  onText: (id: string, text: string) => void;
}

export function RenderNode({ node, selected, editing, textEditId, onSelect, onSelectParent, onEditText, onText }: Props) {
  const [hovered, setHovered] = useState(false);
  const isSel = editing && selected === node.id;
  const isTextEditing = editing && textEditId === node.id;
  const cls = editing
    ? `bnode ${isSel ? "bnode-selected" : ""} ${isTextEditing ? "bnode-textedit" : ""} ${hovered && !isSel ? "bnode-hover" : ""}`
    : undefined;
  const style = node.style as CSSProperties;

  const common = {
    className: cls,
    style,
    "data-label": node.type,
    onClick: editing
      ? (e: React.MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
          if (isTextEditing) return; // let the caret work while typing
          // Squarespace-style drill: clicking an already-selected node selects its parent
          if (isSel) onSelectParent(node.id);
          else onSelect(node.id);
        }
      : undefined,
    onDoubleClick: editing
      ? (e: React.MouseEvent) => {
          e.stopPropagation();
          if (node.type === "heading" || node.type === "text" || node.type === "button") onEditText(node.id);
        }
      : undefined,
    onMouseEnter: editing ? (e: React.MouseEvent) => { e.stopPropagation(); setHovered(true); } : undefined,
    onMouseLeave: editing ? () => setHovered(false) : undefined,
  };

  const textProps = {
    contentEditable: isTextEditing,
    suppressContentEditableWarning: true,
    onBlur: (e: React.FocusEvent<HTMLElement>) => onText(node.id, e.currentTarget.innerText),
  };

  switch (node.type) {
    case "heading": return <h2 {...common} {...textProps}>{node.text}</h2>;
    case "text": return <p {...common} {...textProps}>{node.text}</p>;
    case "button": return <a href={editing ? undefined : node.href} {...common} {...textProps}>{node.text}</a>;
    case "image": return <img src={node.src} alt="" {...common} />;
    case "divider": return <hr {...common} />;
    default:
      return (
        <div {...common}>
          {node.children?.length ? node.children.map((c) => (
            <RenderNode key={c.id} node={c} selected={selected} editing={editing} textEditId={textEditId}
              onSelect={onSelect} onSelectParent={onSelectParent} onEditText={onEditText} onText={onText} />
          )) : editing ? <div className="bnode-empty">Empty — add elements here</div> : null}
        </div>
      );
  }
}
