import type { CSSProperties } from "react";
import type { BNode } from "./types";

interface Props {
  node: BNode;
  selected: string | null;
  editing: boolean;
  onSelect: (id: string) => void;
  onText: (id: string, text: string) => void;
}

export function RenderNode({ node, selected, editing, onSelect, onText }: Props) {
  const isSel = editing && selected === node.id;
  const cls = editing ? `bnode ${isSel ? "bnode-selected" : ""}` : undefined;
  const style = node.style as CSSProperties;
  const common = {
    className: cls,
    style,
    "data-label": node.type,
    onClick: editing ? (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); onSelect(node.id); } : undefined,
  };
  const editable = editing && isSel;
  const textProps = {
    contentEditable: editable,
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
            <RenderNode key={c.id} node={c} selected={selected} editing={editing} onSelect={onSelect} onText={onText} />
          )) : editing ? <div className="bnode-empty">Empty — add elements here</div> : null}
        </div>
      );
  }
}
