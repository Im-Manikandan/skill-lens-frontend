---
name: tw-text-gray
description: >
  Tailwind CSS text-gray-* scale usage guide for design. Maps every semantic text role
  (heading, body, secondary, muted, placeholder, disabled, label, caption) to the correct
  gray step for dark and light themes. Apply whenever choosing text color for any UI element.
disable-model-invocation: true
---

# Tailwind Text Gray Scale

Never pick `text-gray-*` by feel. Every text element has a semantic role. Role → step. No exceptions.

## Dark Theme (primary for this project)

This project uses dark glassmorphism. Use this table for all dark backgrounds (`bg-gray-900`, `bg-gray-800`, glass cards, panels).

| Role | Class | Contrast | Use |
|------|-------|----------|-----|
| **Page heading / H1** | `text-white` | ~15:1 | Top-level titles only |
| **Section heading / H2** | `text-gray-100` | ~14:1 | Section, card, modal titles |
| **Body text / H3** | `text-gray-200` | ~12:1 | Primary readable prose, important labels |
| **Secondary body / labels** | `text-gray-300` | ~10:1 | Field labels, list items, table cells |
| **Sub-labels / metadata** | `text-gray-400` | ~7:1 | Timestamps, counts, helper text, tags |
| **Muted / hints** | `text-gray-500` | ~4.5:1 | Hints, captions, collapsed descriptions |
| **Placeholder** | `text-gray-600` | ~3:1 | Input placeholder only — not body copy |
| **Disabled** | `text-gray-700` | ~2:1 | Disabled inputs, locked controls |

### Quick-select by element type

```
Page title          → text-white
Card title          → text-gray-100
Table header        → text-gray-200
Table cell          → text-gray-300
Icon label          → text-gray-400
Timestamp           → text-gray-400
Helper/hint text    → text-gray-500
Input placeholder   → text-gray-600
Disabled state      → text-gray-700
```

## Light Theme

| Role | Class | Use |
|------|-------|-----|
| **Page heading** | `text-gray-900` | H1, hero titles |
| **Section heading** | `text-gray-800` | H2, card titles |
| **Body text** | `text-gray-700` | Primary readable prose |
| **Secondary / labels** | `text-gray-600` | Field labels, table cells |
| **Muted / metadata** | `text-gray-500` | Timestamps, captions, tags |
| **Placeholder** | `text-gray-400` | Input placeholder |
| **Disabled** | `text-gray-300` | Disabled controls |

## Hierarchy Rules

**Minimum 2 steps between adjacent hierarchy levels.**
- Heading → Body: at least `text-gray-100` → `text-gray-300` (skip a step)
- Body → Muted: at least `text-gray-300` → `text-gray-500`
- Never two adjacent roles at the same step — flat hierarchy = no hierarchy

**Don't use `text-gray-400` for everything.**
- `text-gray-400` is secondary metadata. Using it for body text, labels, AND hints simultaneously collapses hierarchy. Force-stack: choose 3 distinct steps per component.

**Contrast minimums (WCAG AA):**
- Body text: ≥4.5:1 → minimum `text-gray-400` on `bg-gray-900`
- Large text (≥18px / ≥14px bold): ≥3:1 → `text-gray-500` acceptable
- Decorative / non-informative: no minimum

## Anti-Patterns

| Anti-pattern | Problem | Fix |
|---|---|---|
| All labels `text-gray-400` | Flat. No hierarchy. | Use 3 distinct steps per card |
| Body text `text-gray-500` | Fails AA contrast on dark bg | Use `text-gray-300` or higher |
| Placeholder = `text-gray-400` | Too visible — looks like filled input | Use `text-gray-600` |
| Disabled = `text-gray-500` | Still readable — not visually disabled | Use `text-gray-700` |
| Mixing `text-gray-*` + custom hex | Inconsistent scale | Stick to Tailwind steps |
| Using `text-gray-900` on dark bg | Near-invisible | `text-gray-900` = light theme only |

## Step Reference (Tailwind defaults)

| Step | Hex | Lum (approx) |
|------|-----|-------------|
| `50` | `#f9fafb` | 97% |
| `100` | `#f3f4f6` | 95% |
| `200` | `#e5e7eb` | 90% |
| `300` | `#d1d5db` | 83% |
| `400` | `#9ca3af` | 60% |
| `500` | `#6b7280` | 44% |
| `600` | `#4b5563` | 31% |
| `700` | `#374151` | 22% |
| `800` | `#1f2937` | 13% |
| `900` | `#111827` | 7% |
| `950` | `#030712` | 2% |

## When Gray Is Wrong

Gray text is neutral. Use it unless there is a semantic reason to deviate:
- **Error / destructive**: `text-red-400` (dark) / `text-red-600` (light)
- **Success / positive**: `text-green-400` → use brand `#B3D335` for this project
- **Warning**: `text-amber-400`
- **Info / active**: `text-blue-400`
- **Brand accent**: use brand palette — see `/brand-colors` skill

## Usage in This Project

This project's dark glassmorphism design system (established pattern in `UsersManagement.jsx`, `ClientsManagement.jsx`):

```jsx
// Card header hierarchy
<h3 className="text-white font-semibold">Card Title</h3>
<p className="text-gray-400 text-sm">subtitle / count</p>

// Table columns
<th className="text-gray-300 text-xs font-medium uppercase">Header</th>
<td className="text-gray-300">Primary cell value</td>
<td className="text-gray-400 text-sm">Secondary cell value</td>
<span className="text-gray-500 text-xs">Timestamp or metadata</span>

// Form fields
<label className="text-gray-300 text-sm font-medium">Field Label</label>
<input placeholder="..." className="placeholder:text-gray-600 text-gray-200" />
<p className="text-gray-500 text-xs">Helper text</p>
```
