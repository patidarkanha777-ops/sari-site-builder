# WordPress-style block controls

## What will change
- Show a compact floating toolbar above the selected block with its type, drag handle, move up/down, duplicate, and delete actions.
- Add a circular plus button between sibling blocks. Clicking it opens a small insertion menu for Section, Row/Box, Heading, Paragraph, Button, Image, and Divider.
- Insert the chosen block at the exact divider position and select it immediately.
- Keep the current click-to-select, parent selection, inline text editing, undo/redo, layers, and inspector behavior unchanged.

## Interaction details
- Floating controls appear only while editing and stay attached to the selected block.
- Insertion controls appear on hover or keyboard focus between blocks, with click-away and Escape dismissal.
- Destructive and movement actions remain disabled or unavailable where they do not apply, including the root page.
- Controls will remain usable in desktop, tablet, and mobile canvas widths without changing exported HTML.

## Technical details
- Extend the recursive canvas renderer with block action callbacks and insertion-position callbacks.
- Add a tree helper that inserts a new node into a specific parent at a specific child index.
- Reuse the builder's existing history commit path so inserted, moved, duplicated, and deleted blocks remain undoable.
- Add editor-only styles for the floating toolbar, insertion line, plus trigger, and popover; these controls will never render in preview mode or exported HTML.
- Verify selection, insertion, editing, and undo in the live preview, then check the generated build status.
