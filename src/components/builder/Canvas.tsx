import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, ArrowUp, Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import type { BNode, NodeType } from "./types";

interface Props {
  node: BNode;
  selected: string | null;
  editing: boolean;
  textEditId: string | null;
  onSelect: (id: string) => void;
  onSelectParent: (id: string) => void;
  onEditText: (id: string) => void;
  onText: (id: string, text: string) => void;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onInsert: (parentId: string, index: number, type: NodeType) => void;
  parentId?: string;
}

const BLOCKS: { type: NodeType; label: string }[] = [
  { type: "section", label: "Section" },
  { type: "container", label: "Row / Box" },
  { type: "heading", label: "Heading" },
  { type: "text", label: "Paragraph" },
  { type: "button", label: "Button" },
  { type: "image", label: "Image" },
  { type: "divider", label: "Divider" },
];

type Rect = { top: number; left: number; width: number; height: number };

function useElementRect(ref: RefObject<HTMLElement | null>, active: boolean) {
  const [rect, setRect] = useState<Rect | null>(null);
  const measure = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    const next = element.getBoundingClientRect();
    setRect({ top: next.top, left: next.left, width: next.width, height: next.height });
  }, [ref]);

  useLayoutEffect(() => {
    if (!active) { setRect(null); return; }
    const observer = new ResizeObserver(measure);
    const frame = window.requestAnimationFrame(() => {
      measure();
      if (ref.current) observer.observe(ref.current);
    });
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, measure, ref]);

  return rect;
}

function BlockToolbar({ targetRef, type, onMove, onDuplicate, onDelete }: {
  targetRef: RefObject<HTMLElement | null>;
  type: NodeType;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const rect = useElementRect(targetRef, true);
  if (!rect) return null;
  const top = Math.max(6, rect.top - 38);
  const left = Math.max(6, Math.min(rect.left, window.innerWidth - 244));
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return createPortal(
    <div className="block-toolbar" style={{ top, left }} onMouseDown={stop} onClick={stop} role="toolbar" aria-label={`${type} block controls`}>
      <span className="block-grip" title="Drag handle"><GripVertical size={15} /></span>
      <span className="block-kind">{type}</span>
      <span className="block-toolbar-rule" />
      <button type="button" onClick={() => onMove(-1)} title="Move up" aria-label="Move block up"><ArrowUp size={15} /></button>
      <button type="button" onClick={() => onMove(1)} title="Move down" aria-label="Move block down"><ArrowDown size={15} /></button>
      <button type="button" onClick={onDuplicate} title="Duplicate" aria-label="Duplicate block"><Copy size={15} /></button>
      <button type="button" className="block-delete" onClick={onDelete} title="Delete" aria-label="Delete block"><Trash2 size={15} /></button>
    </div>,
    document.body,
  );
}

function InsertionPoint({ parentRef, parentId, index, count, direction, onInsert }: {
  parentRef: RefObject<HTMLElement | null>;
  parentId: string;
  index: number;
  count: number;
  direction: string;
  onInsert: (parentId: string, index: number, type: NodeType) => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; horizontal: boolean } | null>(null);

  const measure = useCallback(() => {
    const parent = parentRef.current;
    if (!parent) return;
    const children = Array.from(parent.querySelectorAll<HTMLElement>(`:scope > [data-builder-parent="${parentId}"]`));
    const horizontal = direction === "row";
    const before = children[index - 1]?.getBoundingClientRect();
    const after = children[index]?.getBoundingClientRect();
    const p = parent.getBoundingClientRect();
    if (horizontal) {
      const left = before && after ? (before.right + after.left) / 2 : before ? before.right + 8 : after ? after.left - 8 : p.left + p.width / 2;
      setPosition({ top: p.top + p.height / 2, left, horizontal: true });
    } else {
      const top = before && after ? (before.bottom + after.top) / 2 : before ? before.bottom + 8 : after ? after.top - 8 : p.top + p.height / 2;
      setPosition({ top, left: p.left + p.width / 2, horizontal: false });
    }
  }, [direction, index, parentId, parentRef]);

  useLayoutEffect(() => {
    const observer = new ResizeObserver(measure);
    const frame = window.requestAnimationFrame(() => {
      measure();
      if (parentRef.current) observer.observe(parentRef.current);
    });
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure, parentRef, count]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("click", close);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("click", close); window.removeEventListener("keydown", onKey); };
  }, [open]);

  if (!position) return null;
  return createPortal(
    <div data-insert-parent={parentId} data-insert-index={index} className={`block-inserter ${position.horizontal ? "block-inserter-row" : "block-inserter-column"} ${open ? "block-inserter-open" : ""}`} style={{ top: position.top, left: position.left }} onClick={(e) => e.stopPropagation()}>
      <span className="block-inserter-line" />
      <button type="button" className="block-inserter-trigger" aria-label="Add block" aria-expanded={open} onClick={() => setOpen((value) => !value)}><Plus size={16} /></button>
      {open && (
        <div className="block-inserter-menu" role="menu" aria-label="Choose a block">
          <div className="block-inserter-title">Add block</div>
          {BLOCKS.map((block) => (
            <button key={block.type} type="button" role="menuitem" onClick={() => { onInsert(parentId, index, block.type); setOpen(false); }}>
              <Plus size={13} /><span>{block.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}

export function RenderNode({ node, selected, editing, textEditId, onSelect, onSelectParent, onEditText, onText, onMove, onDuplicate, onDelete, onInsert, parentId }: Props) {
  const [hovered, setHovered] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
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
    "data-builder-node": node.id,
    "data-builder-parent": parentId,
    ref: (element: HTMLElement | null) => { elementRef.current = element; },
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
    case "heading": return <>{isSel && node.id !== "root" && <BlockToolbar targetRef={elementRef} type={node.type} onMove={onMove} onDuplicate={onDuplicate} onDelete={onDelete} />}<h2 {...common} {...textProps}>{node.text}</h2></>;
    case "text": return <>{isSel && <BlockToolbar targetRef={elementRef} type={node.type} onMove={onMove} onDuplicate={onDuplicate} onDelete={onDelete} />}<p {...common} {...textProps}>{node.text}</p></>;
    case "button": return <>{isSel && <BlockToolbar targetRef={elementRef} type={node.type} onMove={onMove} onDuplicate={onDuplicate} onDelete={onDelete} />}<a href={editing ? undefined : node.href} {...common} {...textProps}>{node.text}</a></>;
    case "image": return <>{isSel && <BlockToolbar targetRef={elementRef} type={node.type} onMove={onMove} onDuplicate={onDuplicate} onDelete={onDelete} />}<img src={node.src} alt="" {...common} /></>;
    case "divider": return <>{isSel && <BlockToolbar targetRef={elementRef} type={node.type} onMove={onMove} onDuplicate={onDuplicate} onDelete={onDelete} />}<hr {...common} /></>;
    default:
      return (
        <>
          {isSel && node.id !== "root" && <BlockToolbar targetRef={elementRef} type={node.type} onMove={onMove} onDuplicate={onDuplicate} onDelete={onDelete} />}
          <div {...common}>
            {editing && Array.from({ length: (node.children?.length ?? 0) + 1 }, (_, index) => (
              <InsertionPoint key={`insert-${index}`} parentRef={elementRef} parentId={node.id} index={index} count={node.children?.length ?? 0} direction={node.style["flexDirection"] ?? "column"} onInsert={onInsert} />
            ))}
            {node.children?.length ? node.children.map((c) => (
              <RenderNode key={c.id} node={c} selected={selected} editing={editing} textEditId={textEditId}
                onSelect={onSelect} onSelectParent={onSelectParent} onEditText={onEditText} onText={onText}
                onMove={onMove} onDuplicate={onDuplicate} onDelete={onDelete} onInsert={onInsert} parentId={node.id} />
            )) : editing ? <div className="bnode-empty">Empty — add elements here</div> : null}
          </div>
        </>
      );
  }
}
