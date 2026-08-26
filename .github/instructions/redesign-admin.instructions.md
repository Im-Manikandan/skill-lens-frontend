---
applyTo: "src/pages/admin/**/*.{jsx,tsx}"
---

# Admin Page Glassmorphism Redesign

When asked to redesign or restyle an admin management page, follow this skill. Do NOT apply to `AdminDashboard.jsx`.

## Steps

1. Read the target file fully.
2. Read both reference files to match exact patterns:
   - `src/pages/admin/users/UsersManagement.jsx` — canonical row-based tabular example
   - `src/pages/admin/clients/ClientsManagement.jsx` — canonical row-based tabular example with MetricChip
3. Redesign the target page following the design system below.
4. Preserve ALL existing business logic, mutations, API calls, form validation.

## Primary Accent Palette (pick one per page)

| Color  | Hex       | Use case                  |
|--------|-----------|---------------------------|
| Blue   | `#60a5fa` | Users, generic            |
| Green  | `#34d399` | Clients, active states    |
| Indigo | `#818cf8` | Industries, frameworks    |
| Pink   | `#f472b6` | Skill data                |
| Amber  | `#fbbf24` | Admins, warnings          |
| Purple | `#a78bfa` | Client admins, roles      |
| Orange | `#fb923c` | Secondary accents         |
| Teal   | `#2dd4bf` | Secondary accents         |

## Background & Border Tokens

- Page bg: `inherit` (dark theme from layout)
- Ambient orbs: `radial-gradient(circle, rgba(R,G,B,0.05–0.06), transparent 70%)`
- Card/row bg: `rgba(255,255,255,0.02)` → hover `rgba(255,255,255,0.04)`
- Border: `rgba(255,255,255,0.06)` → hover `${accentColor}20`
- Stat card bg: `linear-gradient(135deg, ${color}12 0%, ${color}05 100%)`
- Stat card border: `1px solid ${color}20`
- Text: `#f1f5f9` (primary), `#e2e8f0` (secondary), `#9ca3af` (muted), `#6b7280` (label), `#4b5563` (faint)

## Imports

```jsx
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { /* lucide icons */ } from 'lucide-react';
import { Row, Col, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input, Spinner, Alert } from 'reactstrap';
```

- Only import what's used. No Card, CardBody, Badge, Table.
- Use `lucide-react` for all icons.

## Animation Variants

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

## Color-Hashed Avatar Helpers

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

## Page Layout Structure

```
<div className="tw:relative tw:overflow-hidden">
  <!-- 2 ambient radial-gradient orbs (position:absolute, pointerEvents:none) -->
  <div className="tw:relative tw:z-10">
    <!-- A. Header -->
    <!-- B. Stats Row (4 StatCards in Row/Col) -->
    <!-- C. Search Bar -->
    <!-- D. Empty State OR Tabular Row List -->
  </div>
  <!-- E. Create/Edit Modal -->
</div>
```

### A. Header

- `motion.div` with fade+slide entrance (`opacity: 0, y: -20` → `1, 0`, duration 0.6)
- Left: 48×48 icon badge (gradient bg, borderRadius 14, accent border) + gradient-text `<h2>` + subtitle
- Right: gradient CTA button with `boxShadow` glow, `motion.div whileHover={{ scale: 1.03 }}`
- Gradient text: `background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 60%, ${accent} 100%)'` with `-webkit-background-clip: text`

### B. Stats Row

```jsx
<motion.div variants={containerVariants} initial="hidden" animate="visible">
  <Row className="tw:g-3 tw:mb-6">
    <Col xs="6" lg="3"><StatCard icon={Icon1} label="Label" value={n} color="#60a5fa" /></Col>
    <Col xs="6" lg="3"><StatCard icon={Icon2} label="Label" value={n} color="#34d399" /></Col>
    <Col xs="6" lg="3"><StatCard icon={Icon3} label="Label" value={n} color="#818cf8" /></Col>
    <Col xs="6" lg="3"><StatCard icon={Icon4} label="Label" value={n} color="#f472b6" /></Col>
  </Row>
</motion.div>
```

Derive values via `useMemo` from query data.

### C. Search Bar

- Container: `rgba(255,255,255,0.03)` bg, `rgba(255,255,255,0.08)` border, borderRadius 14
- Absolute `Search` icon left, native `<input>` with transparent bg
- Clearable with `XCircle` on right when non-empty
- `useMemo` filtered list from `searchQuery`

### D. Tabular Row List

Each entity is a **horizontal row card** — NOT a grid, NOT a `<Table>`:

```jsx
<motion.div variants={containerVariants} initial="hidden" animate="visible">
  <div className="tw:flex tw:flex-col tw:gap-3">
    {filteredItems.map(item => (
      <motion.div key={item.id} variants={itemVariants}>
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16, padding: '16px 20px', transition: 'all 0.3s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          e.currentTarget.style.borderColor = `${accent}20`;
          e.currentTarget.style.transform = 'translateX(4px)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
          e.currentTarget.style.transform = 'translateX(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}>
          <div className="tw:flex tw:items-center tw:gap-4 tw:flex-wrap">
            {/* 1. 48x48 gradient avatar */}
            {/* 2. flex-1 info block: name + status dot row 1, metadata row 2 */}
            {/* 3. role/metric pills */}
            {/* 4. action buttons */}
          </div>
        </div>
      </motion.div>
    ))}
  </div>
  <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: '#6b7280' }}>
    Showing {filteredItems.length} of {allItems.length} items
  </div>
</motion.div>
```

**Row inner layout:**
1. **Avatar** — 48×48, borderRadius 14, gradient bg (color-hashed), white initial letter, boxShadow
2. **Info block** (`tw:flex-1 tw:min-w-0`) — name (15px, 600, `#f1f5f9`) + inline status dot (8×8 with glow) + status text (11px); metadata icons (12px, `#6b7280`) on second line
3. **Pills** — `padding: '5px 12px'`, `borderRadius: 20`, `fontSize: 12`, `fontWeight: 600`, `background: linear-gradient(135deg, ${color}15, ${color}05)`, `border: 1px solid ${color}25`
4. **Actions** — `motion.button whileHover={{ scale: 1.1 }}`, 36×36, borderRadius 10, accent tint bg, glow on hover

#### Status Dot

```jsx
<div style={{
  width: 8, height: 8, borderRadius: '50%',
  backgroundColor: item.is_active ? '#34d399' : '#ef4444',
  boxShadow: item.is_active ? '0 0 8px rgba(52,211,153,0.5)' : '0 0 8px rgba(239,68,68,0.5)',
}} />
```

#### MetricChip (inline counting component)

```jsx
function MetricChip({ icon: Icon, label, value, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8,
      background: `linear-gradient(135deg, ${color}10, ${color}05)`,
      border: `1px solid ${color}20`,
    }}>
      <Icon style={{ width: 13, height: 13, color }} />
      <span style={{ fontSize: 12, color: '#9ca3af' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{value}</span>
    </div>
  );
}
```

### E. Empty State

```jsx
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
  className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-16">
  <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
    <div style={{ width: 72, height: 72, borderRadius: 20,
      background: `linear-gradient(135deg, ${accent}20, ${accent}08)`,
      border: `1px solid ${accent}25`,
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon style={{ width: 32, height: 32, color: accent }} />
    </div>
  </motion.div>
  <p style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginTop: 20 }}>
    {searchQuery ? 'No results found' : 'No items yet'}
  </p>
  <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
    {searchQuery ? 'Try a different search term' : 'Create your first item to get started'}
  </p>
</motion.div>
```

### F. Modal

```jsx
<Modal isOpen={isOpen} toggle={onClose} centered
  contentClassName="tw:bg-gray-800 tw:border tw:border-gray-700 tw:text-white"
  style={{ maxWidth: 480 }}>
  {/* Rainbow gradient bar */}
  <div style={{ height: 3, borderRadius: '8px 8px 0 0',
    background: 'linear-gradient(90deg, color1, color2, color3)' }} />
  <ModalHeader toggle={onClose} className="tw:border-gray-700">
    {/* 40x40 icon badge (rounded 12) + title + subtitle */}
  </ModalHeader>
  <ModalBody>
    {/* Inputs: borderRadius 10, padding '10px 14px' */}
    {/* Active/inactive toggle: styled div with bg/border reflecting state */}
  </ModalBody>
  <ModalFooter className="tw:border-gray-700">
    <Button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontWeight: 500 }}>Cancel</Button>
    <Button style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      border: 'none', borderRadius: 10, fontWeight: 600,
      boxShadow: '0 4px 20px rgba(59,130,246,0.3)' }}>Save</Button>
  </ModalFooter>
</Modal>
```

## Checklist

- [ ] Read existing page code fully before starting
- [ ] Preserve ALL existing business logic, mutations, API calls, form validation
- [ ] Replace Card/CardBody/Badge/Table with glassmorphism row-based layout
- [ ] Add `useMemo` for search filtering and stats
- [ ] Add `useState` for `searchQuery`
- [ ] Add ambient background orbs
- [ ] Add header with gradient text + icon badge
- [ ] Add 4 stat cards with meaningful aggregates
- [ ] Add glassmorphic search bar
- [ ] Convert entity list to tabular rows with avatar, info, pills, actions
- [ ] Add empty state with floating animation
- [ ] Restyle modal with gradient bar, icon header, rounded inputs
- [ ] Clean up unused imports (no Card, CardBody, Badge, Table)
