---
name: redesign-admin
description: Redesign an admin management page to use the premium glassmorphism tabular UI style matching UsersManagement.jsx and ClientsManagement.jsx. Use when the user wants to redesign or restyle an admin page. Do NOT apply to AdminDashboard.jsx.
disable-model-invocation: true
argument-hint: [page-file-path]
---

# Admin Page Glassmorphism Redesign

The user will specify which page file to redesign. Read the target file fully, then read both reference files to match their exact patterns. Preserve all business logic and API calls.

## Steps

1. Read the target file specified in $ARGUMENTS fully
2. Read both reference files (`src/pages/admin/UsersManagement.jsx` and `src/pages/admin/ClientsManagement.jsx`) to match their exact patterns
3. Redesign the target page following the design system below
4. Preserve ALL existing business logic, mutations, API calls, form validation

## Reference Files
- `src/pages/admin/UsersManagement.jsx` — canonical row-based tabular example
- `src/pages/admin/ClientsManagement.jsx` — canonical row-based tabular example with MetricChip

Read both reference files before starting to match the exact patterns.

## Design System — Colors & Tokens

### Primary accent palette (pick one per page to theme the header/button)
| Color       | Hex       | Use case                  |
|-------------|-----------|---------------------------|
| Blue        | `#60a5fa` | Users, generic             |
| Green       | `#34d399` | Clients, active states     |
| Indigo      | `#818cf8` | Industries, frameworks     |
| Pink        | `#f472b6` | Skill data                 |
| Amber       | `#fbbf24` | Admins, warnings           |
| Purple      | `#a78bfa` | Client admins, roles       |
| Orange      | `#fb923c` | Secondary accents          |
| Teal        | `#2dd4bf` | Secondary accents          |

### Background & border tokens
- Page bg: inherit (dark theme from layout)
- Ambient orbs: `radial-gradient(circle, rgba(R,G,B,0.05–0.06), transparent 70%)`
- Card/row bg: `rgba(255,255,255,0.02)` → hover `rgba(255,255,255,0.04)`
- Border: `rgba(255,255,255,0.06)` → hover `${accentColor}20`
- Stat card bg: `linear-gradient(135deg, ${color}12 0%, ${color}05 100%)`
- Stat card border: `1px solid ${color}20`
- Text colors: `#f1f5f9` (primary), `#e2e8f0` (secondary), `#9ca3af` (muted), `#6b7280` (label), `#4b5563` (faint)

## Page Structure (in order)

### 1. Imports
```jsx
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { /* lucide icons */ } from 'lucide-react';
import { Row, Col, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input, Spinner, Alert } from 'reactstrap';
```
- Only import what's used (no Card/CardBody/Badge/Table — the new design doesn't use them)
- Use lucide-react for all icons

### 2. Animation variants (paste at top level)
```jsx
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};
```

### 3. Color-hashed avatar/gradient helpers
Use a deterministic hash function so each entity gets a consistent gradient avatar:
```jsx
const GRADIENTS = [
  ['#818cf8', '#6366f1'], ['#34d399', '#10b981'], ['#f472b6', '#ec4899'],
  ['#fbbf24', '#f59e0b'], ['#60a5fa', '#3b82f6'], ['#a78bfa', '#8b5cf6'],
  ['#fb923c', '#f97316'], ['#2dd4bf', '#14b8a6'],
];
function getColors(name) {
  if (!name) return GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}
function getInitial(name) {
  if (!name) return '?';
  return name.trim()[0].toUpperCase();
}
```

### 4. StatCard component
```jsx
function StatCard({ icon: Icon, label, value, color }) { ... }
```
- `motion.div` with `variants={itemVariants}` and `whileHover={{ y: -4 }}`
- Inner div: gradient bg, 16px border-radius, 20px/24px padding
- Corner glow orb (absolute, top-right, radial-gradient)
- 44x44 icon box with gradient fill + border
- Value: fontSize 26, fontWeight 700, white
- Label: fontSize 12, uppercase, letter-spacing 0.06em, `#6b7280`

### 5. Page layout structure

```
<div className="tw:relative tw:overflow-hidden">
  <!-- Ambient background (2 radial-gradient orbs, pointerEvents:none) -->
  <div className="tw:relative tw:z-10">
    <!-- A. Header -->
    <!-- B. Stats Row (4 StatCards in Row/Col grid) -->
    <!-- C. Search Bar -->
    <!-- D. Empty State OR Tabular List -->
  </div>
  <!-- E. Create/Edit Modal -->
</div>
```

#### A. Header
- `motion.div` with fade+slide entrance
- Left: 48x48 icon badge (gradient bg, 14px border-radius, accent border) + gradient text h2 + subtitle
- Right: gradient button with `boxShadow` glow, `motion.div` with `whileHover={{ scale: 1.03 }}`
- Gradient text: `background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 60%, ${accent} 100%)'` with `-webkit-background-clip: text`

#### B. Stats Row
- `motion.div variants={containerVariants}` wrapping `<Row className="tw:g-3">`
- 4 `<Col xs="6" lg="3">` each with `<StatCard />`
- Pick meaningful stats derived via `useMemo` from the data (total count, active count, specific aggregates)

#### C. Search Bar
- Glassmorphic container: `rgba(255,255,255,0.03)` bg, `rgba(255,255,255,0.08)` border, 14px radius
- Absolute-positioned `Search` icon left, native `<input>` with transparent bg
- Clearable with `XCircle` button on right when query is non-empty
- Wire up `useMemo` filtered list from `searchQuery`

#### D. Tabular Row List
Each entity renders as a **horizontal row card** (NOT a grid card, NOT a `<Table>`):

```jsx
<motion.div variants={containerVariants} initial="hidden" animate="visible">
  <div className="tw:flex tw:flex-col tw:gap-3">
    {filteredItems.map((item) => (
      <motion.div key={item.id} variants={itemVariants}>
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16, padding: '16px 20px',
          transition: 'all 0.3s ease', cursor: 'default',
        }}
        onMouseEnter={e => { /* bg 0.04, borderColor accent, translateX(4px), boxShadow */ }}
        onMouseLeave={e => { /* reset */ }}
        >
          <div className="tw:flex tw:items-center tw:gap-4 tw:flex-wrap">
            {/* 48x48 gradient avatar */}
            {/* flex-1 info section: name + inline badges/status on row 1, metadata on row 2 */}
            {/* role/metric pills section */}
            {/* action buttons section */}
          </div>
        </div>
      </motion.div>
    ))}
  </div>
  {/* Footer: "Showing X of Y" */}
</motion.div>
```

**Row inner layout:**
1. **Avatar** — 48x48, borderRadius 14, gradient background (color-hashed), white initial letter, boxShadow
2. **Info block** (`tw:flex-1 tw:min-w-0`) — name (15px, 600 weight, `#f1f5f9`) + inline status dot (8x8 circle with glow `boxShadow`) + status text (11px) on first line; metadata icons (12px, `#6b7280`) on second line
3. **Pills/tags** — gradient-bordered rounded pills: `padding: '5px 12px'`, `borderRadius: 20`, `fontSize: 12`, `fontWeight: 600`, `background: linear-gradient(135deg, ${color}15, ${color}05)`, `border: 1px solid ${color}25`
4. **Actions** — `motion.button` with `whileHover={{ scale: 1.1 }}`, 36x36, borderRadius 10, transparent bg with accent tint, glow on hover

#### E. Empty State
- Centered layout with animated floating icon (`animate={{ y: [0, -8, 0] }}`)
- 72x72 icon container with gradient bg + border
- Contextual text (different for "no data" vs "no search results")
- CTA button only when no search query

#### F. Modal
- `contentClassName="tw:bg-gray-800 tw:border tw:border-gray-700 tw:text-white"`
- `style={{ maxWidth: 480 }}`
- Rainbow gradient accent bar at top: `height: 3`, `linear-gradient(90deg, color1, color2, color3)`
- Header: icon badge (40x40, rounded 12) + title + subtitle
- Inputs: `style={{ borderRadius: 10, padding: '10px 14px' }}`
- Checkbox toggle for active/inactive: wrap in styled div that changes bg/border color based on state
- Footer: Cancel (secondary, rounded 10) + Submit (gradient bg, glow shadow, rounded 10)

## Checklist
- [ ] Read existing page code fully before starting
- [ ] Preserve ALL existing business logic, mutations, API calls, form validation
- [ ] Replace Card/CardBody/Badge/Table with glassmorphism row-based layout
- [ ] Add `useMemo` for search filtering and stats computation
- [ ] Add `useState` for `searchQuery`
- [ ] Add ambient background orbs
- [ ] Add header with gradient text + icon badge
- [ ] Add 4 stat cards with meaningful aggregates
- [ ] Add glassmorphic search bar
- [ ] Convert entity list to tabular rows with avatar, info, pills, actions
- [ ] Add empty state with floating animation
- [ ] Restyle modal with gradient bar, icon header, rounded inputs
- [ ] Clean up unused imports (no Card, CardBody, Badge, Table)
- [ ] Ensure no TypeScript/lint warnings for unused variables
